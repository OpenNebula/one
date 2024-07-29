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

#ifndef BACKUP_JOB_POOL_H_
#define BACKUP_JOB_POOL_H_

#include "PoolSQL.h"
#include "BackupJob.h"
#include "OneDB.h"

/**
 *  The Backup Job Pool class.
 */
class BackupJobPool : public PoolSQL
{
public:

    BackupJobPool(SqlDB *db)
        : PoolSQL(db, one_db::backup_job_table)
    {};

    /**
     *  Function to allocate a new Image object
     *    @param uid the user id of the image's owner
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the user
     *    @param gname name of the group
     *    @param umask permissions umask
     *    @param template template associated with the Backup Job
     *    @param oid the id assigned to the Backup Job
     *    @param error_str Returns the error reason, if any
     *    @return the oid assigned to the object,
     *                  -1 in case of failure
     *                  -2 in case of template parse failure
     */
    int allocate (
            int                      uid,
            int                      gid,
            const std::string&       uname,
            const std::string&       gname,
            int                      umask,
            std::unique_ptr<Template> templ,
            int *                    oid,
            std::string&             error_str);

    /**
     *  Updates an Image in the data base. It also updates the previous state
     *  after executing the hooks.
     *    @param objsql a pointer to the VM
     *
     *    @return 0 on success.
     */
    int update(PoolObjectSQL * objsql) override
    {
        auto bj = dynamic_cast<BackupJob*>(objsql);

        if ( bj == nullptr )
        {
            return -1;
        }

        return bj->update(db);
    }

    int drop(PoolObjectSQL * objsql, std::string& error_msg) override
    {
        BackupJob *bj = static_cast<BackupJob*>(objsql);

        bj->remove_id_from_vms();

        return PoolSQL::drop(objsql, error_msg);
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the Image unique identifier
     *   @return a pointer to the Image, nullptr in case of failure
     */
    std::unique_ptr<BackupJob> get(int oid)
    {
        return PoolSQL::get<BackupJob>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the Image unique identifier
     *   @return a pointer to the Image, nullptr in case of failure
     */
    std::unique_ptr<BackupJob> get_ro(int oid)
    {
        return PoolSQL::get_ro<BackupJob>(oid);
    }

    /**
     *  Bootstraps the database table(s) associated to the Image pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return BackupJob::bootstrap(_db);
    }

    /**
     *  Dumps the Image pool in XML format. A filter can be also added to the
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
        return PoolSQL::dump(oss, "BACKUPJOB_POOL", "body", one_db::backup_job_table,
                             where, sid, eid, desc);
    }

    /**
     * Returns Backup Jobs IDs with outdated VMs and max priority
    */
    std::vector<int> active()
    {
        std::vector<int> oids;

        search(oids, one_db::backup_job_table,
               "outdated_vms > 0 AND priority = (SELECT MAX(priority) FROM backupjob_pool WHERE outdated_vms > 0)");

        return oids;
    }

private:
    //--------------------------------------------------------------------------
    // Configuration Attributes for Images
    // -------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Pool Attributes
    // -------------------------------------------------------------------------
    /**
     *  Factory method to produce Image objects
     *    @return a pointer to the new Image
     */
    PoolObjectSQL * create() override
    {
        return new BackupJob(-1, -1, "", "", 0, nullptr);
    }
};

#endif /*BACKUP_JOB_POOL_H_*/
