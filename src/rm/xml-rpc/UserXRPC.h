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

#ifndef USER_XRPC_H
#define USER_XRPC_H

#include "RequestXRPC.h"
#include "UserAPI.h"
#include "UserPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAllocateXRPC : public RequestXRPC, public UserAllocateAPI
{
public:
    UserAllocateXRPC() :
        RequestXRPC("one.user.allocate",
                    "Allocates a new user",
                    "A:ssssA"),
        UserAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChangeGroupXRPC : public RequestXRPC, public UserAPI
{
public:
    UserChangeGroupXRPC():
        RequestXRPC("one.user.chgrp",
                    "Changes ownership of a user",
                    "A:sii"),
        UserAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC&     att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChangePasswordXRPC : public RequestXRPC, public UserChangePasswordAPI
{
public:
    UserChangePasswordXRPC():
        RequestXRPC("one.user.passwd",
                    "Changes user's password",
                    "A:sis"),
        UserChangePasswordAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC&     att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChangeAuthXRPC: public RequestXRPC, public UserChangeAuthAPI
{
public:
    UserChangeAuthXRPC():
        RequestXRPC("one.user.chauth",
                    "Changes user's authentication driver",
                    "A:siss"),
        UserChangeAuthAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC&     att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserSetQuotaXRPC : public RequestXRPC, public UserSetQuotaAPI
{
public:
    UserSetQuotaXRPC():
        RequestXRPC("one.user.quota",
                    "Sets user quota limits",
                    "A:sis"),
        UserSetQuotaAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC&     att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserEnableXRPC : public RequestXRPC, public UserEnableAPI
{
public:
    UserEnableXRPC():
        RequestXRPC("one.user.enable",
                    "Enable or disable user",
                    "A:sii"),
        UserEnableAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC&     att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserDeleteXRPC : public RequestXRPC, public UserDeleteAPI
{
public:
    UserDeleteXRPC() :
        RequestXRPC("one.user.delete",
                    "Deletes a user",
                    "A:si"),
        UserDeleteAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserUpdateXRPC : public RequestXRPC, public UserAPI
{
public:
    UserUpdateXRPC() :
        RequestXRPC("one.user.update",
                    "Updates a user template",
                    "A:sisi"),
        UserAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAddGroupXRPC : public RequestXRPC, public UserAPI
{
public:
    UserAddGroupXRPC():
        RequestXRPC("one.user.addgroup",
                    "Adds the user to a secondary group",
                    "A:sii"),
        UserAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserDelGroupXRPC : public RequestXRPC, public UserAPI
{
public:
    UserDelGroupXRPC():
        RequestXRPC("one.user.delgroup",
                    "Deletes the user from a secondary group",
                    "A:sii"),
        UserAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserQuotaInfoXRPC : public RequestXRPC, public UserQuotaInfoAPI
{
public:
    UserQuotaInfoXRPC():
        RequestXRPC("one.userquota.info",
                    "Returns the default user quota limits",
                    "A:s"),
        UserQuotaInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserQuotaUpdateXRPC : public RequestXRPC, public UserAPI
{
public:
    UserQuotaUpdateXRPC():
        RequestXRPC("one.userquota.update",
                    "Updates the default user quota limits",
                    "A:ss"),
        UserAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserLoginXRPC : public RequestXRPC, public UserLoginAPI
{
public:
    UserLoginXRPC():
        RequestXRPC("one.user.login",
                    "Generates or sets a login token",
                    "A:sssii"),
        UserLoginAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserInfoXRPC : public RequestXRPC, public UserInfoAPI
{
public:
    UserInfoXRPC():
        RequestXRPC("one.user.info",
                    "Returns user information",
                    "A:sib"),
        UserInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserPoolInfoXRPC : public RequestXRPC, public UserPoolAPI
{
public:
    UserPoolInfoXRPC()
        : RequestXRPC("one.userpool.info",
                      "Returns the user pool",
                      "A:s")
        , UserPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
