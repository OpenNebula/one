/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The User class.
 */
class User : public PoolObjectSQL
{
public:

    /**
     *  Function to write a User on an output stream
     */
    friend ostream& operator<<(ostream& os, User& u);

    /**
     * Function to print the User object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

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
     *     @return username User's hostname
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
    };

    /**
     *  Sets user password
     */
    void set_password(string _password)
    {
        password = _password;
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
     *  "Encrypts" the password with SHA1 digest
     *  @param password
     *  @return sha1 encrypted password
     */
    static string sha1_digest(const string& pass);

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
     * Flag marking user enabled/disabled
     */
    bool        enabled;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Callback function to unmarshall a User object (User::select)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Bootstraps the database table(s) associated to the User
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss_user(User::db_bootstrap);

        db->exec(oss_user);
    };

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************

    User(int     id,
         string _username,
         string _password,
         bool   _enabled);

    virtual ~User();

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
     *  Writes/updates the User data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        return insert_replace(db, true);
    }
};

#endif /*USER_H_*/
