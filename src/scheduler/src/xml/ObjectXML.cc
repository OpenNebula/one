/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ObjectXML::ObjectXML(const string &xml_doc):xml(0),ctx(0)
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

ObjectXML::ObjectXML(const xmlNodePtr node):xml(0),ctx(0)
{
    xml = xmlNewDoc(reinterpret_cast<const xmlChar *>("1.0"));

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

    xmlNodePtr root_node = xmlDocCopyNode(node,xml,1);

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

vector<string> ObjectXML::operator[] (const char * xpath_expr)
{
    xmlXPathObjectPtr obj;
    vector<string>    content;

    obj = xmlXPathEvalExpression(
        reinterpret_cast<const xmlChar *>(xpath_expr), ctx);

    if (obj == 0 || obj->nodesetval == 0)
    {
        return content;
    }

    xmlNodeSetPtr ns = obj->nodesetval;
    int           size = ns->nodeNr;
    xmlNodePtr    cur;
    xmlChar *     str_ptr;

    for(int i = 0; i < size; ++i)
    {
        cur = ns->nodeTab[i];

        if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
        {
            continue;
        }

        str_ptr = xmlNodeGetContent(cur);

        if (str_ptr != 0)
        {
            string element_content = reinterpret_cast<char *>(str_ptr);

            content.push_back(element_content);

            xmlFree(str_ptr);
        }
    }

    xmlXPathFreeObject(obj);

    return content;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectXML::get_nodes (const char * xpath_expr, vector<xmlNodePtr>& content)
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
    int           num_nodes = 0;
    xmlNodePtr    cur;

    for(int i = 0; i < size; ++i)
    {
        cur = ns->nodeTab[i];

        if ( cur == 0 || cur->type != XML_ELEMENT_NODE )
        {
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

int ObjectXML::update(const string &xml_doc)
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

void ObjectXML::xml_parse(const string &xml_doc)
{
    xml = xmlParseMemory (xml_doc.c_str(),xml_doc.length());

    if (xml == 0)
    {
        throw("Error parsing XML Document");
    }

    ctx = xmlXPathNewContext(xml);

    if (ctx == 0)
    {
        xmlFreeDoc(xml);
        throw("Unable to create new XPath context");
    }
}


/* ************************************************************************ */
/* Host :: Parse functions to compute rank and evaluate requirements        */
/* ************************************************************************ */

extern "C"
{
    typedef struct yy_buffer_state * YY_BUFFER_STATE;

    int expr_bool_parse(ObjectXML * oxml, bool& result, char ** errmsg);

    int expr_arith_parse(ObjectXML * oxml, int& result, char ** errmsg);

    int expr_lex_destroy();

    YY_BUFFER_STATE expr__scan_string(const char * str);

    void expr__delete_buffer(YY_BUFFER_STATE);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ObjectXML::eval_bool(const string& expr, bool& result, char **errmsg)
{
    YY_BUFFER_STATE     str_buffer = 0;
    const char *        str;
    int                 rc;

    *errmsg = 0;

    str = expr.c_str();

    str_buffer = expr__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = expr_bool_parse(this,result,errmsg);

    expr__delete_buffer(str_buffer);

    expr_lex_destroy();

    return rc;

error_yy:

    *errmsg=strdup("Error setting scan buffer");

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ObjectXML::eval_arith(const string& expr, int& result, char **errmsg)
{
    YY_BUFFER_STATE     str_buffer = 0;
    const char *        str;
    int                 rc;

    *errmsg = 0;

    str = expr.c_str();

    str_buffer = expr__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = expr_arith_parse(this,result,errmsg);

    expr__delete_buffer(str_buffer);

    expr_lex_destroy();

    return rc;

error_yy:

    *errmsg=strdup("Error setting scan buffer");

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

