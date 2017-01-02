/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VMGROUP_POOL_H_
#define VMGROUP_POOL_H_

#include "PoolSQL.h"
#include "VMGroup.h"

class VMGroupPool : public PoolSQL
{
public:
    VMGroupPool(SqlDB * db):PoolSQL(db, VMGroup::table, true, true){};

    ~VMGroupPool(){};

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */
    /**
     * Allocates a new VMGroup, writing it in the pool database. No memory is
     * allocated for the object.
     *
     *   @param uid user identifier
     *   @param gid the id of the group this object is assigned to
     *   @param uname user name
     *   @param gname group name
     *   @param umask permissions umask
     *   @param vmgroup_template a Template object
     *   @param oid the id assigned to the new VMGroup
     *   @param error_str Returns the error reason, if any
     *
     *   @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(int uid, int gid, const std::string& uname,
        const std::string& gname, int umask, Template * vmgrp_tmpl, int * oid,
        std::string& error_str);

    /**
     *  Function to get a VMGroup from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid VMGroup unique id
     *    @param lock locks the VMGroup mutex
     *    @return a pointer to the VMGroup, 0 if the VMGroup could not be loaded
     */
    VMGroup * get(int oid, bool lock)
    {
        return static_cast<VMGroup *>(PoolSQL::get(oid, lock));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    VMGroup * get(const std::string& name, int uid, bool lock)
    {
        return static_cast<VMGroup *>(PoolSQL::get(name, uid, lock));
    };

    /** Update a VMGroup
     *    @param vmgroup pointer to VMGroup
     *    @return 0 on success
     */
    int update(VMGroup * vmgroup)
    {
        return vmgroup->update(db);
    };

    /**
     *  Bootstraps the database table(s) associated to the VMGroup pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return VMGroup::bootstrap(_db);
    };

    /**
     *  Dumps the VMGroup pool in XML format. A filter can be added to the query
     *  @param os the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */
    int dump(std::ostringstream& os, const std::string& where,
            const std::string& limit)
    {
        return PoolSQL::dump(os, "VM_GROUP_POOL", VMGroup::table, where, limit);
    };

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new VMGroup(-1,-1,"","",0,0);
    };
};

#endif /*VMGROUP_POOL_H_*/

