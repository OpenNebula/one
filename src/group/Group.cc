/* ------------------------------------------------------------------------ */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>

#include "Group.h"
#include "Nebula.h"

const char * Group::table = "group_pool";

const char * Group::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Group::db_bootstrap = "CREATE TABLE IF NOT EXISTS group_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

/* ************************************************************************ */
/* Group :: Database Access Functions                                       */
/* ************************************************************************ */

int Group::select(SqlDB * db)
{
    int rc;

    rc = PoolObjectSQL::select(db);

    if ( rc != 0 )
    {
        return rc;
    }

    return quota.select(oid, db);
}

/* -------------------------------------------------------------------------- */

int Group::select(SqlDB * db, const string& name, int uid)
{
    int rc;

    rc = PoolObjectSQL::select(db,name,uid);

    if ( rc != 0 )
    {
        return rc;
    }

    return quota.select(oid, db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Group::drop(SqlDB * db)
{
    int rc;

    rc = PoolObjectSQL::drop(db);

    if ( rc == 0 )
    {
        rc += quota.drop(db);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Group::insert(SqlDB *db, string& error_str)
{
    int rc;

    rc = insert_replace(db, false, error_str);

    if (rc == 0)
    {
        rc = quota.insert(oid, db, error_str);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Group::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set oneadmin as the owner
    set_user(0,"");

    // Set the Group ID as the group it belongs to
    set_group(oid, name);

    // Update the Group

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if ( replace )
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<<table <<" ("<< db_names <<") VALUES ("
        <<          oid                 << ","
        << "'" <<   sql_name            << "',"
        << "'" <<   sql_xml             << "',"
        <<          uid                 << ","
        <<          gid                 << ","
        <<          owner_u             << ","
        <<          group_u             << ","
        <<          other_u             << ")";


    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Group to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Group in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& Group::to_xml(string& xml) const
{
    return to_xml_extended(xml, false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Group::to_xml_extended(string& xml) const
{
    return to_xml_extended(xml, true);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Group::to_xml_extended(string& xml, bool extended) const
{
    ostringstream   oss;
    string          collection_xml;
    string          admins_xml;
    string          template_xml;

    oss <<
    "<GROUP>"    <<
        "<ID>"   << oid  << "</ID>"        <<
        "<NAME>" << name << "</NAME>"      <<
        obj_template->to_xml(template_xml) <<
        users.to_xml(collection_xml) <<
        admins.to_xml(admins_xml);

    if (extended)
    {
        string quota_xml;
        string def_quota_xml;

        oss << quota.to_xml(quota_xml)
            << Nebula::instance().get_default_group_quota().to_xml(def_quota_xml);
    }

    oss << "</GROUP>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Group::from_xml(const string& xml)
{
    int rc = 0;
    vector<xmlNodePtr> content;
    vector<xmlNodePtr>::iterator it;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/GROUP/ID",   -1);
    rc += xpath(name,"/GROUP/NAME", "not_found");

    // Set oneadmin as the owner
    set_user(0,"");

    // Set the Group ID as the group it belongs to
    set_group(oid, name);

    // Set of IDs
    ObjectXML::get_nodes("/GROUP/USERS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += users.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of Admin IDs
    ObjectXML::get_nodes("/GROUP/ADMINS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += admins.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Get associated metadata for the group
    ObjectXML::get_nodes("/GROUP/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Group::add_admin(int user_id, string& error_msg)
{
    int rc;
    ostringstream oss;

    if ( users.contains(user_id) == false )
    {
        oss << "User " << user_id << " is not part of Group "
            << oid << ".";

        error_msg = oss.str();

        return -1;
    }

    rc = admins.add(user_id);

    if (rc == -1)
    {
        oss << "User " << user_id << " is already an administrator of Group "
            << oid << ".";

        error_msg = oss.str();

        return -1;
    }

    add_admin_rules(user_id);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Group::add_admin_rules(int user_id)
{
    int     rc;
    string  error_msg;

    AclManager* aclm = Nebula::instance().get_aclm();

    // #<uid> USER/@<gid> USE+MANAGE+ADMIN+CREATE *
    rc = aclm->add_rule(
            AclRule::INDIVIDUAL_ID |
            user_id,

            PoolObjectSQL::USER |
            AclRule::GROUP_ID |
            oid,

            AuthRequest::USE |
            AuthRequest::MANAGE |
            AuthRequest::ADMIN |
            AuthRequest::CREATE,

            AclRule::ALL_ID,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }

    // #<uid> VM+NET+IMAGE+TEMPLATE+DOCUMENT+SECGROUP+VROUTER/@<gid> USE+MANAGE *
    rc = aclm->add_rule(
            AclRule::INDIVIDUAL_ID |
            user_id,

            PoolObjectSQL::VM |
            PoolObjectSQL::NET |
            PoolObjectSQL::IMAGE |
            PoolObjectSQL::TEMPLATE |
            PoolObjectSQL::DOCUMENT |
            PoolObjectSQL::SECGROUP |
            PoolObjectSQL::VROUTER |
            AclRule::GROUP_ID |
            oid,

            AuthRequest::USE |
            AuthRequest::MANAGE,

            AclRule::ALL_ID,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Group::del_admin(int user_id, string& error_msg)
{
    int rc = admins.del(user_id);

    if (rc == -1)
    {
        ostringstream oss;
        oss << "User " << user_id << " is not an administrator of Group "
            << oid << ".";

        error_msg = oss.str();

        return -1;
    }

    del_admin_rules(user_id);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Group::del_admin_rules(int user_id)
{
    int     rc;
    string  error_msg;

    AclManager* aclm = Nebula::instance().get_aclm();

    // #<uid> USER/@<gid> USE+MANAGE+ADMIN+CREATE *
    rc = aclm->del_rule(
            AclRule::INDIVIDUAL_ID |
            user_id,

            PoolObjectSQL::USER |
            AclRule::GROUP_ID |
            oid,

            AuthRequest::USE |
            AuthRequest::MANAGE |
            AuthRequest::ADMIN |
            AuthRequest::CREATE,

            AclRule::ALL_ID,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }

    // #<uid> VM+NET+IMAGE+TEMPLATE+DOCUMENT+SECGROUP+VROUTER/@<gid> USE+MANAGE *
    rc = aclm->del_rule(
            AclRule::INDIVIDUAL_ID |
            user_id,

            PoolObjectSQL::VM |
            PoolObjectSQL::NET |
            PoolObjectSQL::IMAGE |
            PoolObjectSQL::TEMPLATE |
            PoolObjectSQL::DOCUMENT |
            PoolObjectSQL::SECGROUP |
            PoolObjectSQL::VROUTER |
            AclRule::GROUP_ID |
            oid,

            AuthRequest::USE |
            AuthRequest::MANAGE,

            AclRule::ALL_ID,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }
}
