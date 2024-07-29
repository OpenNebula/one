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

#include <string>
#include <sstream>
#include <cstring>

#include "Attribute.h"
#include "NebulaUtil.h"

using namespace std;

const char * VectorAttribute::magic_sep      = "@^_^@";
const int    VectorAttribute::magic_sep_size = 5;
const string Attribute::EMPTY_ATTRIBUTE = "";

string VectorAttribute::marshall(const char * _sep) const
{
    ostringstream os;
    const char *  my_sep;

    if ( _sep == 0 )
    {
        my_sep = magic_sep;
    }
    else
    {
        my_sep = _sep;
    }

    if ( attribute_value.size() == 0 )
    {
        return 0;
    }

    auto it = attribute_value.begin();

    os << it->first << "=" << it->second;

    for (++it; it != attribute_value.end(); it++)
    {
        os << my_sep << it->first << "=" << it->second;
    }

    return os.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::to_xml(ostringstream &oss) const
{
    oss << "<" << name() << ">";

    for (auto it=attribute_value.begin(); it!=attribute_value.end(); it++)
    {
        if ( it->first.empty() )
        {
            continue;
        }

        oss << "<" << it->first << ">"
            << one_util::escape_xml(it->second)
            << "</" << it->first << ">";
    }

    oss << "</"<< name() << ">";
}

void VectorAttribute::to_xml(ostringstream &oss,
                             const std::map<std::string, std::set<std::string>> &hidden) const
{
    oss << "<" << name() << ">";

    auto hidden_it = hidden.find(name());

    for (auto it=attribute_value.begin(); it!=attribute_value.end(); it++)
    {
        if ( it->first.empty())
        {
            continue;
        }

        oss << "<" << it->first << ">";

        if (hidden_it != hidden.end() &&
            hidden_it->second.find(it->first) != hidden_it->second.end())
        {
            oss << "***";
        }
        else
        {
            oss << one_util::escape_xml(it->second);
        }

        oss << "</" << it->first << ">";
    }

    oss << "</"<< name() << ">";
}

void VectorAttribute::to_json(std::ostringstream& s) const
{
    if ( attribute_value.empty() )
    {
        s << "{}";
        return;
    }

    bool is_first = true;

    s << "{";

    for (const auto& it : attribute_value)
    {
        if ( it.first.empty() )
        {
            continue;
        }

        if ( !is_first )
        {
            s << ",";
        }
        else
        {
            is_first = false;
        }

        s << "\"" << it.first << "\": ";
        one_util::escape_json(it.second, s);
    }

    s << "}";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::unmarshall(const string& sattr, const char * _sep)
{
    size_t  bpos=0, epos, mpos;
    string  tmp;
    bool    cont = true;

    const char *  my_sep;
    int           my_sep_size;

    if ( _sep == 0 )
    {
        my_sep      = magic_sep;
        my_sep_size = magic_sep_size;
    }
    else
    {
        my_sep      = _sep;
        my_sep_size = strlen(_sep);
    }

    while(cont)
    {
        epos=sattr.find(my_sep, bpos);

        if (epos == string::npos)
        {
            tmp  = sattr.substr(bpos);
            cont = false;
        }
        else
        {
            tmp  = sattr.substr(bpos, epos-bpos);
            bpos = epos + my_sep_size;
        }

        mpos = tmp.find('=');

        if (mpos == string::npos)
        {
            continue;
        }

        if ( mpos + 1 == tmp.size() )
        {
            attribute_value.insert(make_pair(tmp.substr(0, mpos), ""));
        }
        else
        {
            attribute_value.insert(make_pair(tmp.substr(0, mpos),
                                             tmp.substr(mpos+1)));
        }
    }
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::replace(const map<string, string>& attr)
{
    attribute_value = attr;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::merge(const VectorAttribute* vattr, bool replace)
{
    const map<string, string>& source_values = vattr->value();

    for (auto it=source_values.begin(); it!=source_values.end(); it++)
    {
        auto jt = attribute_value.find(it->first);

        if (jt != attribute_value.end())
        {
            if (replace)
            {
                attribute_value.erase(jt);
            }
            else
            {
                continue;
            }
        }

        attribute_value.insert(make_pair(it->first, it->second));
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::replace(const string& name, const string& value)
{
    auto it = attribute_value.find(name);

    if ( it != attribute_value.end() )
    {
        attribute_value.erase(it);
    }

    attribute_value.insert(make_pair(name, value));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::remove(const string& name)
{
    auto it = attribute_value.find(name);

    if ( it != attribute_value.end() )
    {
        attribute_value.erase(it);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VectorAttribute::vector_value(const string& name)
{
    auto it = attribute_value.find(name);

    if ( it == attribute_value.end() )
    {
        return EMPTY_ATTRIBUTE;
    }
    else
    {
        return it->second;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const string& VectorAttribute::vector_value(const string& name) const
{
    auto it = attribute_value.find(name);

    if ( it == attribute_value.end() )
    {
        return EMPTY_ATTRIBUTE;
    }
    else
    {
        return it->second;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VectorAttribute::vector_value(const string& name, string& value) const
{
    auto it = attribute_value.find(name);

    if (it == attribute_value.end())
    {
        return -1;
    }

    value = it->second;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VectorAttribute::vector_value(const string& name, bool& value) const
{
    value = false;
    auto it = attribute_value.find(name);

    if (it == attribute_value.end())
    {
        return -1;
    }

    if (it->second.empty())
    {
        return -1;
    }

    value = one_util::icasecmp(it->second, "YES");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SingleAttribute::encrypt(const string& one_key, const set<string>& eas)
{
    if ( one_key.empty() )
    {
        return;
    }

    std::string * plain = one_util::aes256cbc_decrypt(attribute_value, one_key);

    if ( plain != nullptr )
    {
        delete plain;
        return;
    }

    std::string * encrypted = one_util::aes256cbc_encrypt(attribute_value, one_key);

    if ( encrypted == nullptr )
    {
        return;
    }

    attribute_value = *encrypted;

    delete encrypted;
}

void SingleAttribute::decrypt(const string& one_key, const set<string>& eas)
{
    if ( one_key.empty() )
    {
        return;
    }

    std::string * plain = one_util::aes256cbc_decrypt(attribute_value, one_key);

    if ( plain != nullptr )
    {
        attribute_value = *plain;

        delete plain;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VectorAttribute::encrypt(const string& one_key, const set<string>& eas)
{
    if ( one_key.empty() )
    {
        return;
    }

    for ( const auto& ea : eas )
    {
        string att = vector_value(ea);

        if (att.empty())
        {
            continue;
        }

        std::string * plain = one_util::aes256cbc_decrypt(att, one_key);

        if ( plain != nullptr )
        {
            delete plain;
            continue;
        }

        std::string * encrypted = one_util::aes256cbc_encrypt(att, one_key);

        if ( encrypted == nullptr )
        {
            continue;
        }

        replace(ea, *encrypted);

        delete encrypted;
    }
}

void VectorAttribute::decrypt(const string& one_key, const set<string>& eas)
{
    if ( one_key.empty() )
    {
        return;
    }

    for ( const auto& ea : eas )
    {
        string att = vector_value(ea);

        if (att.empty())
        {
            continue;
        }

        std::string * plain = one_util::aes256cbc_decrypt(att, one_key);

        if ( plain != nullptr )
        {
            replace(ea, *plain);

            delete plain;
        }
    }
}

