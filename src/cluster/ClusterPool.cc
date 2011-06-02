/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

const string ClusterPool::DEFAULT_CLUSTER_NAME = "default";
const int    ClusterPool::DEFAULT_CLUSTER_ID   = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ClusterPool::ClusterPool(SqlDB * db):PoolSQL(db, Cluster::table)
{
    // lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        int         rc;
        Cluster *   cluster;
        string      error_str;

        // Build a new Cluster object
        cluster = new Cluster(DEFAULT_CLUSTER_ID, DEFAULT_CLUSTER_NAME);

        // Insert the Object in the pool
        rc = PoolSQL::allocate(cluster, error_str);

        if(rc != 0)
        {
            ostringstream oss;

            oss << "Error trying to create default cluster: " << error_str;
            NebulaLog::log("CLUSTER",Log::ERROR,oss);

            throw runtime_error(oss.str());
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPool::allocate(int * oid, string name, string& error_str)
{
    Cluster *       cluster;
    ostringstream   oss;

    if ( name.empty() )
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
    cluster = new Cluster(-1, name);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(cluster, error_str);

    return *oid;


error_name:
    oss << "NAME cannot be empty.";
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

int ClusterPool::drop(Cluster * cluster)
{
    int         rc;

    vector<int>             hids;
    vector<int>::iterator   hid_it;

    int         cluster_id = cluster->get_oid();

    ostringstream where;

    // Return error if cluster is 'default'
    if( cluster_id == DEFAULT_CLUSTER_ID )
    {
        NebulaLog::log("CLUSTER",Log::WARNING,
                       "Default cluster cannot be deleted.");

        return -1;
    }

    // Move the hosts assigned to the deleted cluster to the default one
    cluster->set_default_cluster();

    rc = cluster->drop(db);

    return rc;
}
