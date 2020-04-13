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

#ifndef DATASTORE_POOL_H_
#define DATASTORE_POOL_H_

#include "Datastore.h"
#include "PoolSQL.h"

using namespace std;


class DatastorePool : public PoolSQL
{
public:
    DatastorePool(SqlDB * db,
                  const vector<const SingleAttribute *>& _inherit_attrs,
                  vector<const SingleAttribute *>& encrypted_attrs);

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

    /**
     *  Name for the file datastore
     */
    static const string FILE_DS_NAME;

    /**
     *  Identifier for the file datastore
     */
    static const int FILE_DS_ID;

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
     *    @param umask permissions umask
     *    @param ds_template Datastore definition template
     *    @param oid the id assigned to the Datastore
     *    @param cluster_ids the ids of the clusters this Datastore will belong to
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(
            int                 uid,
            int                 gid,
            const string&       uname,
            const string&       gname,
            int                 umask,
            DatastoreTemplate * ds_template,
            int *               oid,
            const set<int>      &cluster_ids,
            string&             error_str);

    /**
     *  Function to get a Datastore from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Datastore unique id
     *    @param lock locks the Datastore mutex
     *    @return a pointer to the Datastore, 0 if the Datastore could not be loaded
     */
    Datastore * get(int oid)
    {
        return static_cast<Datastore *>(PoolSQL::get(oid));
    };

    /**
     *  Function to get a read only Datastore from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid Datastore unique id
     *    @return a pointer to the Datastore, 0 if the Datastore could not be loaded
     */
    Datastore * get_ro(int oid)
    {
        return static_cast<Datastore *>(PoolSQL::get_ro(oid));
    }

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
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
        bool desc)
    {
        return PoolSQL::dump(oss, "DATASTORE_POOL", "body", Datastore::table,
                where, sid, eid, desc);
    };

    /**
     *  Lists the Datastore ids
     *  @param oids a vector with the oids of the objects.
     *
     *  @return 0 on success
     */
     int list(vector<int>& oids)
     {
        return PoolSQL::list(oids, Datastore::table);
     }

     /**
      *  Adds to the disk the datastore inherit attributes and conf values
      *    @param ds_id of the datastore to use
      *    @para disk vector attribute for the disk
      *
      *    @return -1 if the DS does not exists
      */
    int disk_attribute(int ds_id, VirtualMachineDisk * disk);

private:
    /**
     * Datastore attributes to be inherited into the VM disk
     */
    vector<string> inherit_attrs;

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        set<int> empty;

        return new Datastore(-1,-1,"","", 0, 0, empty);
    };
};

#endif /*DATASTORE_POOL_H_*/
