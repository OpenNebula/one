/* ------------------------------------------------------------------------ */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems              */
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

#ifndef VMGROUP_H_
#define VMGROUP_H_

#include "PoolObjectSQL.h"

class VMGroupPool;

/**
 *  A VMGroupRole defines a VM type that typically implements a role in a
 *  multi-vm application.
 *
 *  ROLE = [
 *    NAME = "Web application servers",
 *    ID   = 12,
 *    VMS  = "1,2,45,21"
 *  ]
 *
 */
class VMGroupRole
{
public:
    VMGroupRole(VectorAttribute *_va);

    virtual ~VMGroupRole(){};

    /* ---------------------------------------------------------------------- */
    /* VMS set Interface                                                      */
    /* ---------------------------------------------------------------------- */
    const std::set<int>& get_vms()
    {
        return vms;
    };

    void add_vm(int vm_id);

    void del_vm(int vm_id);

private:
    /**
     *  The set of vms in the role
     */
    std::set<int> vms;

    /**
     *  The associated vector attribute
     */
    VectorAttribute * va;

    /**
     *  Set the VMS attribute for the role (list of VM IDs)
     */
    void set_vms();
};

/**
 *  A VM group is a set of related VMs that may impose placement constraints.
 *
 *  Data model:
 *
 *  NAME        = "Web server"
 *  DESCRIPTION = "A multi-tier web server: frontend, apps servers, db"
 *
 *  ROLE = [
 *    NAME = "frontend",
 *    ID   = 0,
 *    VMS  = "0,1"
 *  ]
 *
 *  ROLE = [
 *    NAME = "db",
 *    ID   = 1,
 *    VMS  = "2,3,4,5"
 *  ]
 *
 *  ANTI_AFFINED = "db", "front_end"
 */
class VMGroup : public PoolObjectSQL
{
public:
    /**
     * Function to print the VMGroup object into a string in XML format
     *   @param xml the resulting XML string
     *   @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     *  Returns a copy of the Template
     *    @return A copy of the Template
     */
    Template * clone_template() const
    {
        return new Template(*obj_template);
    };

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VMGroupPool;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    VMGroup(int _uid, int _gid, const string& _uname, const string& _gname,
            int _umask, Template * group_template);

    ~VMGroup();

    // -------------------------------------------------------------------------
    // Role Map management
    // -------------------------------------------------------------------------
    /**
     *  A role map indexed by different key types
     */
    template<class T>
    class RoleMap
    {
    public:
        /**
         *  Inserts a new role in the map
         *    @param k the key
         *    @param r pointer to yhe VMGroupRole
         *    @return true if the role was successfully inserted
         */
        bool insert(const T& k, VMGroupRole * r)
        {
            std::pair<T, VMGroupRole *> rpair(k, r);
            std::pair<roles_it, bool> rc;

            rc = roles.insert(rpair);

            return rc.second;
        }

        /**
         *  Frees the memory associated to the map and clears it
         */
        void delete_roles()
        {
            for (roles_it it = roles.begin() ; it != roles.end() ; ++it )
            {
                delete it->second;
            }

            clear();
        }

        /**
         *  Clears the contents of the map
         */
        void clear()
        {
            roles.clear();
        }

        size_t erase(const T& k)
        {
            return roles.erase(k);
        }

        /**
         *  Check id a set of keys are in the map.
         *    @param key_str a comma separated list of keys
         *    @return true if all the keys are in the map
         */
        bool in_map(const string& key_str)
        {
            std::set<T> key_set;
            typename std::set<T>::iterator it;

            one_util::split_unique(key_str, ',', key_set);

            if ( key_set.empty() )
            {
                return true;
            }

            for ( it = key_set.begin(); it != key_set.end() ; ++it )
            {
                if ( roles.find(*it) == roles.end() )
                {
                    return false;
                }
            }

            return true;
        }

    private:
        typedef typename std::map<T, VMGroupRole *>::iterator roles_it;

        std::map<T, VMGroupRole *> roles;
    };

    /**
     *  Add a new role to the VM group
     *    @param role to add as a vector attribute
     *    @param error if any
     *
     *    @return 0 on success
     */
    int add_role(VectorAttribute * vrole, string& error);

    // -------------------------------------------------------------------------
    // DataBase implementation
    // -------------------------------------------------------------------------
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
     *  Bootstraps the database table(s) associated to the VMGroup
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(VMGroup::db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Writes the VMGroup in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the VMGroup's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Checks the new roles and affined/anti-affined cross-references
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(string& error);

    /**
     *  Factory method for VMGroup templates
     */
    Template * get_new_template() const
    {
        return new Template;
    }

    // -------------------------------------------------------------------------
    // VMGroup attributes
    // -------------------------------------------------------------------------
    /**
     *  Name of the VM Group
     */
    std::string name;

    /**
     *  Map to access the roles by their name
     */
    RoleMap<std::string> by_name;

    /**
     *  Map to access the roles by their id
     */
    RoleMap<int> by_id;
};

#endif /*SECURITYGROUP_H_*/

