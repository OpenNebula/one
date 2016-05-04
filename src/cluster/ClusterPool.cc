/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include <stdexcept>

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

ClusterPool::ClusterPool(SqlDB * db, const VectorAttribute * _vnc_conf):
    PoolSQL(db, Cluster::table, true, true), vnc_conf(_vnc_conf)
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

        if( rc != DEFAULT_CLUSTER_ID )
        {
            goto error_bootstrap;
        }

        Cluster* cluster = get(DEFAULT_CLUSTER_ID, true);

        if (cluster == 0)
        {
            goto error_bootstrap;
        }

        cluster->add_datastore(DatastorePool::SYSTEM_DS_ID, error_str);
        cluster->add_datastore(DatastorePool::DEFAULT_DS_ID, error_str);
        cluster->add_datastore(DatastorePool::FILE_DS_ID, error_str);

        update(cluster);

        cluster->unlock();

        // User created clusters will start from ID 100
        set_update_lastOID(99);
    }

    return;

error_bootstrap:
    oss.str("");
    oss << "Error trying to create default cluster: " << error_str;
    NebulaLog::log("CLUSTER",Log::ERROR,oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::allocate(string name, int * oid, string& error_str)
{
    Cluster * cluster;
    string    error;

    ostringstream oss;

    // Check name
    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    cluster = get(name, false);

    if( cluster != 0 )
    {
        goto error_duplicated;
    }

    // Build a new Cluster object
    cluster = new Cluster(-1, name, 0, vnc_conf);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(cluster, error_str);

    return *oid;


error_duplicated:
    oss << "NAME is already taken by CLUSTER " << cluster->get_oid() << ".";
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
            filter << " OR oid IN ( SELECT oid from " << Cluster::datastore_table
                   << " WHERE ";
            fc = ")";
            break;

        case PoolObjectSQL::NET:
            filter << " OR oid IN ( SELECT oid from " << Cluster::network_table
                   << " WHERE ";
            fc = ")";
            break;

        default:
            return;
    }

    for ( vector<int>::const_iterator it = cids.begin(); it < cids.end(); it++ )
    {
        if ( it != cids.begin() )
        {
            filter << " OR ";
        }

        filter << "cid = " << *it;
    }

    filter << fc;
}
