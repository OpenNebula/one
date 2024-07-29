/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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
#include "AclManager.h"
#include "AclRule.h"

using namespace std;

const int    Vdc::ALL_RESOURCES = -10;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Vdc::Vdc(int id, unique_ptr<Template> vdc_template):
    PoolObjectSQL(id, VDC, "", -1, -1, "", "", one_db::vdc_table),
    clusters(PoolObjectSQL::CLUSTER),
    hosts(PoolObjectSQL::HOST),
    datastores(PoolObjectSQL::DATASTORE),
    vnets(PoolObjectSQL::NET)

{
    if (vdc_template)
    {
        obj_template = move(vdc_template);
    }
    else
    {
        obj_template = make_unique<Template>();
    }
}

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
    set_user(0, "");
    set_group(0, "");

    // Update the vdc

    sql_name = db->escape_str(name);

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body));

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
        oss << "UPDATE " << one_db::vdc_table << " SET "
            << "name = '"    <<   sql_name   << "', "
            << "body = '"    <<   sql_xml    << "', "
            << "uid = "      <<   uid        << ", "
            << "gid = "      <<   gid        << ", "
            << "owner_u = "  <<   owner_u    << ", "
            << "group_u = "  <<   group_u    << ", "
            << "other_u = "  <<   other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::vdc_table
            << " (" << one_db::vdc_db_names << ") VALUES ("
            <<          oid                 << ","
            << "'" <<   sql_name            << "',"
            << "'" <<   sql_xml             << "',"
            <<          uid                 << ","
            <<          gid                 << ","
            <<          owner_u             << ","
            <<          group_u             << ","
            <<          other_u             << ")";
    }

    rc = db->exec_wr(oss);

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
int Vdc::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::vdc_db_bootstrap);

    return db->exec_local_wr(oss);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Vdc::drop(SqlDB * db)
{
    int rc;

    rc = PoolObjectSQL::drop(db);

    if ( rc == 0 )
    {
        for (auto gid : groups)
        {
            clusters.del_group_rules(gid);

            hosts.del_group_rules(gid);

            datastores.del_group_rules(gid);

            vnets.del_group_rules(gid);
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

    oss <<
        "<VDC>"    <<
        "<ID>"   << oid  << "</ID>"   <<
        "<NAME>" << name << "</NAME>" <<
        "<GROUPS>";

    for (auto gid : groups)
    {
        oss << "<ID>" << gid << "</ID>";
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
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/VDC/ID",   -1);
    rc += xpath(name, "/VDC/NAME", "not_found");

    // Get associated classes
    ObjectXML::get_nodes("/VDC/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    // Set of Groups
    ObjectXML::get_nodes("/VDC/GROUPS/ID", content);

    for (auto node : content)
    {
        ObjectXML tmp_xml(node);

        int group_id;

        rc += tmp_xml.xpath(group_id, "/ID", -1);

        groups.insert(group_id);
    }

    ObjectXML::free_nodes(content);

    // Set of Clusters
    ObjectXML::get_nodes("/VDC/CLUSTERS/CLUSTER", content);

    rc += clusters.from_xml_node(content);

    ObjectXML::free_nodes(content);

    // Set of Hosts
    ObjectXML::get_nodes("/VDC/HOSTS/HOST", content);

    rc += hosts.from_xml_node(content);

    ObjectXML::free_nodes(content);

    // Set of Datastores
    ObjectXML::get_nodes("/VDC/DATASTORES/DATASTORE", content);

    rc += datastores.from_xml_node(content);

    ObjectXML::free_nodes(content);

    // Set of VNets
    ObjectXML::get_nodes("/VDC/VNETS/VNET", content);

    rc += vnets.from_xml_node(content);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    // Set oneadmin as the owner and group it belongs to
    set_user(0, "");
    set_group(0, "");

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::add_group(int group_id, string& error_msg)
{
    auto ret = groups.insert(group_id);

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

void ResourceSet::insert_default_rules(const string& name_attr, PoolObjectSQL::ObjectType type)
{
    string default_vdc_acl;
    vector<string> vdc_acl;
    long long op = AuthRequest::NONE;
    AuthRequest::Operation user_op;

    Nebula::instance().get_configuration_attribute(name_attr, default_vdc_acl);

    vdc_acl = one_util::split(default_vdc_acl, '+', true);

    for (const auto& str : vdc_acl)
    {
        user_op = AuthRequest::str_to_operation(str);
        if ( str != "" && str != "-" && user_op != AuthRequest::NONE )
        {
            op = op | user_op;
        }
    }
    if ( op != AuthRequest::NONE )
    {
        rules.insert(make_pair( type, op ));
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

ResourceSet::ResourceSet(PoolObjectSQL::ObjectType _type):type(_type)
{
    vector<string> cluster_res = { "HOST", "NET", "DATASTORE" };
    string name_attr= "";

    switch(type)
    {
        // @<gid> HOST/#<hid> MANAGE #<zid>
        case PoolObjectSQL::HOST:
        case PoolObjectSQL::NET:
        case PoolObjectSQL::DATASTORE:
            xml_name = ResourceSet::type_to_vdc_str(type);
            name_attr = "DEFAULT_VDC_" + xml_name + "_ACL";

            insert_default_rules(name_attr, type);

            break;
        // @<gid> HOST/%<cid> MANAGE #<zid>
        // @<gid> DATASTORE+NET/%<cid> USE #<zid>
        case PoolObjectSQL::CLUSTER:

            for (const auto& cluster : cluster_res)
            {
                name_attr = "DEFAULT_VDC_CLUSTER_" + cluster + "_ACL";

                insert_default_rules(name_attr, PoolObjectSQL::str_to_type(cluster));
            }

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
    for (auto it = resources.begin(); it != resources.end(); it++)
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
    int rc = 0;

    int zone_id, id;

    string zone_path     = "/" + xml_name + "/ZONE_ID";
    string resource_path = "/" + xml_name + "/" + xml_name + "_ID";

    for (auto node : content)
    {
        ObjectXML tmp_xml(node);

        rc += tmp_xml.xpath(zone_id, zone_path.c_str(), -1);
        rc += tmp_xml.xpath(id, resource_path.c_str(), -1);

        resources.insert(pair<int, int>(zone_id, id));
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ResourceSet::add(const set<int>& groups, int zone_id, int id,
                     string& error_msg)
{
    auto ret = resources.insert(pair<int, int>(zone_id, id));

    if( !ret.second )
    {
        ostringstream oss;

        oss << PoolObjectSQL::type_to_str(type) << " " << id << " from Zone "
            << zone_id << " is already assigned to the VDC";
        error_msg = oss.str();

        return -1;
    }

    for (auto group : groups)
    {
        add_rule(group, zone_id, id);
    }

    // When using the 'all' resource id, clear the other previous IDs
    if (id == Vdc::ALL_RESOURCES)
    {
        string error_aux;

        vector<int>           del_ids;

        for (auto res_it = resources.begin(); res_it != resources.end(); res_it++)
        {
            if(res_it->first == zone_id && res_it->second != Vdc::ALL_RESOURCES)
            {
                del_ids.push_back(res_it->second);
            }
        }

        for (auto del_id : del_ids)
        {
            this->del(groups, zone_id, del_id, error_aux);
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int ResourceSet::del(const set<int>& groups, int zone_id, int id,
                     string& error_msg)
{
    if( resources.erase(pair<int, int>(zone_id, id)) != 1 )
    {
        ostringstream oss;

        oss << PoolObjectSQL::type_to_str(type) << " " << id << " from Zone "
            << zone_id << " is not assigned to the VDC ";
        error_msg = oss.str();

        return -1;
    }

    for (auto group : groups)
    {
        del_rule(group, zone_id, id);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::add_group_rules(int group_id)
{
    for (auto it = resources.begin(); it != resources.end(); it++)
    {
        add_rule(group_id, it->first, it->second);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::del_group_rules(int group_id)
{
    for (auto it = resources.begin(); it != resources.end(); it++)
    {
        del_rule(group_id, it->first, it->second);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void ResourceSet::add_rule(int group_id, int zone_id, int id)
{
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

    for (auto it = rules.begin(); it != rules.end(); it++)
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

    for (auto it = rules.begin(); it != rules.end(); it++)
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
