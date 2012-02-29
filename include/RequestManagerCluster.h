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
        dspool     = nd.get_dspool();
        vnpool     = nd.get_vnpool();

        auth_object = PoolObjectSQL::CLUSTER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~RequestManagerCluster(){};

    /* --------------------------------------------------------------------- */

    ClusterPool *           clpool;
    HostPool *              hpool;
    DatastorePool *         dspool;
    VirtualNetworkPool *    vnpool;

    /* --------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;

    void add_generic(
            xmlrpc_c::paramList const&  _paramList,
            RequestAttributes&          att,
            PoolSQL *                   pool,
            PoolObjectSQL::ObjectType   type);

    virtual int add_object(Cluster* cluster, int id, string& error_msg) = 0;

    virtual int del_object(Cluster* cluster, int id, string& error_msg) = 0;

    virtual void get(int oid, bool lock, PoolObjectSQL ** object, Clusterable ** cluster_obj) = 0;
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
                         RequestAttributes& att)
    {
        return add_generic(_paramList, att, hpool, PoolObjectSQL::HOST);
    }

    virtual int add_object(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->add_host(id, error_msg);
    };

    virtual int del_object(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->del_host(id, error_msg);
    };

    virtual void get(int oid, bool lock, PoolObjectSQL ** object, Clusterable ** cluster_obj)
    {
        Host * host = hpool->get(oid, lock);

        *object      = static_cast<PoolObjectSQL *>(host);
        *cluster_obj = static_cast<Clusterable *>(host);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddDatastore : public RequestManagerCluster
{
public:
    ClusterAddDatastore():
        RequestManagerCluster("ClusterAddDatastore",
                "Adds a datastore to the cluster",
                "A:sii"){};

    ~ClusterAddDatastore(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att)
    {
        return add_generic(_paramList, att, dspool, PoolObjectSQL::DATASTORE);
    }

    virtual int add_object(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->add_datastore(id, error_msg);
    };

    virtual int del_object(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->del_datastore(id, error_msg);
    };

    virtual void get(int oid, bool lock, PoolObjectSQL ** object, Clusterable ** cluster_obj)
    {
        Datastore * ds = dspool->get(oid, lock);

        *object      = static_cast<PoolObjectSQL *>(ds);
        *cluster_obj = static_cast<Clusterable *>(ds);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddVNet : public RequestManagerCluster
{
public:
    ClusterAddVNet():
        RequestManagerCluster("ClusterAddVNet",
                "Adds a virtual network to the cluster",
                "A:sii"){};

    ~ClusterAddVNet(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att)
    {
        return add_generic(_paramList, att, vnpool, PoolObjectSQL::NET);
    }

    virtual int add_object(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->add_vnet(id, error_msg);
    };

    virtual int del_object(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->del_vnet(id, error_msg);
    };

    virtual void get(int oid, bool lock, PoolObjectSQL ** object, Clusterable ** cluster_obj)
    {
        VirtualNetwork * vnet = vnpool->get(oid, lock);

        *object      = static_cast<PoolObjectSQL *>(vnet);
        *cluster_obj = static_cast<Clusterable *>(vnet);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
