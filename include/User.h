/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "PoolSQL.h"
#include "UserTemplate.h"
#include "ObjectCollection.h"
#include "QuotasSQL.h"

class UserQuotas;

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The User class.
 */
class User : public PoolObjectSQL, public ObjectCollection
{
public:

    /**
     *  Characters that can not be in a name
     */
    static const string INVALID_NAME_CHARS;

    /**
     *  Characters that can not be in a password
     */
    static const string INVALID_PASS_CHARS;

    /**
     * Function to print the User object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     * Function to print the User object into a string in
     * XML format. The extended XML includes the default quotas
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml) const;

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
    const string& get_password() const
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
        invalidate_session();
    };

    /**
     *  Checks if a password is valid, i.e. it is not empty and does not
     *  contain invalid characters.
     *    @param pass Password to be checked
     *    @param error_str Returns the error reason, if any
     *    @return true if the string is valid
     */
    static bool pass_is_valid(const string& pass, string& error_str);

    /**
     *  Sets user password. It checks that the new password does not contain
     *  forbidden chars.
     *    @param _password the new pass
     *    @param error_str Returns the error reason, if any
     *    @returns -1 if the password is not valid
     */
    int set_password(const string& passwd, string& error_str);

    /**
     *  Returns user password
     *     @return the user's auth driver
     */
    const string& get_auth_driver() const
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
    int set_auth_driver(const string& _auth_driver, string& error_str)
    {
        auth_driver = _auth_driver;
        invalidate_session();

        return 0;
    };

    /**
     *  Splits an authentication token (<usr>:<pass>)
     *    @param secret, the authentication token
     *    @param username
     *    @param password
     *    @return 0 on success
     **/
    static int split_secret(const string secret, string& user, string& pass);

    /**
     *  Factory method for image templates
     */
    Template * get_new_template() const
    {
        return new UserTemplate;
    }

    /**
     *  Object quotas, provides set and check interface
     */
    UserQuotas quota;

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
    set<int> get_groups()
    {
        return get_collection_copy();
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
        return add_collection_id(group_id);
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
        if( group_id == gid )
        {
            return -2;
        }

        return del_collection_id(group_id);
    }

    // *************************************************************************
    // Quotas
    // *************************************************************************

    /**
     *  Writes/updates the User quotas fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_quotas(SqlDB *db)
    {
        return quota.update(oid, db);
    };

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class UserPool;

    // -------------------------------------------------------------------------
    // User Attributes
    // -------------------------------------------------------------------------

    /**
     *  User's password
     */
    string      password;

    /**
     *  Authentication driver for this user
     */
    string      auth_driver;

    /**
     * Flag marking user enabled/disabled
     */
    bool        enabled;

    // *************************************************************************
    // Authentication session (Private)
    // *************************************************************************

    /**
     * Until when the session_token is valid
     */
    time_t session_expiration_time;

    /**
     * Last authentication token validated by the driver, can
     * be trusted until the session_expiration_time
     */
    string session_token;

    /**
     * Checks if a session token is authorized and still valid
     *
     * @param token The authentication token
     * @return true if the token is still valid
     */
    bool valid_session(const string& token)
    {
        return (( session_token == token ) &&
                ( time(0) < session_expiration_time ) );
    };

    /**
     * Resets the authentication session
     */
    void invalidate_session()
    {
        session_token.clear();
        session_expiration_time = 0;
    };

    /**
     * Stores the given session token for a limited time. This eliminates the
     * need to call the external authentication driver until the time expires.
     *
     * @param token The authenticated token
     * @param validity_time
     */
    void set_session(const string& token, time_t validity_time)
    {
        session_token           = token;
        session_expiration_time = time(0) + validity_time;
    };

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
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the User
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss_user(User::db_bootstrap);

        return db->exec(oss_user);
    };

    /**
     *  Reads the User (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db);

    /**
     *  Reads the User (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @param name of the user
     *    @param uid of the owner
     *
     *    @return 0 on success
     */
    int select(SqlDB * db, const string& name, int uid);

    /**
     *  Drops the user from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db);

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     * Function to print the User object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @param extended If true, default quotas are included
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml, bool extended) const;

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************

    User(int           id,
         int           _gid,
         const string& _uname,
         const string& _gname,
         const string& _password,
         const string& _auth_driver,
         bool          _enabled):
        PoolObjectSQL(id,USER,_uname,-1,_gid,"",_gname,table),
        ObjectCollection("GROUPS"),
        quota(),
        password(_password),
        auth_driver(_auth_driver),
        enabled(_enabled),
        session_expiration_time(0),
        session_token("")
    {
        obj_template = new UserTemplate;
    };

    virtual ~User()
    {
        delete obj_template;
    };

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Writes the User in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Writes/updates the User data fields in the database. This method does
     *  not update the user's quotas
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    };

};

#endif /*USER_H_*/
