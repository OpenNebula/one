/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "AclXRPC.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void AclAddRuleXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid;

    auto ec = add_rule(
        paramList.getString(1),                             // user
        paramList.getString(2),                             // resource
        paramList.getString(3),                             // rigths
        paramList.size() > 4 ? paramList.getString(4) : "", // zone
        oid,
        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void AclDelRuleXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del_rule(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void AclInfoXRPC::request_execute(xmlrpc_c::paramList const& _paramList,
                                  RequestAttributesXRPC& att)
{
    std::string xml;

    auto ec = info(xml, att);

    response(ec, xml, att);
}
