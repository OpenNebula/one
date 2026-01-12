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

#ifndef ACL_XRPC_H
#define ACL_XRPC_H

#include "RequestXRPC.h"
#include "AclAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclAddRuleXRPC : public RequestXRPC, public AclAPI
{
public:
    AclAddRuleXRPC():
        RequestXRPC("one.acl.addrule",
                    "Adds a new ACL rule",
                    "A:sssss"),
        AclAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclDelRuleXRPC : public RequestXRPC, public AclAPI
{
public:
    AclDelRuleXRPC():
        RequestXRPC("one.acl.delrule",
                    "Deletes an existing ACL rule",
                    "A:si"),
        AclAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclInfoXRPC : public RequestXRPC, public AclAPI
{
public:
    AclInfoXRPC():
        RequestXRPC("one.acl.info",
                    "Returns the ACL rule set",
                    "A:s"),
        AclAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
