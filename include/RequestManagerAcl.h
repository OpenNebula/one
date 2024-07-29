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

#ifndef REQUEST_MANAGER_ACL_H
#define REQUEST_MANAGER_ACL_H

#include "Request.h"
#include "Nebula.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerAcl: public Request
{
protected:
    RequestManagerAcl( const std::string& method_name,
                       const std::string& help,
                       const std::string& params)
        :Request(method_name, params, help)
    {
        auth_object = PoolObjectSQL::ACL;
        auth_op     = AuthRequest::MANAGE;

        Nebula& nd  = Nebula::instance();
        aclm        = nd.get_aclm();
    };

    ~RequestManagerAcl() {};

    /* -------------------------------------------------------------------- */

    AclManager * aclm;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclAddRule : public RequestManagerAcl
{
public:
    AclAddRule():
        RequestManagerAcl("one.acl.addrule",
                          "Adds a new ACL rule",
                          "A:ssss")
    {};

    ~AclAddRule() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclDelRule : public RequestManagerAcl
{
public:
    AclDelRule():
        RequestManagerAcl("one.acl.delrule",
                          "Deletes an existing ACL rule",
                          "A:si")
    {};

    ~AclDelRule() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclInfo: public RequestManagerAcl
{
public:
    AclInfo():
        RequestManagerAcl("one.acl.info",
                          "Returns the ACL rule set",
                          "A:s")
    {};

    ~AclInfo() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
