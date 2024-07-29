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

#include "RequestManagerAcl.h"
#include "AclManager.h"
#include "AclRule.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclAddRule::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    /*
        xmlrpc-c version 1.07 can manage 64 bit numbers, but not all distros. ship
        the latest version.

        user      = xmlrpc_c::value_i8(paramList.getI8(1));
        resource  = xmlrpc_c::value_i8(paramList.getI8(2));
        rights    = xmlrpc_c::value_i8(paramList.getI8(3));
    */
    long long user;
    long long resource;
    long long rights;
    long long zone;

    istringstream iss;

    iss.str( xmlrpc_c::value_string(paramList.getString(1)) );
    iss >> hex >> user;

    iss.clear();
    iss.str( xmlrpc_c::value_string(paramList.getString(2)) );
    iss >> hex >> resource;

    iss.clear();
    iss.str( xmlrpc_c::value_string(paramList.getString(3)) );
    iss >> hex >> rights;

    if ( paramList.size() > 4 )
    {
        iss.clear();
        iss.str( xmlrpc_c::value_string(paramList.getString(4)) );
        iss >> hex >> zone;
    }
    else
    {
        zone = AclRule::INDIVIDUAL_ID | Nebula::instance().get_zone_id();
    }

    if ( basic_authorization(-1, att) == false )
    {
        return;
    }

    int rc = aclm->add_rule(user, resource, rights, zone, att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    success_response(rc, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclDelRule::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    int    oid = xmlrpc_c::value_int(paramList.getInt(1));

    if ( basic_authorization(-1, att) == false )
    {
        return;
    }

    int rc = aclm->del_rule(oid, att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclInfo::request_execute(xmlrpc_c::paramList const& paramList,
                              RequestAttributes& att)
{
    ostringstream oss;
    int rc;

    if ( basic_authorization(-1, att) == false )
    {
        return;
    }

    rc = aclm->dump(oss);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal Database error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss.str(), att);

    return;
}

