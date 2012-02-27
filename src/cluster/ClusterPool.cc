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

#include "ClusterPool.h"
#include "Nebula.h"
#include "NebulaLog.h"

#include <stdexcept>

/* -------------------------------------------------------------------------- */
/* There is a default cluster boostrapped by the core:                        */
/* The first 100 cluster IDs are reserved for system clusters.                */
/* Regular ones start from ID 100                                             */
/* -------------------------------------------------------------------------- */

const string ClusterPool::DEFAULT_CLUSTER_NAME = "default";
const int    ClusterPool::DEFAULT_CLUSTER_ID   = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ClusterPool::ClusterPool(SqlDB * db):PoolSQL(db, Cluster::table)
{
    ostringstream oss;
    string        error_str;

    if (get_lastOID() == -1) //lastOID is set in PoolSQL::init_cb
    {
        int         rc;
        Cluster *   cluster;

        cluster = new Cluster(DEFAULT_CLUSTER_ID, DEFAULT_CLUSTER_NAME);

        rc = PoolSQL::allocate(cluster, error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        set_update_lastOID(99);
    }

    return;

error_bootstrap:
    oss << "Error trying to create default cluster: " << error_str;
    NebulaLog::log("CLUSTER",Log::ERROR,oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::allocate(string name, int * oid, string& error_str)
{
    Cluster *       cluster;
    ostringstream   oss;

    if ( name.empty() )
    {
        goto error_name;
    }

    if ( name.length() > 128 )
    {
        goto error_name_length;
    }

    // Check for duplicates
    cluster = get(name, false);

    if( cluster != 0 )
    {
        goto error_duplicated;
    }

    // Build a new Cluster object
    cluster = new Cluster(-1, name);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(cluster, error_str);

    return *oid;

error_name:
    oss << "NAME cannot be empty.";
    goto error_common;

error_name_length:
    oss << "NAME is too long; max length is 128 chars.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by CLUSTER " << cluster->get_oid() << ".";

error_common:
    *oid = -1;
    error_str = oss.str();

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
