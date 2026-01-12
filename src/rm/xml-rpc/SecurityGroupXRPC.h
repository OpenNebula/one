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

#ifndef SECURITY_GROUP_XRPC_H
#define SECURITY_GROUP_XRPC_H

#include "RequestXRPC.h"
#include "SecurityGroupAPI.h"
#include "SecurityGroupPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupAllocateXRPC : public RequestXRPC, public SecurityGroupAllocateAPI
{
public:
    SecurityGroupAllocateXRPC() :
        RequestXRPC("one.secgroup.allocate",
                    "Allocates a new security group",
                    "A:ss"),
                    SecurityGroupAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupDeleteXRPC : public RequestXRPC, public SecurityGroupAPI
{
public:
    SecurityGroupDeleteXRPC() :
        RequestXRPC("one.secgroup.delete",
                    "Deletes a security group",
                    "A:si"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupUpdateXRPC : public RequestXRPC, public SecurityGroupAPI
{
public:
    SecurityGroupUpdateXRPC() :
        RequestXRPC("one.secgroup.update",
                    "Updates a security group template",
                    "A:sisi"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupRenameXRPC : public RequestXRPC, public SecurityGroupAPI
{
public:
    SecurityGroupRenameXRPC() :
        RequestXRPC("one.secgroup.rename",
                    "Renames a security group",
                    "A:sis"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupChmodXRPC: public RequestXRPC, public SecurityGroupAPI
{
public:
    SecurityGroupChmodXRPC()
        : RequestXRPC("one.secgroup.chmod",
                      "Changes permission bits of a security group",
                      "A:siiiiiiiiii")
        , SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupChownXRPC : public RequestXRPC, public SecurityGroupAPI
{
public:
    SecurityGroupChownXRPC()
        : RequestXRPC("one.secgroup.chown",
                      "Changes ownership of a security group",
                      "A:siii")
        , SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupCloneXRPC : public RequestXRPC, public SecurityGroupAPI
{
public:
    SecurityGroupCloneXRPC() :
        RequestXRPC("one.secgroup.clone",
                    "Clone a security group",
                    "A:sis"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupCommitXRPC : public RequestXRPC, public SecurityGroupAPI
{
public:
    SecurityGroupCommitXRPC() :
        RequestXRPC("one.secgroup.commit",
                    "Commit security group changes to VMs",
                    "A:sib"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupInfoXRPC : public RequestXRPC, public SecurityGroupInfoAPI
{
public:
    SecurityGroupInfoXRPC():
        RequestXRPC("one.secgroup.info",
                    "Returns security group information",
                    "A:sib"),
        SecurityGroupInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupPoolInfoXRPC : public RequestXRPC, public SecurityGroupPoolAPI
{
public:
    SecurityGroupPoolInfoXRPC()
        : RequestXRPC("one.secgrouppool.info",
                      "Returns the security group pool",
                      "A:siii")
        , SecurityGroupPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
