/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#include "Attribute.h"

using namespace std;

/**
 *  Base class for file templates. A template is a file (or a tring for the
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

    /**
     *  The class destructor frees all the attributes conforming the template
     */
    virtual ~Template();

    /**
     *  Parse a string representing the template, each attribute is inserted
     *  in the template class.
     *    @param parse_str string with template attributes
     *    @param error_msg error string, must be freed by the calling funtion.
     *    This string is null if no error occurred.
     *    @return 0 on success.
     */
    int parse(const string &parse_str, char **error_msg);

    /**
     *  Parse a template file.
     *    @param filename of the template file
     *    @param error_msg error string, must be freed by the calling funtion.
     *    This string is null if no error occurred.
     *    @return 0 on success.
     */
    int parse(const char * filename, char **error_msg);

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
     */
    void to_xml(string& xml) const;

    /**
     *  Sets a new attribute, the attribute MUST BE ALLOCATED IN THE HEAP, and
     *  will be freed when the template destructor is called.
     *    @param attr pointer to the attribute
     */
    virtual void set(Attribute * attr)
    {
        if ( replace_mode == true )
        {
            attributes.erase(attr->name());
        }

        attributes.insert(make_pair(attr->name(),attr));
    };

    /**
     *  Gets all the attributes with the given name.
     *    @param name the attribute name.
     *    @returns the number of elements in the vector
     */
    virtual int get(
        const string& name,
        vector<const Attribute*>& values) const;

    /**
     *  Gets all the attributes with the given name,  non-const version
     *    @param name the attribute name.
     *    @returns the number of elements in the vector
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
        string& name,
        string& value) const;

    /**
     *  Gets the value of a Single attributes (int) with the given name.
     *    @param name the attribute name.
     *    @param value the attribute value, an int, 0 if the attribute is not
     *    defined or not Single
     */
    virtual void get(
        string& name,
        int&    value) const;

    friend ostream& operator<<(ostream& os, Template& t);

protected:
    /**
     *  The template attributes
     */
    multimap<string,Attribute *>    attributes;

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
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*TEMPLATE_H_*/
