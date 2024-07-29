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

#ifndef VMTEMPLATE_POOL_H_
#define VMTEMPLATE_POOL_H_

#include "PoolSQL.h"
#include "VMTemplate.h"
#include "OneDB.h"

/**
 *  The VMTemplate Pool class.
 */
class VMTemplatePool : public PoolSQL
{
public:

    VMTemplatePool(SqlDB * db) : PoolSQL(db, one_db::vm_template_table) {};

    ~VMTemplatePool() {};

    /**
     *  Allocates a new object, writting it in the pool database. No memory is
     *  allocated for the object.
     *    @param uid user id (the owner of the Template)
     *    @param gid the id of the group this object is assigned to
     *    @param uname user name
     *    @param gname group name
     *    @param umask permissions umask
     *    @param template_contents a VM Template object
     *    @param oid the id assigned to the Template
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(int                      uid,
                 int                      gid,
                 const std::string&       uname,
                 const std::string&       gname,
                 int                      umask,
                 std::unique_ptr<VirtualMachineTemplate> template_contents,
                 int *                    oid,
                 std::string&             error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the VMTemplate unique identifier
     *   @return a pointer to the VMTemplate, nullptr in case of failure
     */
    std::unique_ptr<VMTemplate> get(int oid)
    {
        return PoolSQL::get<VMTemplate>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the VMTemplate unique identifier
     *   @return a pointer to the VMTemplate, nullptr in case of failure
     */
    std::unique_ptr<VMTemplate> get_ro(int oid)
    {
        return PoolSQL::get_ro<VMTemplate>(oid);
    }

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
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
        return PoolSQL::dump(oss, "VMTEMPLATE_POOL", "body",
                             one_db::vm_template_table, where, sid, eid, desc);
    };

    /**
     *  Bootstraps the database table(s) associated to the pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return VMTemplate::bootstrap(_db);
    };

private:
    /**
     *  Factory method to produce Image objects
     *    @return a pointer to the new Image
     */
    PoolObjectSQL * create() override
    {
        return new VMTemplate(-1, -1, -1, "", "", 0, 0);
    };
};

#endif /*VMTEMPLATE_POOL_H_*/
