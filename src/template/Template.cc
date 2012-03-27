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

#include "Template.h"
#include "template_syntax.h"

#include <iostream>
#include <sstream>
#include <cstring>
#include <cstdio>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Template::~Template()
{
    multimap<string,Attribute *>::iterator  it;

    for ( it = attributes.begin(); it != attributes.end(); it++)
    {
        delete it->second;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

pthread_mutex_t Template::mutex = PTHREAD_MUTEX_INITIALIZER;

extern "C"
{
    typedef struct yy_buffer_state * YY_BUFFER_STATE;

    extern FILE *template_in, *template_out;

    int template_parse(Template * tmpl, char ** errmsg);

    int template_lex_destroy();

    YY_BUFFER_STATE template__scan_string(const char * str);

    void template__delete_buffer(YY_BUFFER_STATE);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::parse(const char * filename, char **error_msg)
{
    int     rc;

    pthread_mutex_lock(&mutex);

    *error_msg = 0;

    template_in = fopen (filename, "r");

    if ( template_in == 0 )
    {
        goto error_open;
    }

    rc = template_parse(this,error_msg);

    fclose(template_in);

    template_lex_destroy();

    pthread_mutex_unlock(&mutex);

    return rc;

error_open:
    *error_msg = strdup("Error opening template file");

    pthread_mutex_unlock(&mutex);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::parse(const string &parse_str, char **error_msg)
{
    YY_BUFFER_STATE     str_buffer = 0;
    const char *        str;
    int                 rc;

    pthread_mutex_lock(&mutex);

    *error_msg = 0;

    str = parse_str.c_str();

    str_buffer = template__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = template_parse(this,error_msg);

    template__delete_buffer(str_buffer);

    template_lex_destroy();

    pthread_mutex_unlock(&mutex);

    return rc;

error_yy:

    *error_msg=strdup("Error setting scan buffer");

    pthread_mutex_unlock(&mutex);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::parse_str_or_xml(const string &parse_str, string& error_msg)
{
    int     rc;

    if ( parse_str[0] == '<' )
    {
        rc = from_xml(parse_str);

        if ( rc != 0 )
        {
            error_msg = "Parse error: XML Template malformed.";
        }
    }
    else
    {
        char * error_char = 0;

        rc = parse(parse_str, &error_char);

        if ( rc != 0 )
        {
            ostringstream oss;

            oss << "Parse error";

            if (error_char != 0)
            {
                oss << ": " << error_char;

                free(error_char);
            }
            else
            {
                oss << ".";
            }

            error_msg = oss.str();
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::marshall(string &str, const char delim)
{
    multimap<string,Attribute *>::iterator  it;
    string *                                attr;

    for(it=attributes.begin(),str="";it!=attributes.end();it++)
    {
        attr = it->second->marshall();

        if ( attr == 0 )
        {
            continue;
        }

        str += it->first + "=" + *attr + delim;

        delete attr;
    }
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::set(Attribute * attr)
{
    if ( replace_mode == true )
    {
        multimap<string, Attribute *>::iterator         i;
        pair<multimap<string, Attribute *>::iterator,
        multimap<string, Attribute *>::iterator>        index;

        index = attributes.equal_range(attr->name());

        for ( i = index.first; i != index.second; i++)
        {
            delete i->second;
        }

        attributes.erase(attr->name());
    }

    attributes.insert(make_pair(attr->name(),attr));
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::remove(const string& name, vector<Attribute *>& values)
{
    multimap<string, Attribute *>::iterator         i;
    pair<multimap<string, Attribute *>::iterator,
    multimap<string, Attribute *>::iterator>        index;
    int                                             j;

    index = attributes.equal_range(name);

    for ( i = index.first,j=0 ; i != index.second ; i++,j++ )
    {
        values.push_back(i->second);
    }

    attributes.erase(index.first,index.second);

    return j;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::erase(const string& name)
{
    multimap<string, Attribute *>::iterator         i;

    pair<
        multimap<string, Attribute *>::iterator,
        multimap<string, Attribute *>::iterator
        >                                           index;
    int                                             j;

    index = attributes.equal_range(name);

    if (index.first == index.second )
    {
        return 0;
    }

    for ( i = index.first,j=0 ; i != index.second ; i++,j++ )
    {
        Attribute * attr = i->second;
        delete attr;
    }

    attributes.erase(index.first,index.second);

    return j;

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::get(
    const string& name,
    vector<const Attribute*>& values) const
{
    multimap<string, Attribute *>::const_iterator       i;
    pair<multimap<string, Attribute *>::const_iterator,
    multimap<string, Attribute *>::const_iterator>      index;
    int                                                 j;

    index = attributes.equal_range(name);

    for ( i = index.first,j=0 ; i != index.second ; i++,j++ )
    {
        values.push_back(i->second);
    }

    return j;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::get(
    const string& name,
    vector<Attribute*>& values)
{
    multimap<string, Attribute *>::iterator       i;
    pair<multimap<string, Attribute *>::iterator,
    multimap<string, Attribute *>::iterator>      index;
    int                                           j;

    index = attributes.equal_range(name);

    for ( i = index.first,j=0 ; i != index.second ; i++,j++ )
    {
        values.push_back(i->second);
    }

    return j;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::get(
        const string& name,
        string& value) const
{
    vector<const Attribute *>   attrs;
    const SingleAttribute *     sattr;
    int                         rc;
    rc = get(name,attrs);

    if  (rc == 0)
    {
        value = "";
        return;
    }

    sattr = dynamic_cast<const SingleAttribute *>(attrs[0]);

    if ( sattr != 0 )
    {
        value = sattr->value();
    }
    else
    {
        value="";
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Template::get(
        const string& name,
        int&    value) const
{
    string sval;

    get(name, sval);

    if ( sval == "" )
    {
        value = 0;
        return false;
    }

    istringstream iss(sval);

    iss >> value;
    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Template::to_xml(string& xml) const
{
    multimap<string,Attribute *>::const_iterator  it;
    ostringstream                   		oss;
    string *                                s;

    oss << "<" << xml_root << ">";

    for ( it = attributes.begin(); it!=attributes.end(); it++)
    {
        s = it->second->to_xml();

        oss << *s;

        delete s;
    }

    oss << "</" << xml_root << ">";

    xml = oss.str();

	return xml;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Template::to_str(string& str) const
{
	ostringstream os;
    multimap<string,Attribute *>::const_iterator  it;
    string *                                s;

    for ( it = attributes.begin(); it!=attributes.end(); it++)
    {
        s = it->second->marshall(",");

        os << it->first << separator << *s << endl;

        delete s;
    }

	str = os.str();
    return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator << (ostream& os, const Template& t)
{
	string str;

	os << t.to_str(str);

    return os;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

Attribute * Template::single_xml_att(const xmlNode * node)
{
    Attribute * attr = 0;
    xmlNode *   child = node->children;

    if( child->next == 0 && child != 0 &&
        (child->type == XML_TEXT_NODE ||
         child->type == XML_CDATA_SECTION_NODE))
    {
        attr = new SingleAttribute(
                            reinterpret_cast<const char *>(node->name),
                            reinterpret_cast<const char *>(child->content) );
    }

    return attr;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

Attribute * Template::vector_xml_att(const xmlNode * node)
{
    VectorAttribute *   attr        = 0;

    xmlNode *           child       = node->children;
    xmlNode *           grandchild  = 0;

    while(child != 0 && child->type != XML_ELEMENT_NODE)
    {
        child = child->next;
    }

    if(child != 0)
    {
        attr = new VectorAttribute(
                        reinterpret_cast<const char *>(node->name));

        for(child = child; child != 0; child = child->next)
        {
            grandchild = child->children;

            if( grandchild != 0 && (grandchild->type == XML_TEXT_NODE ||
                                    grandchild->type == XML_CDATA_SECTION_NODE))
            {
                attr->replace(
                        reinterpret_cast<const char *>(child->name),
                        reinterpret_cast<const char *>(grandchild->content) );
            }
        }
    }

    return attr;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Template::from_xml(const string &xml_str)
{
    xmlDocPtr xml_doc = 0;
    xmlNode * root_element;

    // Parse xml string as libxml document
    xml_doc = xmlParseMemory (xml_str.c_str(),xml_str.length());

    if (xml_doc == 0) // Error parsing XML Document
    {
        return -1;
    }

    // Get the <TEMPLATE> element
    root_element = xmlDocGetRootElement(xml_doc);
    if( root_element == 0 )
    {
        return -1;
    }

    rebuild_attributes(root_element);

    xmlFreeDoc(xml_doc);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Template::from_xml_node(const xmlNodePtr node)
{
    if (node == 0)
    {
        return -1;
    }

    rebuild_attributes(node);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Template::rebuild_attributes(const xmlNode * root_element)
{
    xmlNode * cur_node = 0;

    Attribute * attr;

    //Clear the template if not empty
    if (!attributes.empty())
    {
        multimap<string,Attribute *>::iterator  it;

        for ( it = attributes.begin(); it != attributes.end(); it++)
        {
            delete it->second;
        }

        attributes.clear();
    }

    // Get the root's children and try to build attributes.
    for (cur_node = root_element->children;
         cur_node != 0;
         cur_node = cur_node->next)
    {
        if (cur_node->type == XML_ELEMENT_NODE)
        {
            // Try to build a single attr.
            attr = single_xml_att(cur_node);
            if(attr == 0)   // The xml element wasn't a single attr.
            {
                // Try with a vector attr.
                attr = vector_xml_att(cur_node);
            }

            if(attr != 0)
            {
                set(attr);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::set_restricted_attributes( vector<const Attribute *>& rattrs,
                                vector<string>& restricted_attributes)
{
    const SingleAttribute * sattr;
    string attr;

    for (unsigned int i = 0 ; i < rattrs.size() ; i++ )
    {
        sattr = static_cast<const SingleAttribute *>(rattrs[i]);

        attr = sattr->value();
        transform (attr.begin(),attr.end(),attr.begin(),(int(*)(int))toupper);

        restricted_attributes.push_back(attr);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Template::check(string& rs_attr, const vector<string> &restricted_attributes)
{
    size_t pos;
    string avector, vattr;
    vector<const Attribute *> values;

    for (unsigned int i=0; i < restricted_attributes.size(); i++)
    {
        pos = restricted_attributes[i].find("/");

        if (pos != string::npos) //Vector Attribute
        {
            int num;

            avector = restricted_attributes[i].substr(0,pos);
            vattr   = restricted_attributes[i].substr(pos+1);

            if ((num = get(avector,values)) > 0 ) //Template contains the attr
            {
                const VectorAttribute * attr;

                for (int j=0; j<num ; j++ )
                {
                    attr = dynamic_cast<const VectorAttribute *>(values[j]);

                    if (attr == 0)
                    {
                        continue;
                    }

                    if ( !attr->vector_value(vattr.c_str()).empty() )
                    {
                        rs_attr = restricted_attributes[i];
                        return true;
                    }
                }
            }
        }
        else //Single Attribute
        {
            if (get(restricted_attributes[i],values) > 0 )
            {
                rs_attr = restricted_attributes[i];
                return true;
            }
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

