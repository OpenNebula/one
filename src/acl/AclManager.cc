/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#include <climits>

#include "AclManager.h"
#include "PoolObjectAuth.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * AclManager::table = "acl";

const char * AclManager::db_names = "oid, user, resource, rights, zone";

const char * AclManager::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "acl (oid INT PRIMARY KEY, user BIGINT, resource BIGINT, "
    "rights BIGINT, zone BIGINT, UNIQUE(user, resource, rights, zone))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int get_lastOID(SqlDB * db)
{
    ostringstream oss;

    int _last_oid = -1;

    single_cb<int> cb;

    cb.set_callback(&_last_oid);

    oss << "SELECT last_oid FROM pool_control WHERE tablename='acl'";

    db->exec_rd(oss, &cb);

    cb.unset_callback();

    return _last_oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void set_lastOID(SqlDB * db, int lastOID)
{
    ostringstream oss;

    oss << "REPLACE INTO pool_control (tablename, last_oid) VALUES ('acl',"
        << lastOID << ")";

    db->exec_wr(oss);
}

/* -------------------------------------------------------------------------- */

AclManager::AclManager(
    SqlDB * _db,
    int     _zone_id,
    bool    _is_federation_slave,
    time_t  _timer_period)
        :zone_id(_zone_id), db(_db), is_federation_slave(_is_federation_slave),
        timer_period(_timer_period)
{
    int lastOID;

    pthread_mutex_init(&mutex, 0);

    am.addListener(this);

    //Federation slaves do not need to init the pool
    if (is_federation_slave)
    {
        return;
    }

    lastOID = get_lastOID(db);

    if (lastOID == -1)
    {
        // Add a default rules for the ACL engine
        string error_str;

        // Users in group USERS can create standard resources
        // @1 VM+IMAGE+TEMPLATE+DOCUMENT+SECGROUP+VMGROUP/* CREATE *
        add_rule(AclRule::GROUP_ID |
                    1,
                 AclRule::ALL_ID |
                    PoolObjectSQL::VM |
                    PoolObjectSQL::IMAGE |
                    PoolObjectSQL::TEMPLATE |
                    PoolObjectSQL::DOCUMENT |
                    PoolObjectSQL::SECGROUP |
                    PoolObjectSQL::VMGROUP,
                 AuthRequest::CREATE,
                 AclRule::ALL_ID,
                 error_str);

        // * ZONE/* USE *
        add_rule(AclRule::ALL_ID,
                 AclRule::ALL_ID |
                    PoolObjectSQL::ZONE,
                 AuthRequest::USE,
                 AclRule::ALL_ID,
                 error_str);

        // * MARKETPLACE+MARKETPLACEAPP/* USE *
        add_rule(AclRule::ALL_ID,
                 AclRule::ALL_ID |
                    PoolObjectSQL::MARKETPLACE |
                    PoolObjectSQL::MARKETPLACEAPP,
                 AuthRequest::USE,
                 AclRule::ALL_ID,
                 error_str);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * acl_action_loop(void *arg)
{
    AclManager * aclm;

    if ( arg == 0 )
    {
        return 0;
    }

    NebulaLog::log("ACL",Log::INFO,"ACL Manager started.");

    aclm = static_cast<AclManager *>(arg);

    aclm->am.loop(aclm->timer_period);

    NebulaLog::log("ACL",Log::INFO,"ACL Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::start()
{
    int rc;

    NebulaLog::log("ACL",Log::INFO,"Starting ACL Manager...");

    rc = select();

    if (is_federation_slave)
    {
        pthread_attr_t    pattr;

        pthread_attr_init (&pattr);
        pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

        rc += pthread_create(&acl_thread,&pattr,acl_action_loop,(void *) this);
    }
    else
    {
        NebulaLog::log("ACL",Log::INFO,"ACL Manager started.");
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::finalize()
{
    if (is_federation_slave)
    {
        am.finalize();
    }
    else
    {
        NebulaLog::log("ACL",Log::INFO,"ACL Manager stopped.");
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

AclManager::~AclManager()
{
    multimap<long long, AclRule *>::iterator  it;

    lock();

    for ( it = acl_rules.begin(); it != acl_rules.end(); it++ )
    {
        delete it->second;
    }

    unlock();

    pthread_mutex_destroy(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const bool AclManager::authorize(
        int                     uid,
        const set<int>&         user_groups,
        const PoolObjectAuth&   obj_perms,
        AuthRequest::Operation  op)
{
    bool auth = false;

    // Build masks for request
    long long user_req;
    long long resource_oid_req;

    if (static_cast<long long int>(op) & 0x10LL) //No lockable object
    {
        op = static_cast<AuthRequest::Operation>(op & 0x0FLL);
    }
    else if (obj_perms.locked > 0 && obj_perms.locked <= static_cast<long long int>(op))
    {
        return false;
    }

    if ( obj_perms.oid >= 0 )
    {
        resource_oid_req = obj_perms.obj_type |
                           AclRule::INDIVIDUAL_ID |
                           obj_perms.oid;
    }
    else
    {
        resource_oid_req = AclRule::NONE_ID;
    }

    long long resource_gid_req;

    if ((obj_perms.gid >= 0) && (!obj_perms.disable_group_acl))
    {
        resource_gid_req = obj_perms.obj_type |
                           AclRule::GROUP_ID |
                           obj_perms.gid;
    }
    else
    {
        resource_gid_req = AclRule::NONE_ID;
    }

    set<long long> resource_cid_req;

    if (!obj_perms.disable_cluster_acl)
    {
        set<int>::iterator i;

        for(i = obj_perms.cids.begin(); i != obj_perms.cids.end(); i++)
        {
            resource_cid_req.insert(    obj_perms.obj_type |
                                        AclRule::CLUSTER_ID |
                                        *i
                                    );
        }
    }

    long long resource_all_req ;

    if (!obj_perms.disable_all_acl)
    {
        resource_all_req = obj_perms.obj_type | AclRule::ALL_ID;
    }
    else
    {
        resource_all_req = AclRule::NONE_ID;
    }

    long long rights_req        = op;

    long long resource_oid_mask = obj_perms.obj_type |
                                  AclRule::INDIVIDUAL_ID |
                                  0x00000000FFFFFFFFLL;

    long long resource_gid_mask = obj_perms.obj_type |
                                  AclRule::GROUP_ID |
                                  0x00000000FFFFFFFFLL;

    long long resource_cid_mask = obj_perms.obj_type |
                                  AclRule::CLUSTER_ID |
                                  0x00000000FFFFFFFFLL;

    if (NebulaLog::log_level() >= Log::DDEBUG)
    {
        ostringstream oss;

        // Create a temporal rule, to log the request
        long long log_resource;

        if ( obj_perms.oid >= 0 )
        {
            log_resource = resource_oid_req;
        }
        else if ( obj_perms.gid >= 0 )
        {
            log_resource = resource_gid_req;
        }
        else
        {
            log_resource = resource_all_req;
        }

        AclRule log_rule(-1,
                         AclRule::INDIVIDUAL_ID | uid,
                         log_resource,
                         rights_req,
                         AclRule::INDIVIDUAL_ID | zone_id);

        oss << "Request " << log_rule.to_str();
        NebulaLog::log("ACL",Log::DDEBUG,oss);
    }

    // -------------------------------------------------------------------------
    // Create temporary rules from the object permissions
    // -------------------------------------------------------------------------

    AclRule owner_rule;
    AclRule group_rule;
    AclRule other_rule;
    multimap<long long, AclRule *> tmp_rules;

    obj_perms.get_acl_rules(owner_rule, group_rule, other_rule, zone_id);

    tmp_rules.insert( make_pair(owner_rule.user, &owner_rule) );
    tmp_rules.insert( make_pair(group_rule.user, &group_rule) );
    tmp_rules.insert( make_pair(other_rule.user, &other_rule) );

    // -------------------------------------------------------------------------
    // Look for rules that apply to everyone
    // -------------------------------------------------------------------------

    user_req = AclRule::ALL_ID;
    auth     = match_rules_wrapper(user_req,
                                   resource_oid_req,
                                   resource_gid_req,
                                   resource_cid_req,
                                   resource_all_req,
                                   rights_req,
                                   resource_oid_mask,
                                   resource_gid_mask,
                                   resource_cid_mask,
                                   tmp_rules);
    if ( auth == true )
    {
        return true;
    }

    // -------------------------------------------------------------------------
    // Look for rules that apply to the individual user id
    // -------------------------------------------------------------------------

    user_req = AclRule::INDIVIDUAL_ID | uid;
    auth     = match_rules_wrapper(user_req,
                                   resource_oid_req,
                                   resource_gid_req,
                                   resource_cid_req,
                                   resource_all_req,
                                   rights_req,
                                   resource_oid_mask,
                                   resource_gid_mask,
                                   resource_cid_mask,
                                   tmp_rules);
    if ( auth == true )
    {
        return true;
    }

    // ----------------------------------------------------------
    // Look for rules that apply to each one of the user's groups
    // ----------------------------------------------------------

    set<int>::iterator  g_it;

    for (g_it = user_groups.begin(); g_it != user_groups.end(); g_it++)
    {
        user_req = AclRule::GROUP_ID | *g_it;
        auth     = match_rules_wrapper(user_req,
                                       resource_oid_req,
                                       resource_gid_req,
                                       resource_cid_req,
                                       resource_all_req,
                                       rights_req,
                                       resource_oid_mask,
                                       resource_gid_mask,
                                       resource_cid_mask,
                                       tmp_rules);
        if ( auth == true )
        {
            return true;
        }
    }

    NebulaLog::log("ACL",Log::DDEBUG,"No more rules, permission not granted ");

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool AclManager::match_rules_wrapper(
        long long             user_req,
        long long             resource_oid_req,
        long long             resource_gid_req,
        const set<long long>& resource_cid_req,
        long long             resource_all_req,
        long long             rights_req,
        long long             individual_obj_type,
        long long             group_obj_type,
        long long             cluster_obj_type,
        const multimap<long long, AclRule*> &tmp_rules)
{
    bool auth = false;

    // Match against the tmp rules
    auth = match_rules(
            user_req,
            resource_oid_req,
            resource_gid_req,
            resource_cid_req,
            resource_all_req,
            rights_req,
            individual_obj_type,
            group_obj_type,
            cluster_obj_type,
            tmp_rules);

    if ( auth == true )
    {
        return true;
    }

    // Match against the internal rules
    lock();

    auth = match_rules(
            user_req,
            resource_oid_req,
            resource_gid_req,
            resource_cid_req,
            resource_all_req,
            rights_req,
            individual_obj_type,
            group_obj_type,
            cluster_obj_type,
            acl_rules);

    unlock();

    return auth;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static bool match_cluster_req(
        const set<long long> &resource_cid_req,
        long long resource_cid_mask,
        long long rule_resource)
{
    set<long long>::iterator i;

    for(i = resource_cid_req.begin(); i != resource_cid_req.end(); i++)
    {
        // rule's object type and cluster object ID match
        if ( ( rule_resource & resource_cid_mask ) == *i )
        {
            return true;
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */

bool AclManager::match_rules(
        long long             user_req,
        long long             resource_oid_req,
        long long             resource_gid_req,
        const set<long long>& resource_cid_req,
        long long             resource_all_req,
        long long             rights_req,
        long long             resource_oid_mask,
        long long             resource_gid_mask,
        long long             resource_cid_mask,
        const multimap<long long, AclRule*> &rules)

{
    bool auth = false;
    ostringstream oss;

    multimap<long long, AclRule *>::const_iterator        it;

    pair<multimap<long long, AclRule *>::const_iterator,
         multimap<long long, AclRule *>::const_iterator>  index;

    long long zone_oid_mask = AclRule::INDIVIDUAL_ID | 0x00000000FFFFFFFFLL;
    long long zone_req      = AclRule::INDIVIDUAL_ID | zone_id;
    long long zone_all_req  = AclRule::ALL_ID;

    index = rules.equal_range( user_req );

    for ( it = index.first; it != index.second; it++)
    {
        if (NebulaLog::log_level() >= Log::DDEBUG)
        {
            oss.str("");
            oss << "> Rule  " << it->second->to_str();
            NebulaLog::log("ACL",Log::DDEBUG,oss);
        }

        auth =
          (
            // Rule applies in any Zone
            ( ( it->second->zone & zone_all_req ) == zone_all_req )
            ||
            // Rule applies in this Zone
            ( ( it->second->zone & zone_oid_mask ) == zone_req )
          )
          &&
          // Rule grants the requested rights
          ( ( it->second->rights & rights_req ) == rights_req )
          &&
          (
            // Rule grants permission for all objects of this type
            ( ( it->second->resource & resource_all_req ) == resource_all_req )
            ||
            // Or rule's object type and group object ID match
            ( ( it->second->resource & resource_gid_mask ) == resource_gid_req )
            ||
            // Or rule's object type and individual object ID match
            ( ( it->second->resource & resource_oid_mask ) == resource_oid_req )
            ||
            // Or rule's object type and one of the cluster object ID match
            match_cluster_req(resource_cid_req, resource_cid_mask,
                it->second->resource)
          );

        if ( auth == true )
        {
            NebulaLog::log("ACL",Log::DDEBUG,"Permission granted");

            break;
        }
    }

    return auth;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::add_rule(long long user, long long resource, long long rights,
                        long long zone, string& error_str)
{
    if (is_federation_slave)
    {
        NebulaLog::log("ONE",Log::ERROR,
                "AclManager::add_rule called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    lock();

    int lastOID = get_lastOID(db);

    if (lastOID == INT_MAX)
    {
        lastOID = -1;
    }

    AclRule * rule = new AclRule(++lastOID, user, resource, rights, zone);

    ostringstream   oss;
    int             rc;

    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    bool found = false;

    index = acl_rules.equal_range( user );

    for ( it = index.first; (it != index.second && !found); it++)
    {
        found = *(it->second) == *rule;
    }

    if ( found )
    {
        goto error_duplicated;
    }

    if ( rule->malformed(error_str) )
    {
        goto error_malformed;
    }

    rc = insert(rule);

    if ( rc != 0 )
    {
        goto error_insert;
    }

    acl_rules.insert( make_pair(rule->user, rule) );
    acl_rules_oids.insert( make_pair(rule->oid, rule) );

    set_lastOID(db, lastOID);

    unlock();

    return lastOID;


error_duplicated:
    oss << "Rule " << rule->to_str() << " already exists";
    rc = -1;

    goto error_common;

error_malformed:
    oss << "Rule " << rule->to_str() << " is malformed: " << error_str;
    rc = -2;

    goto error_common;

error_insert:
    oss << "Error inserting rule in DB";
    rc = -3;

    goto error_common;

error_common:
    error_str = oss.str();

    delete rule;

    unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


int AclManager::del_rule(int oid, string& error_str)
{

    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    AclRule *   rule;
    int         rc;
    bool        found = false;

    if (is_federation_slave)
    {
        NebulaLog::log("ONE",Log::ERROR,
                "AclManager::del_rule called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    lock();

    // Check the rule exists
    found = acl_rules_oids.count(oid) > 0;

    if ( !found )
    {
        ostringstream oss;
        oss << "Rule " << oid << " does not exist";
        error_str = oss.str();

        unlock();
        return -1;
    }

    rule = acl_rules_oids[oid];

    // Look for it in the multimap

    found = false;

    index = acl_rules.equal_range( rule->user );

    it = index.first;
    while ( !found && it != index.second )
    {
        found = *rule == *(it->second);

        if ( !found )
        {
            it++;
        }
    }

    if ( !found )
    {
        ostringstream oss;
        oss << "Internal error: ACL Rule " << oid
            << " indexed by oid, but not in by user attribute";

        NebulaLog::log("ACL",Log::ERROR,oss);

        unlock();
        return -1;
    }


    rc = drop( oid );

    if ( rc != 0 )
    {
        error_str = "SQL DB error";

        unlock();
        return -1;
    }

    rule = it->second;

    acl_rules.erase( it );
    acl_rules_oids.erase( oid );

    delete rule;

    unlock();
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::del_rule(
        long long user,
        long long resource,
        long long rights,
        long long zone,
        string&   error_str)
{
    lock();

    AclRule * rule = new AclRule(-1, user, resource, rights, zone);

    int oid = -1;
    bool found = false;

    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    index = acl_rules.equal_range( user );

    for ( it = index.first; (it != index.second && !found); it++)
    {
        found = *(it->second) == *rule;

        if (found)
        {
            oid = it->second->get_oid();
        }
    }

    unlock();

    if (oid != -1)
    {
        return del_rule(oid, error_str);
    }
    else
    {
        error_str = "Rule does not exist";
        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_uid_rules(int uid)
{
    long long user_req = AclRule::INDIVIDUAL_ID | uid;

    // Delete rules that match
    // #uid  __/__  __
    del_user_matching_rules(user_req);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_gid_rules(int gid)
{
    long long request = AclRule::GROUP_ID | gid;
    long long resource_gid_mask = AclRule::GROUP_ID |
                                  0x00000000FFFFFFFFLL;

    // Delete rules that match
    // @gid  __/__  __
    del_user_matching_rules(request);

    // __  __/@gid  __
    del_resource_matching_rules(request, resource_gid_mask);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_cid_rules(int cid)
{
    long long request = AclRule::CLUSTER_ID | cid;
    long long resource_gid_mask = AclRule::CLUSTER_ID |
                                  0x00000000FFFFFFFFLL;

    // Delete rules that match
    // __  __/%cid  __
    del_resource_matching_rules(request, resource_gid_mask);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_zid_rules(int zid)
{
    long long request = AclRule::INDIVIDUAL_ID | zid;

    // Delete rules that match
    // __  __/__  __ #zid
    del_zone_matching_rules(request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_resource_rules(int oid, PoolObjectSQL::ObjectType obj_type)
{
    long long request = obj_type |
                        AclRule::INDIVIDUAL_ID |
                        oid;

    long long mask = 0xFFFFFFFFFFFFFFFFLL;

    // Delete rules that are an exact match, i.e. for oid=7 and obj_type=IMAGE,
    // this rule applies, but can't be deleted:
    // __ IMAGE+TEMPLATE/#7 __
    del_resource_matching_rules(request, mask);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_user_matching_rules(long long user_req)
{
    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    vector<int>             oids;
    vector<int>::iterator   oid_it;
    string                  error_str;

    lock();

    index = acl_rules.equal_range( user_req );

    for ( it = index.first; it != index.second; it++)
    {
        oids.push_back(it->second->oid);
    }

    unlock();

    for ( oid_it = oids.begin() ; oid_it < oids.end(); oid_it++ )
    {
        del_rule(*oid_it, error_str);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_resource_matching_rules(long long resource_req,
                                             long long resource_mask)
{
    multimap<long long, AclRule *>::iterator        it;

    vector<int>             oids;
    vector<int>::iterator   oid_it;
    string                  error_str;

    lock();

    for ( it = acl_rules.begin(); it != acl_rules.end(); it++ )
    {
        if ( ( it->second->resource & resource_mask ) == resource_req )
        {
            oids.push_back(it->second->oid);
        }
    }

    unlock();

    for ( oid_it = oids.begin() ; oid_it < oids.end(); oid_it++ )
    {
        del_rule(*oid_it, error_str);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::del_zone_matching_rules(long long zone_req)
{
    multimap<long long, AclRule *>::iterator        it;

    vector<int>             oids;
    vector<int>::iterator   oid_it;
    string                  error_str;

    lock();

    for ( it = acl_rules.begin(); it != acl_rules.end(); it++ )
    {
        if ( it->second->zone == zone_req )
        {
            oids.push_back(it->second->oid);
        }
    }

    unlock();

    for ( oid_it = oids.begin() ; oid_it < oids.end(); oid_it++ )
    {
        del_rule(*oid_it, error_str);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::reverse_search(int                       uid,
                                const set<int>&           user_groups,
                                PoolObjectSQL::ObjectType obj_type,
                                AuthRequest::Operation    op,
                                bool                      disable_all_acl,
                                bool                      disable_cluster_acl,
                                bool                      disable_group_acl,
                                bool&                     all,
                                vector<int>&              oids,
                                vector<int>&              gids,
                                vector<int>&              cids)
{
    ostringstream oss;

    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    // Build masks for request
    long long resource_oid_req = obj_type | AclRule::INDIVIDUAL_ID;
    long long resource_gid_req = obj_type | AclRule::GROUP_ID;
    long long resource_all_req = obj_type | AclRule::ALL_ID;
    long long resource_cid_req = obj_type | AclRule::CLUSTER_ID;
    long long rights_req       = op;

    long long resource_oid_mask =
            ( obj_type | AclRule::INDIVIDUAL_ID );

    long long resource_gid_mask  =
            ( obj_type | AclRule::GROUP_ID );

    long long resource_cid_mask  =
            ( obj_type | AclRule::CLUSTER_ID );

    long long zone_oid_req =
            AclRule::INDIVIDUAL_ID | zone_id;

    long long zone_all_req = AclRule::ALL_ID;

    if (NebulaLog::log_level() >= Log::DDEBUG)
    {
        // Create a temporal rule, to log the request
        long long log_resource;

        log_resource = resource_all_req;

        AclRule log_rule(-1,
                         AclRule::INDIVIDUAL_ID | uid,
                         log_resource,
                         rights_req,
                         zone_oid_req);

        oss << "Reverse search request " << log_rule.to_str();
        NebulaLog::log("ACL",Log::DDEBUG,oss);
    }

    // ---------------------------------------------------
    // Look for the rules that match
    // ---------------------------------------------------

    vector<long long>           user_reqs;
    vector<long long>::iterator reqs_it;

    set<int>::iterator  g_it;

    // rules that apply to everyone
    user_reqs.push_back(AclRule::ALL_ID);

    // rules that apply to the individual user id
    user_reqs.push_back(AclRule::INDIVIDUAL_ID | uid);

    // rules that apply to each one of the user's groups
    for (g_it = user_groups.begin(); g_it != user_groups.end(); g_it++)
    {
        user_reqs.push_back(AclRule::GROUP_ID | *g_it);
    }

    all = false;

    for (reqs_it = user_reqs.begin(); reqs_it != user_reqs.end(); reqs_it++)
    {
        lock();

        index = acl_rules.equal_range( *reqs_it );

        for ( it = index.first; it != index.second; it++)
        {
                // Rule grants the requested rights
            if ( ( ( it->second->rights & rights_req ) == rights_req )
                 &&
                 // Rule applies in this zone or in all zones
                 ( ( it->second->zone == zone_oid_req )
                   ||
                   ( it->second->zone == zone_all_req )
                 )
               )
            {
                if (NebulaLog::log_level() >= Log::DDEBUG)
                {
                    oss.str("");
                    oss << "> Rule  " << it->second->to_str();
                    NebulaLog::log("ACL",Log::DDEBUG,oss);
                }

                // Rule grants permission for all objects of this type
                if ((!disable_all_acl) &&
                    ((it->second->resource & resource_all_req) == resource_all_req))
                {
                    all = true;
                    break;
                }
                // Rule grants permission for all objects of a group
                else if ((!disable_group_acl) &&
                         ((it->second->resource & resource_gid_mask) == resource_gid_req))
                {
                    gids.push_back(it->second->resource_id());
                }
                // Rule grants permission for all objects of a cluster
                else if ((!disable_cluster_acl) &&
                         ((it->second->resource & resource_cid_mask) == resource_cid_req))
                {
                    cids.push_back(it->second->resource_id());
                }
                // Rule grants permission for an individual object
                else if ((it->second->resource & resource_oid_mask) == resource_oid_req)
                {
                    oids.push_back(it->second->resource_id());
                }
            }
        }

        unlock();

        if ( all == true )
        {
            oids.clear();
            gids.clear();
            cids.clear();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::bootstrap(SqlDB * _db)
{
    ostringstream oss(db_bootstrap);

    return _db->exec_local_wr(oss);
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::select_cb(void *nil, int num, char **values, char **names)
{
    if ( (num != 5)   ||
         (!values[0]) ||
         (!values[1]) ||
         (!values[2]) ||
         (!values[3]) ||
         (!values[4]) )
    {
        return -1;
    }

    istringstream iss;

    int oid = atoi(values[0]);

    long long rule_values[4];

    for ( int i = 0; i < 4; i++ )
    {
        iss.str( values[i+1] );

        iss >> rule_values[i];

        if ( iss.fail() == true )
        {
            return -1;
        }

        iss.clear();
    }

    AclRule * rule = new AclRule(oid,
                                 rule_values[0],
                                 rule_values[1],
                                 rule_values[2],
                                 rule_values[3]);

    if (NebulaLog::log_level() >= Log::DDEBUG)
    {
        ostringstream oss;

        oss << "Loading ACL Rule " << rule->to_str();
        NebulaLog::log("ACL",Log::DDEBUG,oss);
    }

    acl_rules.insert( make_pair(rule->user, rule) );
    acl_rules_oids.insert( make_pair(rule->oid, rule) );

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::select()
{
    multimap<long long, AclRule *>::iterator  it;

    ostringstream   oss;
    int             rc;

    oss << "SELECT " << db_names << " FROM " << table;

    set_callback(static_cast<Callbackable::Callback>(&AclManager::select_cb));

    lock();

    for ( it = acl_rules.begin(); it != acl_rules.end(); it++ )
    {
        delete it->second;
    }

    acl_rules.clear();
    acl_rules_oids.clear();

    rc = db->exec_rd(oss,this);

    unlock();

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::insert(AclRule * rule, SqlDB * db)
{
    ostringstream   oss;
    int             rc;

    // Construct the SQL statement to Insert

    oss <<  "INSERT INTO "  << table <<" ("<< db_names <<") VALUES ("
        <<  rule->oid       << ","
        <<  rule->user      << ","
        <<  rule->resource  << ","
        <<  rule->rights    << ","
        <<  rule->zone      << ")";

    rc = db->exec_wr(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


int AclManager::drop(int oid)
{
    ostringstream   oss;
    int             rc;

    oss << "DELETE FROM " << table << " WHERE "
        << "oid=" << oid;

    rc = db->exec_wr(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::dump(ostringstream& oss)
{
    map<int, AclRule *>::iterator        it;
    string xml;

    lock();

    oss << "<ACL_POOL>";

    for ( it = acl_rules_oids.begin() ; it != acl_rules_oids.end(); it++ )
    {
        oss << it->second->to_xml(xml);
    }

    oss << "</ACL_POOL>";

    unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

