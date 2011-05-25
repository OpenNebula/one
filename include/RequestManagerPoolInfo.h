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

#ifndef REQUEST_MANAGER_POOL_INFO_H_
#define REQUEST_MANAGER_POOL_INFO_H_

#include "Request.h"
#include "Nebula.h"
#include "AuthManager.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerPoolInfo: public Request
{
protected:
    RequestManagerPoolInfo(const string& method_name,
                           const string& help)
        :Request(method_name,"A:s",help)
    {
        auth_op = AuthRequest::INFO_POOL;
    };

    ~RequestManagerPoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolInfo : public RequestManagerPoolInfo
{
public:
    HostPoolInfo():
        RequestManagerPoolInfo("HostPoolInfo",
                               "Returns the host pool")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = AuthRequest::HOST;
    };

    ~HostPoolInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPoolInfo : public RequestManagerPoolInfo
{
public:
    ClusterPoolInfo():
        RequestManagerPoolInfo("ClusterPoolInfo",
                               "Returns the cluster pool")
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_cpool();
        auth_object = AuthRequest::CLUSTER;
    };

    ~ClusterPoolInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupPoolInfo: public RequestManagerPoolInfo
{
public:
    GroupPoolInfo():
        RequestManagerPoolInfo("GroupPoolInfo",
                               "Returns the group pool")
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = AuthRequest::GROUP;
    };

    ~GroupPoolInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserPoolInfo: public RequestManagerPoolInfo
{
public:
    UserPoolInfo():
        RequestManagerPoolInfo("UserPoolInfo",
                               "Returns the user pool")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = AuthRequest::USER;
    };

    ~UserPoolInfo(){};
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
