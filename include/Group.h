/* ------------------------------------------------------------------------ */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems              */
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

#ifndef GROUP_H_
#define GROUP_H_

#include "PoolObjectSQL.h"
#include "GroupTemplate.h"
#include "ObjectCollection.h"
#include "QuotasSQL.h"
#include "Template.h"
#include "VMActions.h"

using namespace std;

/**
 *  The Group class.
 */
class Group : public PoolObjectSQL
{
public:

    /**
     * Function to print the Group object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const override;

    /**
     * Function to print the Group object into a string in
     * XML format. The extended XML includes the default quotas
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str) override;

    /**
     *  Adds this user's ID to the set.
     *    @param id of the user to be added to the group
     *    @return 0 on success
     */
    int add_user(int id)
    {
        return users.add(id);
    }

    /**
     *  Deletes this users's ID from the set.
     *    @param id of the user to be deleted from the group
     *    @return 0 on success
     */
    int del_user(int id)
    {
        if (admins.contains(id))
        {
            string error;

            del_admin(id, error);
        }

        return users.del(id);
    }

    /**
     * Adds a User to the admin set. ACL Rules are updated only for this user.
     *
     * @param user_id ID of the user
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int add_admin(int user_id, string& error_msg);

    /**
     * Deletes a User from the admin set. ACL Rules are updated only for this user.
     *
     * @param user_id ID of the user
     * @param error_msg Returns the error reason, if any
     *
     * @return 0 on success
     */
    int del_admin(int user_id, string& error_msg);

    /**
     * Retrun true if User is an admin member of the group
     *
     * @param user_id ID of the user
     *
     * @return true on success
     */
    bool is_admin(int user_id)
    {
        return admins.contains(user_id);
    }
    /**
     *  Object quotas, provides set and check interface
     */
    GroupQuotas quota;

    /**
     *  Writes/updates the Group quotas fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_quotas(SqlDB *db)
    {
        return quota.update(oid, db->get_local_db());
    }

    /**
     *  Factory method for Group templates
     */
    Template * get_new_template() const override
    {
        return new GroupTemplate;
    }

    /**
     *  Sets suntone views in the group template if they are not set. Adds
     *  an attribute of the form:
     *   SUNSTONE=[
     *     DEFAULT_VIEW             = "cloud",
     *     GROUP_ADMIN_DEFAULT_VIEW = "groupadmin",
     *     GROUP_ADMIN_VIEWS        = "cloud,groupadmin",
     *     VIEWS                    = "cloud" ]
     */
    void sunstone_views(const string& user_default, const string& user_views,
            const string& admin_default, const string& admin_views);

    /**
     *  @return the operation level (admin, manage or use) associated to the
     *  given action for this group
     */
    AuthRequest::Operation get_vm_auth_op(VMActions::Action action) const
    {
        return vm_actions.get_auth_op(action);
    }

protected:
    /* Checks the validity of template attributes
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(string& error) override;

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class GroupPool;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Group(int id, const string& name):
        PoolObjectSQL(id,GROUP,name,-1,-1,"","",table),
        quota(),
        users("USERS"),
        admins("ADMINS")
    {
        // Allow users in this group to see it
        group_u = 1;

        obj_template = new GroupTemplate;
    }

    virtual ~Group() = default;

    // *************************************************************************
    // Administrators
    // *************************************************************************

    /**
     *  Stores a collection with the regular users
     */
    ObjectCollection users;

    /**
     *  Stores a collection with the admin users
     */
    ObjectCollection admins;

    void add_admin_rules(int user_id);
    void del_admin_rules(int user_id);

    /**
     *  List of VM actions and rights for this group
     */
    VMActions vm_actions;

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
     *  Bootstraps the database table(s) associated to the Group
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss_group(Group::db_bootstrap);

        return db->exec_local_wr(oss_group);
    }

    /**
     *  Reads the Group (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db) override;

    /**
     *  Reads the Group (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @param name of the group
     *    @param uid of the owner
     *
     *    @return 0 on success
     */
    int select(SqlDB * db, const string& name, int uid) override;

    /**
     *  Reads the Group quotas from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select_quotas(SqlDB * db);

    /**
     *  Drops the group from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db) override;

    /**
     *  Writes the Group in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str) override;

    /**
     *  Writes/updates the Group's data fields in the database. This method does
     *  not update the Group's Quotas
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Function to print the Group object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @param extended If true, default quotas are included
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml, bool extended) const;
};

#endif /*GROUP_H_*/
