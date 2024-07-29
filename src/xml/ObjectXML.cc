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

#include <ObjectXML.h>
#include <stdexcept>
#include <cstring>
#include <iostream>
#include <sstream>
#include <libxml/parser.h>
#include <libxml/relaxng.h>

#include "expr_arith.h"
#include "expr_bool.h"
#include "expr_parser.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ObjectXML::ObjectXML(const std::string &xml_doc)
    : paths(nullptr)
    , num_paths(0)
    , xml(nullptr)
    , ctx(nullptr)
{
    try
    {
        xml_parse(xml_doc);
    }
    catch(runtime_error& re)
    {
        throw;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ObjectXML::ObjectXML(const xmlNodePtr node)
    : paths(0)
    , num_paths(0)
    , xml(xmlNewDoc(reinterpret_cast<const xmlChar *>("1.0")))
    , ctx(0)
{
    if (xml == 0)
    {
        throw("Error allocating XML Document");
    }

    ctx = xmlXPathNewContext(xml);

    if (ctx == 0)
    {
        xmlFreeDoc(xml);
        throw("Unable to create new XPath context");
    }

    xmlNodePtr root_node = xmlDocCopyNode(node, xml, 1);

    if (root_node == 0)
    {
        xmlXPathFreeContext(ctx);
        xmlFreeDoc(xml);
        throw("Unable to allocate node");
    }

    xmlDocSetRootElement(xml, root_node);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ObjectXML::~ObjectXML()
{
    if (xml != 0)
    {
        xmlFreeDoc(xml);
    }

    if ( ctx != 0)
    {
        xmlXPathFreeContext(ctx);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ObjectXML::xpaths(std::vector<std::string>& content, const char * expr)
{
    xmlXPathObjectPtr obj;

    std::ostringstream oss;
    xmlNodePtr    cur;
    xmlChar *     str_ptr;

    obj = xmlXPathEvalExpression(reinterpret_cast<const xmlChar *>(expr), ctx);

    if (obj == 0)
    {
        return;
    }

    switch (obj->type)
    {
        case XPATH_NUMBER:
            oss << obj->floatval;

            content.push_back(oss.str());
            break;

        case XPATH_NODESET:
            if (obj->nodesetval == 0)
            {
                return;
            }

            for(int i = 0; i < obj->nodesetval->nodeNr ; ++i)
            {
                cur = obj->nodesetval->nodeTab[i];

                if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
                {
                    continue;
                }

                str_ptr = xmlNodeGetContent(cur);

                if (str_ptr != 0)
                {
                    std::string ncontent = reinterpret_cast<char *>(str_ptr);

                    content.push_back(ncontent);

                    xmlFree(str_ptr);
                }
            }
            break;

        case XPATH_UNDEFINED:
        case XPATH_BOOLEAN:
        case XPATH_STRING:
        case XPATH_POINT:
        case XPATH_RANGE:
        case XPATH_LOCATIONSET:
        case XPATH_USERS:
        case XPATH_XSLT_TREE:
            break;

    }

    xmlXPathFreeObject(obj);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::xpath(string& value, const char * xpath_expr, const char * def)
{
    vector<string> values;
    int rc = 0;

    xpaths(values, xpath_expr);

    if ( values.empty() == true )
    {
        value = def;
        rc    = -1;
    }
    else
    {
        value = values[0];
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::xpath_value(string& value, const char *doc, const char *the_xpath)
{
    try
    {
        ObjectXML      obj(doc);
        vector<string> values;

        obj.xpaths(values, the_xpath);

        if (values.empty() == true)
        {
            return -1;
        }

        value = values[0];
    }
    catch(runtime_error& re)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::get_nodes(const string& xpath_expr,
                         std::vector<xmlNodePtr>& content) const
{
    xmlXPathObjectPtr obj;

    obj = xmlXPathEvalExpression(
                  reinterpret_cast<const xmlChar *>(xpath_expr.c_str()), ctx);

    if (obj == 0)
    {
        return 0;
    }

    if (obj->nodesetval == 0)
    {
        xmlXPathFreeObject(obj);
        return 0;
    }

    xmlNodeSetPtr ns = obj->nodesetval;
    int           size = ns->nodeNr;
    int           num_nodes = 0;
    xmlNodePtr    cur;

    for(int i = 0; i < size; ++i)
    {
        cur = xmlCopyNode(ns->nodeTab[i], 1);

        if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
        {
            xmlFreeNode(cur);
            continue;
        }

        content.push_back(cur);
        num_nodes++;
    }

    xmlXPathFreeObject(obj);

    return num_nodes;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::count_nodes(const string& xpath_expr) const
{
    xmlXPathObjectPtr obj = xmlXPathEvalExpression(
                                    reinterpret_cast<const xmlChar *>(xpath_expr.c_str()), ctx);

    if (obj == 0)
    {
        return 0;
    }

    if (obj->nodesetval == 0)
    {
        xmlXPathFreeObject(obj);
        return 0;
    }

    int num_nodes = obj->nodesetval->nodeNr;

    xmlXPathFreeObject(obj);

    return num_nodes;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::add_node(
        const char *    xpath_expr,
        xmlNodePtr      node,
        const char *    new_name)
{
    xmlXPathObjectPtr obj;

    obj = xmlXPathEvalExpression(
                  reinterpret_cast<const xmlChar *>(xpath_expr), ctx);

    if (obj == 0 || obj->nodesetval == 0)
    {
        return -1;
    }

    xmlNodeSetPtr ns = obj->nodesetval;
    int           size = ns->nodeNr;
    xmlNodePtr    cur;

    for(int i = 0; i < size; ++i)
    {
        cur = ns->nodeTab[i];

        if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
        {
            continue;
        }

        xmlNodePtr node_cpy = xmlCopyNode(node, 1);

        if (node_cpy == 0)
        {
            xmlXPathFreeObject(obj);

            return -1;
        }

        xmlNodeSetName(node_cpy, reinterpret_cast<const xmlChar *>(new_name));

        xmlNodePtr res = xmlAddChild(cur, node_cpy);

        if (res == 0)
        {
            xmlXPathFreeObject(obj);
            xmlFreeNode(node_cpy);

            return -1;
        }
    }

    xmlXPathFreeObject(obj);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::update_from_str(const string &xml_doc)
{
    if (xml != 0)
    {
        xmlFreeDoc(xml);
    }

    if ( ctx != 0)
    {
        xmlXPathFreeContext(ctx);
    }

    try
    {
        xml_parse(xml_doc);
    }
    catch(runtime_error& re)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::update_from_node(const xmlNodePtr node)
{
    if (xml != 0)
    {
        xmlFreeDoc(xml);
    }

    if ( ctx != 0)
    {
        xmlXPathFreeContext(ctx);
    }

    xml = xmlNewDoc(reinterpret_cast<const xmlChar *>("1.0"));

    if (xml == 0)
    {
        return -1;
    }

    ctx = xmlXPathNewContext(xml);

    if (ctx == 0)
    {
        xmlFreeDoc(xml);
        return -1;
    }

    xmlNodePtr root_node = xmlDocCopyNode(node, xml, 1);

    if (root_node == 0)
    {
        xmlXPathFreeContext(ctx);
        xmlFreeDoc(xml);
        return -1;
    }

    xmlDocSetRootElement(xml, root_node);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::validate_xml(const string &xml_doc)
{
    xmlDocPtr tmp_xml = 0;
    tmp_xml = xmlParseMemory (xml_doc.c_str(), xml_doc.length());

    if (tmp_xml == 0)
    {
        return -1;
    }

    xmlFreeDoc(tmp_xml);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ObjectXML::xml_parse(const string &xml_doc)
{
    xml = xmlReadMemory (xml_doc.c_str(), xml_doc.length(), 0, 0, XML_PARSE_HUGE);

    if (xml == 0)
    {
        throw runtime_error("Error parsing XML Document");
    }

    ctx = xmlXPathNewContext(xml);

    if (ctx == 0)
    {
        xmlFreeDoc(xml);
        throw runtime_error("Unable to create new XPath context");
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::rename_nodes(const char * xpath_expr, const char * new_name)
{
    xmlXPathObjectPtr obj;

    obj = xmlXPathEvalExpression(
                  reinterpret_cast<const xmlChar *>(xpath_expr), ctx);

    if (obj == 0 || obj->nodesetval == 0)
    {
        return 0;
    }

    xmlNodeSetPtr ns = obj->nodesetval;
    int           size = ns->nodeNr;
    int           renamed = 0;
    xmlNodePtr    cur;

    for(int i = 0; i < size; ++i)
    {
        cur = ns->nodeTab[i];

        if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
        {
            continue;
        }

        xmlNodeSetName(cur, reinterpret_cast<const xmlChar *>(new_name));
        renamed++;
    }

    xmlXPathFreeObject(obj);

    return renamed;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::remove_nodes(const char * xpath_expr)
{
    xmlXPathObjectPtr obj = xmlXPathEvalExpression(
                                    reinterpret_cast<const xmlChar *>(xpath_expr), ctx);

    if (obj == 0 || obj->nodesetval == 0)
    {
        return 0;
    }

    xmlNodeSetPtr ns = obj->nodesetval;

    int size    = ns->nodeNr;
    int removed = size;

    for(int i = 0; i < size; ++i)
    {
        xmlNodePtr cur = ns->nodeTab[i];

        if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
        {
            removed--;
            continue;
        }

        xmlUnlinkNode(cur);

        xmlFreeNode(cur);
    }

    xmlXPathFreeObject(obj);

    return removed;
}

/* ************************************************************************ */
/* Host :: Parse functions to compute rank and evaluate requirements        */
/* ************************************************************************ */

int ObjectXML::eval_bool(const string& expr, bool& result, char **errmsg)
{
    const char * str;
    int          rc;

    YY_BUFFER_STATE str_buffer = 0;
    yyscan_t scanner = 0;

    *errmsg = 0;

    expr_lex_init(&scanner);

    str = expr.c_str();

    str_buffer = expr__scan_string(str, scanner);

    if (str_buffer == 0)
    {
        *errmsg=strdup("Error setting scan buffer");
        return -1;
    }

    rc = expr_bool_parse(this, result, errmsg, scanner);

    expr__delete_buffer(str_buffer, scanner);

    expr_lex_destroy(scanner);

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ObjectXML::eval_arith(const string& expr, int& result, char **errmsg)
{
    const char * str;
    int rc;

    YY_BUFFER_STATE str_buffer = 0;
    yyscan_t scanner = 0;

    *errmsg = 0;

    expr_lex_init(&scanner);

    str = expr.c_str();

    str_buffer = expr__scan_string(str, scanner);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = expr_arith_parse(this, result, errmsg, scanner);

    expr__delete_buffer(str_buffer, scanner);

    expr_lex_destroy(scanner);

    return rc;

error_yy:

    *errmsg=strdup("Error setting scan buffer");

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ObjectXML::validate_rng(const std::string &xml_doc, const string& schema_path)
{
    int rc;
    xmlDocPtr doc = 0;
    xmlRelaxNGPtr schema;
    xmlRelaxNGValidCtxtPtr validctxt;
    xmlRelaxNGParserCtxtPtr rngparser;

    doc = xmlParseMemory (xml_doc.c_str(), xml_doc.length());

    if (doc == 0)
    {
        return -1;
    }

    rngparser = xmlRelaxNGNewParserCtxt(schema_path.c_str());
    schema = xmlRelaxNGParse(rngparser);
    validctxt = xmlRelaxNGNewValidCtxt(schema);

    rc = xmlRelaxNGValidateDoc(validctxt, doc);

    xmlRelaxNGFree(schema);
    xmlRelaxNGFreeValidCtxt(validctxt);
    xmlRelaxNGFreeParserCtxt(rngparser);
    xmlFreeDoc(doc);

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
