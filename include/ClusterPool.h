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

#ifndef CLUSTER_POOL_H_
#define CLUSTER_POOL_H_

#include <string>
#include <sstream>
#include <map>

#include "SqlDB.h"

using namespace std;


/**
 *  A cluster helper class. It is not a normal PoolSQL,
 *  but a series of static methods related to clusters.
 */
class ClusterPool
{
public:
    /**
     *  Cluster name for the default cluster
     */
    static const string DEFAULT_CLUSTER_NAME;

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class HostPool;

    /* ---------------------------------------------------------------------- */
    /* Attributes                                                             */
    /* ---------------------------------------------------------------------- */
    /**
     *  This map stores the clusters
     */
    map<int, string>	cluster_names;


    /* ---------------------------------------------------------------------- */
    /* Methods for cluster management                                         */
    /* ---------------------------------------------------------------------- */

    /**
     *  Returns true if the clid is an id for an existing cluster
     *  @param clid ID of the cluster
     *
     *  @return true if the clid is an id for an existing cluster
     */
    bool exists(int clid)
    {
        return cluster_names.count(clid) > 0;
    };

    /**
     *  Allocates a new cluster in the pool
     *    @param clid the id assigned to the cluster
     *    @return the id assigned to the cluster or -1 in case of failure
     */
    int allocate(int * clid, string name, SqlDB *db, string& error_str);

    /**
     *  Returns the xml representation of the given cluster
     *    @param clid ID of the cluster
     *
     *    @return the xml representation of the given cluster
     */
    string info(int clid);

    /**
     *  Removes the given cluster from the pool and the DB
     *    @param clid ID of the cluster
     *
     *    @return 0 on success
     */
    int drop(int clid, SqlDB *db);

    /**
     *  Dumps the cluster pool in XML format.
     *    @param oss the output stream to dump the pool contents
     *
     *    @return 0 on success
     */
    int dump(ostringstream& oss);

    /**
     *  Bootstraps the database table(s) associated to the Cluster
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss(ClusterPool::db_bootstrap);
        db->exec(oss);
    };

    /**
     *  Function to insert new Cluster in the pool
     *    @param oid the id assigned to the Cluster
     *    @param name the Cluster's name
     *    @return 0 on success, -1 in case of failure
     */
    int insert (int oid, string name, SqlDB *db);

    /**
     *  Formats as XML the given id and name.
     *    @param oss the output stream to dump the pool contents
     *
     *    @return 0 on success
     */
    void dump_cluster(ostringstream& oss, int id, string name);


    /* ---------------------------------------------------------------------- */
    /* DB manipulation                                                        */
    /* ---------------------------------------------------------------------- */

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

};

#endif /*CLUSTER_POOL_H_*/
