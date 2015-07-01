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
        PoolObjectSQL(id, VDC, "", -1, -1, "", "", table),
        clusters(PoolObjectSQL::CLUSTER),
        hosts(PoolObjectSQL::HOST),
        datastores(PoolObjectSQL::DATASTORE),
        vnets(PoolObjectSQL::NET)

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
            clusters.del_group_rules(*it);

            hosts.del_group_rules(*it);

            datastores.del_group_rules(*it);

            vnets.del_group_rules(*it);
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
    clusters.to_xml(oss);
    oss << "</CLUSTERS>";

    oss << "<HOSTS>";
    hosts.to_xml(oss);
    oss << "</HOSTS>";

    oss << "<DATASTORES>";
    datastores.to_xml(oss);
    oss << "</DATASTORES>";

    oss << "<VNETS>";
    vnets.to_xml(oss);
    oss << "</VNETS>";

    oss << obj_template->to_xml(template_xml) <<
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

    rc += clusters.from_xml_node(content);

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of Hosts
    ObjectXML::get_nodes("/VDC/HOSTS/HOST", content);

    rc += hosts.from_xml_node(content);

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of Datastores
    ObjectXML::get_nodes("/VDC/DATASTORES/DATASTORE", content);

    rc += datastores.from_xml_node(content);

    ObjectXML::free_nodes(content);
    content.clear();

    // Set of VNets
    ObjectXML::get_nodes("/VDC/VNETS/VNET", content);

    rc += vnets.from_xml_node(content);

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

    clusters.add_group_rules(group_id);

    hosts.add_group_rules(group_id);

    datastores.add_group_rules(group_id);

    vnets.add_group_rules(group_id);

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

    clusters.del_group_rules(group_id);

    hosts.del_group_rules(group_id);

    datastores.del_group_rules(group_id);

    vnets.del_group_rules(group_id);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

ResourceSet::ResourceSet(PoolObjectSQL::ObjectType _type):type(_type)
{
    switch(type)
    {
        // @<gid> HOST/#<hid> MANAGE #<zid>
        case PoolObjectSQL::HOST:
            rules.insert(make_pair(PoolObjectSQL::HOST, AuthRequest::MANAGE));
            xml_name = "HOST";
        break;

        // @<gid> NET/#<vnetid> USE #<zone>
        case PoolObjectSQL::NET:
            rules.insert(make_pair(PoolObjectSQL::NET, AuthRequest::USE));
            xml_name = "VNET";
        break;

        // @<gid> DATASTORE/#<dsid> USE #<zone>
        case PoolObjectSQL::DATASTORE:
            rules.insert(make_pair(PoolObjectSQL::DATASTORE, AuthRequest::USE));
            xml_name = "DATASTORE";
        break;

        // @<gid> HOST/%<cid> MANAGE #<zid>
        // @<gid> DATASTORE+NET/%<cid> USE #<zid>
        case PoolObjectSQL::CLUSTER:
            rules.insert(make_pair(PoolObjectSQL::HOST, AuthRequest::MANAGE));
            rules.insert(make_pair(PoolObjectSQL::NET|PoolObjectSQL::DATASTORE,
                AuthRequest::USE));
            xml_name = "CLUSTER";
        break;

        default:
        break;
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::to_xml(ostringstream &oss) const
{
    set<pair<int,int> >::const_iterator it;

    for (it = resources.begin(); it != resources.end(); it++)
    {
        oss << "<"<< xml_name<<">" <<
            "<ZONE_ID>" << it->first << "</ZONE_ID>"
            "<"<< xml_name<<"_ID"<<">" << it->second << "</"<<xml_name<<"_ID>"
            << "</"<< xml_name<<">";
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ResourceSet::from_xml_node(vector<xmlNodePtr>& content)
{
    vector<xmlNodePtr>::iterator it;
    int rc = 0;

    int zone_id, id;

    string zone_path     = "/" + xml_name + "/ZONE_ID";
    string resource_path = "/" + xml_name + "/" + xml_name + "_ID";

    for (it = content.begin(); it != content.end(); it++)
    {
        ObjectXML tmp_xml(*it);

        rc += tmp_xml.xpath(zone_id, zone_path.c_str(), -1);
        rc += tmp_xml.xpath(id, resource_path.c_str(), -1);

        resources.insert(pair<int,int>(zone_id, id));
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ResourceSet::add(const set<int>& groups, int zone_id, int id,
    string& error_msg)
{
    set<int>::const_iterator it;

    pair<set<pair<int, int> >::iterator,bool> ret;

    ret = resources.insert(pair<int,int>(zone_id, id));

    if( !ret.second )
    {
        ostringstream oss;

        oss << PoolObjectSQL::type_to_str(type) << " " << id << " from Zone "
            << zone_id << " is already assigned to the VDC";
        error_msg = oss.str();

        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        add_rule(*it, zone_id, id);
    }

    // When using the 'all' resource id, clear the other previous IDs
    if (id == Vdc::ALL_RESOURCES)
    {
        string error_aux;

        vector<int>           del_ids;
        vector<int>::iterator del_it;

        set<pair<int, int> >::iterator res_it;

        for (res_it = resources.begin(); res_it != resources.end(); res_it++)
        {
            if(res_it->first == zone_id && res_it->second != Vdc::ALL_RESOURCES)
            {
                del_ids.push_back(res_it->second);
            }
        }

        for (del_it = del_ids.begin(); del_it != del_ids.end(); del_it++)
        {
            this->del(groups, zone_id, *del_it, error_aux);
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ResourceSet::del(const set<int>& groups, int zone_id, int id,
    string& error_msg)
{
    set<int>::const_iterator it;

    if( resources.erase(pair<int,int>(zone_id, id)) != 1 )
    {
        ostringstream oss;

        oss << PoolObjectSQL::type_to_str(type) << " " << id << " from Zone "
            << zone_id << " is not assigned to the VDC ";
        error_msg = oss.str();

        return -1;
    }

    for (it = groups.begin(); it != groups.end(); it++)
    {
        del_rule(*it, zone_id, id);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::add_group_rules(int group_id)
{
    set<pair<int,int> >::const_iterator it;

    for (it = resources.begin(); it != resources.end(); it++)
    {
        add_rule(group_id, it->first, it->second);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::del_group_rules(int group_id)
{
    set<pair<int,int> >::const_iterator it;

    for (it = resources.begin(); it != resources.end(); it++)
    {
        del_rule(group_id, it->first, it->second);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::add_rule(int group_id, int zone_id, int id)
{
    set<pair<long long, long long> >::const_iterator it;

    string    error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (id == Vdc::ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else if ( type == PoolObjectSQL::CLUSTER )
    {
        mask_prefix = AclRule::CLUSTER_ID | id;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | id;
    }

    for (it = rules.begin(); it != rules.end(); it++)
    {
        long long resource = it->first;
        long long rights   = it->second;

        int rc = aclm->add_rule(
                AclRule::GROUP_ID | group_id,
                mask_prefix | resource,
                rights,
                AclRule::INDIVIDUAL_ID | zone_id,
                error_msg);

        if (rc < 0)
        {
            NebulaLog::log("VDC", Log::ERROR, error_msg);
        }
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::del_rule(int group_id, int zone_id, int id)
{
    set<pair<long long, long long> >::const_iterator it;

    string    error_msg;
    long long mask_prefix;

    AclManager* aclm = Nebula::instance().get_aclm();

    if (id == Vdc::ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else if ( type == PoolObjectSQL::CLUSTER )
    {
        mask_prefix = AclRule::CLUSTER_ID | id;
    }
    else
    {
        mask_prefix = AclRule::INDIVIDUAL_ID | id;
    }

    for (it = rules.begin(); it != rules.end(); it++)
    {
        long long resource = it->first;
        long long rights   = it->second;

        int rc = aclm->del_rule(
                AclRule::GROUP_ID | group_id,
                mask_prefix | resource,
                rights,
                AclRule::INDIVIDUAL_ID | zone_id,
                error_msg);

        if (rc < 0)
        {
            NebulaLog::log("VDC", Log::ERROR, error_msg);
        }
    }
}
