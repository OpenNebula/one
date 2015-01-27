/* ------------------------------------------------------------------------ */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs      */
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

#include "Vdc.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */

const int    Vdc::ALL_RESOURCES = -10;

const char * Vdc::table = "vdc_pool";

const char * Vdc::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Vdc::db_bootstrap = "CREATE TABLE IF NOT EXISTS vdc_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Vdc::Vdc(int id, Template* vdc_template):
        PoolObjectSQL(id, VDC, "", -1, -1, "", "", table)
{
    if (vdc_template != 0)
    {
        obj_template = vdc_template;
    }
    else
    {
        obj_template = new Template;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Vdc::~Vdc()
{
    delete obj_template;
};

/* ************************************************************************ */
/* Vdc :: Database Access Functions                                         */
/* ************************************************************************ */

int Vdc::insert(SqlDB *db, string& error_str)
{
    int    rc;

    ostringstream oss;

    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);

    if ( name.empty() )
    {
        oss << "vdc-" << oid;
        name = oss.str();
    }

    // ------------------------------------------------------------------------
    // Insert the Vdc
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Vdc::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set oneadmin as the owner and group it belongs to
    set_user(0,"");
    set_group(0,"");

    // Update the vdc

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

    error_str = "Error transforming the VDC to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting VDC in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Vdc::drop(SqlDB * db)
{
    set<int>::const_iterator it;
    int rc;

    rc = PoolObjectSQL::drop(db);

    if ( rc == 0 )
    {
        for (it = groups.begin(); it != groups.end(); it++)
        {
            del_group_rules(*it);
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Vdc::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;

    set<pair<int,int> >::const_iterator it;
    set<int>::const_iterator group_it;

    oss <<
    "<VDC>"    <<
        "<ID>"   << oid  << "</ID>"   <<
        "<NAME>" << name << "</NAME>" <<
        "<GROUPS>";

    for (group_it = groups.begin(); group_it != groups.end(); group_it++)
    {
        oss << "<ID>" << *group_it << "</ID>";
    }

    oss << "</GROUPS>";

    oss << "<CLUSTERS>";

    for (it = clusters.begin(); it != clusters.end(); it++)
    {
        oss <<
            "<CLUSTER>" <<
                "<ZONE_ID>"     << it->first    << "</ZONE_ID>"     <<
                "<CLUSTER_ID>"  << it->second   << "</CLUSTER_ID>"  <<
            "</CLUSTER>";
    }

    oss << "</CLUSTERS>";

    oss << "<HOSTS>";

    for (it = hosts.begin(); it != hosts.end(); it++)
    {
        oss <<
            "<HOST>" <<
                "<ZONE_ID>"     << it->first    << "</ZONE_ID>"     <<
                "<HOST_ID>"     << it->second   << "</HOST_ID>"     <<
            "</HOST>";
    }

    oss << "</HOSTS>";

    oss << "<DATASTORES>";

    for (it = datastores.begin(); it != datastores.end(); it++)
    {
        oss <<
            "<DATASTORE>" <<
                "<ZONE_ID>"     << it->first    << "</ZONE_ID>"     <<
                "<DATASTORE_ID>"<< it->second   << "</DATASTORE_ID>"<<
            "</DATASTORE>";
    }

    oss << "</DATASTORES>";

    oss << "<VNETS>";

    for (it = vnets.begin(); it != vnets.end(); it++)
    {
        oss <<
            "<VNET>" <<
                "<ZONE_ID>"     << it->first    << "</ZONE_ID>"     <<
                "<VNET_ID>"     << it->second   << "</VNET_ID>"     <<
            "</VNET>";
    }

    oss << "</VNETS>";

    oss <<
        obj_template->to_xml(template_xml) <<
    "</VDC>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    vector<xmlNodePtr>::iterator it;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/VDC/ID",   -1);
    rc += xpath(name,"/VDC/NAME", "not_found");

    // Get associated classes
    ObjectXML::get_nodes("/VDC/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of Groups
    ObjectXML::get_nodes("/VDC/GROUPS/ID", content);

    for (it = content.begin(); it != content.end(); it++)
    {
        ObjectXML tmp_xml(*it);

        int group_id;

        rc += tmp_xml.xpath(group_id, "/ID", -1);

        groups.insert(group_id);
    }

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of Clusters
    ObjectXML::get_nodes("/VDC/CLUSTERS/CLUSTER", content);

    for (it = content.begin(); it != content.end(); it++)
    {
        ObjectXML tmp_xml(*it);

        int zone_id, cluster_id;

        rc += tmp_xml.xpath(zone_id, "/CLUSTER/ZONE_ID", -1);
        rc += tmp_xml.xpath(cluster_id, "/CLUSTER/CLUSTER_ID", -1);

        clusters.insert(pair<int,int>(zone_id, cluster_id));
    }

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of Hosts
    ObjectXML::get_nodes("/VDC/HOSTS/HOST", content);

    for (it = content.begin(); it != content.end(); it++)
    {
        ObjectXML tmp_xml(*it);

        int zone_id, host_id;

        rc += tmp_xml.xpath(zone_id, "/HOST/ZONE_ID", -1);
        rc += tmp_xml.xpath(host_id, "/HOST/HOST_ID", -1);

        hosts.insert(pair<int,int>(zone_id, host_id));
    }

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of Datastores
    ObjectXML::get_nodes("/VDC/DATASTORES/DATASTORE", content);

    for (it = content.begin(); it != content.end(); it++)
    {
        ObjectXML tmp_xml(*it);

        int zone_id, datastore_id;

        rc += tmp_xml.xpath(zone_id, "/DATASTORE/ZONE_ID", -1);
        rc += tmp_xml.xpath(datastore_id, "/DATASTORE/DATASTORE_ID", -1);

        datastores.insert(pair<int,int>(zone_id, datastore_id));
    }

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of VNets
    ObjectXML::get_nodes("/VDC/VNETS/VNET", content);

    for (it = content.begin(); it != content.end(); it++)
    {
        ObjectXML tmp_xml(*it);

        int zone_id, vnet_id;

        rc += tmp_xml.xpath(zone_id, "/VNET/ZONE_ID", -1);
        rc += tmp_xml.xpath(vnet_id, "/VNET/VNET_ID", -1);

        vnets.insert(pair<int,int>(zone_id, vnet_id));
    }

    ObjectXML::free_nodes(content);
    content.clear();

    if (rc != 0)
    {
        return -1;
    }

    // Set oneadmin as the owner and group it belongs to
    set_user(0,"");
    set_group(0,"");

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::add_group(int group_id, string& error_msg)
{
    pair<set<int>::iterator,bool> ret;

    ret = groups.insert(group_id);

    if( !ret.second )
    {
        ostringstream oss;
        oss << "Group " << group_id << " is already assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    add_group_rules(group_id);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::del_group(int group_id, string& error_msg)
{
    if( groups.erase(group_id) != 1 )
    {
        ostringstream oss;
        oss << "Group " << group_id << " is not assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    del_group_rules(group_id);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::add_cluster(int zone_id, int cluster_id, string& error_msg)
{
    set<int>::const_iterator it;

    pair<set<pair<int, int> >::iterator,bool> ret;

    ret = clusters.insert(pair<int,int>(zone_id, cluster_id));

    if( !ret.second )
    {
        ostringstream oss;
        oss << "Cluster " << cluster_id << " from Zone " << zone_id
            << " is already assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        add_cluster_rules(*it, zone_id, cluster_id);
    }

    // When using the 'all' resource id, clear the other previous IDs
    if (cluster_id == ALL_RESOURCES)
    {
        string                  error_aux;
        vector<int>             del_ids;
        vector<int>::iterator   del_it;
        set<pair<int, int> >::iterator res_it;

        for (res_it = clusters.begin(); res_it != clusters.end(); res_it++)
        {
            if(res_it->first == zone_id && res_it->second != ALL_RESOURCES)
            {
                del_ids.push_back(res_it->second);
            }
        }

        for (del_it = del_ids.begin(); del_it != del_ids.end(); del_it++)
        {
            del_cluster(zone_id, *del_it, error_aux);
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::del_cluster(int zone_id, int cluster_id, string& error_msg)
{
    set<int>::const_iterator it;

    if( clusters.erase(pair<int,int>(zone_id, cluster_id)) != 1 )
    {
        ostringstream oss;
        oss << "Cluster " << cluster_id << " from Zone " << zone_id
            << " is not assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        del_cluster_rules(*it, zone_id, cluster_id);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::add_host(int zone_id, int host_id, string& error_msg)
{
    set<int>::const_iterator it;

    pair<set<pair<int, int> >::iterator,bool> ret;

    ret = hosts.insert(pair<int,int>(zone_id, host_id));

    if( !ret.second )
    {
        ostringstream oss;
        oss << "Host " << host_id << " from Zone " << zone_id
            << " is already assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        add_host_rules(*it, zone_id, host_id);
    }

    // When using the 'all' resource id, clear the other previous IDs
    if (host_id == ALL_RESOURCES)
    {
        string                  error_aux;
        vector<int>             del_ids;
        vector<int>::iterator   del_it;
        set<pair<int, int> >::iterator res_it;

        for (res_it = hosts.begin(); res_it != hosts.end(); res_it++)
        {
            if(res_it->first == zone_id && res_it->second != ALL_RESOURCES)
            {
                del_ids.push_back(res_it->second);
            }
        }

        for (del_it = del_ids.begin(); del_it != del_ids.end(); del_it++)
        {
            del_host(zone_id, *del_it, error_aux);
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::del_host(int zone_id, int host_id, string& error_msg)
{
    set<int>::const_iterator it;

    if( hosts.erase(pair<int,int>(zone_id, host_id)) != 1 )
    {
        ostringstream oss;
        oss << "Host " << host_id << " from Zone " << zone_id
            << " is not assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        del_host_rules(*it, zone_id, host_id);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::add_datastore(int zone_id, int datastore_id, string& error_msg)
{
    set<int>::const_iterator it;

    pair<set<pair<int, int> >::iterator,bool> ret;

    ret = datastores.insert(pair<int,int>(zone_id, datastore_id));

    if( !ret.second )
    {
        ostringstream oss;
        oss << "Datastore " << datastore_id << " from Zone " << zone_id
            << " is already assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        add_datastore_rules(*it, zone_id, datastore_id);
    }

    // When using the 'all' resource id, clear the other previous IDs
    if (datastore_id == ALL_RESOURCES)
    {
        string                  error_aux;
        vector<int>             del_ids;
        vector<int>::iterator   del_it;
        set<pair<int, int> >::iterator res_it;

        for (res_it = datastores.begin(); res_it != datastores.end(); res_it++)
        {
            if(res_it->first == zone_id && res_it->second != ALL_RESOURCES)
            {
                del_ids.push_back(res_it->second);
            }
        }

        for (del_it = del_ids.begin(); del_it != del_ids.end(); del_it++)
        {
            del_datastore(zone_id, *del_it, error_aux);
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::del_datastore(int zone_id, int datastore_id, string& error_msg)
{
    set<int>::const_iterator it;

    if( datastores.erase(pair<int,int>(zone_id, datastore_id)) != 1 )
    {
        ostringstream oss;
        oss << "Datastore " << datastore_id << " from Zone " << zone_id
            << " is not assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        del_datastore_rules(*it, zone_id, datastore_id);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::add_vnet(int zone_id, int vnet_id, string& error_msg)
{
    set<int>::const_iterator it;

    pair<set<pair<int, int> >::iterator,bool> ret;

    ret = vnets.insert(pair<int,int>(zone_id, vnet_id));

    if( !ret.second )
    {
        ostringstream oss;
        oss << "Network " << vnet_id << " from Zone " << zone_id
            << " is already assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        add_vnet_rules(*it, zone_id, vnet_id);
    }

    // When using the 'all' resource id, clear the other previous IDs
    if (vnet_id == ALL_RESOURCES)
    {
        string                  error_aux;
        vector<int>             del_ids;
        vector<int>::iterator   del_it;
        set<pair<int, int> >::iterator res_it;

        for (res_it = vnets.begin(); res_it != vnets.end(); res_it++)
        {
            if(res_it->first == zone_id && res_it->second != ALL_RESOURCES)
            {
                del_ids.push_back(res_it->second);
            }
        }

        for (del_it = del_ids.begin(); del_it != del_ids.end(); del_it++)
        {
            del_vnet(zone_id, *del_it, error_aux);
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::del_vnet(int zone_id, int vnet_id, string& error_msg)
{
    set<int>::const_iterator it;

    if( vnets.erase(pair<int,int>(zone_id, vnet_id)) != 1 )
    {
        ostringstream oss;
        oss << "Network " << vnet_id << " from Zone " << zone_id
            << " is not assigned to the VDC " << oid;
        error_msg = oss.str();
        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        del_vnet_rules(*it, zone_id, vnet_id);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::add_group_rules(int group_id)
{
    set<pair<int,int> >::const_iterator it;

    for (it = clusters.begin(); it != clusters.end(); it++)
    {
        add_cluster_rules(group_id, it->first, it->second);
    }

    for (it = hosts.begin(); it != hosts.end(); it++)
    {
        add_host_rules(group_id, it->first, it->second);
    }

    for (it = datastores.begin(); it != datastores.end(); it++)
    {
        add_datastore_rules(group_id, it->first, it->second);
    }

    for (it = vnets.begin(); it != vnets.end(); it++)
    {
        add_vnet_rules(group_id, it->first, it->second);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::del_group_rules(int group_id)
{
    set<pair<int,int> >::const_iterator it;

    for (it = clusters.begin(); it != clusters.end(); it++)
    {
        del_cluster_rules(group_id, it->first, it->second);
    }

    for (it = hosts.begin(); it != hosts.end(); it++)
    {
        del_host_rules(group_id, it->first, it->second);
    }

    for (it = datastores.begin(); it != datastores.end(); it++)
    {
        del_datastore_rules(group_id, it->first, it->second);
    }

    for (it = vnets.begin(); it != vnets.end(); it++)
    {
        del_vnet_rules(group_id, it->first, it->second);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::add_cluster_rules(int group_id, int zone_id, int cluster_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (cluster_id == ALL_RESOURCES)
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
            group_id,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }

    // @<gid> DATASTORE+NET/%<cid> USE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::DATASTORE |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::del_cluster_rules(int group_id, int zone_id, int cluster_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (cluster_id == ALL_RESOURCES)
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
            group_id,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }

    // @<gid> DATASTORE+NET/%<cid> USE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::DATASTORE |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::add_host_rules(int group_id, int zone_id, int host_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (host_id == ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | host_id;
    }

    // @<gid> HOST/#<hid> MANAGE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::del_host_rules(int group_id, int zone_id, int host_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (host_id == ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | host_id;
    }

    // @<gid> HOST/#<hid> MANAGE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::add_datastore_rules(int group_id, int zone_id, int ds_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (ds_id == ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | ds_id;
    }

    // @<gid> DATASTORE/#<dsid> USE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::DATASTORE,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::del_datastore_rules(int group_id, int zone_id, int ds_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (ds_id == ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | ds_id;
    }

    // @<gid> DATASTORE/#<dsid> USE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::DATASTORE,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::add_vnet_rules(int group_id, int zone_id, int vnet_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (vnet_id == ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | vnet_id;
    }

    // @<gid> DATASTORE/#<dsid> USE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Vdc::del_vnet_rules(int group_id, int zone_id, int vnet_id)
{
    int rc = 0;
    string error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (vnet_id == ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | vnet_id;
    }

    // @<gid> DATASTORE/#<dsid> USE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc < 0)
    {
        NebulaLog::log("VDC",Log::ERROR,error_msg);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
