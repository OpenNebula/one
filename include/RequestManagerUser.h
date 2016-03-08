/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_USER_H
#define REQUEST_MANAGER_USER_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerUser: public Request
{
protected:
    RequestManagerUser(const string& method_name,
                       const string& help,
                       const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();

        auth_object = PoolObjectSQL::USER;
    };

    ~RequestManagerUser(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const&  _paramList,
            RequestAttributes&          att);

    virtual int user_action(int                        user_id,
                            xmlrpc_c::paramList const& _paramList,
                            string&                    error_str ) = 0;

    /* -------------------------------------------------------------------- */
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChangePassword : public RequestManagerUser
{
public:
    UserChangePassword():
        RequestManagerUser("UserChangePassword",
                           "Changes user's password",
                           "A:sis")
    {
        auth_op = AuthRequest::MANAGE;
        hidden_params.insert(2); // password argument
    };

    ~UserChangePassword(){};

    int user_action(int                        user_id,
                    xmlrpc_c::paramList const& _paramList,
                    string&                    err);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChangeAuth: public RequestManagerUser
{
public:
    UserChangeAuth():
        RequestManagerUser("UserChangeAuth",
                           "Changes user's authentication driver",
                           "A:siss")
    {
        auth_op = AuthRequest::ADMIN;
        hidden_params.insert(3); // new password argument
    };

    ~UserChangeAuth(){};

    int user_action(int                        user_id,
                    xmlrpc_c::paramList const& _paramList,
                    string&                    err);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserSetQuota : public RequestManagerUser
{
public:
    UserSetQuota():
        RequestManagerUser("UserSetQuota",
                           "Sets user quota limits",
                           "A:sis")
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~UserSetQuota(){};

    int user_action(int                        user_id,
                    xmlrpc_c::paramList const& _paramList,
                    string&                    err);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserLogin : public Request
{
public:
    UserLogin(): Request("UserLogin", "A:sssi", "Generates or sets a login token")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();

        auth_object = PoolObjectSQL::USER;
        auth_op     = AuthRequest::MANAGE;

        hidden_params.insert(2); // password argument
    };

    virtual ~UserLogin(){};

    void request_execute(
            xmlrpc_c::paramList const&  _paramList,
            RequestAttributes&          att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserEditGroup : public Request
{
public:
    UserEditGroup(
            const string& method_name,
            const string& help,
            const string& params):
                Request(method_name,params,help)
    {
        auth_object = PoolObjectSQL::USER;
        auth_op     = AuthRequest::MANAGE;

        Nebula& nd = Nebula::instance();
        gpool = nd.get_gpool();
        upool = nd.get_upool();
    };

    ~UserEditGroup(){};

    void request_execute(
            xmlrpc_c::paramList const&  _paramList,
            RequestAttributes&          att);

protected:

    virtual int secondary_group_action(
            int                        user_id,
            int                        group_id,
            xmlrpc_c::paramList const& _paramList,
            string&                    error_str) = 0;

    GroupPool * gpool;

    UserPool  * upool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAddGroup : public UserEditGroup
{
public:
    UserAddGroup():
        UserEditGroup("UserAddGroup",
                       "Adds the user to a secondary group",
                       "A:sii"){};

    ~UserAddGroup(){};

    int secondary_group_action(
                int                        user_id,
                int                        group_id,
                xmlrpc_c::paramList const& _paramList,
                string&                    error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserDelGroup : public UserEditGroup
{
public:
    UserDelGroup():
        UserEditGroup("UserDelGroup",
                       "Deletes the user from a secondary group",
                       "A:sii"){};

    ~UserDelGroup(){};

    int secondary_group_action(
            int                        user_id,
            int                        group_id,
            xmlrpc_c::paramList const& _paramList,
            string&                    error_str);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
