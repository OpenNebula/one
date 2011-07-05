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

#include <climits>

#include "AclManager.h"
#include "NebulaLog.h"
#include "GroupPool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * AclManager::table = "acl";

const char * AclManager::db_names = "oid, user, resource, rights";

const char * AclManager::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "acl (oid INT PRIMARY KEY, user BIGINT, resource BIGINT, rights BIGINT)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::init_cb(void *nil, int num, char **values, char **names)
{
    lastOID = -1;

    if ( values[0] != 0 )
    {
        lastOID = atoi(values[0]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

AclManager::AclManager(SqlDB * _db) : db(_db), lastOID(-1)
{
    ostringstream oss;

    pthread_mutex_init(&mutex, 0);

    set_callback(static_cast<Callbackable::Callback> (&AclManager::init_cb));

    oss << "SELECT last_oid FROM pool_control WHERE tablename='" << table
            << "'";

    db->exec(oss, this);

    unset_callback();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::start()
{
    return select();
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
        int                    uid, 
        const set<int>&        user_groups,
        AuthRequest::Object    obj_type, 
        int                    obj_id, 
        int                    obj_gid,
        AuthRequest::Operation op)
{
    ostringstream oss;

    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    bool auth = false;

    // Build masks for request
    long long user_req;
    long long resource_oid_req;

    if ( obj_id >= 0 )
    {
        resource_oid_req  = obj_type | AclRule::INDIVIDUAL_ID | obj_id;
    }
    else
    {
        resource_oid_req = AclRule::NONE_ID;
    }

    long long resource_gid_req;

    if ( obj_gid >= 0 )
    {
        resource_gid_req  = obj_type | AclRule::GROUP_ID | obj_gid;
    }
    else
    {
        resource_gid_req = AclRule::NONE_ID;
    }

    long long resource_all_req = obj_type | AclRule::ALL_ID;
    long long rights_req       = op;

    long long resource_oid_mask =
            ( obj_type | AclRule::INDIVIDUAL_ID | 0x00000000FFFFFFFFLL );

    long long resource_gid_mask  =
            ( obj_type | AclRule::GROUP_ID | 0x00000000FFFFFFFFLL );


    // Create a temporal rule, to log the request
    long long log_resource;

    if ( obj_id >= 0 )
    {
        log_resource = resource_oid_req;
    }
    else if ( obj_gid >= 0 )
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
                     rights_req);

    oss << "Request " << log_rule.to_str();
    NebulaLog::log("ACL",Log::DEBUG,oss);

    // ---------------------------------------------------
    // Look for rules that apply to everyone
    // ---------------------------------------------------

    user_req = AclRule::ALL_ID;
    auth     = match_rules(user_req, 
                           resource_oid_req, 
                           resource_gid_req,
                           resource_all_req, 
                           rights_req, 
                           resource_oid_mask, 
                           resource_gid_mask);
    if ( auth == true )
    {
        return true;
    }

    // ---------------------------------------------------
    // Look for rules that apply to the individual user id
    // ---------------------------------------------------

    user_req = AclRule::INDIVIDUAL_ID | uid;
    auth     = match_rules(user_req, 
                           resource_oid_req, 
                           resource_gid_req,
                           resource_all_req, 
                           rights_req, 
                           resource_oid_mask, 
                           resource_gid_mask);
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

        auth     = match_rules(user_req, 
                               resource_oid_req, 
                               resource_gid_req,
                               resource_all_req, 
                               rights_req, 
                               resource_oid_mask,
                               resource_gid_mask);

        if ( auth == true )
        {
            return true;
        }
    }

    oss.str("No more rules, permission not granted ");
    NebulaLog::log("ACL",Log::DEBUG,oss);

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool AclManager::match_rules(
        long long user_req,
        long long resource_oid_req,
        long long resource_gid_req,
        long long resource_all_req,
        long long rights_req,
        long long resource_oid_mask,
        long long resource_gid_mask)

{
    bool auth = false;
    ostringstream oss;

    multimap<long long, AclRule *>::iterator        it;

    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    lock();

    index = acl_rules.equal_range( user_req );

    for ( it = index.first; it != index.second; it++)
    {
        oss.str("");
        oss << "> Rule  " << it->second->to_str();
        NebulaLog::log("ACL",Log::DEBUG,oss);

        auth =
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
          );

        if ( auth == true )
        {
            oss.str("Permission granted");
            NebulaLog::log("ACL",Log::DEBUG,oss);

            break;
        }
    }

    unlock();

    return auth;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::add_rule(long long user, long long resource, long long rights,
                        string& error_str)
{
    lock();

    if (lastOID == INT_MAX)
    {
        lastOID = -1;
    }

    AclRule * rule = new AclRule(++lastOID, user, resource, rights);

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

    update_lastOID();

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
    lastOID--;

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

    delete it->second;

    acl_rules.erase( it );
    acl_rules_oids.erase( oid );

    unlock();
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::bootstrap(SqlDB * _db)
{
    ostringstream oss(db_bootstrap);

    _db->exec(oss);

    // Add a default rule
    // @1 VM+NET+IMAGE+TEMPLATE/* CREATE+INFO_POOL_MINE
    AclRule default_rule(0, 0x200000001LL, 0x2d400000000LL, 0x41LL);
    insert(&default_rule, _db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclManager::update_lastOID()
{
    // db->escape_str is not used for 'table' since its name can't be set in
    // any way by the user, it is hardcoded.

    ostringstream oss;

    oss << "REPLACE INTO pool_control (tablename, last_oid) VALUES ("
        << "'" <<   table       << "',"
        <<          lastOID     << ")";

    db->exec(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::select_cb(void *nil, int num, char **values, char **names)
{
    if ( (num != 4)   ||
         (!values[0]) ||
         (!values[1]) ||
         (!values[2]) ||
         (!values[3]) )
    {
        return -1;
    }

    ostringstream oss;
    istringstream iss;

    int oid = atoi(values[0]);

    long long rule_values[3];

    for ( int i = 0; i < 3; i++ )
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
                                 rule_values[2]);

    oss << "Loading ACL Rule " << rule->to_str();
    NebulaLog::log("ACL",Log::DDEBUG,oss);

    acl_rules.insert( make_pair(rule->user, rule) );
    acl_rules_oids.insert( make_pair(rule->oid, rule) );

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::select()
{
    ostringstream   oss;
    int             rc;

    oss << "SELECT " << db_names << " FROM " << table;

    set_callback(static_cast<Callbackable::Callback>(&AclManager::select_cb));

    rc = db->exec(oss,this);

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
        <<  rule->rights    << ")";

    rc = db->exec(oss);

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

    rc = db->exec(oss);

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
