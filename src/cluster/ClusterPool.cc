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

#include "ClusterPool.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "ClusterTemplate.h"
#include "DatastorePool.h"

#include <stdexcept>

using namespace std;

/* -------------------------------------------------------------------------- */
/* There is a default cluster boostrapped by the core: 0, default             */
/* The first 100 cluster IDs are reserved for system clusters.                */
/* Regular ones start from ID 100                                             */
/* -------------------------------------------------------------------------- */

const string ClusterPool::NONE_CLUSTER_NAME = "";
const int    ClusterPool::NONE_CLUSTER_ID   = -1;

const string ClusterPool::DEFAULT_CLUSTER_NAME = "default";
const int    ClusterPool::DEFAULT_CLUSTER_ID   = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ClusterPool::ClusterPool(SqlDB * db,
                         const VectorAttribute * _vnc_conf,
                         const vector<const SingleAttribute *>& encrypted_attrs):
    PoolSQL(db, one_db::cluster_table), vnc_conf(_vnc_conf)
{
    ostringstream oss;
    string        error_str;

    // ---------------------------------------------------------------------
    // Create the default cluster
    // ---------------------------------------------------------------------

    if (get_lastOID() == -1) //lastOID is set in PoolSQL::init_cb
    {
        int rc;

        allocate(DEFAULT_CLUSTER_NAME, &rc, error_str);

        if (rc != DEFAULT_CLUSTER_ID)
        {
            goto error_bootstrap;
        }

        auto cluster = get(DEFAULT_CLUSTER_ID);

        if (!cluster)
        {
            goto error_bootstrap;
        }

        add_to_cluster(PoolObjectSQL::DATASTORE, cluster.get(),
                       DatastorePool::SYSTEM_DS_ID, error_str);
        add_to_cluster(PoolObjectSQL::DATASTORE, cluster.get(),
                       DatastorePool::DEFAULT_DS_ID, error_str);
        add_to_cluster(PoolObjectSQL::DATASTORE, cluster.get(),
                       DatastorePool::FILE_DS_ID, error_str);

        // User created clusters will start from ID 100
        set_lastOID(99);
    }

    // Parse encrypted attributes
    ClusterTemplate::parse_encrypted(encrypted_attrs);

    return;

error_bootstrap:
    oss.str("");
    oss << "Error trying to create default cluster: " << error_str;
    NebulaLog::log("CLUSTER", Log::ERROR, oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::allocate(string name, int * oid, string& error_str)
{
    Cluster * cluster;

    ostringstream oss;

    int db_oid;

    // Check name
    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    db_oid = exist(name);

    if( db_oid != -1 )
    {
        goto error_duplicated;
    }

    // Build a new Cluster object
    cluster = new Cluster(-1, name, 0, vnc_conf);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(cluster, error_str);

    return *oid;


error_duplicated:
    oss << "NAME is already taken by CLUSTER " << db_oid << ".";
    error_str = oss.str();

error_name:
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    Cluster * cluster = static_cast<Cluster*>(objsql);

    int rc;

    // Return error if the cluster is a default one.
    if( cluster->get_oid() < 100 )
    {
        error_msg = "System Clusters (ID < 100) cannot be deleted.";
        NebulaLog::log("CLUSTER", Log::ERROR, error_msg);
        return -2;
    }

    if ( cluster->check_drop(error_msg) < 0 )
    {
        NebulaLog::log("CLUSTER", Log::ERROR, error_msg);

        return -3;
    }

    rc = cluster->drop(db);

    if( rc != 0 )
    {
        error_msg = "SQL DB error";
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClusterPool::cluster_acl_filter(ostringstream& filter,
                                     PoolObjectSQL::ObjectType auth_object, const vector<int>& cids)
{
    if ( cids.empty() )
    {
        return;
    }

    string fc = "";

    switch (auth_object)
    {
        case PoolObjectSQL::HOST:
            filter << " OR ";
            break;

        case PoolObjectSQL::DATASTORE:
            filter << " OR oid IN ( SELECT oid from "
                   << one_db::cluster_datastore_table << " WHERE ";
            fc = ")";
            break;

        case PoolObjectSQL::NET:
            filter << " OR oid IN ( SELECT oid from " << one_db::cluster_network_table
                   << " WHERE ";
            fc = ")";
            break;

        default:
            return;
    }

    for ( auto it = cids.begin(); it != cids.end(); it++ )
    {
        if ( it != cids.begin() )
        {
            filter << " OR ";
        }

        filter << "cid = " << *it;
    }

    filter << fc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::query_datastore_clusters(int oid, set<int> &cluster_ids)
{
    ostringstream oss;
    set_cb<int>   cb;

    cb.set_callback(&cluster_ids);

    oss << "SELECT cid FROM " << one_db::cluster_datastore_table
        << " WHERE oid = " << oid;

    int rc = db->exec_rd(oss, &cb);

    cb.unset_callback();

    if ( rc != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::query_vnet_clusters(int oid, set<int> &cluster_ids)
{
    ostringstream oss;
    set_cb<int>   cb;

    cb.set_callback(&cluster_ids);

    oss << "SELECT cid FROM " << one_db::cluster_network_table << " WHERE oid = "<<oid;

    int rc = db->exec_rd(oss, &cb);

    cb.unset_callback();

    if ( rc != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::add_to_cluster(PoolObjectSQL::ObjectType type, Cluster* cluster,
                                int resource_id, string& error_msg)
{
    string table, names;

    switch (type)
    {
        case PoolObjectSQL::DATASTORE:
            table = one_db::cluster_datastore_table;
            names = one_db::cluster_datastore_db_names;
            break;
        case PoolObjectSQL::NET:
            table = one_db::cluster_network_table;
            names = one_db::cluster_network_db_names;
            break;
        case PoolObjectSQL::HOST:
            break;
        default:
            error_msg = "Invalid resource type: " + PoolObjectSQL::type_to_str(type);
            return -1;
    }

    int rc = cluster->add_resource(type, resource_id, error_msg);

    if (rc != 0)
    {
        return -1;
    }

    if (!table.empty())
    {
        ostringstream oss;

        oss << "INSERT INTO " << table <<" ("
            << names << ") VALUES (" << cluster->get_oid()
            << "," << resource_id << ")";

        rc = db->exec_wr(oss);

        if (rc != 0)
        {
            cluster->del_resource(type, resource_id, error_msg);

            error_msg =  "Error updating cluster elemnts table";

            return -1;
        }
    }

    update(cluster);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::del_from_cluster(PoolObjectSQL::ObjectType type, Cluster* cluster,
                                  int resource_id, string& error_msg)
{
    string table;

    switch (type)
    {
        case PoolObjectSQL::DATASTORE:
            table = one_db::cluster_datastore_table;
            break;
        case PoolObjectSQL::NET:
            table = one_db::cluster_network_table;
            break;
        case PoolObjectSQL::HOST:
            break;
        default:
            error_msg = "Invalid resource type: " + PoolObjectSQL::type_to_str(type);
            return -1;
    }

    int rc = cluster->del_resource(type, resource_id, error_msg);

    if ( rc != 0 )
    {
        return -1;
    }

    if (!table.empty())
    {
        ostringstream oss;

        oss << "DELETE FROM " << table << " WHERE cid = "
            << cluster->get_oid() << " AND oid = " << resource_id;

        rc = db->exec_wr(oss);

        if (rc != 0)
        {
            cluster->add_resource(type, resource_id, error_msg);

            error_msg =  "Error updating cluster elements table";

            return -1;
        }
    }

    update(cluster);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

