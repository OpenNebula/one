/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#ifndef TEMPLATE_H_
#define TEMPLATE_H_

#include <iostream>
#include <map>
#include <vector>

#include <libxml/tree.h>
#include <libxml/parser.h>

#include "Attribute.h"

using namespace std;

/**
 *  Base class for file templates. A template is a file (or a string for the
 *  matter of fact) containing a set of attribute definitions of the form:
 *  NAME = VALUE
 *  where NAME is a string representing the name of the attribute, and VALUE can
 *  be a single string or a vector value (array of string pairs). The file can
 *  contain several attributes with the same name.
 */
class Template
{
public:

    Template(bool         _replace_mode = false,
             const char   _separator    = '=',
             const char * _xml_root     = "TEMPLATE"):
                 replace_mode(_replace_mode),
                 separator(_separator),
                 xml_root(_xml_root){};

    Template(const Template& t)
    {
        multimap<string,Attribute *>::const_iterator it;

        replace_mode = t.replace_mode;
        separator    = t.separator;
        xml_root     = t.xml_root;

        attributes.clear();

        for (it = t.attributes.begin() ; it != t.attributes.end() ; it++)
        {
            attributes.insert(make_pair(it->first,(it->second)->clone()));
        }
    }

    Template& operator=(const Template& t)
    {
        multimap<string,Attribute *>::const_iterator it;

        if (this != &t)
        {
            replace_mode = t.replace_mode;
            separator    = t.separator;
            xml_root     = t.xml_root;

            attributes.clear();

            for (it = t.attributes.begin() ; it != t.attributes.end() ; it++)
            {
                attributes.insert(make_pair(it->first,(it->second)->clone()));
            }
        }

        return *this;
    }

    /**
     *  The class destructor frees all the attributes conforming the template
     */
    virtual ~Template();

    /* ---------------------------------------------------------------------- */
    /* Functions to create a Template parsing a file, stream in txt or XML    */
    /* ---------------------------------------------------------------------- */
    /**
     *  Parse a string representing the template, each attribute is inserted
     *  in the template class.
     *    @param parse_str string with template attributes
     *    @param error_msg error string, must be freed by the calling function.
     *    This string is null if no error occurred.
     *    @return 0 on success.
     */
    int parse(const string &parse_str, char **error_msg);

    /**
     *  Parse a template file.
     *    @param filename of the template file
     *    @param error_msg error string, must be freed by the calling function.
     *    This string is null if no error occurred.
     *    @return 0 on success.
     */
    int parse(const char * filename, char **error_msg);

    /**
     *  Parse a string representing the template, automatically detecting if
     *  it is the default syntax, or an XML template. Each attribute is inserted
     *  in the template class.
     *    @param parse_str string with template attributes, or XML template
     *    @param error_msg error string, must be freed by the calling function.
     *    This string is null if no error occurred.
     *    @return 0 on success.
     */
    int parse_str_or_xml(const string &parse_str, string& error_msg);

    /**
     *  Rebuilds the template from a xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     *  Rebuilds the object from an xml node
     *    @param node The xml node pointer
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node);

    /**
     *  Writes the Template into a output stream in txt format
     */
    friend ostream& operator<<(ostream& os, const Template& t);

    /* ---------------------------------------------------------------------- */
    /* Functions to render a Template in a str, or xml                        */
    /* ---------------------------------------------------------------------- */
    /**
     *  Marshall a template. This function generates a single string with the
     *  template attributes ("VAR=VAL<delim>...").
     *    @param str_tempalte string that hold the template
     *    @param delim to separate attributes
     */
    void marshall(string &str, const char delim='\n');

    /**
     *  Writes the template in a simple xml string:
     *  <template>
     *    <single>value</single>
     *    <vector>
     *      <attr>value</attr>
     *      ...
     *    </vector>
     *    ...
     *  </template>
     *  The name of the root element is set when the Template object is created
     *    @param xml string that hold the xml template representation
     *    @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Writes the template in a plain text string
     *    @param str string that hold the template representation
     *    @return a reference to the generated string
     */
    string& to_str(string& str) const;

    /* ---------------------------------------------------------------------- */
    /* Functions to add, remove and change attributes from a Template         */
    /* ---------------------------------------------------------------------- */
    /**
     *  Clears all the attributes from the template
     */
    void clear();

    /**
     *  Sets a new attribute, the attribute MUST BE ALLOCATED IN THE HEAP, and
     *  will be freed when the template destructor is called.
     *    @param attr pointer to the attribute
     */
    virtual void set(Attribute * attr);

    virtual void set(vector<SingleAttribute *>& values)
    {
        _set<SingleAttribute>(values);
    }

    virtual void set(vector<VectorAttribute *>& values)
    {
        _set<VectorAttribute>(values);
    }

    /**
     *  Adds a new attribute to the template (replacing it if already defined)
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    template<typename T>
    int replace(const string& name, const T& value)
    {
        std::ostringstream oss;

        oss << value;

        return replace(name, oss.str());
    }

    int replace(const string& name, const string& value);

    int replace(const string& name, const bool& value);

    /**
     *  Adds a new single attribute to the template. It will replace an existing
     *  one if replace_mode was set to true
     *    @param name of the attribute
     *    @param value of the attribute
     */
    template<typename T>
    void add(const string& name, const T& value)
    {
        std::ostringstream oss;

        oss << value;

        set(new SingleAttribute(name, oss.str()));
	}

	void add(const string& name, const string& value)
	{
		set(new SingleAttribute(name, value));
	}

    /**
     *  Removes an attribute from the template. The attributes are returned. The
     *  attributes MUST be freed by the calling funtion
     *    @param name of the attribute
     *    @param values a vector containing a pointer to the attributes
     *    @return the number of attributes removed
     */
    template<typename T>
    int remove(const string& name, vector<T *>& values)
    {
        pair<multimap<string, Attribute *>::iterator,
             multimap<string, Attribute *>::iterator> index;

        multimap<string, Attribute *>::iterator i;

        int j;

        index = attributes.equal_range(name);

        for ( i = index.first,j=0 ; i != index.second ; i++,j++ )
        {
            values.push_back(static_cast<T *>(i->second));
        }

        attributes.erase(index.first, index.second);

        return j;
    }

    /**
     *  Removes an attribute from the template, but it DOES NOT free the
     *  attribute.
     *    @param att Attribute to remove. It will be deleted
     *    @return pointer to the removed attribute or 0 if non attribute was
     *    removed
     */
    virtual Attribute * remove(Attribute * att);

    /**
     *  Removes an attribute from the template, and frees the attributes.
     *    @param name of the attribute
     *    @return the number of attributes removed
     */
    virtual int erase(const string& name);

    /* ---------------------------------------------------------------------- */
    /* Functions get attributes from a template                               */
    /* ---------------------------------------------------------------------- */
    /**
     *  Gets the all the attributes of the given name and stores a reference
     *  to them in a vector. If the selected attribute does not match the
     *  requested type it will not be included
     *    @param name the attribute name.
     *    @param values vector with the values
     *
     *    @return the number of elements in the vector
     */
    inline virtual int get(const string& n, vector<const VectorAttribute*>& v) const
    {
        return __get<VectorAttribute>(n, v);
    }

    inline virtual int get( const string& n, vector<VectorAttribute*>& v)
    {
        return __get<VectorAttribute>(n, v);
    }

    inline virtual int get(const string& n, vector<const SingleAttribute*>& s) const
    {
        return __get<SingleAttribute>(n, s);
    }

    inline virtual int get( const string& n, vector<SingleAttribute*>& s)
    {
        return __get<SingleAttribute>(n, s);
    }

    /**
     *  Gets the first Attribute of the specified type with the given name.
     *  Const and non-const versions of this method is provided
     *    @param name the attribute name.
     *    @return true first attribute or 0 if not found or wrong type
     */
	inline const VectorAttribute * get(const string& name) const
	{
		return __get<VectorAttribute>(name);
	}

	inline VectorAttribute * get(const string& name)
	{
		return __get<VectorAttribute>(name);
	}

    /**
     *  Gets the value of a SingleAttribute with the given name and converts
     *  it to the target value format
     *    @param name the attribute name.
     *    @param value the attribute value
     *
     *    @return true if a SingleAttribute was found and it stores a valid
     *    value, false otherwise.
     */
    template<typename T>
    bool get(const string& name, T& value) const
    {
        const SingleAttribute * s = __get<SingleAttribute>(name);

        value = 0;

        if ( s == 0 )
        {
            return false;
        }

        istringstream iss(s->value());

        iss >> value;

        if (iss.fail() || !iss.eof())
        {
            return false;
        }

        return true;
    }

    virtual bool get(const string& name, bool& value) const;

    virtual bool get(const string& name, string& value) const;

    /**
     *  Trims the trailing spaces in the attribute
     *    @param name of the attribute
     *    @return True if the attribute was found and trimmed
     */
    virtual bool trim(const string& name);

    /**
     *  Trims the trailing spaces in the NAME attribute
     *    @return True if the attribute was found and trimmed
     */
    inline virtual bool trim_name()
    {
        return trim("NAME");
    };

    /**
     *  Merges another Template, adding the new attributes and
     *  replacing the existing ones
     *
     *    @param from_tmpl the template to be merged
     *    @param error_str string describing the error
     *
     *    @return 0 on success.
     */
     int merge(const Template * from_tmpl, string& error_str);

     /**
      * Deletes all restricted attributes
      */
     virtual void remove_restricted();

     /**
      * Deletes all the attributes, except the restricted ones
      */
     virtual void remove_all_except_restricted();

     /**
      *  @return true if the template defines one or more restricted attributes
      */
     virtual bool has_restricted();

protected:
    /**
     *  The template attributes
     */
    multimap<string,Attribute *>    attributes;

    /**
     *  Builds a SingleAttribute from the given node
     *    @param node The xml element to build the attribute from.
     *
     *    @return the attribute, or 0 if the node doesn't contain a single att.
     */
    Attribute* single_xml_att(const xmlNode * node);

    /**
     *  Builds a VectorAttribute from the given node
     *    @param node The xml element to build the attribute from.
     *
     *    @return the attribute, or 0 if the node doesn't contain a vector att.
     */
    Attribute* vector_xml_att(const xmlNode * node);

    /**
     * Stores the attributes as restricted, these attributes will be used in
     * Template::check
     * @param rattrs Attributes to restrict
     * @param restricted_attributes The attributes will be stored here
     */
    static void set_restricted_attributes(
            vector<const SingleAttribute *>& rattrs,
            vector<string>& restricted_attributes);

    /**
     *  Checks the template for RESTRICTED ATTRIBUTES
     *    @param rs_attr the first restricted attribute found if any
     *    @return true if a restricted attribute is found in the template
     */
    bool check(string& rs_attr, const vector<string> &restricted_attributes);

    /**
     * Deletes all restricted attributes
     */
    void remove_restricted(const vector<string> &restricted_attributes);

    /**
     * Deletes all the attributes, except the restricted ones
     */
    void remove_all_except_restricted(const vector<string> &restricted_attributes);

    /**
     * Updates the xml root element name
     *
     * @param _xml_root New name
     */
    void set_xml_root(const char * _xml_root)
    {
        xml_root = _xml_root;
    };

private:

    bool                            replace_mode;
    /**
     *  Mutex to perform just one flex-bison parsing at a time
     */
    static pthread_mutex_t          mutex;

    /**
     * Character to separate key from value when dump onto a string
     **/
    char                            separator;

    /**
     *  Name of the Root element for the XML document
     */
    string                          xml_root;

    /**
     *  Builds the template attribute from the node
     *    @param root_element The xml element to build the template from.
     */
    void rebuild_attributes(const xmlNode * root_element);

    /**
     *  Gets the all the attributes of the given name and stores a reference
     *  to them in a vector. If the selected attribute does not match the
     *  requested type it will not be included
     *    @param name the attribute name.
     *    @param values vector with the values
     *
     *    @return the number of elements in the vector
     */
    template<typename T>
    int __get(const string& name, vector<const T *>& values) const
    {
        pair<multimap<string, Attribute *>::const_iterator,
             multimap<string, Attribute *>::const_iterator> index;

        multimap<string, Attribute *>::const_iterator i;

        int j;

        index = attributes.equal_range(name);

        for (i = index.first, j = 0 ; i != index.second ; i++, j++)
        {
            const T * vatt = dynamic_cast<const T *>(i->second);

            if ( vatt == 0 )
            {
                continue;
            }

            values.push_back(vatt);
        }

        return j;
    }

    /* Non-const version of get for all attributes  */
    template<typename T>
    int __get(const string& name, vector<T *>& values)
    {
        pair<multimap<string, Attribute *>::iterator,
             multimap<string, Attribute *>::iterator> index;

        multimap<string, Attribute *>::iterator i;

        int j;

        index = attributes.equal_range(name);

        for (i = index.first, j = 0 ; i != index.second ; i++, j++)
        {
            T * vatt = dynamic_cast<T *>(i->second);

            if ( vatt == 0 )
            {
                continue;
            }

            values.push_back(vatt);
        }

        return j;
    }

    /**
     *  Gets the first Attribute of the specified type with the given name.
     *  Const and non-const versions of this method is provided
     *    @param name the attribute name.
     *    @return true first attribute or 0 if not found or wrong type
     */
    template<typename T>
    const T * __get(const string& s) const
    {
        vector<const T*> atts;

        if (__get<T>(s, atts) < 1)
        {
            return 0;
        }

        return atts[0];
    }

    template<typename T>
    T * __get(const string& s)
    {
        return const_cast<T *>(
                static_cast<const Template&>(*this).__get<T>(s));
    }

    template<typename T>
    void _set(vector<T *>& values)
    {
        typename vector<T *>::iterator it;

        for(it = values.begin(); it != values.end(); it++ )
        {
            set(*it);
        }
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*TEMPLATE_H_*/
