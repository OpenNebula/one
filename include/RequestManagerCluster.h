/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "ClusterPool.h"
#include "DatastorePool.h"
#include "VirtualNetworkPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerCluster: public Request
{
protected:
    RequestManagerCluster(const std::string& method_name,
                          const std::string& help,
                          const std::string& params)
        :Request(method_name, params, help)
    {
        Nebula& nd = Nebula::instance();
        clpool     = nd.get_clpool();
        dspool     = nd.get_dspool();
        vnpool     = nd.get_vnpool();

        auth_object = PoolObjectSQL::CLUSTER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~RequestManagerCluster() {};

    /* --------------------------------------------------------------------- */

    ClusterPool *           clpool;
    DatastorePool *         dspool;
    VirtualNetworkPool *    vnpool;

    /* --------------------------------------------------------------------- */

    void add_generic(
            int                         cluster_id,
            int                         object_id,
            RequestAttributes&          att,
            PoolSQL *                   pool,
            PoolObjectSQL::ObjectType   type)
    {
        action_generic(cluster_id, object_id, att, pool, type, true);
    }

    void del_generic(
            int                         cluster_id,
            int                         object_id,
            RequestAttributes&          att,
            PoolSQL *                   pool,
            PoolObjectSQL::ObjectType   type)
    {
        action_generic(cluster_id, object_id, att, pool, type, false);
    }

    void action_generic(
            int                         cluster_id,
            int                         object_id,
            RequestAttributes&          att,
            PoolSQL *                   pool,
            PoolObjectSQL::ObjectType   type,
            bool                        add);

    /**
     * Add object to cluster id collection
     * @param cluster where to add the object
     * @param id of the object
     * @param ds_type Datastore type, will be ignored for different objects
     * @param error_msg Error reason, if any
     * @return 0 on success
     */
    virtual int add_object(
            Cluster* cluster,
            int id,
            std::string& error_msg) = 0;

    virtual int del_object(Cluster* cluster, int id, std::string& error_msg) = 0;

    virtual void get(int oid, std::unique_ptr<PoolObjectSQL>& object,
                     Clusterable ** cluster_obj) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerClusterHost: public Request
{
protected:
    RequestManagerClusterHost(
            const std::string& method_name,
            const std::string& help,
            const std::string& params)
        :Request(method_name, params, help)
    {
        Nebula& nd = Nebula::instance();
        clpool     = nd.get_clpool();
        hpool      = nd.get_hpool();

        auth_object = PoolObjectSQL::CLUSTER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~RequestManagerClusterHost() {};

    /* --------------------------------------------------------------------- */

    ClusterPool *   clpool;
    HostPool *      hpool;

    /* --------------------------------------------------------------------- */

    void add_generic(
            int                 cluster_id,
            int                 host_id,
            RequestAttributes&  att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddHost : public RequestManagerClusterHost
{
public:
    ClusterAddHost():
        RequestManagerClusterHost("one.cluster.addhost",
                                  "Adds a host to the cluster",
                                  "A:sii") {};

    ~ClusterAddHost() {};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att) override
    {
        int cluster_id  = xmlrpc_c::value_int(paramList.getInt(1));
        int object_id   = xmlrpc_c::value_int(paramList.getInt(2));

        return add_generic(cluster_id, object_id, att);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelHost : public RequestManagerClusterHost
{
public:
    ClusterDelHost():
        RequestManagerClusterHost("one.cluster.delhost",
                                  "Deletes a host from its cluster",
                                  "A:sii") {};

    ~ClusterDelHost() {};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att) override
    {
        // First param is ignored, as objects can be assigned to only
        // one cluster
        int cluster_id  = ClusterPool::DEFAULT_CLUSTER_ID;
        int object_id   = xmlrpc_c::value_int(paramList.getInt(2));

        return add_generic(cluster_id, object_id, att);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerClusterDatastore : public RequestManagerCluster
{
public:
    RequestManagerClusterDatastore(
            const std::string& method_name,
            const std::string& help,
            const std::string& params):
        RequestManagerCluster(method_name, help, params) {};

    ~RequestManagerClusterDatastore() {};

    int add_object(
            Cluster* cluster,
            int id,
            std::string& error_msg) override
    {
        return clpool->add_to_cluster(PoolObjectSQL::DATASTORE, cluster, id, error_msg);
    }

    int del_object(Cluster* cluster, int id, std::string& error_msg) override
    {
        return clpool->del_from_cluster(PoolObjectSQL::DATASTORE, cluster, id, error_msg);
    }

    void get(int oid, std::unique_ptr<PoolObjectSQL>& object,
             Clusterable ** cluster_obj) override
    {
        auto ds = dspool->get(oid);

        *cluster_obj = static_cast<Clusterable *>(ds.get());
        object      = std::move(ds);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddDatastore : public RequestManagerClusterDatastore
{
public:
    ClusterAddDatastore():
        RequestManagerClusterDatastore("one.cluster.adddatastore",
                                       "Adds a datastore to the cluster",
                                       "A:sii") {};

    ~ClusterAddDatastore() {};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att) override
    {
        int cluster_id  = xmlrpc_c::value_int(paramList.getInt(1));
        int object_id   = xmlrpc_c::value_int(paramList.getInt(2));

        return add_generic(cluster_id, object_id, att,
                           dspool, PoolObjectSQL::DATASTORE);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelDatastore : public RequestManagerClusterDatastore
{
public:
    ClusterDelDatastore():
        RequestManagerClusterDatastore("one.cluster.deldatastore",
                                       "Deletes a datastore from its cluster",
                                       "A:sii") {};

    ~ClusterDelDatastore() {};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att) override
    {
        int cluster_id  = xmlrpc_c::value_int(paramList.getInt(1));
        int object_id   = xmlrpc_c::value_int(paramList.getInt(2));

        return del_generic(cluster_id, object_id, att,
                           dspool, PoolObjectSQL::DATASTORE);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerClusterVNet : public RequestManagerCluster
{
public:

    RequestManagerClusterVNet(
            const std::string& method_name,
            const std::string& help,
            const std::string& params):
        RequestManagerCluster(method_name, help, params) {};

    ~RequestManagerClusterVNet() {};

    int add_object(
            Cluster* cluster,
            int id,
            std::string& error_msg) override
    {
        return clpool->add_to_cluster(PoolObjectSQL::NET, cluster, id, error_msg);
    }

    int del_object(Cluster* cluster, int id, std::string& error_msg) override
    {
        return clpool->del_from_cluster(PoolObjectSQL::NET, cluster, id, error_msg);
    }

    void get(int oid, std::unique_ptr<PoolObjectSQL>& object,
             Clusterable ** cluster_obj) override
    {
        auto vnet = vnpool->get(oid);

        *cluster_obj = static_cast<Clusterable *>(vnet.get());
        object      = std::move(vnet);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddVNet : public RequestManagerClusterVNet
{
public:
    ClusterAddVNet():
        RequestManagerClusterVNet("one.cluster.addvnet",
                                  "Adds a virtual network to the cluster",
                                  "A:sii") {};

    ~ClusterAddVNet() {};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att) override
    {
        int cluster_id  = xmlrpc_c::value_int(paramList.getInt(1));
        int object_id   = xmlrpc_c::value_int(paramList.getInt(2));

        return add_generic(cluster_id, object_id, att,
                           vnpool, PoolObjectSQL::NET);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelVNet : public RequestManagerClusterVNet
{
public:
    ClusterDelVNet():
        RequestManagerClusterVNet("one.cluster.delvnet",
                                  "Deletes a virtual network from its cluster",
                                  "A:sii") {};

    ~ClusterDelVNet() {};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att) override
    {
        int cluster_id  = xmlrpc_c::value_int(paramList.getInt(1));
        int object_id   = xmlrpc_c::value_int(paramList.getInt(2));

        return del_generic(cluster_id, object_id, att,
                           vnpool, PoolObjectSQL::NET);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
