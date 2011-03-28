/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "Host.h"
#include "SqlDB.h"

using namespace std;

/**
 *  A cluster helper class. It is not a normal PoolSQL,
 *  but a series of static methods related to clusters.
 */
class ClusterPool : public PoolSQL
{
public:
    ClusterPool(SqlDB * db);

    ~ClusterPool(){};

    /**
     *  Removes the host from the given cluster setting the default one.
     *    @param host The host to assign
     *
     *    @return 0 on success
     */
    int set_default_cluster(Host * host)
    {
        return host->set_cluster(ClusterPool::DEFAULT_CLUSTER_NAME);
    };

    /**
     *  Cluster name for the default cluster
     */
    static const string DEFAULT_CLUSTER_NAME;

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new cluster in the pool
     *    @param clid the id assigned to the cluster
     *    @return the id assigned to the cluster or -1 in case of failure
     */
    int allocate(int * oid, string name, string& error_str);

    /**
     *  Function to get a Cluster from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Cluster unique id
     *    @param lock locks the Cluster mutex
     *    @return a pointer to the Cluster, 0 if the Cluster could not be loaded
     */
    Cluster * get(int oid, bool lock)
    {
        return static_cast<Cluster *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    Cluster * get(const string& name, bool lock)
    {
        return static_cast<Cluster *>(PoolSQL::get(name,-1,lock));
    };

    /** Update a particular Cluster
     *    @param user pointer to Cluster
     *    @return 0 on success
     */
    int update(Cluster * cluster)
    {
        return cluster->update(db);
    };

    /**
     *  Drops the Cluster from the data base. The object mutex SHOULD be
     *  locked.
     *    @param cluster a pointer to the object
     *    @return 0 on success.
     */
    int drop(Cluster * cluster);

    /**
     *  Bootstraps the database table(s) associated to the Cluster pool
     */
    static void bootstrap(SqlDB * _db)
    {
        Cluster::bootstrap(_db);
    };

    /**
     *  Dumps the Cluster pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return PoolSQL::dump(oss, "CLUSTER_POOL", Cluster::table, where);
    };

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new Cluster(-1,"");
    };
};

#endif /*CLUSTER_POOL_H_*/
