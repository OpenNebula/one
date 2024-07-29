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

#ifndef SECURITYGROUP_POOL_H_
#define SECURITYGROUP_POOL_H_

#include "PoolSQL.h"
#include "SecurityGroup.h"
#include "OneDB.h"


class SecurityGroupPool : public PoolSQL
{
public:
    SecurityGroupPool(SqlDB * db);

    ~SecurityGroupPool() {};

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new SecurityGroup, writing it in the pool database. No memory is
     *  allocated for the object.
     *
     * @param uid user identifier
     * @param gid the id of the group this object is assigned to
     * @param uname user name
     * @param gname group name
     * @param umask permissions umask
     * @param sgroup_template a Template object
     * @param oid the id assigned to the SecurityGroup
     * @param error_str Returns the error reason, if any
     *
     * @return the oid assigned to the object, -1 in case of failure
     * @return
     */
    int allocate(
            int                uid,
            int                gid,
            const std::string& uname,
            const std::string& gname,
            int                umask,
            std::unique_ptr<Template> sgroup_template,
            int *              oid,
            std::string&       error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the SecurityGroup unique identifier
     *   @return a pointer to the SecurityGroup, nullptr in case of failure
     */
    std::unique_ptr<SecurityGroup> get(int oid)
    {
        return PoolSQL::get<SecurityGroup>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the SecurityGroup unique identifier
     *   @return a pointer to the SecurityGroup, nullptr in case of failure
     */
    std::unique_ptr<SecurityGroup> get_ro(int oid)
    {
        return PoolSQL::get_ro<SecurityGroup>(oid);
    }

    /** Update a particular SecurityGroup
     *    @param securitygroup pointer to SecurityGroup
     *    @return 0 on success
     */
    int update(SecurityGroup * securitygroup)
    {
        return securitygroup->update(db);
    }

    /**
     *  Bootstraps the database table(s) associated to the SecurityGroup pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return SecurityGroup::bootstrap(_db);
    };

    /**
     *  Dumps the SecurityGroup pool in XML format. A filter can be also added to the
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
        return PoolSQL::dump(oss, "SECURITY_GROUP_POOL", "body", one_db::sg_table,
                             where, sid, eid, desc);
    };

    /**
     * Gets the the security group rules associated to a set of security groups
     * Single SG and multiple SG version.
     *
     * @param vm_id Virtual Machine id, if not -1 the VM is added to the sg
     * @param sgs security group ID set
     * @param rules Security Group rules will be added at the end of this vector
     */
    void get_security_group_rules(int vmid, const std::set<int>& sgs,
                                  std::vector<VectorAttribute*> &rules)
    {
        for (auto sg : sgs)
        {
            get_security_group_rules(vmid, sg, rules);
        }

    };

    void get_security_group_rules(int vid, int sid,
                                  std::vector<VectorAttribute*> &rs);

    /**
     * Removes the VM from the security groups
     *
     * @param id of Virtual Machine
     * @param sg security group ID
     */
    void release_security_group(int id, int sgid);

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create() override
    {
        return new SecurityGroup(-1, -1, "", "", 0, 0);
    };
};

#endif /*SECURITYGROUP_POOL_H_*/
