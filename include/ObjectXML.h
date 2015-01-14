/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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


#ifndef OBJECT_XML_H_
#define OBJECT_XML_H_

#include <string>
#include <vector>

#include <libxml/tree.h>
#include <libxml/parser.h>
#include <libxml/xpath.h>
#include <libxml/xpathInternals.h>

using namespace std;

/**
 *  This class represents a generic Object supported by a xml document.
 *  The class provides basic methods to query attributes, and get xml nodes
 */
class ObjectXML
{
public:

    // ---------------------- Constructors ------------------------------------

    ObjectXML():xml(0),ctx(0){};

    /**
     *  Constructs an object using a XML document
     */
    ObjectXML(const string &xml_doc);

    /**
     *  Constructs an object using a XML Node. The node is copied to the new
     *  object
     */
    ObjectXML(const xmlNodePtr node);

    virtual ~ObjectXML();

    /**
     *  Access Object elements using Xpath
     *    @param xpath_expr the Xpath of the element
     *    @return a vector with the elements
     */
    vector<string> operator[] (const char * xpath_expr);

    /**
     *  Gets and sets a xpath attribute, if the attribute is not found a default
     *  is used
     *    @param value to set
     *    @param xpath_expr of the xml element
     *    @param def default value if the element is not found
     *
     *    @return -1 if default was set
     */
    int xpath(string& value, const char * xpath_expr, const char * def);

    /**
     *  Gets and sets a xpath attribute, if the attribute is not found a default
     *  is used
     *    @param value to set
     *    @param xpath_expr of the xml element
     *    @param def default value if the element is not found
     *
     *    @return -1 if default was set
     */
    int xpath(int& value, const char * xpath_expr, const int& def);

    /**
     *  Gets and sets a xpath attribute, if the attribute is not found a default
     *  is used
     *    @param value to set
     *    @param xpath_expr of the xml element
     *    @param def default value if the element is not found
     *
     *    @return -1 if default was set
     */
    int xpath(unsigned int& value, const char * xpath_expr,
              const unsigned int& def);

    /**
     *  Gets and sets a xpath attribute, if the attribute is not found a default
     *  is used
     *    @param value to set
     *    @param xpath_expr of the xml element
     *    @param def default value if the element is not found
     *
     *    @return -1 if default was set
     */
    int xpath(long long& value, const char * xpath_expr,
              const long long& def);

    /**
     *  Gets and sets a xpath attribute, if the attribute is not found a default
     *  is used
     *    @param value to set
     *    @param xpath_expr of the xml element
     *    @param def default value if the element is not found
     *
     *    @return -1 if default was set
     */
    int xpath(unsigned long long& value, const char * xpath_expr,
              const unsigned long long& def);

    /**
     *  Gets and sets a xpath attribute, if the attribute is not found a default
     *  is used
     *    @param value to set
     *    @param xpath_expr of the xml element
     *    @param def default value if the element is not found
     *
     *    @return -1 if default was set
     */
    int xpath(time_t& value, const char * xpath_expr, const time_t& def);

    /**
     *  Gets the value of an element from an xml string
     *    @param value the value of the element
     *    @param xml the xml string
     *    @param xpath the xpath of the target element
     *
     *    @return -1 if the element was not found
     */
    static int xpath_value(string& value, const char *xml, const char *xpath);

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes.
     *    @param name of the attribute
     *    @param value of the attribute
     *
     *    @return -1 if the element was not found
     */
    virtual int search(const char *name, string& value);

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes. integer version
     */
    virtual int search(const char *name, int& value);

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes. float version
     */
    virtual int search(const char *name, float& value);

    /**
     *  Get xml nodes by Xpath
     *    @param xpath_expr the Xpath for the elements
     *    @param content nodes for the given Xpath expression. The nodes are
     *    returned as pointers to the object nodes.
     *    @return the number of nodes found
     */
    int get_nodes(const char * xpath_expr, vector<xmlNodePtr>& content);

    /**
     * Adds a copy of the node as a child of the node in the xpath expression.
     * The source node must be cleaned by the caller.
     *
     * @param xpath_expr Path of the parent node
     * @param node Node copy and add
     * @param new_name New name for the node copy
     *
     * @return 0 on success, -1 otherwise
     */
    int add_node(const char * xpath_expr, xmlNodePtr node, const char * new_name);

    /**
     *  Frees a vector of XMLNodes, as returned by the get_nodes function
     *    @param content the vector of xmlNodePtr
     */
    void free_nodes(vector<xmlNodePtr>& content)
    {
        vector<xmlNodePtr>::iterator it;

        for (it = content.begin(); it < content.end(); it++)
        {
            xmlFreeNode(*it);
        }
    };

    /**
     *   Updates the object representation with a new XML document. Previous
     *   XML resources are freed
     *   @param xml_doc the new xml document
     */
    int update_from_str(const string &xml_doc);

    /**
     *   Updates the object representation with a new XML document. Previous
     *   XML resources are freed
     *   @param xml_doc the new xml document
     */
    int update_from_node(const xmlNodePtr node);

    /**
     *  Validates the xml string
     *
     *  @param xml_doc string to parse
     *  @return 0 if the xml validates
     */
    static int validate_xml(const string &xml_doc);

    /**
     * Renames the nodes given in the xpath expression
     * @param xpath_expr xpath expression to find the nodes to rename
     * @param new_name new name for the xml elements
     *
     * @return the number of nodes renamed
     */
    int rename_nodes(const char * xpath_expr, const char * new_name);

    // ---------------------------------------------------------
    //  Lex & bison parser for requirements and rank expressions
    // ---------------------------------------------------------

    /**
     *  Evaluates a requirement expression on the given host.
     *    @param requirements string
     *    @param result true if the host matches the requirements
     *    @param errmsg string describing the error, must be freed by the
     *    calling function
     *    @return 0 on success
     */
    int eval_bool(const string& expr, bool& result, char **errmsg);

    /**
     *  Evaluates a rank expression on the given host.
     *    @param rank string
     *    @param result of the rank evaluation
     *    @param errmsg string describing the error, must be freed by the
     *    calling function
     *    @return 0 on success
     */
    int eval_arith(const string& expr, int& result, char **errmsg);

    /**
     *  Function to write the Object in an output stream
     */
    friend ostream& operator<<(ostream& os, ObjectXML& oxml)
    {
        xmlChar * mem;
        int       size;

        xmlDocDumpMemory(oxml.xml,&mem,&size);

        string str(reinterpret_cast<char *>(mem));
        os << str;

        xmlFree(mem);

        return os;
    };

protected:
    /**
     *  Array of paths to look for attributes in search methods
     */
    const char **paths;

    /**
     *  Number of elements in paths array
     */
    int num_paths;

private:
    /**
     *  XML representation of the Object
     */
    xmlDocPtr   xml;

    /**
     *  XPath Context to access Object elements
     */
    xmlXPathContextPtr ctx;

    /**
     *  Parse a XML documents and initializes XPath contexts
     */
    void xml_parse(const string &xml_doc);

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes.
     *  @param name of the attribute
     *  @results vector of attributes that matches the query
     */
    void search(const char* name, vector<string>& results);
};

#endif /*OBJECT_XML_H_*/
