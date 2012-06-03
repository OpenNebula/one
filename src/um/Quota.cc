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

VectorAttribute * Quota::get_quota(const string& id)
{
    map<string, Attribute *>::iterator it;
    VectorAttribute * q;

    if ( id.empty() )
    {
        return 0;
    }

    for ( it = attributes.begin(); it != attributes.end(); it++)
    {
        q = static_cast<VectorAttribute *>(it->second);

        if (q->vector_value("ID") == id)
        {
            return q;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quota::add(VectorAttribute * nq)
{
    string id;

    id = nq->vector_value("ID");

    if ( id.empty() )
    {
        return;
    }

    attributes.insert(make_pair(nq->name(), nq));
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Quota::set(vector<VectorAttribute*> * new_quotas, string& error)
{
    vector<VectorAttribute *>::iterator  it;

    VectorAttribute * tq;
    string            id;

    for ( it = new_quotas->begin(); it != new_quotas->end(); it++)
    {
        id = (*it)->vector_value("ID");

        tq = get_quota(id);

        if ( tq == 0 )
        {
            VectorAttribute * nq;

            if ((nq = new_quota(*it)) == 0)
            {
                goto error_limits;
            }

            add(nq);
        }
        else
        {
            if (update_limits(tq, *it))
            {
                goto error_limits;
            }   
        }
    }
    
    return 0;

error_limits:
    ostringstream oss;
    oss <<  "Negative limits or bad format in quota " << (*it)->marshall();

    error = oss.str();
    return -1;        
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
