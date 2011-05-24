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

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerPoolInfo: public Request
{
protected:
    RequestManagerPoolInfo(const string& method_name,
                           const string& help)
        :Request(method_name,"A:s",help){};

    ~RequestManagerPoolInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(int uid, 
                         int gid,
                         xmlrpc_c::paramList const& _paramList);
    
    /* -------------------------------------------------------------------- */

    PoolSQL *pool;
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
        Nebula& nd = Nebula::instance();
        pool       = nd.get_hpool();
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
    };

    ~ClusterPoolInfo(){};

private:
    VMTemplatePool * tpool;
    UserPool *       upool;
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
        Nebula& nd = Nebula::instance();
        pool       = nd.get_upool();
    };

    ~UserPoolInfo(){};
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
