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

bool AclManager::authorize(int uid, const set<int> &user_groups,
        AuthRequest::Object obj_type, int obj_id, int obj_gid,
        AuthRequest::Operation op)
{
    ostringstream oss;

    bool auth = false;

    // Build masks for request
    long long user_req          = AclRule::INDIVIDUAL_ID + uid;
    long long resource_oid_req  = obj_type + AclRule::INDIVIDUAL_ID + obj_id;
    long long resource_gid_req  = obj_type + AclRule::INDIVIDUAL_ID + obj_gid;
    long long rights_req        = op;

    long long individual_obj_type =
            ( obj_type | AclRule::INDIVIDUAL_ID | 0xFFFFFFFF );

    long long group_obj_type =
            ( obj_type | AclRule::GROUP_ID | 0xFFFFFFFF );

    AclRule request_rule(user_req, resource_oid_req, rights_req);
    oss << "Request " << request_rule.to_str();
    NebulaLog::log("ACL",Log::DEBUG,oss);


    set<AclRule>::iterator rule;

    for ( rule = acl_set.begin() ; rule != acl_set.end(); rule++ )
    {
        oss.str("");
        oss << "> Rule  " << rule->to_str();
        NebulaLog::log("ACL",Log::DEBUG,oss);

        // TODO: This only works for individual uid

        auth =
            // This rule applies to this individual user ID
            ( rule->user == user_req )
            &&
            (
                // Rule's object type and individual object ID match
                ( ( rule->resource & individual_obj_type ) == resource_oid_req )
                ||
                // Or rule's object type and group object ID match
                ( ( rule->resource & group_obj_type ) == resource_gid_req )
            )
            &&
            ( ( rule->rights & rights_req ) == rights_req );

        if ( auth == true )
        {
            oss.str("Permission granted");
            NebulaLog::log("ACL",Log::DEBUG,oss);

            return true;
        }
    }

    oss.str("No more rules, permission not granted ");
    NebulaLog::log("ACL",Log::DEBUG,oss);

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclManager::dump(ostringstream& oss)
{
    set<AclRule>::iterator rule;
    string xml;

    oss << "<ACL>";

    for ( rule = acl_set.begin() ; rule != acl_set.end(); rule++ )
    {
        oss << rule->to_xml(xml);
    }

    oss << "</ACL>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
