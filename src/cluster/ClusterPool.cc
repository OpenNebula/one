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
        cluster = new Cluster(0, ClusterPool::DEFAULT_CLUSTER_NAME);

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

    Host*                   host;
    vector<int>             hids;
    vector<int>::iterator   hid_it;

    Nebula&     nd = Nebula::instance();
    HostPool *  hpool = nd.get_hpool();

    string      cluster_name = cluster->get_name();
    string      where = "cluster = '" + cluster_name + "'";

    // Return error if cluster is 'default'
    if( cluster->get_oid() == 0 )
    {
        NebulaLog::log("CLUSTER",Log::WARNING,
                       "Default cluster cannot be deleted.");

        return -1;
    }

    rc = cluster->drop(db);

    // Move the hosts assigned to the deleted cluster to the default one
    if( rc == 0 )
    {
        hpool->search(hids, where);

        for ( hid_it=hids.begin() ; hid_it < hids.end(); hid_it++ )
        {
            host = hpool->get(*hid_it, true);

            if ( host == 0 )
            {
                continue;
            }

            set_default_cluster(host);

            hpool->update(host);

            host->unlock();
        }
    }

    return rc;
}
