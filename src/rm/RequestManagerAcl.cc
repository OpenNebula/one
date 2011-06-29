/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void AclAddRule::request_execute(xmlrpc_c::paramList const& paramList)
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

    istringstream iss;

    iss.str( xmlrpc_c::value_string(paramList.getString(1)) );
    iss >> hex >> user;

    iss.clear();
    iss.str( xmlrpc_c::value_string(paramList.getString(2)) );
    iss >> hex >> resource;

    iss.clear();
    iss.str( xmlrpc_c::value_string(paramList.getString(3)) );
    iss >> hex >> rights;


    Nebula& nd  = Nebula::instance();
    aclm        = nd.get_aclm();

    string error_msg;

    // TODO: Only oneadmin can manage ACL
    if ( uid != 0 )
    {
        failure_response(AUTHORIZATION,
                authorization_error("Only oneadmin can manage ACL rules"));
        return;
    }

    int rc = aclm->add_rule(user, resource, rights, error_msg);


    if ( rc < 0 )
    {
        failure_response(INTERNAL, request_error(error_msg, ""));
        return;
    }

    success_response(rc);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void AclDelRule::request_execute(xmlrpc_c::paramList const& paramList)
{
    int oid = xmlrpc_c::value_int(paramList.getInt(1));

    Nebula& nd  = Nebula::instance();
    aclm        = nd.get_aclm();

    string error_msg;

    // TODO: Only oneadmin can manage ACL
    if ( uid != 0 )
    {
        failure_response(AUTHORIZATION,
                authorization_error("Only oneadmin can manage ACL rules"));
        return;
    }

    int rc = aclm->del_rule(oid, error_msg);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, request_error(error_msg, ""));
        return;
    }

    success_response("");

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void AclInfo::request_execute(xmlrpc_c::paramList const& paramList)
{
    Nebula& nd  = Nebula::instance();
    aclm        = nd.get_aclm();

    ostringstream oss;
    int rc;

    // TODO: Only oneadmin can manage ACL
    if ( uid != 0 )
    {
        failure_response(AUTHORIZATION,
                authorization_error("Only oneadmin can manage ACL rules"));
        return;
    }

    rc = aclm->dump(oss);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, request_error("Internal Error",""));
        return;
    }

    success_response( oss.str() );

    return;
}

/* ------------------------------------------------------------------------- */
