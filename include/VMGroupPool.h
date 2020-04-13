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

#ifndef VMGROUP_POOL_H_
#define VMGROUP_POOL_H_

#include "PoolSQL.h"
#include "VMGroup.h"

class AuthRequest;

class VMGroupPool : public PoolSQL
{
public:
    VMGroupPool(SqlDB * db):PoolSQL(db, VMGroup::table){};

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
    VMGroup * get(int oid)
    {
        return static_cast<VMGroup *>(PoolSQL::get(oid));
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
    VMGroup * get(const std::string& name, int uid)
    {
        return static_cast<VMGroup *>(PoolSQL::get(name, uid));
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
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
        bool desc)
    {
        return PoolSQL::dump(oss, "VM_GROUP_POOL", "body", VMGroup::table, where,
                sid, eid, desc);
    };

    /**
     *  Parse the VMGROUP definition in a VM and fills the ROLE attributes. It
     *  also adds the VM to the role if found.
     *    @param va the vector attribute
     *    @param uid VM owner, used as default to look for the VMGroup
     *    @param vid of the VM
     *    @param err if any
     *
     *    @return 0 on success
     */
    int vmgroup_attribute(VectorAttribute * va, int uid, int vid, string& err);

    /**
     *  Removes VM from the VMGroup
     *    @param va with VMGROUP
     *    @param vid of the VM to be removed
     */
    void del_vm(const VectorAttribute * va, int vid);

    /**
     *  Builds the AuthRequest for the VMGroup
     *    @param va with the VMGROUP
     *    @param uid VM owber, used as default to look for the VMGroup
     *    @param ar the authrequest
     */
    void authorize(const VectorAttribute * va, int uid, AuthRequest* ar);

private:
    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new VMGroup(-1,-1,"","",0,0);
    };

    /**
     *  Gest a VMGroup from its vector attribute description
     *    @param va the VectorAttribute
     *    @param _uid default uid to look for the VMGroup
     */
    VMGroup * get_from_attribute(const VectorAttribute *va, int _uid);
};

#endif /*VMGROUP_POOL_H_*/

