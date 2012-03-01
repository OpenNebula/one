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

#ifndef DATASTORE_POOL_H_
#define DATASTORE_POOL_H_

#include "Datastore.h"
#include "SqlDB.h"

using namespace std;


class DatastorePool : public PoolSQL
{
public:
    DatastorePool(SqlDB * db);

    ~DatastorePool(){};

    /* ---------------------------------------------------------------------- */
    /* Constants for DB management                                            */
    /* ---------------------------------------------------------------------- */

    /**
     *  Name for the system datastore
     */
    static const string SYSTEM_DS_NAME;

    /**
     *  Identifier for the system datastore
     */
    static const int SYSTEM_DS_ID;

    /**
     *  Name for the default datastore
     */
    static const string DEFAULT_DS_NAME;

    /**
     *  Identifier for the default datastore
     */
    static const int DEFAULT_DS_ID;

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new Datastore, writing it in the pool database. No memory is
     *  allocated for the object.
     *    @param uid the user id of the Datastore owner
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the user
     *    @param gname name of the group
     *    @param ds_template Datastore definition template
     *    @param oid the id assigned to the Datastore
     *    @param cluster_id the id of the cluster this Datastore will belong to
     *    @param cluster_name the name of the cluster this Datastore will belong to
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(
            int                 uid,
            int                 gid,
            const string&       uname,
            const string&       gname,
            DatastoreTemplate * ds_template,
            int *               oid,
            int                 cluster_id,
            const string&       cluster_name,
            string&             error_str);

    /**
     *  Function to get a Datastore from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Datastore unique id
     *    @param lock locks the Datastore mutex
     *    @return a pointer to the Datastore, 0 if the Datastore could not be loaded
     */
    Datastore * get(int oid, bool lock)
    {
        return static_cast<Datastore *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    Datastore * get(const string& name, bool lock)
    {
        // The owner is set to -1, because it is not used in the key() method
        return static_cast<Datastore *>(PoolSQL::get(name,-1,lock));
    };

    /**
     *  Generate an index key for the object
     *    @param name of the object
     *    @param uid owner of the object, only used if needed
     *
     *    @return the key, a string
     */
    string key(const string& name, int uid)
    {
        // Name is enough key because Datastores can't repeat names.
        return name;
    };

    /** Update a particular Datastore
     *    @param user pointer to Datastore
     *    @return 0 on success
     */
    int update(Datastore * datastore)
    {
        return datastore->update(db);
    };

    /**
     *  Drops the Datastore data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the Datastore object
     *    @param error_msg Error reason, if any
     *    @return 0 on success, -1 DB error
     *            -3 Datastore's Image IDs set is not empty
     */
    int drop(PoolObjectSQL * objsql, string& error_msg);

    /**
     *  Bootstraps the database table(s) associated to the Datastore pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return Datastore::bootstrap(_db);
    };

    /**
     *  Dumps the Datastore pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return PoolSQL::dump(oss, "DATASTORE_POOL", Datastore::table, where);
    };

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new Datastore(-1,-1,"","", 0, -1, "");
    };
};

#endif /*DATASTORE_POOL_H_*/
