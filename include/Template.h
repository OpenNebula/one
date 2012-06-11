/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

        for (it = t.attributes.begin() ; it != t.attributes.end() ; it++)
        {
            attributes.insert(make_pair(it->first,(it->second)->clone()));
        }
    }

    /**
     *  The class destructor frees all the attributes conforming the template
     */
    virtual ~Template();

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

    /**
     *  Sets a new attribute, the attribute MUST BE ALLOCATED IN THE HEAP, and
     *  will be freed when the template destructor is called.
     *    @param attr pointer to the attribute
     */
    virtual void set(Attribute * attr);

    /**
     *  Adds a new single attribute to the template.
     *    @param name of the attribute
     *    @param value of the attribute
     */
     void add(const string& name, const string& value)
     {
        set(new SingleAttribute(name, value));
     }

    /**
     *  Adds a new single attribute to the template.
     *    @param name of the attribute
     *    @param value of the attribute
     */
     void add(const string& name, int value)
     {
        ostringstream oss;

        oss << value;

        set(new SingleAttribute(name, oss.str()));
     }

    /**
     *  Removes an attribute from the template. The attributes are returned. The
     *  attributes MUST be freed by the calling funtion
     *    @param name of the attribute
     *    @param values a vector containing a pointer to the attributes
     *    @return the number of attributes removed
     */
    virtual int remove(
        const string&        name,
        vector<Attribute *>& values);

    /**
     *  Removes an attribute from the template, and frees the attributes.
     *    @param name of the attribute
     *    @return the number of attributes removed
     */
    virtual int erase(const string& name);

    /**
     *  Gets all the attributes with the given name.
     *    @param name the attribute name.
     *    @return the number of elements in the vector
     */
    virtual int get(
        const string& name,
        vector<const Attribute*>& values) const;

    /**
     *  Gets all the attributes with the given name,  non-const version
     *    @param name the attribute name.
     *    @return the number of elements in the vector
     */
    virtual int get(
        const string& name,
        vector<Attribute*>& values);

    /**
     *  Gets the value of a Single attributes (string) with the given name.
     *    @param name the attribute name.
     *    @param value the attribute value, a string, "" if the attribute is not
     *    defined or not Single
     */
    virtual void get(
        const string& name,
        string& value) const;

    /**
     *  Gets the value of a Single attributes (int) with the given name.
     *    @param name the attribute name.
     *    @param value the attribute value, an int, 0 if the attribute is not
     *    defined or not Single
     *
     *    @return True if the Single attribute was found
     */
    virtual bool get(
        const string& name,
        int&    value) const;

    friend ostream& operator<<(ostream& os, const Template& t);

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
            vector<const Attribute *>& rattrs,
            vector<string>& restricted_attributes);

    /**
     *  Checks the template for RESTRICTED ATTRIBUTES
     *    @param rs_attr the first restricted attribute found if any
     *    @return true if a restricted attribute is found in the template
     */
    bool check(string& rs_attr, const vector<string> &restricted_attributes);

private:

    bool                            replace_mode;
    /**
     *  Mutex to perform just one flex-bison parsing at a time
     */
    static pthread_mutex_t			mutex;

    /**
     * Character to separate key from value when dump onto a string
     **/
    char							separator;

    /**
     *  Name of the Root element for the XML document
     */
    string							xml_root;

    /**
     *  Builds the template attribute from the node
     *    @param root_element The xml element to build the template from.
     */
    void rebuild_attributes(const xmlNode * root_element);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*TEMPLATE_H_*/
