/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef REQUEST_MANAGER_CLUSTER_H
#define REQUEST_MANAGER_CLUSTER_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerCluster: public Request
{
protected:
    RequestManagerCluster(const string& method_name,
                          const string& help,
                          const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd = Nebula::instance();
        clpool     = nd.get_clpool();
        hpool      = nd.get_hpool();

        auth_object = PoolObjectSQL::CLUSTER;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerCluster(){};

    /* --------------------------------------------------------------------- */

    ClusterPool * clpool;
    HostPool *    hpool;

    /* --------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;

    int get_info (PoolSQL *                 pool,
                  int                       id,
                  PoolObjectSQL::ObjectType type,
                  RequestAttributes&        att,
                  PoolObjectAuth&           perms,
                  string&                   name);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddHost : public RequestManagerCluster
{
public:
    ClusterAddHost():
        RequestManagerCluster("ClusterAddHost",
                "Adds a host to the cluster",
                "A:sii"){};

    ~ClusterAddHost(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
