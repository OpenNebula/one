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

#include "Quota.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Quota::set(const string& quota_str, string& error)
{
    Quota tmp("GENERIC_QUOTA");

    if ( tmp.parse_str_or_xml(quota_str, error) != 0 )
    {
        return -1;
    }

    multimap<string, Attribute *>::iterator  it;

    pair<multimap<string, Attribute *>::iterator,
         multimap<string, Attribute *>::iterator> actual;

    Attribute * quota;

    for ( it = tmp.attributes.begin(); it != tmp.attributes.end(); it++)
    {
        quota  = get_quota(it->second);

        if ( quota == 0 ) //Quota not set yet.
        {
            Attribute * nq;

            if ((nq = new_quota(it->second)) == 0)
            {
                goto error_limits;
            }

            attributes.insert(make_pair(nq->name(),nq));
        }
        else
        {
            if (update_limits(quota, it->second))
            {
                goto error_limits;
            }   
        }
    }

error_limits:
    ostringstream oss;
    oss <<  "Negative limits or bad format in quota " << it->first
        <<  " = " << it->second->marshall();

    error = oss.str();
    return -1;        
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quota::add_to_quota(SingleAttribute * attr, float num)
{
    istringstream iss;
    ostringstream oss;
    float         total;

    iss.str(attr->value());

    iss >> total;

    total += num;

    oss << total;

    attr->replace(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quota::add_to_quota(VectorAttribute * attr, const string& va_name, int num)
{
    istringstream iss;
    ostringstream oss;
    float         total;

    iss.str(attr->vector_value(va_name.c_str()));

    iss >> total;

    total += num;

    oss << total;

    attr->replace(va_name, oss.str());
}
