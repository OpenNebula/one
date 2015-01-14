/* ------------------------------------------------------------------------ */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs      */
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
    string          template_xml;

    set<pair<int,int> >::const_iterator it;

    ObjectCollection::to_xml(collection_xml);

    oss <<
    "<GROUP>"    <<
        "<ID>"   << oid  << "</ID>"        <<
        "<NAME>" << name << "</NAME>"      <<
        obj_template->to_xml(template_xml) <<
        collection_xml;

    for (it = providers.begin(); it != providers.end(); it++)
    {
        oss <<
        "<RESOURCE_PROVIDER>" <<
            "<ZONE_ID>"     << it->first    << "</ZONE_ID>"     <<
            "<CLUSTER_ID>"  << it->second   << "</CLUSTER_ID>"  <<
        "</RESOURCE_PROVIDER>";
    }

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

    rc += ObjectCollection::from_xml_node(content[0]);

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

    // Set of resource providers
    ObjectXML::get_nodes("/GROUP/RESOURCE_PROVIDER", content);

    for (it = content.begin(); it != content.end(); it++)
    {
        ObjectXML tmp_xml(*it);

        int zone_id, cluster_id;

        rc += tmp_xml.xpath(zone_id, "/RESOURCE_PROVIDER/ZONE_ID", -1);
        rc += tmp_xml.xpath(cluster_id, "/RESOURCE_PROVIDER/CLUSTER_ID", -1);

        providers.insert(pair<int,int>(zone_id, cluster_id));
    }

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

int Group::add_resource_provider(int zone_id, int cluster_id, string& error_msg)
{
    AclManager* aclm = Nebula::instance().get_aclm();

    int rc = 0;
    long long mask_prefix;

    pair<set<pair<int, int> >::iterator,bool> ret;

    ret = providers.insert(pair<int,int>(zone_id, cluster_id));

    if( !ret.second )
    {
        error_msg = "Resource provider is already assigned to this group";
        return -1;
    }

    if (cluster_id == ClusterPool::ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::CLUSTER_ID | cluster_id;
    }

    // @<gid> HOST/%<cid> MANAGE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            oid,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }

    // @<gid> DATASTORE+NET/%<cid> USE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            oid,

            mask_prefix |
            PoolObjectSQL::DATASTORE |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Group::del_resource_provider(int zone_id, int cluster_id, string& error_msg)
{
    AclManager* aclm = Nebula::instance().get_aclm();

    int rc = 0;

    long long mask_prefix;

    if( providers.erase(pair<int,int>(zone_id, cluster_id)) != 1 )
    {
        error_msg = "Resource provider is not assigned to this group";
        return -1;
    }

    if (cluster_id == ClusterPool::ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::CLUSTER_ID | cluster_id;
    }

    // @<gid> HOST/%<cid> MANAGE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            oid,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }

    // @<gid> DATASTORE+NET/%<cid> USE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            oid,

            mask_prefix |
            PoolObjectSQL::DATASTORE |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("GROUP",Log::ERROR,error_msg);
    }

    return 0;
}

