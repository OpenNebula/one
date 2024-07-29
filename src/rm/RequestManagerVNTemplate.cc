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

#include "RequestManagerVNTemplate.h"
#include "VirtualMachineDisk.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"
#include "RequestManagerClone.h"
#include "ClusterPool.h"
#include "VirtualNetworkPool.h"
#include "VNTemplatePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManagerVNTemplate::RequestManagerVNTemplate(const string& method_name,
                                                   const string& help,
                                                   const string& params)
    : Request(method_name, params, help)
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vntpool();

    auth_object = PoolObjectSQL::VNTEMPLATE;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplateInstantiate::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    int    id   = xmlrpc_c::value_int(paramList.getInt(1));
    string name = xmlrpc_c::value_string(paramList.getString(2));
    string str_uattrs = xmlrpc_c::value_string(paramList.getString(3));

    int       vid;
    ErrorCode ec;

    ec = request_execute(id, name, str_uattrs, 0, vid, att);

    if ( ec == SUCCESS )
    {
        success_response(vid, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VNTemplateInstantiate::request_execute(int id, const string& name,
                                                          const string &str_uattrs, Template* extra_attrs, int& vid,
                                                          RequestAttributes& att)
{
    int rc;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualNetworkPool* vnpool  = nd.get_vnpool();
    VNTemplatePool*     vntpool = nd.get_vntpool();
    ClusterPool*        clpool  = nd.get_clpool();

    unique_ptr<VirtualNetworkTemplate> tmpl;
    VirtualNetworkTemplate extended_tmpl;

    string tmpl_name;

    string cluster_ids_str;
    set<int> cluster_ids;


    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto rtmpl = vntpool->get_ro(id) )
    {
        tmpl_name = rtmpl->get_name();
        tmpl      = rtmpl->clone_template();

        rtmpl->get_permissions(perms);

        rtmpl->get_template_attribute("CLUSTER_IDS", cluster_ids_str);
    }
    else
    {
        att.resp_id = id;
        return NO_EXISTS;
    }

    if (!cluster_ids_str.empty())
    {
        clpool->exist(cluster_ids_str, cluster_ids);
    }

    if (cluster_ids_str.empty())
    {
        cluster_ids.insert(0);
    }

    ErrorCode ec = merge(tmpl.get(), str_uattrs, att);

    if (ec != SUCCESS)
    {
        return ec;
    }

    if ( extra_attrs != 0 )
    {
        tmpl->merge(extra_attrs);
    }

    ec = as_uid_gid(tmpl.get(), att);

    if ( ec != SUCCESS )
    {
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Store the template attributes in the VN                                */
    /* ---------------------------------------------------------------------- */
    tmpl->erase("NAME");
    tmpl->replace("TEMPLATE_NAME", tmpl_name);
    tmpl->replace("TEMPLATE_ID", id);

    if (!name.empty())
    {
        tmpl->set(new SingleAttribute("NAME", name));
    }

    //--------------------------------------------------------------------------

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::USE, perms); //USE TEMPLATE

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return AUTHORIZATION;
    }

    rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                          -1, move(tmpl), &vid, cluster_ids, att.resp_msg);

    if ( rc < 0 )
    {
        return ALLOCATE;
    }

    for (auto cid : cluster_ids)
    {
        if ( auto cluster = clpool->get(cid) )
        {
            string _er;
            clpool->add_to_cluster(PoolObjectSQL::NET, cluster.get(), vid, _er);
        }
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VNTemplateInstantiate::merge(
        Template *      tmpl,
        const string    &str_uattrs,
        RequestAttributes& att)
{
    int rc;

    VirtualNetworkTemplate  uattrs;
    string                  aname;

    rc = uattrs.parse_str_or_xml(str_uattrs, att.resp_msg);

    if ( rc != 0 )
    {
        return INTERNAL;
    }
    else if (uattrs.empty())
    {
        return SUCCESS;
    }

    if (!att.is_admin())
    {
        if (uattrs.check_restricted(aname, tmpl, true))
        {
            att.resp_msg ="User Template includes a restricted attribute " + aname;

            return AUTHORIZATION;
        }
    }

    tmpl->merge(&uattrs);

    return SUCCESS;
}
