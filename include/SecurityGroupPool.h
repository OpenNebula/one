/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

using namespace std;


class SecurityGroupPool : public PoolSQL
{
public:
    SecurityGroupPool(SqlDB * db);

    ~SecurityGroupPool(){};

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
            int             uid,
            int             gid,
            const string&   uname,
            const string&   gname,
            int             umask,
            Template *      sgroup_template,
            int *           oid,
            string&         error_str);

    /**
     *  Function to get a SecurityGroup from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid SecurityGroup unique id
     *    @param lock locks the SecurityGroup mutex
     *    @return a pointer to the SecurityGroup, 0 if the SecurityGroup could not be loaded
     */
    SecurityGroup * get(int oid)
    {
        return static_cast<SecurityGroup *>(PoolSQL::get(oid));
    };

    /**
     *  Function to get a read only SecurityGroup from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid SecurityGroup unique id
     *    @return a pointer to the SecurityGroup, 0 if the SecurityGroup could not be loaded
     */
    SecurityGroup * get_ro(int oid)
    {
        return static_cast<SecurityGroup *>(PoolSQL::get_ro(oid));
    };

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
     *  @param limit parameters used for pagination
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss, const string& where, const string& limit,
            bool desc)
    {
        return PoolSQL::dump(oss, "SECURITY_GROUP_POOL", "body", SecurityGroup::table,
                where, limit, desc);
    };

    /**
     * Gets the the security group rules associated to a set of security groups
     * Single SG and multiple SG version.
     *
     * @param vm_id Virtual Machine id, if not -1 the VM is added to the sg
     * @param sgs security group ID set
     * @param rules Security Group rules will be added at the end of this vector
     */
    void get_security_group_rules(int vmid, set<int>& sgs,
        vector<VectorAttribute*> &rules)
    {
        set<int>::iterator sg_it;

        for (sg_it = sgs.begin(); sg_it != sgs.end(); ++sg_it)
        {
            get_security_group_rules(vmid, *sg_it, rules);
        }

    };

    void get_security_group_rules(int vid, int sid, vector<VectorAttribute*> &rs);

    /**
     * Removes the VM from the security groups
     *
     * @param id of Virtual Machine
     * @param sgs security group ID set
     */
    void release_security_groups(int id, set<int>& sgs);

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new SecurityGroup(-1,-1,"","",0,0);
    };
};

#endif /*SECURITYGROUP_POOL_H_*/
