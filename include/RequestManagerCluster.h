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
        dspool     = nd.get_dspool();
        vnpool     = nd.get_vnpool();

        auth_object = PoolObjectSQL::CLUSTER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~RequestManagerCluster(){};

    /* --------------------------------------------------------------------- */

    ClusterPool *           clpool;
    DatastorePool *         dspool;
    VirtualNetworkPool *    vnpool;

    /* --------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att) = 0;

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

    virtual Datastore::DatastoreType get_ds_type(PoolObjectSQL *obj)
    {
        return Datastore::FILE_DS;
    };

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
            string& error_msg) = 0;

    virtual int del_object(Cluster* cluster, int id, string& error_msg) = 0;

    virtual void get(int oid, bool lock, PoolObjectSQL ** object, Clusterable ** cluster_obj) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerClusterHost: public Request
{
protected:
    RequestManagerClusterHost(
            const string& method_name,
            const string& help,
            const string& params)
                :Request(method_name,params,help)
            {
                Nebula& nd = Nebula::instance();
                clpool     = nd.get_clpool();
                hpool      = nd.get_hpool();

                auth_object = PoolObjectSQL::CLUSTER;
                auth_op     = AuthRequest::ADMIN;
            };

    ~RequestManagerClusterHost(){};

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
        RequestManagerClusterHost("ClusterAddHost",
                "Adds a host to the cluster",
                "A:sii"){};

    ~ClusterAddHost(){};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att)
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
        RequestManagerClusterHost("ClusterDelHost",
                "Deletes a host from its cluster",
                "A:sii"){};

    ~ClusterDelHost(){};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att)
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
        const string& method_name,
        const string& help,
        const string& params):
            RequestManagerCluster(method_name, help, params){};

    ~RequestManagerClusterDatastore(){};

    virtual Datastore::DatastoreType get_ds_type(PoolObjectSQL *obj)
    {
        return static_cast<Datastore*>(obj)->get_type();
    };

    virtual int add_object(
            Cluster* cluster,
            int id,
            string& error_msg)
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

class ClusterAddDatastore : public RequestManagerClusterDatastore
{
public:
    ClusterAddDatastore():
        RequestManagerClusterDatastore("ClusterAddDatastore",
                "Adds a datastore to the cluster",
                "A:sii"){};

    ~ClusterAddDatastore(){};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att)
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
        RequestManagerClusterDatastore("ClusterDelDatastore",
                "Deletes a datastore from its cluster",
                "A:sii"){};

    ~ClusterDelDatastore(){};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att)
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
            const string& method_name,
            const string& help,
            const string& params):
                RequestManagerCluster(method_name, help, params){};

    ~RequestManagerClusterVNet(){};

    virtual int add_object(
            Cluster* cluster,
            int id,
            string& error_msg)
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

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAddVNet : public RequestManagerClusterVNet
{
public:
    ClusterAddVNet():
        RequestManagerClusterVNet("ClusterAddVNet",
                "Adds a virtual network to the cluster",
                "A:sii"){};

    ~ClusterAddVNet(){};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att)
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
        RequestManagerClusterVNet("ClusterDelVNet",
                "Deletes a virtual network from its cluster",
                "A:sii"){};

    ~ClusterDelVNet(){};

    void request_execute(xmlrpc_c::paramList const& paramList,
                         RequestAttributes& att)
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
