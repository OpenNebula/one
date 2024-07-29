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

#include "Quota.h"
#include "NebulaUtil.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const int Quota::DEFAULT        = -1;
const string Quota::DEFAULT_STR = "-1";
const int Quota::UNLIMITED      = -2;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Quota::get_quota(
        const string& id,
        VectorAttribute ** va,
        map<string, Attribute *>::iterator& it)
{
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

void Quota::add_to_quota(VectorAttribute * attr, const string& va_name, float num)
{
    istringstream iss;
    float         total;

    iss.str(attr->vector_value(va_name));

    iss >> total;

    total += num;

    attr->replace(va_name, one_util::float_to_str(total));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Quota::set(vector<VectorAttribute*> * new_quotas, string& error)
{
    vector<VectorAttribute *>::iterator  it;

    VectorAttribute * tq;
    string            id;

    for (it = new_quotas->begin(); it != new_quotas->end(); ++it)
    {
        id = (*it)->vector_value("ID");

        if ( get_quota(id, &tq) == -1 )
        {
            goto error_limits;
        }

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
            if (update_limits(tq, *it) != 0)
            {
                goto error_limits;
            }
        }

        cleanup_quota(id);
    }

    return 0;

error_limits:
    ostringstream oss;

    oss <<  "Negative limits or bad format in quota " << template_name;

    string quota_str = (*it)->marshall(",");

    oss << " = [ " << quota_str << " ]";

    error = oss.str();

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Quota::check_quota(const string& qid,
                        map<string, float>& usage_req,
                        Quotas& default_quotas,
                        string& error)
{
    VectorAttribute * q;
    VectorAttribute * default_q;

    bool check;
    float limit;
    float usage;

    if ( get_quota(qid, &q) == -1 )
    {
        ostringstream oss;
        oss << "String '" << qid << "' is not a valid ID";

        error = oss.str();

        return false;
    }

    if ( get_default_quota(qid, default_quotas, &default_q) == -1 )
    {
        default_q = 0;
    }

    // -------------------------------------------------------------------------
    //  Quota does not exist, create a new one
    // -------------------------------------------------------------------------
    if ( q == 0 )
    {
        map<string, string> values;

        for (const string& metric : metrics)
        {
            string metrics_used = metric + "_USED";

            values.insert(make_pair(metric, DEFAULT_STR));
            values.insert(make_pair(metrics_used, "0"));
        }

        if (!qid.empty())
        {
            values.insert(make_pair("ID", qid));
        }

        q = new VectorAttribute(template_name, values);

        add(q);
    }

    // -------------------------------------------------------------------------
    //  Check the quotas for each usage request
    // -------------------------------------------------------------------------
    for (const string& metric : metrics)
    {
        string metrics_used = metric + "_USED";

        auto it = usage_req.find(metric);

        if (it == usage_req.end())
        {
            continue;
        }

        q->vector_value(metric, limit);
        q->vector_value(metrics_used, usage);

        if ( limit == DEFAULT )
        {
            if ( default_q != 0 )
            {
                default_q->vector_value(metric, limit);
            }
            else
            {
                limit = UNLIMITED;
            }
        }

        check = ( limit == UNLIMITED ) || ( ( usage + it->second ) <= limit );

        if ( !check )
        {
            ostringstream oss;

            oss << "limit of " << limit << " reached for " << metric
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
    for (const string& metric : metrics)
    {
        string metrics_used = metric + "_USED";

        auto it = usage_req.find(metric);

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

void Quota::add_quota(const string& qid, map<string, float>& usage_req)
{
    VectorAttribute * q;

    if ( get_quota(qid, &q) == -1)
    {
        return;
    }

    if ( q == 0 )
    {
        return;
    }

    for (const string& metric : metrics)
    {
        string metrics_used = metric;

        metrics_used += "_USED";

        auto it = usage_req.find(metric);

        if (it == usage_req.end())
        {
            continue;
        }

        add_to_quota(q, metrics_used, it->second);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quota::del_quota(const string& qid, map<string, float>& usage_req)
{
    VectorAttribute * q;

    if ( get_quota(qid, &q) == -1)
    {
        return;
    }

    if ( q == 0 )
    {
        return;
    }

    for (const string& metric : metrics)
    {
        string metrics_used = metric + "_USED";

        auto it = usage_req.find(metric);

        if (it == usage_req.end())
        {
            continue;
        }

        add_to_quota(q, metrics_used, -it->second);
    }

    cleanup_quota(qid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Quota::cleanup_quota(const string& qid)
{
    VectorAttribute * q;
    map<string, Attribute *>::iterator q_it;

    float usage, limit, implicit_limit;

    if ( get_quota(qid, &q, q_it) == -1)
    {
        return;
    }

    if ( q == 0 )
    {
        return;
    }

    if ( is_default )
    {
        implicit_limit = UNLIMITED;
    }
    else
    {
        implicit_limit = DEFAULT;
    }

    for (const string& metric : metrics)
    {
        string metrics_used = metric + "_USED";

        q->vector_value(metric, limit);
        q->vector_value(metrics_used, usage);

        if ( usage != 0 || limit != implicit_limit )
        {
            return;
        }
    }

    delete static_cast<Attribute *>(q_it->second);

    attributes.erase(q_it);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Quota::update_limits(
        VectorAttribute *       quota,
        const VectorAttribute * va)
{
    float   limit_f;

    for (const string& metric : metrics)
    {
        const string& limit = va->vector_value_str(metric, limit_f);

        if (limit.empty())
        {
            if ( is_default )
            {
                limit_f = UNLIMITED;
            }
            else
            {
                limit_f = DEFAULT;
            }
        }

        // Negative. Default & unlimited allowed
        if (( !is_default && limit_f < 0 && limit_f != UNLIMITED && limit_f != DEFAULT )
            ||
            // Negative. Unlimited allowed
            ( is_default && limit_f < 0 && limit_f != UNLIMITED )
           )
        {
            return -1;
        }

        quota->replace(metric, one_util::float_to_str(limit_f));
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * Quota::new_quota(const VectorAttribute * va)
{
    map<string, string> limits;

    float  limit_f;

    for (const string& metric : metrics)
    {
        string metrics_used = metric + "_USED";

        const string& limit = va->vector_value_str(metric, limit_f);

        if (limit.empty())
        {
            if ( is_default )
            {
                limit_f = UNLIMITED;
            }
            else
            {
                limit_f = DEFAULT;
            }
        }
        // Negative. Default & unlimited allowed
        if (( !is_default && limit_f < 0 && limit_f != UNLIMITED && limit_f != DEFAULT )
            ||
            // Negative. Unlimited allowed
            ( is_default && limit_f < 0 && limit_f != UNLIMITED )
           )
        {
            return 0;
        }

        limits.insert(make_pair(metric, one_util::float_to_str(limit_f)));
        limits.insert(make_pair(metrics_used, "0"));
    }

    const string& id = va->vector_value("ID");

    if ( !id.empty() )
    {
        limits.insert(make_pair("ID", id));
    }

    return new VectorAttribute(template_name, limits);
}
