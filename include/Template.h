/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include <map>
#include <set>
#include <vector>
#include <string>
#include <functional>
#include <memory>

#include <libxml/tree.h>
#include <libxml/parser.h>

#include "Attribute.h"

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

    explicit Template(bool         _replace_mode = false,
                      const char   _separator    = '=',
                      const char * _xml_root     = "TEMPLATE"):
        replace_mode(_replace_mode),
        separator(_separator),
        xml_root(_xml_root) {}

    Template(const Template& t)
        : replace_mode(t.replace_mode)
        , separator(t.separator)
        , xml_root(t.xml_root)
    {
        for (auto it = t.attributes.begin() ; it != t.attributes.end() ; it++)
        {
            attributes.insert(make_pair(it->first, (it->second)->clone()));
        }
    }

    Template(Template&& t) noexcept
        : attributes(std::move(t.attributes))
        , replace_mode(t.replace_mode)
        , separator(t.separator)
        , xml_root(std::move(t.xml_root))
    {
    }

    Template& operator=(const Template& t)
    {
        if (this != &t)
        {
            replace_mode = t.replace_mode;
            separator    = t.separator;
            xml_root     = t.xml_root;

            clear();

            for (auto att : t.attributes)
            {
                attributes.insert(make_pair(att.first, (att.second)->clone()));
            }
        }

        return *this;
    }

    Template& operator=(Template&& t) noexcept
    {
        if (this != &t)
        {
            replace_mode = t.replace_mode;
            separator    = t.separator;
            xml_root     = std::move(t.xml_root);

            clear();
            attributes   = std::move(t.attributes);
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
    int parse(const std::string &parse_str, char **error_msg);

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
    int parse_str_or_xml(const std::string &parse_str, std::string& error_msg);

    /**
     *  Rebuilds the template from a xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str);

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
    friend std::ostream& operator<<(std::ostream& os, const Template& t);

    /* ---------------------------------------------------------------------- */
    /* Functions to render a Template in a str, or xml                        */
    /* ---------------------------------------------------------------------- */
    /**
     *  Marshall a template. This function generates a single string with the
     *  template attributes ("VAR=VAL<delim>...").
     *    @param str_tempalte string that hold the template
     *    @param delim to separate attributes
     */
    void marshall(std::string &str, const char delim = '\n');

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
     *
     *  Hidden attributes are defined as a map, where
     *    - Simple attributes use an empty set { "PORT", {} }
     *    - Vector attributes use a set of hidden subattributes { "DB", { "USER", "PASSWD"} }
     *
     *  @param xml string that hold the xml template representation
     *
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const;

    std::string& to_xml(std::string& xml, const std::string& extra) const;

    std::string& to_xml(std::string& xml, const std::map<std::string, std::set<std::string>>& hidden) const;

    std::string& to_json(std::string& xml) const;

    /**
     *  Writes the template in a plain text string
     *    @param str string that hold the template representation
     *    @return a reference to the generated string
     */
    virtual std::string& to_str(std::string& str) const;

    /* ---------------------------------------------------------------------- */
    /* Functions to add, remove and change attributes from a Template         */
    /* ---------------------------------------------------------------------- */
    /**
     *  Clears all the attributes from the template
     */
    virtual void clear();

    /**
     *  Sets a new attribute, the attribute MUST BE ALLOCATED IN THE HEAP, and
     *  will be freed when the template destructor is called.
     *    @param attr pointer to the attribute
     */
    void set(Attribute * attr);

    template<typename T>
    void set(const std::vector<T *>& values)
    {
        for (auto v : values)
        {
            set(v);
        }
    }

    /**
     *  Adds a new attribute to the template (replacing it if already defined)
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    template<typename T>
    int replace(const std::string& name, const T& value)
    {
        std::ostringstream oss;

        oss << value;

        return replace(name, oss.str());
    }

    int replace(const std::string& name, const std::string& value);

    int replace(const std::string& name, const bool& value);

    /**
     *  Adds a new single attribute to the template. It will replace an existing
     *  one if replace_mode was set to true
     *    @param name of the attribute
     *    @param value of the attribute
     */
    template<typename T>
    void add(const std::string& name, const T& value)
    {
        std::ostringstream oss;

        oss << value;

        set(new SingleAttribute(name, oss.str()));
    }

    void add(const std::string& name, const std::string& value)
    {
        set(new SingleAttribute(name, value));
    }

    void add(const std::string& name, bool value)
    {
        if ( value )
        {
            set(new SingleAttribute(name, "YES"));
        }
        else
        {
            set(new SingleAttribute(name, "NO"));
        }
    }

    /**
     *  Removes an attribute from the template. The attributes are returned. The
     *  attributes MUST be freed by the calling funtion
     *    @param name of the attribute
     *    @param values a vector containing a pointer to the attributes
     *    @return the number of attributes removed
     */
    template<typename T>
    int remove(const std::string& name, std::vector<T *>& values)
    {
        int j = 0;

        auto index = attributes.equal_range(name);

        for ( auto i = index.first; i != index.second; i++, j++ )
        {
            auto att = dynamic_cast<T*>(i->second);

            if (!att)
            {
                delete i->second;
                continue;
            }

            values.push_back(att);
        }

        attributes.erase(index.first, index.second);

        return j;
    }

    template<typename T>
    int remove(const std::string& name, std::vector<std::unique_ptr<T>>& values)
    {
        int j = 0;

        auto index = attributes.equal_range(name);

        for ( auto i = index.first; i != index.second; i++, j++ )
        {
            std::unique_ptr<T> va(dynamic_cast<T *>(i->second));

            if (!va)
            {
                delete i->second;
                continue;
            }

            values.push_back(std::move(va));
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
    virtual int erase(const std::string& name);

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
    inline virtual int get(const std::string& n,
                           std::vector<const VectorAttribute*>& v) const
    {
        return __get<VectorAttribute>(n, v);
    }

    inline virtual int get(const std::string& n, std::vector<VectorAttribute*>& v)
    {
        return __get<VectorAttribute>(n, v);
    }

    inline virtual int get(const std::string& n,
                           std::vector<const SingleAttribute*>& s) const
    {
        return __get<SingleAttribute>(n, s);
    }

    inline virtual int get(const std::string& n, std::vector<SingleAttribute*>& s)
    {
        return __get<SingleAttribute>(n, s);
    }

    /**
     *  Gets the first Attribute of the specified type with the given name.
     *  Const and non-const versions of this method is provided
     *    @param name the attribute name.
     *    @return true first attribute or 0 if not found or wrong type
     */
    inline const VectorAttribute * get(const std::string& name) const
    {
        return __get<VectorAttribute>(name);
    }

    inline VectorAttribute * get(const std::string& name)
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
    bool get(const std::string& name, T& value) const
    {
        const SingleAttribute * s = __get<SingleAttribute>(name);

        value = 0;

        if ( s == 0 )
        {
            return false;
        }

        std::istringstream iss(s->value());

        iss >> value;

        if (iss.fail() || !iss.eof())
        {
            return false;
        }

        return true;
    }

    virtual bool get(const std::string& name, bool& value) const;

    virtual bool get(const std::string& name, std::string& value) const;

    /**
     *  Trims the trailing spaces in the attribute
     *    @param name of the attribute
     *    @return True if the attribute was found and trimmed
     */
    virtual bool trim(const std::string& name);

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
     *    @param from_tmpl the template to be merged
     */
    void merge(const Template * from_tmpl);

    /**
     *  Check if the template can be safely merge with a base template. If a
     *  restricted attribute is found it is check that it has the same value in
     *  base.
     *    @param rs_attr the first restricted attribute found with a different
     *    value in base
     *    @param base template used to check restricted values.
     *
     *    @return true if a restricted attribute with a different value is found
     *    in the template
     *
     *   The version of this method without base template just look for any
     *   restricted attribute.
     */
    virtual bool check_restricted(std::string& rs_attr, const Template* base, bool append)
    {
        return false;
    }

    virtual bool check_restricted(std::string& rs_attr)
    {
        return false;
    }

    /**
     *  Encrypt all secret attributes
     */
    virtual void encrypt(const std::string& one_key) {};

    /**
     *  Decrypt all secret attributes
     */
    virtual void decrypt(const std::string& one_key) {};

    /**
     *  @return true if template is empty
     */
    bool empty() const
    {
        return attributes.empty();
    }

    /**
     *  Generic iterator over Template attributes
     */
    void each_attribute(std::function<void(const Attribute * a)>&& f) const
    {
        for(const auto& it: attributes)
        {
            f(it.second);
        }
    }

protected:
    /**
     *  The template attributes
     */
    std::multimap<std::string, Attribute *> attributes;

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
     *  Parses a list of restricted attributes in the form ATTRIBUTE_NAME or
     *  ATTRIBUTE_NAME/SUBATTRIBUTE.
     *    @param ras list of restricted attributes
     *    @param rattr_m result list of attributes indexed by ATTRIBUTE_NAME.
     *    RAs are stored:
     *      {
     *        RESTRICTED_ATTR_NAME => [ RESTRICTED_SUB_ATTRIBUTES ],
     *        ...
     *      }
     *    If the RA is Single the sub attribute list will be empty.
     */
    static void parse_restricted(const std::vector<const SingleAttribute *>& ras,
                                 std::map<std::string, std::set<std::string> >& rattr_m);

    /**
     *  Check if the template can be safely merge with a base template. If a
     *  restricted attribute is found it is check that it has the same value in
     *  base.
     *    @param rs_attr the first restricted attribute found with a different
     *    value in base
     *    @param base template used to check restricted values.
     *    @param ras list of restricted attributes.
     *
     *    @return true if a restricted attribute with a different value is found
     *    in the template
     */
    bool check_restricted(std::string& rs_attr, const Template* base,
                          const std::map<std::string, std::set<std::string> >& ras, bool append);

    bool check_restricted(std::string& rs_attr,
                          const std::map<std::string, std::set<std::string> >& ras);

    /**
     *  Parses a list of encrypted attributes in the form ATTRIBUTE_NAME or
     *  ATTRIBUTE_NAME/SUBATTRIBUTE.
     *    @param eas list of encrypted attributes
     *    @param eattr_m result list of attributes indexed by ATTRIBUTE_NAME.
     *    EAs are stored:
     *      {
     *        ENCRYPTED_ATTR_NAME => [ ENCRYPTED_SUB_ATTRIBUTES ],
     *        ...
     *      }
     *    If the EA is Single the sub attribute list will be empty.
     */
    static void parse_encrypted(const std::vector<const SingleAttribute *>& eas,
                                std::map<std::string, std::set<std::string> >& eattr_m);

    /**
     *  Encrypt all secret attributes
     */
    void encrypt(const std::string& one_key,
                 const std::map<std::string, std::set<std::string> >& eas);

    /**
     *  Decrypt all secret attributes
     */
    void decrypt(const std::string& one_key,
                 const std::map<std::string, std::set<std::string> >& eas);

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
     * Character to separate key from value when dump onto a string
     **/
    char                            separator;

    /**
     *  Name of the Root element for the XML document
     */
    std::string                          xml_root;

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
    int __get(const std::string& name, std::vector<const T *>& values) const
    {
        int j = 0;

        auto index = attributes.equal_range(name);

        for (auto i = index.first; i != index.second ; i++)
        {
            const T * vatt = dynamic_cast<const T *>(i->second);

            if ( vatt == 0 )
            {
                continue;
            }

            values.push_back(vatt);
            j++;
        }

        return j;
    }

    /* Non-const version of get for all attributes  */
    template<typename T>
    int __get(const std::string& name, std::vector<T *>& values)
    {
        int j = 0;

        auto index = attributes.equal_range(name);

        for (auto i = index.first; i != index.second ; i++)
        {
            T * vatt = dynamic_cast<T *>(i->second);

            if ( vatt == 0 )
            {
                continue;
            }

            values.push_back(vatt);
            j++;
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
    const T * __get(const std::string& s) const
    {
        std::vector<const T*> atts;

        if (__get<T>(s, atts) < 1)
        {
            return 0;
        }

        return atts[0];
    }

    template<typename T>
    T * __get(const std::string& s)
    {
        return const_cast<T *>(
                       static_cast<const Template&>(*this).__get<T>(s));
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*TEMPLATE_H_*/
