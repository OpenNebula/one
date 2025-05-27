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

#include "Host.h"
#include "HostPool.h"
#include "Nebula.h"
#include "ClusterPool.h"
#include "InformationManager.h"
#include "VirtualMachinePool.h"

#include <sstream>

using namespace std;

/* ************************************************************************ */
/* Host :: Constructor/Destructor                                           */
/* ************************************************************************ */

Host::Host(
        int id,
        const string& _hostname,
        const string& _im_mad_name,
        const string& _vmm_mad_name,
        int           _cluster_id,
        const string& _cluster_name):
    PoolObjectSQL(id, HOST, _hostname, -1, -1, "", "", one_db::host_table),
    ClusterableSingle(_cluster_id, _cluster_name),
    state(INIT),
    prev_state(INIT),
    im_mad_name(_im_mad_name),
    vmm_mad_name(_vmm_mad_name),
    vm_collection("VMS")
{
    obj_template = make_unique<HostTemplate>();

    add_template_attribute("RESERVED_CPU", "");
    add_template_attribute("RESERVED_MEM", "");

    replace_template_attribute("IM_MAD", im_mad_name);
    replace_template_attribute("VM_MAD", vmm_mad_name);

    //-------------------- Init search xpath routes ---------------------------
    ObjectXML::paths =
    {
        "/HOST/TEMPLATE/",
        "/HOST/HOST_SHARE/",
        "/HOST/HOST_SHARE/DATASTORES/",
        "/HOST/MONITORING/CAPACITY/",
        "/HOST/MONITORING/SYSTEM/",
        "/HOST/",
        "/HOST/CLUSTER_TEMPLATE/"
    };
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_hostname;
    char * sql_xml;

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

    // Update the Host

    sql_hostname = db->escape_str(name);

    if ( sql_hostname == 0 )
    {
        goto error_hostname;
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

    if (replace)
    {
        oss << "UPDATE " << one_db::host_table << " SET "
            << "name = '" << sql_hostname << "', "
            << "body = '" << sql_xml << "', "
            << "state = " << state << ", "
            << "uid = " << uid << ", "
            << "gid = " << gid << ", "
            << "owner_u = " << owner_u << ", "
            << "group_u = " << group_u << ", "
            << "other_u = " << other_u << ", "
            << "cid = " << cluster_id
            << " WHERE oid = " << oid;
    }
    else
    {
        // Construct the SQL statement to Insert or Replace
        oss << "INSERT INTO "<< one_db::host_table
            <<" ("<< one_db::host_db_names <<") VALUES ("
            << oid << ","
            << "'" << sql_hostname << "',"
            << "'" << sql_xml << "',"
            <<  state << ","
            <<  uid << ","
            <<  gid << ","
            <<  owner_u << ","
            <<  group_u << ","
            <<  other_u << ","
            <<  cluster_id << ")";
    }

    rc = db->exec_wr(oss);

    db->free_str(sql_hostname);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_hostname);
    db->free_str(sql_xml);

    error_str = "Error transforming the Host to XML.";

    goto error_common;

error_body:
    db->free_str(sql_hostname);
    goto error_generic;

error_hostname:
    goto error_generic;

error_generic:
    error_str = "Error inserting Host in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::update_info(Template &tmpl)
{
    if ( state == OFFLINE )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Remove expired information from current template
    // -------------------------------------------------------------------------
    clear_template_error_message();

    remove_template_attribute("VM");
    remove_template_attribute("VM_POLL");

    // -------------------------------------------------------------------------
    // Copy monitor, extract share info & update state
    // -------------------------------------------------------------------------
    obj_template->merge(&tmpl);

    if ( state != OFFLINE && state != DISABLED )
    {
        state = MONITORED;
    }

    update_wilds();

    // Update host_share
    HostShareConf hconf = {-1, -1, "", "", "", ""};

    obj_template->get("TOTALCPU", hconf.total_cpu);
    obj_template->get("TOTALMEMORY", hconf.total_mem);

    if (host_share.get_total_cpu() == hconf.total_cpu &&
        host_share.get_total_mem() == hconf.total_mem)
    {
        hconf.total_cpu = -1;
        hconf.total_mem = -1;
    }
    else
    {
        // Total memory or cpu has changed, update reservation
        reserved_capacity(hconf.rcpu, hconf.rmem);
    }

    get_hostcluster_attr("PCI_FILTER", hconf.pci_filter);
    get_hostcluster_attr("PCI_SHORT_ADDRESS", hconf.pci_short_address);

    host_share.set_monitorization(*obj_template, hconf);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Host::update_zombies(const set<int>& zombies)
{
    remove_template_attribute("ZOMBIES");
    remove_template_attribute("TOTAL_ZOMBIES");

    if (zombies.empty())
    {
        return;
    }

    ostringstream zombie_str;
    int num_zombies = 0;

    for (auto& it: zombies)
    {
        if (num_zombies++ > 0)
        {
            zombie_str << ", ";
        }

        zombie_str << it;
    }

    add_template_attribute("TOTAL_ZOMBIES", num_zombies);
    add_template_attribute("ZOMBIES", zombie_str.str());
}

/* ------------------------------------------------------------------------ */

void Host::update_wilds()
{
    remove_template_attribute("WILDS");
    remove_template_attribute("TOTAL_WILDS");

    int num_wilds = 0;
    ostringstream wild;

    vector<Attribute*> vm_att;

    obj_template->remove("VM", vm_att);

    for (auto att : vm_att)
    {
        auto vatt = dynamic_cast<VectorAttribute*>(att);

        if (vatt == 0)
        {
            delete att;
            continue;
        }

        int vmid = -1;
        int rc = vatt->vector_value("ID", vmid);

        if (rc != 0)
        {
            delete att;
            continue;
        }

        if (vmid == -1)
        {
            if (num_wilds++ > 0)
            {
                wild << ", ";
            }

            string wname = vatt->vector_value("VM_NAME");

            if (wname.empty())
            {
                wname = vatt->vector_value("DEPLOY_ID");
            }

            wild << wname;

            obj_template->set(att);
        }
        else
        {
            delete att;
        }
    }

    if (num_wilds > 0)
    {
        add_template_attribute("TOTAL_WILDS", num_wilds);
        add_template_attribute("WILDS", wild.str());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Cluster* Host::get_cluster() const
{
    if (cluster_obj != nullptr)
    {
        return cluster_obj.get();
    }

    if (cluster_id == -1)
    {
        return nullptr;
    }

    auto cpool = Nebula::instance().get_clpool();

    cluster_obj = cpool->get_ro(cluster_id);

    return cluster_obj.get();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Host::enable()
{
    if (state == DISABLED && host_share.get_total_cpu() > 0)
    {
        state = MONITORED;
    }
    else
    {
        state = INIT;
    }
};

/* -------------------------------------------------------------------------- */

void Host::disable()
{
    state = DISABLED;
};

/* -------------------------------------------------------------------------- */

void Host::offline()
{
    state = OFFLINE;

    host_share.reset_capacity();

    remove_template_attribute("TOTALCPU");
    remove_template_attribute("TOTALMEMORY");

    remove_template_attribute("FREECPU");
    remove_template_attribute("FREEMEMORY");

    remove_template_attribute("USEDCPU");
    remove_template_attribute("USEDMEMORY");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Host::error(const string& message)
{
    ostringstream oss;

    oss << "Error monitoring Host " << get_name() << " (" << get_oid() << ")"
        << ": " << message;

    NebulaLog::log("ONE", Log::ERROR, oss);

    if ( state != OFFLINE && state != DISABLED )
    {
        state = ERROR;
    }

    set_template_error_message(oss.str());
}

/* ************************************************************************ */
/* Host :: Misc                                                             */
/* ************************************************************************ */

string& Host::to_xml(string& xml) const
{
    string template_xml;
    string share_xml;

    ostringstream oss;
    string        vm_collection_xml;

    oss <<
        "<HOST>"
        "<ID>"            << oid              << "</ID>"              <<
        "<NAME>"          << name             << "</NAME>"            <<
        "<STATE>"         << state            << "</STATE>"           <<
        "<PREV_STATE>"    << prev_state       << "</PREV_STATE>"      <<
        "<IM_MAD>"        << one_util::escape_xml(im_mad_name)  << "</IM_MAD>" <<
        "<VM_MAD>"        << one_util::escape_xml(vmm_mad_name) << "</VM_MAD>" <<
        "<CLUSTER_ID>"    << cluster_id       << "</CLUSTER_ID>"      <<
        "<CLUSTER>"       << cluster          << "</CLUSTER>"         <<
        host_share.to_xml(share_xml)  <<
        vm_collection.to_xml(vm_collection_xml) <<
        obj_template->to_xml(template_xml) <<
        monitoring.to_xml();

    if (!cluster_template_xml.empty())
    {
        oss << "<CLUSTER_TEMPLATE>" << cluster_template_xml << "</CLUSTER_TEMPLATE>";
    }

    oss << "</HOST>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Host::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;

    int int_state;
    int int_prev_state;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/HOST/ID", -1);
    rc += xpath(name, "/HOST/NAME", "not_found");
    rc += xpath(int_state, "/HOST/STATE", 0);
    rc += xpath(int_prev_state, "/HOST/PREV_STATE", 0);

    rc += xpath(im_mad_name, "/HOST/IM_MAD", "not_found");
    rc += xpath(vmm_mad_name, "/HOST/VM_MAD", "not_found");

    rc += xpath(cluster_id, "/HOST/CLUSTER_ID", -1);
    rc += xpath(cluster,    "/HOST/CLUSTER",    "not_found");

    state = static_cast<HostState>( int_state );
    prev_state = static_cast<HostState>( int_prev_state );

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

    // ------------ Host Share ---------------

    ObjectXML::get_nodes("/HOST/HOST_SHARE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += host_share.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    // ------------ Host Template ---------------

    ObjectXML::get_nodes("/HOST/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    // ------------ VMS collection ---------------
    rc += vm_collection.from_xml(this, "/HOST/");

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Host::get_hostcluster_attr(const std::string& name, std::string& value) const
{
    get_template_attribute(name, value);

    if (!value.empty() || cluster_id == -1)
    {
        return;
    }

    if (auto cluster = get_cluster())
    {
        cluster->get_template_attribute(name, value);
    }
}

/* -------------------------------------------------------------------------- */

void Host::reserved_capacity(string& rcpu, string& rmem) const
{
    get_template_attribute("RESERVED_CPU", rcpu);
    get_template_attribute("RESERVED_MEM", rmem);

    if (!rcpu.empty() && !rmem.empty())
    {
        return;
    }

    string cluster_rcpu = "";
    string cluster_rmem = "";

    if (auto cluster = get_cluster())
    {
        cluster->get_reserved_capacity(cluster_rcpu, cluster_rmem);
    }

    if (rcpu.empty())
    {
        rcpu = cluster_rcpu;
    }

    if (rmem.empty())
    {
        rmem = cluster_rmem;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Host::update_reserved_capacity(const string& ccpu, const string& cmem)
{
    string rcpu;
    string rmem;

    get_template_attribute("RESERVED_CPU", rcpu);
    get_template_attribute("RESERVED_MEM", rmem);

    if (!rcpu.empty() && !rmem.empty())
    {
        // Do not update reserved capacity from cluster, it's defined in host
        return false;
    }

    if (rcpu.empty())
    {
        rcpu = ccpu;
    }

    if (rmem.empty())
    {
        rmem = cmem;
    }

    host_share.update_capacity(*obj_template, rcpu, rmem);

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Host::post_update_template(string& error, Template *_old_tmpl)
{
    string new_im_mad;
    string new_vm_mad;

    string rcpu;
    string rmem;

    get_template_attribute("IM_MAD", new_im_mad);
    get_template_attribute("VM_MAD", new_vm_mad);

    if (!new_im_mad.empty())
    {
        im_mad_name = new_im_mad;
    }

    if (!new_vm_mad.empty())
    {
        vmm_mad_name = new_vm_mad;
    }

    replace_template_attribute("IM_MAD", im_mad_name);
    replace_template_attribute("VM_MAD", vmm_mad_name);

    reserved_capacity(rcpu, rmem);

    host_share.update_capacity(*obj_template, rcpu, rmem);

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Host::load_monitoring()
{
    auto hpool = Nebula::instance().get_hpool();
    monitoring = hpool->get_monitoring(oid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Host::is_pinned() const
{
    string pin_policy;

    obj_template->get("PIN_POLICY", pin_policy);

    return one_util::tolower(pin_policy) == "pinned";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Host::add_pci(HostShareCapacity &sr)
{
    get_hostcluster_attr("PCI_GPU_PROFILE", sr.vgpu_profile);

    return host_share.add_pci(sr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Host::add_capacity(HostShareCapacity &sr)
{
    get_hostcluster_attr("PCI_GPU_PROFILE", sr.vgpu_profile);

    if ( vm_collection.add(sr.vmid) == 0 )
    {
        host_share.add(sr);
    }
    else
    {
        std::ostringstream oss;
        oss << "VM " << sr.vmid << " is already in host " << oid << ".";

        NebulaLog::log("ONE", Log::ERROR, oss);
    }
};
