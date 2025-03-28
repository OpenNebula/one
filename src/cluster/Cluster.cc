/* ------------------------------------------------------------------------ */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems              */
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

#include "Cluster.h"
#include "GroupPool.h"
#include "Nebula.h"
#include "OneDB.h"
#include "DatastorePool.h"
#include "PlanPool.h"
#include "HostPool.h"

#include <sstream>

using namespace std;

/* ************************************************************************** */
/* Cluster :: Constructor/Destructor                                          */
/* ************************************************************************** */

Cluster::Cluster(
        int id,
        const string& name,
        std::unique_ptr<ClusterTemplate>  cl_template,
        const VectorAttribute& vnc_conf):
    PoolObjectSQL(id, CLUSTER, name, -1, -1, "", "", one_db::cluster_table),
    hosts("HOSTS"),
    datastores("DATASTORES"),
    vnets("VNETS"),
    vnc_bitmap(vnc_conf, id, one_db::cluster_bitmap_table)
{
    if (cl_template)
    {
        obj_template = std::move(cl_template);
    }
    else
    {
        obj_template = make_unique<ClusterTemplate>();
    }

    add_template_attribute("RESERVED_CPU", "");
    add_template_attribute("RESERVED_MEM", "");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::check_drop(string& error_msg)
{
    ostringstream oss;

    if ( hosts.size() > 0 )
    {
        oss << "Cluster " << oid << " is not empty, it contains "
            << hosts.size() << " hosts.";

        goto error_common;
    }

    if ( datastores.size() > 0 )
    {
        oss << "Cluster " << oid << " is not empty, it contains "
            << datastores.size() << " datastores.";

        goto error_common;
    }

    if ( vnets.size() > 0 )
    {
        oss << "Cluster " << oid << " is not empty, it contains "
            << vnets.size() << " vnets.";

        goto error_common;
    }

    return 0;

error_common:
    error_msg = oss.str();

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::get_default_system_ds(const set<int>& ds_set)
{
    Nebula& nd = Nebula::instance();

    DatastorePool*  dspool = nd.get_dspool();

    for (auto dsid : ds_set)
    {
        if ( auto ds = dspool->get_ro(dsid) )
        {
            if (ds->get_type() == Datastore::SYSTEM_DS)
            {
                return dsid;
            }
        }
    }

    return -1;
}

/* ************************************************************************** */
/* Cluster :: Database Access Functions                                       */
/* ************************************************************************** */


int Cluster::post_update_template(std::string& error, Template *_old_tmpl)
{
    std::vector<VectorAttribute*> one_drs_attrs;

    const auto one_drs_num = obj_template->get("ONE_DRS", one_drs_attrs);

    if (one_drs_num <= 0)
    {
        return 0;
    }

    auto* one_drs = one_drs_attrs.front();

    const auto validate_field = [&](const std::string& field_name, const std::regex& pattern)
    {
        std::string value = one_util::trim(one_drs->vector_value(field_name));

        one_util::tolower(value);

        if (!std::regex_match(value, pattern))
        {
            error = "Error cluster template contains invalid " + field_name ;
            return false;
        }

        if (!value.empty())
        {
            // Store normalized value
            one_drs->replace(field_name, value);
        }

        return true;
    };

    if (!validate_field("POLICY", std::regex("^(pack|balance)$")))
    {
        return -1;
    }

    if (!validate_field("AUTOMATION", std::regex("^(manual|partial|full)$")))
    {
        return -1;
    }

    if (!validate_field("MIGRATION_THRESHOLD", std::regex(R"(^(-1||\d+(\.\d+)?)$)")))
    {
        return -1;
    }

    static std::vector<std::string> numeric_attr = {
        "CPU_USAGE_WEIGHT",
        "CPU_WEIGHT",
        "MEMORY_WEIGHT",
        "NET_WEIGHT",
        "DISK_WEIGHT",
        "PREDICTIVE"
    };

    for (const auto &i : numeric_attr)
    {
        if (!validate_field(i, std::regex(R"(^(\d+(\.\d+)?|)$)")))
        {
            return -1;
        }
    }

    // Check Cluster doesn't contains pinned hosts
    auto hpool = Nebula::instance().get_hpool();
    for (const auto& host_id : hosts.get_collection())
    {
        if (auto host = hpool->get_ro(host_id))
        {
            if (host->is_pinned())
            {
                error = "Error cluster contains pinned host " + std::to_string(host_id);
                return -1;
            }
        }
    }

    return 0;
}

int Cluster::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

    // Update the Cluster

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
        oss << "UPDATE " << one_db::cluster_table << " SET "
            << "name = '"   << sql_name << "', "
            << "body = '"   << sql_xml  << "', "
            << "uid =  "    << uid      << ", "
            << "gid =  "    << gid      << ", "
            << "owner_u = " << owner_u  << ", "
            << "group_u = " << group_u  << ", "
            << "other_u = " << other_u
            << " WHERE oid = " << oid;

    }
    else
    {
        oss << "INSERT INTO " << one_db::cluster_table
            << " (" << one_db::cluster_db_names << ") VALUES ("
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

    error_str = "Error transforming the Cluster to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Cluster in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::bootstrap(SqlDB * db)
{
    int rc;
    ostringstream oss;

    oss.str(one_db::cluster_db_bootstrap);
    rc = db->exec_local_wr(oss);

    oss.str(one_db::cluster_datastore_db_bootstrap);
    rc += db->exec_local_wr(oss);

    oss.str(one_db::cluster_network_db_bootstrap);
    rc += db->exec_local_wr(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::insert(SqlDB *db, std::string& error_str)
{
    int rc;

    rc = insert_replace(db, false, error_str);

    if ( rc != 0 )
    {
        return rc;
    }

    PlanPool * plpool = Nebula::instance().get_planpool();

    Plan plan(oid);

    if (plpool->insert(&plan) != 0)
    {
        return -1;
    }

    return vnc_bitmap.insert(oid, db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Cluster::to_xml(string& xml) const
{
    ostringstream   oss;
    string          host_collection_xml;
    string          ds_collection_xml;
    string          vnet_collection_xml;
    string          template_xml;

    oss <<
        "<CLUSTER>"  <<
        "<ID>"       << oid  << "</ID>"      <<
        "<NAME>"     << name << "</NAME>"    <<
        hosts.to_xml(host_collection_xml)    <<
        datastores.to_xml(ds_collection_xml) <<
        vnets.to_xml(vnet_collection_xml)    <<
        obj_template->to_xml(template_xml)   <<
        plan_xml                             <<
        "</CLUSTER>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& Cluster::template_xml(std::string& xml) const
{
    ostringstream oss;

    obj_template->each_attribute([&oss](const Attribute * a){
        a->to_xml(oss);
    });

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Cluster::from_xml(const string& xml)
{
    int rc = 0;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/CLUSTER/ID",          -1);
    rc += xpath(name,       "/CLUSTER/NAME",        "not_found");

    // Set oneadmin as the owner
    set_user(0, "");

    // Set the Cluster ID as the cluster it belongs to
    set_group(oid, name);

    // Get associated classes
    rc += hosts.from_xml(this, "/CLUSTER/");
    rc += datastores.from_xml(this, "/CLUSTER/");
    rc += vnets.from_xml(this, "/CLUSTER/");

    ObjectXML::get_nodes("/CLUSTER/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Cluster::set_error_message(const char *mod, const string& name, const string& message)
{
    static const int MAX_ERROR_MSG_LENGTH = 100;

    SingleAttribute * attr;
    ostringstream     error_value;

    error_value << one_util::log_time() << ": " << message.substr(0, MAX_ERROR_MSG_LENGTH);

    if (message.length() >= MAX_ERROR_MSG_LENGTH)
    {
        error_value << "... see more details in oned.log";

        NebulaLog::error(mod, message);
    }

    attr = new SingleAttribute(name, error_value.str());

    obj_template->erase(name);
    obj_template->set(attr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Cluster::load_plan()
{
    auto plpool = Nebula::instance().get_planpool();

    if (auto plan = plpool->get_ro(oid))
    {
        if (plan->state() != PlanState::NONE)
        {
            plan_xml = plan->to_xml();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Cluster::DrsAutomation Cluster::automation() const
{
    auto *vattr = obj_template->get("ONE_DRS");

    if (!vattr)
    {
        return DrsAutomation::MANUAL;
    }

    string str = vattr->vector_value("AUTOMATION");

    one_util::tolower(str);

    if ( str == "partial" )
    {
        return Cluster::PARTIAL;
    }
    else if ( str == "full" )
    {
        return Cluster::FULL;
    }

    return Cluster::MANUAL;
}
