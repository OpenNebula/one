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

#ifndef DATASTORE_POOL_H_
#define DATASTORE_POOL_H_

#include "Datastore.h"
#include "PoolSQL.h"
#include "OneDB.h"


class DatastorePool : public PoolSQL
{
public:
    DatastorePool(SqlDB * db,
                  const std::vector<const SingleAttribute *>& _inherit_attrs,
                  const std::vector<const SingleAttribute *>& encrypted_attrs);

    ~DatastorePool() {};

    /* ---------------------------------------------------------------------- */
    /* Constants for DB management                                            */
    /* ---------------------------------------------------------------------- */

    /**
     *  Name for the system datastore
     */
    static const std::string SYSTEM_DS_NAME;

    /**
     *  Identifier for the system datastore
     */
    static const int SYSTEM_DS_ID;

    /**
     *  Name for the default datastore
     */
    static const std::string DEFAULT_DS_NAME;

    /**
     *  Identifier for the default datastore
     */
    static const int DEFAULT_DS_ID;

    /**
     *  Name for the file datastore
     */
    static const std::string FILE_DS_NAME;

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
            int                  uid,
            int                  gid,
            const std::string&   uname,
            const std::string&   gname,
            int                  umask,
            std::unique_ptr<DatastoreTemplate> ds_template,
            int *                oid,
            const std::set<int>& cluster_ids,
            std::string&         error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the Datastore unique identifier
     *   @return a pointer to the Datastore, nullptr in case of failure
     */
    std::unique_ptr<Datastore> get(int oid)
    {
        return PoolSQL::get<Datastore>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the Datastore unique identifier
     *   @return a pointer to the Datastore, nullptr in case of failure
     */
    std::unique_ptr<Datastore> get_ro(int oid)
    {
        return PoolSQL::get_ro<Datastore>(oid);
    }

    /**
     *  Drops the Datastore data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the Datastore object
     *    @param error_msg Error reason, if any
     *    @return 0 on success, -1 DB error
     *            -3 Datastore's Image IDs set is not empty
     */
    int drop(PoolObjectSQL * objsql, std::string& error_msg) override;

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
             bool desc) override
    {
        return PoolSQL::dump(oss, "DATASTORE_POOL", "body", one_db::ds_table,
                             where, sid, eid, desc);
    };

    /**
     *  Lists the Datastore ids
     *  @param oids a vector with the oids of the objects.
     *
     *  @return 0 on success
     */
    int list(std::vector<int>& oids)
    {
        return PoolSQL::list(oids, one_db::ds_table);
    }

    /**
     *  Adds to the disk the datastore inherit attributes and conf values
     *    @param ds_id of the datastore to use
     *    @para disk vector attribute for the disk
     *
     *    @return -1 if the DS does not exists
     */
    int disk_attribute(int ds_id, VirtualMachineDisk * disk);

    /**
     *  Returns the default DRIVER to use with images and disks in this DS. The
     *  precedence is:
     *    1. TM_MAD_CONF/DRIVER in oned.conf
     *    2. DRIVER in the DS template
     *
     *    @param dsid of the datastore
     *
     *    @return driver name or "" if not set or missing DS
     */
    std::string get_ds_driver(int ds_id)
    {
        if ( auto ds = get_ro(ds_id) )
        {
            return ds->get_ds_driver();
        }

        return "";
    }

private:
    /**
     * Datastore attributes to be inherited into the VM disk
     */
    std::vector<std::string> inherit_attrs;

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create() override
    {
        std::set<int> empty;

        return new Datastore(-1, -1, "", "", 0, 0, empty);
    };
};

#endif /*DATASTORE_POOL_H_*/
