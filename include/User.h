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

#ifndef USER_H_
#define USER_H_

#include "PoolObjectSQL.h"
#include "UserTemplate.h"
#include "ObjectCollection.h"
#include "QuotasSQL.h"
#include "LoginToken.h"
#include "VMActions.h"
#include "AuthRequest.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The User class.
 */
class User : public PoolObjectSQL
{
public:

    virtual ~User() = default;

    /**
     *  Characters that can not be in a name
     */
    static const std::string INVALID_NAME_CHARS;

    /**
     *  Characters that can not be in a password
     */
    static const std::string INVALID_PASS_CHARS;

    /**
     * Function to print the User object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    /**
     * Function to print the User object into a string in
     * XML format. The extended XML includes the default quotas
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml_extended(std::string& xml) const;

    /**
     *  Check if the user is enabled
     *    @return true if the user is enabled
     */
    bool isEnabled() const
    {
        return enabled;
    }

    /**
     *  Returns user password
     *     @return the User's password
     */
    const std::string& get_password() const
    {
        return password;
    };

    /**
     *   Enables the current user
     */
    void enable()
    {
        enabled = true;
    };

    /**
     *   Disables the current user
     */
    void disable()
    {
        enabled = false;

        session->reset();

        login_tokens.reset();
    };

    /**
     *  Checks if a password is valid, i.e. it is not empty and does not
     *  contain invalid characters.
     *    @param pass Password to be checked
     *    @param error_str Returns the error reason, if any
     *    @return true if the string is valid
     */
    static bool pass_is_valid(const std::string& pass, std::string& error_str);

    /**
     *  Sets user password. It checks that the new password does not contain
     *  forbidden chars.
     *    @param _password the new pass
     *    @param error_str Returns the error reason, if any
     *    @returns -1 if the password is not valid
     */
    int set_password(const std::string& passwd, std::string& error_str);

    /**
     *  Returns user password
     *     @return the user's auth driver
     */
    const std::string& get_auth_driver() const
    {
        return auth_driver;
    };

    /**
     *  Sets the user auth driver.
     *
     *    @param _auth_driver the new auth. driver
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success, -1 otherwise
     */
    int set_auth_driver(const std::string& _auth_driver, std::string& error_str)
    {
        auth_driver = _auth_driver;
        session->reset();

        return 0;
    };

    /**
     *  Splits an authentication token (<usr>:<pass>)
     *    @param secret, the authentication token
     *    @param username
     *    @param password
     *    @return 0 on success
     **/
    static int split_secret(const std::string& secret,
                            std::string& user,
                            std::string& pass);

    /**
     *  Factory method for image templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<UserTemplate>();
    }

    /**
     * Returns the UMASK template attribute (read as an octal number), or the
     * default UMASK from oned.conf if it does not exist
     *
     * @return the UMASK to create new objects
     */
    int get_umask() const;

    /**
     * Returns the default UMASK attribute (octal) from oned.conf
     *
     * @return the UMASK to create new objects
     */
    static int get_default_umask();

    /**
     *  Returns a copy of the groups for the user
     */
    const std::set<int>& get_groups() const
    {
        return groups.get_collection();
    };

    // *************************************************************************
    // Group IDs set Management
    // *************************************************************************

    /**
     *  Adds a group ID to the groups set.
     *
     *    @param id The new id
     *    @return 0 on success, -1 if the ID was already in the set
     */
    int add_group(int group_id)
    {
        return groups.add(group_id);
    }

    /**
     *  Deletes a group ID from the groups set.
     *
     *    @param id The id
     *    @return   0 on success,
     *              -1 if the ID was not in the set,
     *              -2 if the group to delete is the main group
     */
    int del_group(int group_id)
    {
        if (group_id == gid)
        {
            return -2;
        }

        return groups.del(group_id);
    }

    /**
     *  Check if user is in this group
     *    @param gid id of group
     */
    bool is_in_group(int _group_id) const
    {
        return groups.contains(_group_id);
    }

    /**
     *  @return the operation level (admin, manage or use) associated to the
     *  given action for this group
     */
    AuthRequest::Operation get_vm_auth_op(VMActions::Action action) const
    {
        return vm_actions.get_auth_op(action);
    }

    // *************************************************************************
    // Quotas
    // *************************************************************************

    /**
     *  Object quotas, provides set and check interface
     */
    UserQuotas quota;

    /**
     *  Writes/updates the User quotas fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_quotas(SqlDB *db)
    {
        return quota.update(oid, db->get_local_db());
    }

    // *************************************************************************
    // Login tokens
    // *************************************************************************

    /**
     * The login token object, provides the set & reset interface for the token
     */
    LoginTokenPool login_tokens;

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class UserPool;
    friend class PoolSQL;

    // -------------------------------------------------------------------------
    // User Attributes
    // -------------------------------------------------------------------------

    /**
     *  User's password
     */
    std::string password;

    /**
     *  Authentication driver for this user
     */
    std::string auth_driver;

    /**
     * Flag marking user enabled/disabled
     */
    bool        enabled;

    /**
     *  Collection og group ids for this user
     */
    ObjectCollection groups;

    /**
     *  List of VM actions and rights for this user
     */
    VMActions vm_actions;

    // *************************************************************************
    // Authentication session used to cache authentication calls
    // *************************************************************************
    SessionToken * session;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the User
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        std::ostringstream oss_user(one_db::user_db_bootstrap);

        return db->exec_local_wr(oss_user);
    }

protected:
    /**
     *  Reads the User (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db) override;

    /**
     *  Reads the User (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @param name of the user
     *    @param uid of the owner
     *
     *    @return 0 on success
     */
    int select(SqlDB * db, const std::string& name, int uid) override;

    /**
     *  Drops the user from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db) override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     * Function to print the User object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @param extended If true, default quotas are included
     *  @return a reference to the generated string
     */
    std::string& to_xml_extended(std::string& xml, bool extended) const;

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************

    User(int                id,
         int                _gid,
         const std::string& _uname,
         const std::string& _gname,
         const std::string& _password,
         const std::string& _auth_driver,
         bool               _enabled):
        PoolObjectSQL(id, USER, _uname, -1, _gid, "", _gname, one_db::user_table),
        quota(),
        password(_password),
        auth_driver(_auth_driver),
        enabled(_enabled),
        groups("GROUPS"),
        session(0)
    {
        obj_template = std::make_unique<UserTemplate>();
    }

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    /**
     *  Writes the User in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Writes/updates the User data fields in the database. This method does
     *  not update the user's quotas
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /* Checks the validity of template attributes
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error) override;
};

#endif /*USER_H_*/
