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

#ifndef ACL_MANAGER_H_
#define ACL_MANAGER_H_

#include "Listener.h"
#include "AuthRequest.h"
#include "PoolObjectSQL.h"

class AclRule;
class PoolObjectAuth;
class SqlDB;

/**
 *  This class manages the ACL rules and the authorization engine
 */
class AclManager : public Callbackable
{
public:
    /**
     *  @param _db pointer to the DB
     *  @param zone_id of the Zone
     *  @param is_federation_slave true is this oned is a federation slave. If
     *  it is true, it will reload periodically rules from the DB
     *  @param timer_period period to reload the rules
     */
    AclManager(SqlDB * _db, int zone_id, bool is_federation_slave, time_t timer);

    virtual ~AclManager();

    /**
     *  Loads the ACL rule set from the DB, and starts the refresh loop is
     *  refresh_cache is set
     *    @return 0 on success.
     */
    int start();

    void finalize();

    void join_thread();

    /**
     *  Reload the ACL rules from the DB. This function needs to be used when
     *  a server becomes leader of the zone as the ACL cache maybe out-dated
     */
    void reload_rules()
    {
        select();
    }

    /* ---------------------------------------------------------------------- */
    /* Rule management                                                        */
    /* ---------------------------------------------------------------------- */

    /**
     *  Takes an authorization request and checks if any rule in the ACL
     *  authorizes the operation.
     *
     *    @param uid The user ID requesting to be authorized
     *    @param user_groups Set of group IDs that the user is part of
     *    @param obj_perms The object's permission attributes
     *    @param op The operation to be authorized
     *    @return true if the authorization is granted by any rule
     */
    bool authorize(int                    uid,
                   const std::set<int>&   user_groups,
                   const PoolObjectAuth&  obj_perms,
                   AuthRequest::Operation op) const;

    /**
     *  Takes an authorization request for oneadmin
     *  and checks if the resource is locked
     *
     *    @param obj_perms The object's permission attributes
     *    @param op The operation to be authorized
     *    @return true if the authorization is granted for oneadmin
     */
    bool oneadmin_authorize(const PoolObjectAuth&  obj_perms,
                            AuthRequest::Operation op) const;

    /**
     *  Adds a new rule to the ACL rule set
     *
     *    @param user 64 bit ID and flags
     *    @param resource 64 bit ID and flags
     *    @param rights 64 bit flags
     *    @param zone 64 bit flags
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the rule on success,
     *    -1 if the rule exists,
     *    -2 if the rule is malformed,
     *    -3 if the DB insert failed
     */
    int add_rule(long long user,
                 long long resource,
                 long long rights,
                 long long zone,
                 std::string& error_str);
    /**
     *  Deletes a rule from the ACL rule set
     *
     *    @param oid Rule id
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int del_rule(int oid, std::string& error_str);

    /**
     *  Deletes a new rule from the ACL rule set
     *
     *    @param user 64 bit ID and flags
     *    @param resource 64 bit ID and flags
     *    @param rights 64 bit flags
     *    @param zone 64 bit flags
     *
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int del_rule(long long user,
                 long long resource,
                 long long rights,
                 long long zone,
                 std::string& error_str);

    /**
     * Deletes rules that apply to this user id
     *
     * @param uid The user id
     */
    void del_uid_rules(int uid);

    /**
     * Deletes rules that apply to this group id
     *
     * @param gid The group id
     */
    void del_gid_rules(int gid);

    /**
     * Deletes rules that apply to this cluster id
     *
     * @param cid The cluster id
     */
    void del_cid_rules(int cid);

    /**
     * Deletes rules that apply to this cluster id
     *
     * @param zid The zone id
     */
    void del_zid_rules(int zid);

    /**
     * Deletes all rules that apply to this resource
     *
     * @param oid Id of the deleted object
     * @param obj_type Object type
     */
    void del_resource_rules(int oid, PoolObjectSQL::ObjectType obj_type);

    /**
     * Searches what resources of type obj_type the ACL rules set allows
     * the given user to perform the operation.
     *
     *    @param uid The user ID
     *    @param user_groups Set of group IDs that the user is part of
     *    @param obj_type The object over which the search will be performed
     *    @param op The operation to be searched
     *    @param all True if the user can perform the operation over any object
     *    @param oids Set of object IDs over which the user can operate
     *    @param gids Set of object group IDs over which the user can operate
     *    @param cids Set of object cluster IDs over which the user can operate
     */
    void reverse_search(int                       uid,
                        const std::set<int>&      user_groups,
                        PoolObjectSQL::ObjectType obj_type,
                        AuthRequest::Operation    op,
                        bool                      disable_all_acl,
                        bool                      disable_cluster_acl,
                        bool                      disable_group_acl,
                        bool&                     all,
                        std::vector<int>&         oids,
                        std::vector<int>&         gids,
                        std::vector<int>&         cids);

    /* ---------------------------------------------------------------------- */
    /* DB management                                                          */
    /* ---------------------------------------------------------------------- */
    /**
     *  Bootstraps the database table(s) associated to the ACL Manager
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db);

    /**
     *  Dumps the rule set in XML format.
     *    @param oss The output stream to dump the rule set contents
     *    @return 0 on success
     */
    int dump(std::ostringstream& oss);

protected:
    /**
     *  Constructor for derived ACL managers. Classes derived from this one
     *  will operate in a stand-alone fashion (i.e. no refresh of ACL rules
     *  from DB)
     */
    AclManager(int _zone_id)
        : zone_id(_zone_id)
        , db(0)
        , is_federation_slave(false)
        , timer_period(-1)
    {
    };

    // -------------------------------------------------------------------------
    // ACL rules management
    // -------------------------------------------------------------------------
    /**
     *  ACL rules. Each rule is indexed by its 'user' long long attibute,
     *  several rules can apply to the same user
     */
    std::multimap<long long, AclRule*> acl_rules;

    /**
     *  Rules indexed by oid. Stores the same rules as acl_rules
     */
    std::map<int, AclRule *> acl_rules_oids;

private:

    /**
     *  Gets all rules that apply to the user_req and, if any of them grants
     *  permission, returns true.
     *
     *    @param user_req user/group id and flags
     *    @param resource_oid_req 64 bit request, ob. type and individual oid
     *    @param resource_gid_req 64 bit request, ob. type and group id
     *    @param resource_cid_req 64 bit request, ob. type and cluster id
     *    @param resource_all_req 64 bit request, ob. type and all flag
     *    @param rights_req Requested rights
     *    @param individual_obj_type Mask with ob. type and individual flags
     *    @param group_obj_type Mask with ob. type and group flags
     *    @param cluster_obj_type Mask with ob. type and cluster flags
     *    @param rules ACL rules to match
     *
     *    @return true if any rule grants permission
     */
    bool match_rules(
            long long                   user_req,
            long long                   resource_oid_req,
            long long                   resource_gid_req,
            const std::set<long long>&  resource_cid_req,
            long long                   resource_all_req,
            long long                   rights_req,
            long long                   resource_oid_mask,
            long long                   resource_gid_mask,
            long long                   resource_cid_mask,
            const std::multimap<long long, AclRule*>& rules) const;

    /**
     *  Wrapper for match_rules. It will check if any rules in the temporary
     *  multimap or in the internal one grants permission.
     *
     *    @param user_req user/group id and flags
     *    @param resource_oid_req 64 bit request, ob. type and individual oid
     *    @param resource_gid_req 64 bit request, ob. type and group id
     *    @param resource_cid_req 64 bit request, ob. type and cluster id
     *    @param resource_all_req 64 bit request, ob. type and all flag
     *    @param rights_req Requested rights
     *    @param individual_obj_type Mask with ob. type and individual flags
     *    @param group_obj_type Mask with ob. type and group flags
     *    @param cluster_obj_type Mask with ob. type and cluster flags
     *    @param tmp_rules Temporary map group of ACL rules
     *
     *    @return true if any rule grants permission
     */
    bool match_rules_wrapper(
            long long                   user_req,
            long long                   resource_oid_req,
            long long                   resource_gid_req,
            const std::set<long long>&  resource_cid_req,
            long long                   resource_all_req,
            long long                   rights_req,
            long long                   individual_obj_type,
            long long                   group_obj_type,
            long long                   cluster_obj_type,
            const std::multimap<long long, AclRule*> &tmp_rules) const;
    /**
     * Deletes all rules that match the user mask
     *
     * @param user_req Mask to match
     */
    void del_user_matching_rules(long long user_req);

    /**
     * Deletes all rules that match the resource mask
     *
     *    @param resource_req 64 bit request, ob. type and group id
     *    @param resource_mask Mask with ob. type and group flags
     */
    void del_resource_matching_rules(
            long long resource_req,
            long long resource_mask);

    /**
     * Deletes all rules that match the zone mask
     *
     * @param zone_req Mask to match
     */
    void del_zone_matching_rules(long long zone_req);

    // -------------------------------------------------------------------------
    // Local zone
    // -------------------------------------------------------------------------

    int zone_id;

    // -------------------------------------------------------------------------
    // Mutex synchronization
    // -------------------------------------------------------------------------

    mutable std::mutex acl_mutex;

    // -------------------------------------------------------------------------
    // DataBase implementation variables
    // -------------------------------------------------------------------------
    /**
     *  Pointer to the database.
     */
    SqlDB * db;

    /**
     *  Callback function to unmarshall the ACL rules
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Reads the ACL rule set from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select();

    /**
     *  Inserts the ACL rule in the database.
     *    @param rule to insert
     *    @return 0 on success
     */
    int insert(AclRule * rule)
    {
        return insert(rule, db);
    };

    /**
     *  Inserts the ACL rule in the database.
     *    @param rule to insert
     *    @db db pointer
     *
     *    @return 0 on success
     */
    static int insert(AclRule * rule, SqlDB * db);

    /**
     *  Drops an ACL rule from the database
     *
     *    @param oid Rule id
     *    @return 0 on success
     */
    int drop(int oid);

    // -------------------------------------------------------------------------
    // Refresh loop thread
    // -------------------------------------------------------------------------
    /**
     * Flag to refresh the cache periodically
     */
    bool            is_federation_slave;

    /**
     *  Timer period for the cache refresh loop.
     */
    time_t          timer_period;

    /**
     *  Timer action async execution
     */
    std::unique_ptr<Timer> timer_thread;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void timer_action()
    {
        select();
    };

};

#endif /*ACL_MANAGER_H*/

