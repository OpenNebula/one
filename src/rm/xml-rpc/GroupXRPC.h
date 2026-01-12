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

#ifndef GROUP_XRPC_H
#define GROUP_XRPC_H

#include "RequestXRPC.h"
#include "GroupAPI.h"
#include "GroupPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAllocateXRPC : public RequestXRPC, public GroupAllocateAPI
{
public:
    GroupAllocateXRPC() :
        RequestXRPC("one.group.allocate",
                    "Allocates a new group",
                    "A:ss"),
        GroupAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupDeleteXRPC : public RequestXRPC, public GroupAPI
{
public:
    GroupDeleteXRPC() :
        RequestXRPC("one.group.delete",
                    "Deletes a group",
                    "A:si"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupSetQuotaXRPC : public RequestXRPC, public GroupAPI
{
public:
    GroupSetQuotaXRPC():
        RequestXRPC("one.group.quota",
                    "Sets group quota limits",
                    "A:sis"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC&     att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupUpdateXRPC : public RequestXRPC, public GroupAPI
{
public:
    GroupUpdateXRPC() :
        RequestXRPC("one.group.update",
                    "Updates a group template",
                    "A:sisi"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAddAdminXRPC : public RequestXRPC, public GroupAPI
{
public:
    GroupAddAdminXRPC():
        RequestXRPC("one.group.addadmin",
                    "Adds a user to the group admin set",
                    "A:sii"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupDelAdminXRPC : public RequestXRPC, public GroupAPI
{
public:
    GroupDelAdminXRPC():
        RequestXRPC("one.group.deladmin",
                    "Removes a user from the group admin set",
                    "A:sii"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupInfoXRPC : public RequestXRPC, public GroupInfoAPI
{
public:
    GroupInfoXRPC():
        RequestXRPC("one.group.info",
                    "Returns group information",
                    "A:sib"),
        GroupInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class GroupQuotaInfoXRPC : public RequestXRPC, public GroupQuotaInfoAPI
{
public:
    GroupQuotaInfoXRPC():
        RequestXRPC("one.groupquota.info",
                    "Returns the default group quota limits",
                    "A:s"),
        GroupQuotaInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class GroupQuotaUpdateXRPC : public RequestXRPC, public GroupAPI
{
public:
    GroupQuotaUpdateXRPC():
        RequestXRPC("one.groupquota.update",
                    "Updates the default group quota limits",
                    "A:ss"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupPoolInfoXRPC : public RequestXRPC, public GroupPoolAPI
{
public:
    GroupPoolInfoXRPC()
        : RequestXRPC("one.grouppool.info",
                      "Returns the group pool",
                      "A:s")
        , GroupPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
