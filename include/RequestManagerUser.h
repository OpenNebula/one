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

        auth_object = AuthRequest::USER;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerUser(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    virtual int user_action(User *                     user,
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
                           "A:sis"){};
    ~UserChangePassword(){};

    int user_action(User *                     user, 
                    xmlrpc_c::paramList const& _paramList, 
                    string&                    err);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
