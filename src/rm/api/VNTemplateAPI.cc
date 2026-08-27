/* -------------------------------------------------------------------------- */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                */
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

#include "VNTemplateAPI.h"
#include "VirtualNetworkPool.h"
#include "GroupPool.h"
#include "SharedAPI.h"
#include "AddressRange.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VNTemplateAPI::instantiate(int oid,
                                              const string& name,
                                              const string& str_tmpl,
                                              int& net_id,
                                              RequestAttributes& att)
{
    att.auth_op = AuthRequest::USE;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualNetworkPool* vnpool  = nd.get_vnpool();
    ClusterPool*        clpool  = nd.get_clpool();

    unique_ptr<VirtualNetworkTemplate> tmpl;
    unique_ptr<VirtualNetworkTemplate> current_tmpl;
    VirtualNetworkTemplate extended_tmpl;

    string tmpl_name;

    string cluster_ids_str;
    set<int> cluster_ids;

    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto vntmpl = vntpool->get_ro(oid) )
    {
        tmpl_name    = vntmpl->get_name();
        tmpl         = vntmpl->clone_template();
        current_tmpl = std::make_unique<VirtualNetworkTemplate>(*tmpl);

        vntmpl->get_permissions(perms);

        vntmpl->get_template_attribute("CLUSTER_IDS", cluster_ids_str);
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (!cluster_ids_str.empty())
    {
        clpool->exist(cluster_ids_str, cluster_ids);
    }

    if (cluster_ids_str.empty())
    {
        cluster_ids.insert(0);
    }

    if (!str_tmpl.empty() && extended_tmpl.parse_str_or_xml(str_tmpl, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    Request::ErrorCode ec = merge(tmpl.get(), str_tmpl, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Store the template attributes in the VN                                */
    /* ---------------------------------------------------------------------- */
    tmpl->erase("NAME");
    tmpl->replace("TEMPLATE_NAME", tmpl_name);
    tmpl->replace("TEMPLATE_ID", oid);

    if (!name.empty())
    {
        tmpl->set(new SingleAttribute("NAME", name));
    }

    ec = as_uid_gid(tmpl.get(), att);

    if ( ec != Request::SUCCESS )
    {
        return ec;
    }

    ec = SharedAPI::validate_vlan_auth(&extended_tmpl, oid, att,
                                       current_tmpl.get());

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    //--------------------------------------------------------------------------

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::USE, perms); //USE TEMPLATE

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    int rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              -1, oid, std::move(tmpl), &net_id, cluster_ids,
                              att.resp_msg);

    if ( rc < 0 )
    {
        return Request::ALLOCATE;
    }

    for (auto cid : cluster_ids)
    {
        if ( auto cluster = clpool->get(cid) )
        {
            string _er;
            clpool->add_to_cluster(PoolObjectSQL::NET, cluster.get(), net_id, _er);
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VNTemplateAPI::merge(Template* tmpl,
                                        const string& str_uattrs,
                                        RequestAttributes& att)
{
    if (str_uattrs.empty())
    {
        return Request::SUCCESS;
    }

    VirtualNetworkTemplate uattrs;

    int rc = uattrs.parse_str_or_xml(str_uattrs, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }
    else if (uattrs.empty())
    {
        return Request::SUCCESS;
    }

    vector<unique_ptr<VectorAttribute>> user_ars;
    uattrs.remove("AR", user_ars);

    if (!att.is_admin())
    {
        string aname;

        for (const auto& uar : user_ars)
        {
            if (AddressRange::check_restricted(uar.get(), aname))
            {
                att.resp_msg ="Extra Template includes a restricted attribute AR/" + aname;

                return Request::AUTHORIZATION;
            }
        }

        if (uattrs.check_restricted(aname, tmpl, true))
        {
            att.resp_msg ="Extra Template includes a restricted attribute " + aname;

            return Request::AUTHORIZATION;
        }
    }

    for (auto& uar : user_ars)
    {
        tmpl->set(uar.release());
    }

    tmpl->merge(&uattrs);

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode VNTemplateAPI::pool_allocate(unique_ptr<Template> tmpl,
                                                int& id,
                                                RequestAttributes& att)
{
    unique_ptr<VirtualNetworkTemplate> ttmpl(
            static_cast<VirtualNetworkTemplate *>(tmpl.release()));

    int rc = vntpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                               std::move(ttmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
