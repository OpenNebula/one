/* ------------------------------------------------------------------------ */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs      */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#ifndef SECURITYGROUP_H_
#define SECURITYGROUP_H_

#include "PoolObjectSQL.h"
#include "ObjectCollection.h"

using namespace std;

/**
 *  The SecurityGroup class.
 */
class SecurityGroup : public PoolObjectSQL
{
public:

    /**
     * Function to print the SecurityGroup object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     *  Returns a copy of the Template
     *    @return A copy of the Template
     */
    Template * clone_template() const
    {
        return new Template(obj_template);
    };

    /* ---------------------------------------------------------------------- */
    /*   Access VM Counter                                                    */
    /* ---------------------------------------------------------------------- */

    /**
     *  Adds a VM ID to the set.
     *    @param vm_id The new id
     *
     *    @return 0 on success, -1 if the ID was already in the set
     */
    int add_vm(int vm_id)
    {
        return vm_collection.add_collection_id(vm_id);
    }

    /**
     *  Deletes a VM ID from the set.
     *    @param vm_id The id
     *
     *    @return 0 on success, -1 if the ID was not in the set
     */
    int del_vm(int vm_id)
    {
        return vm_collection.del_collection_id(vm_id);
    }

    /**
     *  Returns how many VMs are using the security group.
     *    @return how many IDs are there in the set.
     */
    int get_vms() const
    {
        return vm_collection.get_collection_size();
    }
private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class SecurityGroupPool;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    SecurityGroup(  int             _uid,
                    int             _gid,
                    const string&   _uname,
                    const string&   _gname,
                    int             _umask,
                    Template*       sgroup_template);

    ~SecurityGroup();

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the SecurityGroup
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(SecurityGroup::db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Writes the SecurityGroup in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the SecurityGroup's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Factory method for SecurityGroup templates
     */
    Template * get_new_template() const
    {
        return new Template;
    }

    /**
     *  Stores a collection with the VMs using the security group
     */
    ObjectCollection vm_collection;
};

#endif /*SECURITYGROUP_H_*/
