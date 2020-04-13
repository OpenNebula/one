/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#ifndef CLUSTER_POOL_H_
#define CLUSTER_POOL_H_

#include "Cluster.h"
#include "PoolSQL.h"

using namespace std;


class ClusterPool : public PoolSQL
{
public:
    ClusterPool(SqlDB * db,
                const VectorAttribute * vnc_conf,
                vector<const SingleAttribute *>& encrypted_attrs);

    ~ClusterPool(){};

    /* ---------------------------------------------------------------------- */
    /* Constants for DB management                                            */
    /* ---------------------------------------------------------------------- */

    /**
     *  Name for the "none" cluster
     */
    static const string NONE_CLUSTER_NAME;

    /**
     *  Identifier for the "none" cluster
     */
    static const int NONE_CLUSTER_ID;

    /**
     *  Name for the default cluster
     */
    static const string DEFAULT_CLUSTER_NAME;

    /**
     *  Identifier for the default cluster
     */
    static const int DEFAULT_CLUSTER_ID;

    /* ---------------------------------------------------------------------- */
    /* Cluster Resources                                                      */
    /* ---------------------------------------------------------------------- */
    /**
     *  Get a free VNC port in the cluster. It will try first base_port + id
     *   @param oid of the cluster
     *   @param vm_id of the ID requesting the port
     *   @param port to free
     */
    int get_vnc_port(int oid, int vm_id, unsigned int& port)
    {
        int rc = -1;

        Cluster * cluster = get(oid);

        if ( cluster != 0 )
        {
          rc = cluster->get_vnc_port(vm_id, port);

          update_vnc_bitmap(cluster);

          cluster->unlock();
        }

        return rc;
    };

    /**
     * Release a previously allocated VNC port in the cluster
     *   @param oid of the cluster
     *   @param port to free
     */
    void release_vnc_port(int oid, unsigned int port)
    {
        Cluster * cluster = get(oid);

        if ( cluster != 0 )
        {
            cluster->release_vnc_port(port);

            update_vnc_bitmap(cluster);

            cluster->unlock();
        }
    }

    /**
     * Mark a VNC port as in-use in the cluster.
     *   @param oid of the cluster
     *   @param port to set
     *
     *   @return 0 on success, -1 if the port was in-use.
     */
    int set_vnc_port(int oid, unsigned int port)
    {
        int rc = -1;

        Cluster * cluster = get(oid);

        if ( cluster != 0 )
        {
            rc = cluster->set_vnc_port(port);

            update_vnc_bitmap(cluster);

            cluster->unlock();
        }

        return rc;
    }

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new cluster, writting it in the pool database. No memory is
     *  allocated for the object.
     *    @param name Cluster name
     *    @param oid the id assigned to the Cluster
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(string name, int * oid, string& error_str);

    /**
     *  Function to get a cluster from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid cluster unique id
     *    @param lock locks the cluster mutex
     *    @return a pointer to the cluster, 0 if the cluster could not be loaded
     */
    Cluster * get(int oid)
    {
        return static_cast<Cluster *>(PoolSQL::get(oid));
    };

    /**
     *  Function to get a read onlycluster from the pool, if the object is not
     *  in memory it is loaded from the DB
     *    @param oid cluster unique id
     *
     *    @return a pointer to the cluster, 0 if the cluster could not be loaded
     */

    Cluster * get_ro(int oid)
    {
        return static_cast<Cluster *>(PoolSQL::get_ro(oid));
    }

    /**
     *  Drops the Cluster from the data base. The object mutex SHOULD be
     *  locked.
     * @param objsql a pointer to a Cluster object
     * @param error_msg Error reason, if any
     * @return  0 on success,
     *          -1 DB error,
     *          -2 object is a system cluster (ID < 100)
     *          -3 Cluster's User IDs set is not empty
     */
    int drop(PoolObjectSQL * objsql, string& error_msg);

    /**
     *  Bootstraps the database table(s) associated to the Cluster pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        ostringstream oss_bitmap;
        int rc;

        rc  = Cluster::bootstrap(_db);
        rc += _db->exec_local_wr(
                BitMap<0>::bootstrap(Cluster::bitmap_table, oss_bitmap));

        return rc;
    };

    /**
     *  Dumps the Cluster pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
        bool desc)
    {
        return PoolSQL::dump(oss, "CLUSTER_POOL", "body", Cluster::table, where,
                             sid, eid, desc);
    };

    /**
     *  Generates the cluster part of the ACL filter to look for objects. This
     *  filter is generated for objects that can be part of a cluster
     *    @param acl_filter stream to write the filter
     *    @param auth_object to generate the filter for
     *    @param cids vector of cluster ids
     */
    static void cluster_acl_filter(ostringstream& filter,
            PoolObjectSQL::ObjectType auth_object, const vector<int>& cids);

    /**
     * Returns the Datastore Clusters performing a DB query
     * @param oid Datastore ID
     * @param cluster_ids Will contain the Cluster IDs
     * @return 0 on success
     */
    int query_datastore_clusters(int oid, set<int> &cluster_ids);

    /**
     * Returns the VNet Clusters performing a DB query
     * @param oid VNet ID
     * @param cluster_ids Will contain the Cluster IDs
     * @return 0 on success
     */
    int query_vnet_clusters(int oid, set<int> &cluster_ids);

    /**
     * Adds a resource to the specifyed cluster and update the clusters body.
     * @param type Resource type
     * @param cluster Cluster in which the resource will be included
     * @param resource_id Id of the resource
     * @param error_msg error message
     * @return 0 on success
     */
    int add_to_cluster(PoolObjectSQL::ObjectType type, Cluster* cluster,
                       int resource_id, string& error_msg);

    /**
     * Removes a resource from the specifyed cluster and update the clusters body.
     * @param type Resource type
     * @param cluster Cluster from which the resource will be removed
     * @param resource_id Id of the resource
     * @param error_msg error message
     * @return 0 on success
     */
    int del_from_cluster(PoolObjectSQL::ObjectType type, Cluster* cluster,
                         int resource_id, string& error_msg);

    /**
     * Updates the cluster vnc bitmap.
     * @cluster the cluster to be updated.
     * @return 0 on success
     */
    int update_vnc_bitmap(Cluster* cluster)
    {
        return cluster->update_vnc_bitmap(db);
    }

private:
    /**
     *  VNC configuration for clusters
     */
    const VectorAttribute vnc_conf;

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new Cluster(-1,"",0, &vnc_conf);
    };
};

#endif /*CLUSTER_POOL_H_*/
