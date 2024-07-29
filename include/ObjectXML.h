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


#ifndef OBJECT_XML_H_
#define OBJECT_XML_H_

#include <string>
#include <vector>
#include <sstream>

#include <libxml/tree.h>
#include <libxml/parser.h>
#include <libxml/xpath.h>
#include <libxml/xpathInternals.h>

/**
 *  This class represents a generic Object supported by a xml document.
 *  The class provides basic methods to query attributes, and get xml nodes
 */
class ObjectXML
{
public:

    // ---------------------- Constructors ------------------------------------

    ObjectXML()
        : paths(nullptr)
        , num_paths(0)
        , xml(nullptr)
        , ctx(nullptr)
    {}

    /**
     *  Constructs an object using a XML document
     */
    ObjectXML(const std::string &xml_doc);

    /**
     *  Constructs an object using a XML Node. The node is copied to the new
     *  object
     */
    ObjectXML(const xmlNodePtr node);

    virtual ~ObjectXML();

    /**
     *  Gets elements by xpath.
     *    @param values vector with the element values.
     *    @param expr of the xml element
     */
    template<typename T>
    void xpaths(std::vector<T>& values, const char * expr)
    {
        xmlXPathObjectPtr obj;

        xmlNodePtr cur;
        xmlChar *  str_ptr;

        obj = xmlXPathEvalExpression(reinterpret_cast<const xmlChar *>(expr), ctx);

        if (obj == 0)
        {
            return;
        }

        switch (obj->type)
        {
            case XPATH_NUMBER:
                values.push_back(static_cast<T>(obj->floatval));
                break;

            case XPATH_NODESET:
                if (obj->nodesetval == 0)
                {
                    return;
                }

                for (int i = 0; i < obj->nodesetval->nodeNr ; ++i)
                {
                    cur = obj->nodesetval->nodeTab[i];

                    if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
                    {
                        continue;
                    }

                    str_ptr = xmlNodeGetContent(cur);

                    if (str_ptr != 0)
                    {
                        std::istringstream iss(reinterpret_cast<char *>(str_ptr));
                        T val;

                        iss >> std::dec >> val;

                        if (!iss.fail())
                        {
                            values.push_back(val);
                        }

                        xmlFree(str_ptr);
                    }
                }
                break;

            default:
                break;

        }

        xmlXPathFreeObject(obj);
    };

    void xpaths(std::vector<std::string>& values, const char * xpath_expr);

    /**
     *  Gets a xpath attribute, if the attribute is not found a default is used.
     *  This function only returns the first element
     *    @param value of the element
     *    @param xpath_expr of the xml element
     *    @param def default value if the element is not found
     *
     *    @return -1 if default was set
     */
    template<typename T>
    int xpath(T& value, const char * xpath_expr, const T& def)
    {
        std::vector<std::string> values;

        xpaths(values, xpath_expr);

        if (values.empty() == true)
        {
            value = def;
            return -1;
        }

        std::istringstream iss(values[0]);

        iss >> std::dec >> value;

        if (iss.fail() == true)
        {
            value = def;
            return -1;
        }

        return 0;
    }

    int xpath(std::string& value, const char * xpath_expr, const char * def);

    /**
     *  Gets the value of an element from an xml string
     *    @param value the value of the element
     *    @param xml the xml string
     *    @param xpath the xpath of the target element
     *
     *    @return -1 if the element was not found
     */
    static int xpath_value(std::string& value, const char *xml, const char *xpath);

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes.
     *    @param name of the attribute
     *    @param value of the attribute
     *
     *    @return -1 if the element was not found
     */
    virtual int search(const char *name, std::string& value)
    {
        return __search(name, value);
    }

    virtual int search(const char *name, int& value)
    {
        return __search(name, value);
    }

    virtual int search(const char *name, float& value)
    {
        return __search(name, value);
    }

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes.
     *  @param name of the attribute
     *  @results vector of attributes that matches the query
     */
    template<typename T>
    void search(const char* name, std::vector<T>& results)
    {

        if (name[0] == '/')
        {
            xpaths(results, name);
        }
        else if (num_paths == 0)
        {
            results.clear();
        }
        else
        {
            std::ostringstream  xpath;

            xpath << paths[0] << name;

            for (int i = 1; i < num_paths ; i++)
            {
                xpath << '|' << paths[i] << name;
            }

            xpaths(results, xpath.str().c_str());
        }
    }

    /**
     *  Get xml nodes by Xpath
     *    @param xpath_expr the Xpath for the elements
     *    @param content nodes for the given Xpath expression. The nodes are
     *    returned as pointers to the object nodes.
     *    @return the number of nodes found
     */
    int get_nodes(const std::string& xpath_expr,
                  std::vector<xmlNodePtr>& content) const;

    /**
     *  Count number of nodes matching a given xpath_expr
     *    @param xpath_expr the Xpath for the elements
     *    @return the number of nodes found
     */
    int count_nodes(const std::string& xpath_expr) const;

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
     *  Removes nodes from the object by xPath
     *
     *  @param xpath_expr Path of the parent node
     *
     *  @return number of elements removed
     */
    int remove_nodes(const char * xpath_expr);

    /**
     *  Frees a vector of XMLNodes, as returned by the get_nodes function
     *    @param content the vector of xmlNodePtr
     */
    static void free_nodes(std::vector<xmlNodePtr>& content)
    {
        for (auto it : content)
        {
            xmlFreeNode(it);
        }

        content.clear();
    }

    /**
     *   Updates the object representation with a new XML document. Previous
     *   XML resources are freed
     *   @param xml_doc the new xml document
     */
    int update_from_str(const std::string &xml_doc);

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
    static int validate_xml(const std::string &xml_doc);

    /**
     *  Validates the XML doc against a RelaxNG schema
     *
     *  @param xml_doc string containing the XML document
     *  @param schema_path path to RelaxNG schema file
     *  @return 0 if the xml validates
     */
    static int validate_rng(const std::string &xml_doc,
                            const std::string& schema_path);

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
    int eval_bool(const std::string& expr, bool& result, char **errmsg);

    /**
     *  Evaluates a rank expression on the given host.
     *    @param rank string
     *    @param result of the rank evaluation
     *    @param errmsg string describing the error, must be freed by the
     *    calling function
     *    @return 0 on success
     */
    int eval_arith(const std::string& expr, int& result, char **errmsg);

    /**
     *  Function to write the Object in an output stream
     */
    friend std::ostream& operator<<(std::ostream& os, ObjectXML& oxml)
    {
        xmlNodePtr root_node = xmlDocGetRootElement(oxml.xml);

        if ( root_node == 0 )
        {
            return os;
        }

        xmlBufferPtr buffer = xmlBufferCreate();

        xmlNodeDump(buffer, oxml.xml, root_node, 0, 0);

        std::string str(reinterpret_cast<char *>(buffer->content));
        os << str;

        xmlBufferFree(buffer);

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
    void xml_parse(const std::string &xml_doc);

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes.
     *    @param name of the attribute
     *    @param value of the attribute
     *
     *    @return -1 if the element was not found
     */
    template<typename T>
    int __search(const char *name, T& value)
    {
        std::vector<T> results;

        search(name, results);

        if (results.size() != 0)
        {
            value = results[0];

            return 0;
        }

        return -1;
    };
};

#endif /*OBJECT_XML_H_*/
