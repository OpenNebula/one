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

#ifndef REQUEST_MANAGER_GROUP_H
#define REQUEST_MANAGER_GROUP_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerGroup: public Request
{
protected:
    RequestManagerGroup(const string& method_name,
                        const string& help,
                        const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_gpool();

        auth_object = PoolObjectSQL::GROUP;
    };

    virtual ~RequestManagerGroup(){};

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupSetQuota : public RequestManagerGroup
{
public:
    GroupSetQuota():
        RequestManagerGroup("GroupSetQuota",
                           "Sets group quota limits",
                           "A:sis")
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~GroupSetQuota(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupEditAdmin : public Request
{
public:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

protected:
    GroupEditAdmin( const string& method_name,
                    const string& help,
                    const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_gpool();
        upool       = nd.get_upool();

        auth_object = PoolObjectSQL::GROUP;
        auth_op     = AuthRequest::ADMIN;
    };

    UserPool*   upool;

    virtual int edit_admin(Group* group, int user_id, string& error_msg) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAddAdmin : public GroupEditAdmin
{
public:
    GroupAddAdmin():
        GroupEditAdmin( "GroupAddAdmin",
                        "Adds a user to the group admin set",
                        "A:sii"){};

    ~GroupAddAdmin(){};

    int edit_admin(Group* group, int user_id, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupDelAdmin : public GroupEditAdmin
{
public:
    GroupDelAdmin():
        GroupEditAdmin( "GroupDelAdmin",
                        "Removes a user from the group admin set",
                        "A:sii"){};

    ~GroupDelAdmin(){};

    int edit_admin(Group* group, int user_id, string& error_msg);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
