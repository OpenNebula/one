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

#include "NebulaTemplate.h"
#include <iostream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int NebulaTemplate::load_configuration()
{
    char * error = 0;
    int    rc;

    string      aname;
    Attribute * attr;

    map<string, Attribute *>::iterator  iter, j, prev;

    set_conf_default();

    rc = parse(conf_file.c_str(), &error);

    if ( rc != 0 && error != 0)
    {
        cout << "\nError while parsing configuration file:\n" << error << endl;

        free(error);

        return -1;
    }

    for(iter=conf_default.begin(); iter!=conf_default.end();)
    {
        aname = iter->first;
        attr  = iter->second;

        j = attributes.find(aname);

        if ( j == attributes.end() )
        {
            attributes.insert(make_pair(aname, attr));
            ++iter;
        }
        else
        {
            delete iter->second;

            prev = iter++;

            conf_default.erase(prev);
        }
    }

    set_multiple_conf_default();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void NebulaTemplate::set_conf_single(const std::string& attr,
                                     const std::string& value)
{
    SingleAttribute *   attribute;

    attribute = new SingleAttribute(attr, value);
    conf_default.insert(make_pair(attribute->name(), attribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& NebulaTemplate::to_xml_hidden(std::string& str) const
{
    return Template::to_xml(str, hidden_attributes);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& NebulaTemplate::to_str(std::string& str) const
{
    ostringstream os;

    for ( auto it = attributes.begin(); it!=attributes.end(); it++)
    {
        string s;

        auto hidden_it = hidden_attributes.find(it->first);

        if (hidden_it != hidden_attributes.end())
        {
            if (it->second->type() == Attribute::SIMPLE)
            {
                s = "***";
            }
            else
            {
                ostringstream oss_vector;
                string sep = "";

                auto attribute_value = static_cast<VectorAttribute*>(it->second)->value();

                for (auto& kv : attribute_value)
                {
                    if (hidden_it->second.find(kv.first) != hidden_it->second.end())
                    {
                        oss_vector << sep << kv.first << "=" << "***";
                    }
                    else
                    {
                        oss_vector << sep << kv.first << "=" << kv.second;
                    }
                    sep = ",";
                }

                s = oss_vector.str();
            }
        }
        else
        {
            s = it->second->marshall(",");
        }

        os << it->first << '=' << s << endl;
    }

    str = os.str();

    return str;
}
