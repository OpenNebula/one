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

#include "Template.h"

#include "template_syntax.h"
#include "template_parser.h"

#include "NebulaUtil.h"

#include <iostream>
#include <sstream>
#include <cstring>
#include <cstdio>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Template::~Template()
{
    for ( auto it = attributes.begin(); it != attributes.end(); it++)
    {
        delete it->second;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::parse(const char * filename, char **error_msg)
{
    int rc;

    yyscan_t scanner = 0;

    YY_BUFFER_STATE file_buffer = 0;

    *error_msg = 0;

    FILE * template_in = fopen (filename, "r");

    if ( template_in == 0 )
    {
        *error_msg = strdup("Error opening template file");

        return -1;
    }

    template_lex_init(&scanner);

    file_buffer = template__create_buffer(template_in, YY_BUF_SIZE, scanner);

    template__switch_to_buffer(file_buffer, scanner);

    rc = template_parse(this, error_msg, scanner);

    fclose(template_in);

    template__delete_buffer(file_buffer, scanner);

    template_lex_destroy(scanner);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::parse(const string &parse_str, char **error_msg)
{
    const char * str;
    int rc;

    YY_BUFFER_STATE str_buffer = 0;
    yyscan_t scanner = 0;

    *error_msg = 0;

    template_lex_init(&scanner);

    str = parse_str.c_str();

    str_buffer = template__scan_string(str, scanner);

    if (str_buffer == 0)
    {
        *error_msg=strdup("Error setting scan buffer");

        return -1;
    }

    rc = template_parse(this, error_msg, scanner);

    template__delete_buffer(str_buffer, scanner);

    template_lex_destroy(scanner);

    return rc;
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
    str = "";

    for(auto it = attributes.begin(); it != attributes.end(); it++)
    {
        string attr = it->second->marshall();

        if ( attr.empty() )
        {
            continue;
        }

        str += it->first + "=" + attr + delim;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::set(Attribute * attr)
{
    if ( replace_mode == true )
    {
        auto index = attributes.equal_range(attr->name());

        for ( auto i = index.first; i != index.second; i++)
        {
            delete i->second;
        }

        attributes.erase(attr->name());
    }

    attributes.insert(make_pair(attr->name(), attr));
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::replace(const string& name, const string& value)
{
    auto index = attributes.equal_range(name);

    if (index.first != index.second )
    {
        for ( auto i = index.first; i != index.second; i++)
        {
            delete i->second;
        }

        attributes.erase(index.first, index.second);
    }

    SingleAttribute * sattr = new SingleAttribute(name, value);

    attributes.insert(make_pair(sattr->name(), sattr));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Template::replace(const string& name, const bool& value)
{
    string s_val;

    auto index = attributes.equal_range(name);

    if (index.first != index.second )
    {
        for ( auto i = index.first; i != index.second; i++)
        {
            delete i->second;
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
    int  j = 0;

    auto index = attributes.equal_range(name);

    if (index.first == index.second )
    {
        return 0;
    }

    for ( auto i = index.first; i != index.second; i++, j++ )
    {
        delete i->second;
    }

    attributes.erase(index.first, index.second);

    return j;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Attribute * Template::remove(Attribute * att)
{
    auto index = attributes.equal_range( att->name() );

    for ( auto i = index.first; i != index.second; i++ )
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
    ostringstream oss;

    oss << "<" << xml_root << ">";

    for ( auto it = attributes.begin(); it!=attributes.end(); it++)
    {
        it->second->to_xml(oss);
    }

    oss << "</" << xml_root << ">";

    xml = oss.str();

    return xml;
}

string& Template::to_xml(string& xml, const std::map<std::string, std::set<std::string>> &hidden) const
{
    ostringstream oss;

    oss << "<" << xml_root << ">";

    for ( auto it = attributes.begin(); it!=attributes.end(); it++)
    {
        it->second->to_xml(oss, hidden);
    }

    oss << "</" << xml_root << ">";

    xml = oss.str();

    return xml;
}

string& Template::to_xml(string& xml, const string& extra) const
{
    ostringstream oss;

    oss << "<" << xml_root << ">";

    for ( auto it = attributes.begin(); it!=attributes.end(); it++)
    {
        it->second->to_xml(oss);
    }

    if (!extra.empty())
    {
        oss << extra;
    }

    oss << "</" << xml_root << ">";

    xml = oss.str();

    return xml;
}

string& Template::to_json(string& json) const
{
    // List of attributes that should be an Array (even with just 1 element)
    static const std::set<string> ARRAY_ATTRS = {"DISK", "NIC"};

    ostringstream oss;

    bool is_first = true;

    oss << "\"" << xml_root << "\": {";

    for ( auto it = attributes.begin(); it!=attributes.end(); )
    {
        if (!is_first)
        {
            oss << ",";
        }
        else
        {
            is_first = false;
        }

        oss << "\"" << it->first << "\": ";

        if ( attributes.count(it->first) == 1 &&
             ARRAY_ATTRS.count(it->first) == 0)
        {
            it->second->to_json(oss);

            ++it;
        }
        else
        {
            std::string jelem = it->first;
            bool is_array_first = true;

            oss << "[ ";

            for ( ; it->first == jelem && it != attributes.end() ; ++it )
            {
                if ( !is_array_first )
                {
                    oss << ",";
                }
                else
                {
                    is_array_first = false;
                }

                it->second->to_json(oss);
            }

            oss << "]";
        }
    }

    oss << "}";

    json = oss.str();

    return json;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Template::to_str(string& str) const
{
    ostringstream os;

    for ( auto it = attributes.begin(); it!=attributes.end(); it++)
    {
        string s = it->second->marshall(",");

        os << it->first << separator << s << endl;
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
    VectorAttribute *   attr        = nullptr;

    xmlNode *           child       = node->children;

    while(child != 0 && child->type != XML_ELEMENT_NODE)
    {
        child = child->next;
    }

    if(child != 0)
    {
        attr = new VectorAttribute(
                reinterpret_cast<const char *>(node->name));

        for( ; child != 0; child = child->next)
        {
            xmlNode *grandchild = child->children;

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
    xml_doc = xmlParseMemory (xml_str.c_str(), xml_str.length());

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

    for ( auto it = attributes.begin(); it != attributes.end(); it++)
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
    for (auto it = from->attributes.begin(); it != from->attributes.end(); ++it)
    {
        erase(it->first);
    }

    for (auto it = from->attributes.begin(); it != from->attributes.end(); ++it)
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

static void parse_attributes(const vector<const SingleAttribute *>& as,
                             std::map<std::string, std::set<std::string> >& as_m)
{
    for (auto attr : as)
    {
        string va  = attr->value();
        size_t pos = va.find("/");

        if (pos != string::npos) //Vector Attribute
        {
            string avector = va.substr(0, pos);
            string vattr   = va.substr(pos+1);

            auto jt = as_m.find(avector);

            if ( jt == as_m.end() )
            {
                std::set<std::string> aset;

                aset.insert(vattr);

                as_m.insert(make_pair(avector, aset));
            }
            else
            {
                jt->second.insert(vattr);
            }
        }
        else
        {
            std::set<std::string> eset;

            as_m.insert(make_pair(va, eset));
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::parse_restricted(const vector<const SingleAttribute *>& ras,
                                std::map<std::string, std::set<std::string> >& rattr_m)
{
    parse_attributes(ras, rattr_m);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::parse_encrypted(const vector<const SingleAttribute *>& eas,
                               std::map<std::string, std::set<std::string> >& eattr_m)
{
    parse_attributes(eas, eattr_m);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static bool restricted_values(const string& vname, const set<string>& vsubs,
                              const Template* tmpl, vector<string>& rstrings)
{
    string value;
    bool exists;

    vector<const VectorAttribute *> va;

    exists = tmpl->get(vname, va);

    for ( auto vattr : va )
    {
        for (const auto& sub : vsubs)
        {
            if ( vattr->vector_value(sub, value) == 0 )
            {
                rstrings.push_back(sub + value);
            }
        }
    }

    sort(rstrings.begin(), rstrings.end());

    return exists;
}

bool Template::check_restricted(string& ra, const Template* base,
                                const std::map<std::string, std::set<std::string> >& ras, bool append)
{
    for ( auto rit = ras.begin(); rit != ras.end(); ++rit )
    {
        if (!(rit->second).empty())
        {
            vector<string> rvalues, rvalues_base;

            bool new_restricted  = restricted_values(rit->first, rit->second, this, rvalues);
            bool base_restricted = restricted_values(rit->first, rit->second, base, rvalues_base);

            bool has_restricted = new_restricted || (!append && base_restricted);

            if ( rvalues != rvalues_base && has_restricted)
            {
                ra = rit->first;
                return true;
            }
        }
        else
        {
            // +---------+--------+--------------------+
            // | current | base   | outcome            |
            // +---------+--------+--------------------+
            // |  YES    | YES/NO | Error if different |
            // |  NO     | YES    | Add to current     |
            // |  NO     | NO     | Nop                |
            // +---------+--------+--------------------+
            string ra_b;

            if ( get(rit->first, ra) )
            {
                base->get(rit->first, ra_b);

                if ( ra_b != ra )
                {
                    ra = rit->first;
                    return true;
                }
            }
            else if ( base->get(rit->first, ra_b) )
            {
                add(rit->first, ra_b);
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
    for ( auto rit = ras.begin(); rit != ras.end(); ++rit )
    {
        const std::set<std::string>& sub = rit->second;

        if (!sub.empty()) //Vector Attribute
        {
            // -----------------------------------------------------------------
            // -----------------------------------------------------------------
            std::vector<VectorAttribute *> va;

            get(rit->first, va);

            for ( auto vattr : va )
            {
                for ( const auto& s : sub )
                {
                    if ( vattr->vector_value(s, ra) == 0 )
                    {
                        ra = s;
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::encrypt(const std::string& one_key,
                       const std::map<std::string, std::set<std::string> >& eas)
{
    for (const auto& eit : eas )
    {
        const std::set<std::string>& sub = eit.second;

        if (!sub.empty()) //Vector Attribute
        {
            vector<VectorAttribute *> vatt;

            get(eit.first, vatt);

            if (vatt.empty())
            {
                continue;
            }

            for ( const auto& vattit : vatt )
            {
                vattit->encrypt(one_key, sub);
            }
        }
        else
        {
            vector<SingleAttribute *> vatt;

            get(eit.first, vatt);

            for ( const auto& attit : vatt )
            {
                attit->encrypt(one_key, sub);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Template::decrypt(const std::string& one_key,
                       const std::map<std::string, std::set<std::string> >& eas)
{
    for ( const auto& eit : eas )
    {
        const std::set<std::string>& sub = eit.second;

        if (!sub.empty()) //Vector Attribute
        {
            vector<VectorAttribute *> vatt;

            get(eit.first, vatt);

            for ( const auto& vattit : vatt )
            {
                vattit->decrypt(one_key, sub);

            }
        }
        else
        {
            vector<SingleAttribute *> vatt;

            get(eit.first, vatt);

            for ( const auto& attit : vatt )
            {
                attit->decrypt(one_key, sub);
            }
        }
    }
}
