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

#ifndef USER_POOL_H_
#define USER_POOL_H_

#include "PoolSQL.h"
#include "User.h"
#include "GroupPool.h"

#include <time.h>
#include <sstream>

#include <iostream>

#include <vector>

using namespace std;

class AuthRequest; //Forward definition of AuthRequest

/**
 *  The User Pool class. ...
 */
class UserPool : public PoolSQL
{
public:

    UserPool(SqlDB * db,
             time_t  __session_expiration_time);

    ~UserPool(){};

    /**
     *  Function to allocate a new User object
     *    @param oid the id assigned to the User
     *    @return the oid assigned to the object or -1 in case of failure
     */
    int allocate (
        int *   oid,
        int     gid,
        const string& uname,
        const string& gname,
        const string& password,
        const string& auth,
        bool    enabled,
        string& error_str);

    /**
     *  Function to get a User from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid User unique id
     *    @param lock locks the User mutex
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    User * get(int oid, bool lock)
    {
        return static_cast<User *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Function to get a User from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param username
     *    @param lock locks the User mutex
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    User * get(string name, bool lock)
    {
        // The owner is set to -1, because it is not used in the key() method
        return static_cast<User *>(PoolSQL::get(name,-1,lock));
    };

    /**
     *  Generate an index key for the object
     *    @param name of the object
     *    @param uid owner of the object, only used if needed
     *
     *    @return the key, a string
     */
    string key(const string& name, int uid)
    {
        // Name is enough key because Users can't repeat names.
        return name;
    };

    /** Update a particular User
     *    @param user pointer to User
     *    @return 0 on success
     */
    int update(User * user)
    {
        return user->update(db);
    };

    /**
     *  Bootstraps the database table(s) associated to the User pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return User::bootstrap(_db);
    };

    /**
     * Returns whether there is a user with given username/password or not
     *   @param session, colon separated username and password string
     *   @param uid of the user if authN succeeded -1 otherwise
     *   @param gid of the user if authN succeeded -1 otherwise
     *   @param uname of the user if authN succeeded "" otherwise
     *   @param gname of the group if authN succeeded "" otherwise
     *
     *   @return false if authn failed, true otherwise
     */
    bool authenticate(const string& session, 
                      int&          uid, 
                      int&          gid,
                      string&       uname,
                      string&       gname);
    /**
     * Returns whether the operations described in a authorization request are
     * authorized ot not.
     *   @param ar, an Authorization Request
     *   @return -1 if authz failed, 0 otherwise
     */
    static int authorize(AuthRequest& ar);

    /**
     *  Dumps the User pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return PoolSQL::dump(oss, "USER_POOL", User::table, where);
    };

    /**
     *  Name for the OpenNebula core authentication process 
     */
    static const char * CORE_AUTH;

    /**
     *  Name for the OpenNebula server (delegated) authentication process 
     */
    static const char * SERVER_AUTH;

    /**
     *  Name for the OpenNebula public authentication process. It only
     *  allows delegated
     */
    static const char * PUBLIC_AUTH;

    /**
     *  Name for the default auth driver to be used for not registered users
     */
    static const char * DEFAULT_AUTH;

    /**
     *  Name for the default Sunstone server user
     */
    static const char * SERVER_NAME;

    /**
     *  Name of the oneadmin user
     */
    static string oneadmin_name;

    /**
     *  Identifier for the oneadmin user
     */
    static const int ONEADMIN_ID;

private:
    //--------------------------------------------------------------------------
    // Configuration Attributes for Users
    // -------------------------------------------------------------------------

    /**
     * Authentication session expiration time
     **/
    static time_t _session_expiration_time;

    /**
     *  Function to authenticate internal (known) users
     */
    bool authenticate_internal(User *        user,
                               const string& token,
                               int&          user_id,
                               int&          group_id,
                               string&       uname,
                               string&       gname);

    /**
     *  Function to authenticate internal users using a server driver
     */
    bool authenticate_server(User *        user,
                             const string& token,
                             int&          user_id,
                             int&          group_id,
                             string&       uname,
                             string&       gname);

    
    /**
     *  Function to authenticate external (not known) users
     */
    bool authenticate_external(const string& username,
                               const string& token,
                               int&    user_id,
                               int&    group_id,
                               string& uname,
                               string& gname);
    /**
     *  Factory method to produce User objects
     *    @return a pointer to the new User
     */
    PoolObjectSQL * create()
    {
        return new User(-1,-1,"","","",UserPool::CORE_AUTH,true);
    };

};

#endif /*USER_POOL_H_*/

