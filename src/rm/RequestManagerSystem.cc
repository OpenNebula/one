/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerSystem.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void SystemVersion::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    // TODO: request_execute will not be executed if the session string
    // is not authenticated in Request::execute.
    // Should we make the version call accessible even
    // if no user is provided?

    success_response(Nebula::instance().code_version(), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void SystemConfig::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    if ( att.gid != GroupPool::ONEADMIN_ID )
    {
        att.resp_msg = "The oned configuration can only be retrieved by users "
            "in the oneadmin group";
        failure_response(AUTHORIZATION, att);
        return;
    }

    success_response(Nebula::instance().get_configuration_xml(), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserQuotaInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    string xml;

    success_response(Nebula::instance().get_default_user_quota().to_xml(xml), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void GroupQuotaInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    string xml;

    success_response(Nebula::instance().get_default_group_quota().to_xml(xml), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void QuotaUpdate::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    string   quota_str = xmlrpc_c::value_string(paramList.getString(1));
    string   error_str, xml;
    Template quota_tmpl;

    int     rc;

    if ( att.gid != GroupPool::ONEADMIN_ID )
    {
        att.resp_msg = "The default quotas can only be updated by users in the"
            " oneadmin group";
        failure_response(AUTHORIZATION, att);
        return;
    }

    rc = quota_tmpl.parse_str_or_xml(quota_str, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    rc = set_default_quota(&quota_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(get_default_quota()->to_xml(xml), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int UserQuotaUpdate::set_default_quota(Template *tmpl, string& error)
{
    return Nebula::instance().set_default_user_quota(tmpl, error);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

const DefaultQuotas * UserQuotaUpdate::get_default_quota()
{
    return &Nebula::instance().get_default_user_quota();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int GroupQuotaUpdate::set_default_quota(Template *tmpl, string& error)
{
    return Nebula::instance().set_default_group_quota(tmpl, error);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

const DefaultQuotas * GroupQuotaUpdate::get_default_quota()
{
    return &Nebula::instance().get_default_group_quota();
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
