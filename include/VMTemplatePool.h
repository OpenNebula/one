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

#ifndef VMTEMPLATE_POOL_H_
#define VMTEMPLATE_POOL_H_

#include "PoolSQL.h"
#include "VMTemplate.h"

/**
 *  The VMTemplate Pool class.
 */
class VMTemplatePool : public PoolSQL
{
public:

    VMTemplatePool(SqlDB * db) : PoolSQL(db, VMTemplate::table, true){};

    ~VMTemplatePool(){};

    /**
     *  Allocates a new object, writting it in the pool database. No memory is
     *  allocated for the object.
     *    @param uid user id (the owner of the Template)
     *    @param gid the id of the group this object is assigned to
     *    @param template_contents a VM Template object
     *    @param oid the id assigned to the Template
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(int                      uid,
                 int                      gid,
                 const string&            uname,
                 const string&            gname,
                 VirtualMachineTemplate * template_contents,
                 int *                    oid,
                 string&                  error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param oid the object unique identifier
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    VMTemplate * get(int oid, bool lock)
    {
        return static_cast<VMTemplate *>(PoolSQL::get(oid,lock));
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
    VMTemplate * get(const string& name, int uid, bool lock)
    {
        return static_cast<VMTemplate *>(PoolSQL::get(name,uid,lock));
    };

    /**
     *  Updates the object's data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the object
     *
     *    @return 0 on success.
     */
    int update(VMTemplate * vm_template)
    {
        return vm_template->update(db);
    };

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return PoolSQL::dump(oss, "VMTEMPLATE_POOL",VMTemplate::table,where);
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
    PoolObjectSQL * create()
    {
        return new VMTemplate(-1,-1,-1,"","",0);
    };
};

#endif /*VMTEMPLATE_POOL_H_*/
