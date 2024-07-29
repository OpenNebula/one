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

#ifndef USER_POOL_H_
#define USER_POOL_H_

#include "PoolSQL.h"
#include "User.h"
#include "GroupPool.h"
#include "CachePool.h"
#include "LoginToken.h"

#include <time.h>
#include <sstream>

#include <iostream>

#include <vector>

class AuthRequest; //Forward definition of AuthRequest

/**
 *  The User Pool class. ...
 */
class UserPool : public PoolSQL
{
public:

    UserPool(SqlDB * db, time_t  __session_expiration_time, bool is_slave,
             const std::vector<const SingleAttribute *>& restricted_attrs,
             const std::vector<const SingleAttribute *>& encrypted_attrs);

    ~UserPool() = default;

    /**
     *  Function to allocate a new User object
     *    @param oid the id assigned to the User
     *    @return the oid assigned to the object or -1 in case of failure
     */
    int allocate(
            int * oid,
            const std::string& uname,
            int   gid,
            const std::string& password,
            const std::string& auth,
            bool  enabled,
            const std::set<int>& gids,
            const std::set<int>& agids,
            std::string& error_str);

    /**
     *  Drops the object's data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the object
     *    @param error_msg Error reason, if any
     *    @return 0 on success, -1 DB error
     */
    int drop(PoolObjectSQL * objsql, std::string& error_msg) override;

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the User unique identifier
     *   @return a pointer to the User, nullptr in case of failure
     */
    std::unique_ptr<User> get(int oid)
    {
        auto u = PoolSQL::get<User>(oid);

        if (u)
        {
            u->session = get_session_token(oid);
        }

        return u;
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the User unique identifier
     *   @return a pointer to the User, nullptr in case of failure
     */
    std::unique_ptr<User> get_ro(int oid)
    {
        auto u = PoolSQL::get_ro<User>(oid);

        if (u)
        {
            u->session = get_session_token(oid);
        }

        return u;
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *    @param username
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    std::unique_ptr<User> get(std::string name)
    {
        // The owner is set to -1, because it is not used in the key() method
        auto u = PoolSQL::get<User>(name, -1);

        if (u)
        {
            u->session = get_session_token(u->oid);
        }

        return u;
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *    @param username
     *    @return a pointer to the User, 0 if the User could not be loaded
     */
    std::unique_ptr<User> get_ro(std::string name)
    {
        // The owner is set to -1, because it is not used in the key() method
        auto u = PoolSQL::get_ro<User>(name, -1);

        if (u)
        {
            u->session = get_session_token(u->oid);
        }

        return u;
    }

    /**
     *  Function to get the token password of an user from the pool
     *    @param uid creator of the object
     *    @param uid owner of the object, only used if the creator not exists
     *
     *    @return the user's token password
     */
    std::string get_token_password(int oid, int bck_oid);

    /**
     * Update a particular User. This method does not update the user's quotas
     *    @param user pointer to User
     *    @return 0 on success
     */
    int update(PoolObjectSQL * objsql) override;

    /**
     * Update a particular User's Quotas
     *    @param user pointer to User
     *    @return 0 on success
     */
    int update_quotas(User * user);

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
     *   @param group_ids the user groups if authN succeeded, is empty otherwise
     *   @param umask of the user, 0 otherwise
     *
     *   @return false if authn failed, true otherwise
     */
    bool authenticate(const std::string& session,
                      std::string&       password,
                      int&               uid,
                      int&               gid,
                      std::string&       uname,
                      std::string&       gname,
                      std::set<int>&     group_ids,
                      int&               umask);
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
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where,
             int sid, int eid, bool desc) override;

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
     *  Name for the default Sunstone server user
     */
    static const char * SERVER_NAME;

    /**
     *  Name of the oneadmin user
     */
    static std::string oneadmin_name;

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

    CachePool<SessionToken> cache;

    SessionToken * get_session_token(int oid)
    {
        return cache.get_resource(oid);
    }

    void delete_session_token(int oid)
    {
        cache.delete_resource(oid);
    }

    /**
     *  Function to authenticate internal (known) users
     */
    bool authenticate_internal(std::unique_ptr<User> user,
                               const std::string& token,
                               std::string&       password,
                               int&               user_id,
                               int&               group_id,
                               std::string&       uname,
                               std::string&       gname,
                               std::set<int>&     group_ids,
                               int&               umask);

    /**
     *  Function to authenticate internal users using a server driver
     */
    bool authenticate_server(std::unique_ptr<User> user,
                             const std::string& token,
                             std::string&       password,
                             int&               user_id,
                             int&               group_id,
                             std::string&       uname,
                             std::string&       gname,
                             std::set<int>&     group_ids,
                             int&               umask);


    /**
     *  Function to authenticate external (not known) users
     */
    bool authenticate_external(const std::string& username,
                               const std::string& token,
                               std::string&       password,
                               int&               user_id,
                               int&               group_id,
                               std::string&       uname,
                               std::string&       gname,
                               std::set<int>&     group_ids,
                               int&               umask);
    /**
     *  Factory method to produce User objects
     *    @return a pointer to the new User
     */
    PoolObjectSQL * create() override
    {
        return new User(-1, -1, "", "", "", UserPool::CORE_AUTH, true);
    };
};

#endif /*USER_POOL_H_*/

