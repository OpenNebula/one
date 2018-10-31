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

#include "RequestManagerVNTemplate.h"
#include "VirtualMachineDisk.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"
#include "RequestManagerClone.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplateInstantiate::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    int    id   = xmlrpc_c::value_int(paramList.getInt(1));
    string name = xmlrpc_c::value_string(paramList.getString(2));
    string str_uattrs;             //Optional XML-RPC argument

    if ( paramList.size() > 2 )
    {
        str_uattrs = xmlrpc_c::value_string(paramList.getString(3));
    }

    VNTemplate * tmpl = static_cast<VNTemplatePool* > (pool)->get_ro(id);

    if ( tmpl == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    string original_tmpl_name = tmpl->get_name();

    tmpl->unlock();

    int instantiate_id = id;

    int       vid;
    ErrorCode ec;

    ec = request_execute(instantiate_id, name, str_uattrs, 0, vid, att);

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

Request::ErrorCode VNTemplateInstantiate::request_execute(int id, string name,
        const string &str_uattrs, Template* extra_attrs, int& vid,
        RequestAttributes& att)
{
    int rc;

    ostringstream sid;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualNetworkPool* vnpool  = nd.get_vnpool();
    VNTemplatePool *    vntpool   = nd.get_vntpool();

    VirtualNetworkTemplate * tmpl;
    VirtualNetworkTemplate extended_tmpl;
    VNTemplate *           rtmpl;

    string tmpl_name;

    set<int> cluster_ids;

    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */
    rtmpl = vntpool->get_ro(id);

    if ( rtmpl == 0 )
    {
        att.resp_id = id;
        return NO_EXISTS;
    }

    tmpl_name   = rtmpl->get_name();
    tmpl        = rtmpl->clone_template();
    //cluster_ids = rtmpl->get_cluster_ids();

    rtmpl->get_permissions(perms);

    rtmpl->unlock();

    ErrorCode ec = merge(tmpl, str_uattrs, att);

    if (ec != SUCCESS)
    {
        delete tmpl;
        return ec;
    }

    if ( extra_attrs != 0 )
    {
        tmpl->merge(extra_attrs);
    }

    ec = as_uid_gid(tmpl, att);

    if ( ec != SUCCESS )
    {
        delete tmpl;
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Store the template attributes in the VN                                */
    /* ---------------------------------------------------------------------- */
    tmpl->erase("NAME");
    tmpl->erase("TEMPLATE_NAME");
    tmpl->erase("TEMPLATE_ID");

    sid << id;

    tmpl->set(new SingleAttribute("TEMPLATE_NAME", tmpl_name));
    tmpl->set(new SingleAttribute("TEMPLATE_ID", sid.str()));

    if (!name.empty())
    {
        tmpl->set(new SingleAttribute("NAME",name));
    }

    //--------------------------------------------------------------------------
    
    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::USE, perms); //USE TEMPLATE

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        delete tmpl;
        return AUTHORIZATION;
    }

    rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            -1, tmpl, &vid, cluster_ids, att.resp_msg);

    if ( rc < 0 )
    {
        return ALLOCATE;
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
        if (uattrs.check_restricted(aname, tmpl))
		{
			att.resp_msg ="User Template includes a restricted attribute " + aname;

			return AUTHORIZATION;
		}
	}

	tmpl->merge(&uattrs);

    return SUCCESS;
}
