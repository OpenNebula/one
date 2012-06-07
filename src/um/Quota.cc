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

int Quota::get_quota(const string& id, VectorAttribute ** va)
{
    map<string, Attribute *>::iterator it;
    VectorAttribute * q;

    istringstream iss(id);
    int           id_i;

    *va = 0;

    if ( id.empty() )
    {
        return -1;
    }

    iss >> id_i;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    for ( it = attributes.begin(); it != attributes.end(); it++)
    {
        q = static_cast<VectorAttribute *>(it->second);

        if (q->vector_value("ID") == id)
        {
            *va = q;
            return 0;
        }
    }

    return 0;
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

int Quota::set(vector<Attribute*> * new_quotas, string& error)
{
    vector<Attribute *>::iterator  it;

    VectorAttribute * iq;
    VectorAttribute * tq;
    string            id;

    for ( it = new_quotas->begin(); it != new_quotas->end(); it++)
    {
        iq = dynamic_cast<VectorAttribute *>(*it);

        if ( iq == 0 )
        {
            goto error_limits;
        }

        id = iq->vector_value("ID");

        if ( get_quota(id, &tq) == -1 )
        {
            goto error_limits;
        }

        if ( tq == 0 )
        {
            VectorAttribute * nq;

            if ((nq = new_quota(iq)) == 0)
            {
                goto error_limits;
            }

            add(nq);
        }
        else
        {
            if (update_limits(tq, iq) != 0)
            {
                goto error_limits;
            } 
        }
    }
    
    return 0;

error_limits:
    ostringstream oss;

    oss <<  "Negative limits or bad format in quota " << template_name;

    if ( iq != 0 )
    {
        string * quota_str = iq->marshall(",");

        oss << " = [ " << *quota_str << " ]";

        delete quota_str;
    }
     
    error = oss.str();

    return -1;        
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Quota::check_quota(const string& qid, 
                        map<string, int>& usage_req, 
                        string& error)
{
    VectorAttribute * q;
    map<string, int>::iterator it;

    bool check;
    int  limit;
    int  usage;

    if ( get_quota(qid, &q) == -1 )
    {
        return false;
    }

    // -------------------------------------------------------------------------
    //  Quota does not exist, create a new one
    // -------------------------------------------------------------------------
    if ( q == 0 )
    {
        map<string, string> values;
    
        for (int i=0; i < num_metrics; i++)
        {
            ostringstream usage_req_str;
            string        metrics_used = metrics[i];

            metrics_used += "_USED";

            it = usage_req.find(metrics[i]);

            if (it == usage_req.end())
            {
                usage_req_str << "0";
            }
            else
            {
                usage_req_str << it->second;    
            }

            values.insert(make_pair(metrics[i],  "0"));
            values.insert(make_pair(metrics_used, usage_req_str.str()));
        }
        
        if (!qid.empty())
        {
            values.insert(make_pair("ID", qid));
        }

        add(new VectorAttribute(template_name, values));

        return true;
    }

    // -------------------------------------------------------------------------
    //  Check the quotas for each usage request
    // -------------------------------------------------------------------------
    for (int i=0; i < num_metrics; i++)
    {
        string metrics_used = metrics[i];
            
        metrics_used += "_USED";

        it = usage_req.find(metrics[i]);

        if (it == usage_req.end())
        {
            continue;
        }

        q->vector_value(metrics[i],   limit);
        q->vector_value(metrics_used.c_str(), usage);

        check = ( limit == 0 ) || ( ( usage + it->second ) <= limit );

        if ( !check )
        {
            ostringstream oss;

            oss << "Limit of " << limit << " reached for " << metrics[i]
                << " quota in " << template_name;

            if ( !qid.empty() ) 
            {
                oss << " with ID: " << qid;
            }

            error = oss.str();

            return false;
        }
    }

    // -------------------------------------------------------------------------
    //  Add resource usage to quotas
    // -------------------------------------------------------------------------
    for (int i=0; i < num_metrics; i++)
    {
        string metrics_used = metrics[i];
            
        metrics_used += "_USED";

        it = usage_req.find(metrics[i]);

        if (it == usage_req.end())
        {
            continue;
        }

        add_to_quota(q, metrics_used, it->second);
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quota::del_quota(const string& qid, map<string, int>& usage_req)
{
    VectorAttribute * q;
    map<string, int>::iterator it;

    if ( get_quota(qid, &q) == -1)
    {
        return;
    }

    if ( q == 0 )
    {
        return;
    } 

    for (int i=0; i < num_metrics; i++)
    {
        string metrics_used = metrics[i];
            
        metrics_used += "_USED";

        it = usage_req.find(metrics[i]);

        if (it == usage_req.end())
        {
            continue;
        }

        add_to_quota(q, metrics_used, -it->second);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Quota::update_limits(VectorAttribute * quota, const VectorAttribute * va)
{        
    string limit;
    int    limit_i;

    for (int i=0; i < num_metrics; i++)
    {
        limit = va->vector_value_str(metrics[i], limit_i);

        if ( limit_i < 0 ) //No quota, NaN or negative
        {
            return -1;
        }
        else
        {
            quota->replace(metrics[i], limit);
        }
    }
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * Quota::new_quota(VectorAttribute * va)
{
    map<string,string> limits;

    string limit;
    int    limit_i;

    for (int i=0; i < num_metrics; i++)
    {
        string metrics_used = metrics[i];
            
        metrics_used += "_USED";

        limit = va->vector_value_str(metrics[i], limit_i);
        
        if ( limit_i < 0 ) //No quota, NaN or negative
        {
            limit = "0";
        }

        limits.insert(make_pair(metrics[i], limit));
        limits.insert(make_pair(metrics_used, "0"));
    }

    string id = va->vector_value("ID");

    if ( !id.empty() )
    {
        limits.insert(make_pair("ID", id));
    }

    return new VectorAttribute(template_name,limits);
}

