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

#include "AclManager.h"
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * AclManager::table = "acl";

const char * AclManager::db_names = "user, resource, rights";

const char * AclManager::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "acl (user BIGINT, resource BIGINT, rights BIGINT)";

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

    for ( it = acl_rules.begin(); it != acl_rules.end(); it++ )
    {
        delete it->second;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const bool AclManager::authorize(int uid, const set<int> &user_groups,
        AuthRequest::Object obj_type, int obj_id, int obj_gid,
        AuthRequest::Operation op)
{
    ostringstream oss;

    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    bool auth = false;

    // Build masks for request
    long long user_req;
    long long resource_oid_req  = obj_type + AclRule::INDIVIDUAL_ID + obj_id;
    long long resource_gid_req  = obj_type + AclRule::GROUP_ID + obj_gid;
    long long resource_all_req  = obj_type + AclRule::ALL_ID;
    long long rights_req        = op;

    long long individual_obj_type =
            ( obj_type | AclRule::INDIVIDUAL_ID | 0xFFFFFFFF );

    long long group_obj_type =
            ( obj_type | AclRule::GROUP_ID | 0xFFFFFFFF );



    AclRule request_rule(AclRule::INDIVIDUAL_ID + uid, resource_oid_req, rights_req);
    oss << "Request " << request_rule.to_str();
    NebulaLog::log("ACL",Log::DEBUG,oss);


    // Look for rules that apply to everyone

    user_req = AclRule::ALL_ID;
    auth = match_rules(user_req, resource_oid_req, resource_gid_req,
            resource_all_req, rights_req, individual_obj_type, group_obj_type);

    if ( auth == true )
    {
        return true;
    }

    // Look for rules that apply to the individual user id
    user_req = AclRule::INDIVIDUAL_ID + uid;

    auth = match_rules(user_req, resource_oid_req, resource_gid_req,
            resource_all_req, rights_req, individual_obj_type, group_obj_type);

    if ( auth == true )
    {
        return true;
    }


    // Look for rules that apply to each one of the user's groups

    set<int>::iterator  g_it;

    for (g_it = user_groups.begin(); g_it != user_groups.end(); g_it++)
    {
        user_req = AclRule::GROUP_ID + *g_it;

        auth = match_rules(user_req, resource_oid_req, resource_gid_req,
                resource_all_req, rights_req, individual_obj_type,
                group_obj_type);

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
        long long individual_obj_type,
        long long group_obj_type)

{
    bool auth;
    ostringstream oss;

    multimap<long long, AclRule *>::iterator        it;

    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

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
            ( it->second->resource == resource_all_req )
            ||
            // Or rule's object type and group object ID match
            ( ( it->second->resource & group_obj_type ) == resource_gid_req )
            ||
            // Or rule's object type and individual object ID match
            ( ( it->second->resource & individual_obj_type ) == resource_oid_req )
          );

        if ( auth == true )
        {
            oss.str("Permission granted");
            NebulaLog::log("ACL",Log::DEBUG,oss);

            return true;
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::add_rule(long long user, long long resource, long long rights,
                        string& error_str)
{
    AclRule * rule = new AclRule(user, resource, rights);

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
        if ( it->second->resource == resource &&
             it->second->rights == rights )
        {
            found = true;
        }
    }

    if ( found )
    {
        oss << "Rule " << rule->to_str() << " already exists";
        error_str = oss.str();

        delete rule;
        return -1;
    }

    if ( rule->malformed(error_str) )
    {
        oss << "Rule " << rule->to_str() << " is malformed: " << error_str;
        error_str = oss.str();

        delete rule;
        return -2;
    }


    rc = insert(rule);

    if ( rc != 0 )
    {
        error_str = "Error inserting rule in DB";
        return -1;
    }

    acl_rules.insert( make_pair(rule->user, rule) );

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::del_rule(long long user, long long resource, long long rights,
                        string& error_str)
{
    multimap<long long, AclRule *>::iterator        it;
    pair<multimap<long long, AclRule *>::iterator,
         multimap<long long, AclRule *>::iterator>  index;

    int rc;
    bool found = false;

    index = acl_rules.equal_range( user );

    it = index.first;
    while ( !found && it != index.second )
    {
        found = ( it->second->resource == resource &&
                  it->second->rights == rights );

        if ( !found )
        {
            it++;
        }
    }

    if ( !found )
    {
        AclRule rule(user, resource, rights);

        ostringstream oss;
        oss << "Rule " << rule.to_str() << " does not exist";
        error_str = oss.str();

        return -1;
    }

    rc = drop( it->second );

    if ( rc != 0 )
    {
        error_str = "SQL DB error";
        return -1;
    }

    delete it->second;
    acl_rules.erase( it );

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::select_cb(void *nil, int num, char **values, char **names)
{
    if ( (num != 3)   ||
         (!values[0]) ||
         (!values[1]) ||
         (!values[2]) )
    {
        return -1;
    }

    ostringstream oss;
    istringstream iss;

    long long rule_values[3];

    for ( int i = 0; i < 3; i++ )
    {
        iss.str( values[i] );

        iss >> rule_values[i];

        if ( iss.fail() == true )
        {
            return -1;
        }

        iss.clear();
    }

    // TODO: Use add_rule() instead, to check possible errors, or assume
    // that anything that was stored into the DB is trustworthy?
    AclRule * rule = new AclRule(rule_values[0], rule_values[1], rule_values[2]);


    oss << "Loading ACL Rule " << rule->to_str();
    NebulaLog::log("ACL",Log::DEBUG,oss);

    acl_rules.insert( make_pair(rule->user, rule) );

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

int AclManager::insert(AclRule * rule)
{
    ostringstream   oss;
    int             rc;

    // Construct the SQL statement to Insert

    oss <<  "INSERT INTO "  << table <<" ("<< db_names <<") VALUES ("
        <<  rule->user      << ","
        <<  rule->resource  << ","
        <<  rule->rights    << ")";

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::drop(AclRule * rule)
{
    ostringstream   oss;
    int             rc;

    oss << "DELETE FROM " << table << " WHERE "
        << "user=" << rule->user << "AND"
        << "resource=" << rule->resource << "AND"
        << "rights=" << rule->rights;

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::dump(ostringstream& oss)
{
    multimap<long long, AclRule *>::iterator        it;
    string xml;

    oss << "<ACL>";

    for ( it = acl_rules.begin() ; it != acl_rules.end(); it++ )
    {
        oss << it->second->to_xml(xml);
    }

    oss << "</ACL>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
