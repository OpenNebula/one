/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaUtil.h"

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

    if(rc == 0)
    {
        trim_name();
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

int Template::replace(const string& name, const string& value)
{
    pair<multimap<string, Attribute *>::iterator,
         multimap<string, Attribute *>::iterator>   index;

    index = attributes.equal_range(name);

    if (index.first != index.second )
    {
        multimap<string, Attribute *>::iterator i;

        for ( i = index.first; i != index.second; i++)
        {
            Attribute * attr = i->second;
            delete attr;
        }

        attributes.erase(index.first, index.second);
    }

    SingleAttribute * sattr = new SingleAttribute(name,value);

    attributes.insert(make_pair(sattr->name(), sattr));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::replace(const string& name, const bool& value)
{
    string s_val;

    pair<multimap<string, Attribute *>::iterator,
         multimap<string, Attribute *>::iterator>   index;

    index = attributes.equal_range(name);

    if (index.first != index.second )
    {
        multimap<string, Attribute *>::iterator i;

        for ( i = index.first; i != index.second; i++)
        {
            Attribute * attr = i->second;
            delete attr;
        }

        attributes.erase(index.first, index.second);
    }

    if (value)
    {
        s_val = "YES";
    }
    else
    {
        s_val = "NO";
    }

    SingleAttribute * sattr = new SingleAttribute(name, s_val);

    attributes.insert(make_pair(sattr->name(), sattr));

    return 0;
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

Attribute * Template::remove(Attribute * att)
{
    multimap<string, Attribute *>::iterator         i;

    pair<
        multimap<string, Attribute *>::iterator,
        multimap<string, Attribute *>::iterator
        >                                           index;

    index = attributes.equal_range( att->name() );

    for ( i = index.first; i != index.second; i++ )
    {
        if ( i->second == att )
        {
            attributes.erase(i);

            return att;
        }
    }

    return 0;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Template::get(const string& name, string& value) const
{
    const SingleAttribute * s = __get<SingleAttribute>(name);

    if ( s == 0 )
    {
        value = "";
        return false;
    }

    value = s->value();

	return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Template::get(const string& name, bool& value) const
{
    const SingleAttribute * s = __get<SingleAttribute>(name);

    value = false;

    if ( s == 0 )
    {
        return false;
    }

    string sval = s->value();

    if (one_util::toupper(sval) == "YES")
    {
        value = true;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Template::to_xml(string& xml) const
{
    multimap<string,Attribute *>::const_iterator  it;
    ostringstream                           oss;
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

bool Template::trim(const string& name)
{
    string st;
    get(name, st);

    if(st.empty())
    {
        return false;
    }

    replace(name, st.substr( 0, st.find_last_not_of(" \f\n\r\t\v") + 1 ) );

    return true;
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

    if( child != 0 && child->next == 0 &&
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

    clear();

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

void Template::clear()
{
    if (attributes.empty())
    {
        return;
    }

    multimap<string,Attribute *>::iterator it;

    for ( it = attributes.begin(); it != attributes.end(); it++)
    {
        delete it->second;
    }

    attributes.clear();
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*   RESTRICTED ATTRIBUTES INTERFACE                                          */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::merge(const Template * from)
{
    multimap<string, Attribute *>::const_iterator it, jt;

    for (it = from->attributes.begin(); it != from->attributes.end(); ++it)
    {
        erase(it->first);
    }

    for (it = from->attributes.begin(); it != from->attributes.end(); ++it)
    {
        if ( it->second->type() == Attribute::VECTOR )
        {
            VectorAttribute * va = static_cast<VectorAttribute *>(it->second);

            if (!va->value().empty())
            {
                set(it->second->clone());
            }
        }
        else //Attribute::SINGLE
        {
            set(it->second->clone());
        }
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Template::parse_restricted(const vector<const SingleAttribute *>& ras,
        std::map<std::string, std::set<std::string> >& ras_m)
{
    vector<const SingleAttribute *>::const_iterator it;

    for (it = ras.begin(); it != ras.end(); ++it)
    {
        string va  = (*it)->value();
        size_t pos = va.find("/");

        if (pos != string::npos) //Vector Attribute
        {
            string avector = va.substr(0,pos);
            string vattr   = va.substr(pos+1);

            map<std::string, std::set<string> >::iterator jt;

            jt = ras_m.find(avector);

            if ( jt == ras_m.end() )
            {
                std::set<std::string> aset;

                aset.insert(vattr);

                ras_m.insert(make_pair(avector, aset));
            }
            else
            {
                jt->second.insert(vattr);
            }
        }
        else
        {
            std::set<std::string> eset;

            ras_m.insert(make_pair(va, eset));
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void restricted_values(const string& vname, const set<string>& vsubs,
        const Template* tmpl, vector<string>& rstrings)
{
    string value;

    vector<const VectorAttribute *>::const_iterator va_it;
    vector<const VectorAttribute *> va;

    tmpl->get(vname, va);

    for ( va_it = va.begin(); va_it != va.end() ; ++va_it )
    {
        for (set<string>::iterator jt = vsubs.begin(); jt != vsubs.end(); ++jt)
        {
            if ( (*va_it)->vector_value(*jt, value) == 0 )
            {
                rstrings.push_back(*jt + value);
            }
        }
    }

    sort(rstrings.begin(), rstrings.end());
}

bool Template::check_restricted(string& ra, const Template* base,
        const std::map<std::string, std::set<std::string> >& ras)
{
    std::map<std::string, std::set<std::string> >::const_iterator rit;

    for ( rit = ras.begin(); rit != ras.end(); ++rit )
    {
        if (!(rit->second).empty())
        {
            vector<string> rvalues, rvalues_base;

            restricted_values(rit->first, rit->second, this, rvalues);
            restricted_values(rit->first, rit->second, base, rvalues_base);

            if ( rvalues != rvalues_base )
            {
                ra = rit->first;
                return true;
            }
        }
        else
        {
            if ( get(rit->first, ra) )
            {
                string ra_b;

                base->get(rit->first, ra_b);

                if ( ra_b != ra )
                {
                    ra = rit->first;
                    return true;
                }
            }
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Template::check_restricted(string& ra,
        const std::map<std::string, std::set<std::string> >& ras)
{
    std::map<std::string, std::set<std::string> >::const_iterator rit;

    for ( rit = ras.begin(); rit != ras.end(); ++rit )
    {
        const std::set<std::string>& sub = rit->second;

        if (!sub.empty()) //Vector Attribute
        {
            // -----------------------------------------------------------------
            // -----------------------------------------------------------------
            std::set<std::string>::iterator jt;
            std::vector<VectorAttribute *>::iterator va_it;

            std::vector<VectorAttribute *> va;

            get(rit->first, va);

            for ( va_it = va.begin(); va_it != va.end() ; ++va_it )
            {
                for ( jt = sub.begin(); jt != sub.end(); ++jt )
                {
                    if ( (*va_it)->vector_value(*jt, ra) == 0 )
                    {
                        ra = *jt;
                        return true;
                    }
                }
            }
        }
        else if ( get(rit->first, ra) ) //Single Attribute
        {
            ra = rit->first;
            return true;
        }
    }

    return false;
}
