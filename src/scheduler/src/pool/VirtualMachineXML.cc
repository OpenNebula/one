/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include <algorithm>

#include "VirtualMachineXML.h"
#include "DatastoreXML.h"
#include "DatastorePoolXML.h"
#include "NebulaUtil.h"
#include "History.h"
#include "RankScheduler.h"
#include "VirtualMachine.h"

using namespace std;

using json = nlohmann::json;

std::map<std::string, std::string> VirtualMachineXML::external_attributes;

/******************************************************************************/
/******************************************************************************/
/*  INITIALIZE VM object attributes from its XML representation               */
/******************************************************************************/
/******************************************************************************/

void VirtualMachineXML::init_attributes()
{
    std::vector<xmlNodePtr> nodes;
    std::vector<VectorAttribute*> attrs;

    int rc;
    int action;
    int tmp;

    std::string automatic_requirements;
    std::string automatic_ds_requirements;
    std::string automatic_nic_requirements;

    /**************************************************************************/
    /* VM attributes and flags                                                */
    /**************************************************************************/
    xpath(oid, "/VM/ID", -1);
    xpath(uid, "/VM/UID", -1);
    xpath(gid, "/VM/GID", -1);

    xpath(state, "/VM/STATE",     0);
    xpath(lcm_state, "/VM/LCM_STATE", 0);

    active = state == 3;

    xpath(tmp, "/VM/RESCHED", 0);
    resched = tmp == 1;

    xpath(action, "/VM/HISTORY_RECORDS/HISTORY/ACTION", -1);
    resume = (action == VMActions::STOP_ACTION || action == VMActions::UNDEPLOY_ACTION
            || action == VMActions::UNDEPLOY_HARD_ACTION );

    xpath(hid, "/VM/HISTORY_RECORDS/HISTORY/HID", -1);
    xpath(dsid, "/VM/HISTORY_RECORDS/HISTORY/DS_ID", -1);

    xpath(stime, "/VM/STIME", (time_t) 0);

    /**************************************************************************/
    /*  VM Capacity memory, cpu and disk (system ds storage)                  */
    /**************************************************************************/
    xpath<long int>(memory, "/VM/TEMPLATE/MEMORY", 0);

    xpath<float>(cpu, "/VM/TEMPLATE/CPU", 0);

    /**************************************************************************/
    /*  Scheduling rank expresions for:                                       */
    /*    - host                                                              */
    /*    - datastore                                                         */
    /**************************************************************************/
    rc = xpath(rank, "/VM/USER_TEMPLATE/SCHED_RANK", "");

    if (rc != 0)
    {
        // Compatibility with previous versions
        xpath(rank, "/VM/USER_TEMPLATE/RANK", "");
    }

    xpath(ds_rank, "/VM/USER_TEMPLATE/SCHED_DS_RANK", "");

    /**************************************************************************/
    /*  Scheduling requirements for:                                          */
    /*    - host                                                              */
    /*    - datastore                                                         */
    /*    - network                                                           */
    /**************************************************************************/
    // ---------------------------------------------------------------------- //
    // Host requirements                                                      //
    // ---------------------------------------------------------------------- //
    xpath(automatic_requirements, "/VM/TEMPLATE/AUTOMATIC_REQUIREMENTS", "");

    rc = xpath(requirements, "/VM/USER_TEMPLATE/SCHED_REQUIREMENTS", "");

    if (rc == 0)
    {
        if ( !automatic_requirements.empty() )
        {
            ostringstream oss;

            oss << automatic_requirements << " & ( " << requirements << " )";

            requirements = oss.str();
        }
    }
    else if ( !automatic_requirements.empty() )
    {
        requirements = automatic_requirements;
    }

    // ---------------------------------------------------------------------- //
    // Datastore requirements                                                 //
    // ---------------------------------------------------------------------- //
    xpath(automatic_ds_requirements, "/VM/TEMPLATE/AUTOMATIC_DS_REQUIREMENTS",
            "");

    rc = xpath(ds_requirements, "/VM/USER_TEMPLATE/SCHED_DS_REQUIREMENTS", "");

    if (rc == 0)
    {
        if ( !automatic_ds_requirements.empty() )
        {
            ostringstream oss;

            oss << automatic_ds_requirements << " & ( " << ds_requirements << " )";

            ds_requirements = oss.str();
        }
    }
    else if ( !automatic_ds_requirements.empty() )
    {
        ds_requirements = automatic_ds_requirements;
    }

    // ---------------------------------------------------------------------- //
    // Network requirements & rank                                            //
    // ---------------------------------------------------------------------- //
    xpath(automatic_nic_requirements, "/VM/TEMPLATE/AUTOMATIC_NIC_REQUIREMENTS",
            "");

    if (get_nodes("/VM/TEMPLATE/NIC", nodes) > 0)
    {
        std::string net_mode;

        for (auto it_nodes = nodes.begin(); it_nodes != nodes.end(); ++it_nodes)
        {
            VirtualMachineTemplate nic_template;

            nic_template.from_xml_node(*it_nodes);

            bool rc2 = nic_template.get("NETWORK_MODE", net_mode);

            if ( !rc2 || !one_util::icasecmp(net_mode, "AUTO") )
            {
                continue;
            }

            std::string reqs, sched_rank;
            int nic_id;

            nic_template.get("NIC_ID", nic_id);

            nics_ids_auto.insert(nic_id);

            VirtualMachineNicXML * the_nic = new VirtualMachineNicXML();

            nics.insert(make_pair(nic_id, the_nic));

            if ( nic_template.get("SCHED_REQUIREMENTS", reqs) )
            {
                if ( !automatic_nic_requirements.empty() )
                {
                    ostringstream oss;

                    oss << automatic_nic_requirements <<" & ( " << reqs << " )";

                    reqs = oss.str();
                }

                the_nic->set_requirements(reqs);
            }

            if ( nic_template.get("SCHED_RANK", sched_rank) )
            {
                the_nic->set_rank(sched_rank);
            }
        }

        free_nodes(nodes);
    }

    /**************************************************************************/
    /*  Template, user template, history information and rescheduling flag    */
    /**************************************************************************/
    if (get_nodes("/VM/TEMPLATE", nodes) > 0)
    {
        vm_template = make_unique<VirtualMachineTemplate>();

        vm_template->from_xml_node(nodes[0]);

        free_nodes(nodes);
    }
    else
    {
        vm_template = nullptr;
    }

    if (get_nodes("/VM/USER_TEMPLATE", nodes) > 0)
    {
        user_template = make_unique<VirtualMachineTemplate>(false,'=',"USER_TEMPLATE");

        user_template->from_xml_node(nodes[0]);

        free_nodes(nodes);

        public_cloud = (user_template->get("PUBLIC_CLOUD", attrs) > 0);

        if (public_cloud == false)
        {
            attrs.clear();
            public_cloud = (user_template->get("EC2", attrs) > 0);
        }
    }
    else
    {
        user_template = 0;
    }

    only_public_cloud = false;

    if (vm_template != 0)
    {
        init_storage_usage();
    }
    else
    {
        system_ds_usage = 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// TODO: use VirtualMachine::isVolatile(disk)
static bool isVolatile(const VectorAttribute * disk)
{
    string type = disk->vector_value("TYPE");

    one_util::toupper(type);

    return ( type == "SWAP" || type == "FS");
}

/* -------------------------------------------------------------------------- */

void VirtualMachineXML::init_storage_usage()
{
    vector<Attribute  *>            disks;

    long long   size;
    long long   snapshot_size;
    string      st;
    int         ds_id;
    bool        clone;

    system_ds_usage = 0;

    int num = vm_template->remove("DISK", disks);

    for (const auto attr : disks)
    {
        const VectorAttribute * disk = dynamic_cast<const VectorAttribute*>(attr);

        if (!disk)
        {
            continue;
        }

        if (disk->vector_value("SIZE", size) != 0)
        {
            continue;
        }

        if (disk->vector_value("DISK_SNAPSHOT_TOTAL_SIZE", snapshot_size) == 0)
        {
            size += snapshot_size;
        }

        if (isVolatile(disk))
        {
            system_ds_usage += size;
        }
        else
        {
            if (disk->vector_value("DATASTORE_ID", ds_id) != 0)
            {
                continue;
            }

            ds_usage.emplace(ds_id, 0);

            if (disk->vector_value("CLONE", clone) != 0)
            {
                continue;
            }

            if (clone)
            {
                st = disk->vector_value("CLONE_TARGET");
            }
            else
            {
                st = disk->vector_value("LN_TARGET");
            }

            one_util::toupper(st);

            if (st == "SELF")
            {
                ds_usage[ds_id] += size;
            }
            else if (st == "SYSTEM")
            {
                system_ds_usage += size;
            } // else st == NONE
        }
    }

    float factor = Scheduler::instance().get_mem_ds_scale();

    if (this->memory > 0 && factor >= 0)
    {
        system_ds_usage += this->memory * factor;
    }

    for (int i = 0; i < num ; i++)
    {
        delete disks[i];
    }
}

/* -------------------------------------------------------------------------- */

/******************************************************************************/
/******************************************************************************/
/*  VM requirements and capacity interface                                    */
/******************************************************************************/
/******************************************************************************/

void VirtualMachineXML::add_requirements(const string& reqs)
{
    if ( reqs.empty() )
    {
        return;
    }
    else if ( requirements.empty() )
    {
        requirements = reqs;
    }
    else
    {
        requirements += " & (" + reqs + ")";
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineXML::get_capacity(HostShareCapacity &sr) const
{
    sr.vmid = oid;

    sr.pci.clear();

    if (vm_template != 0)
    {
        vm_template->get("PCI", sr.pci);

        vm_template->get("NUMA_NODE", sr.nodes);

        sr.topology = vm_template->get("TOPOLOGY");
    }

    if ( memory == 0 || cpu == 0 )
    {
        sr.cpu  = 0;
        sr.mem  = 0;
        sr.disk = 0;

        return;
    }

    sr.cpu  = (int) (cpu * 100); //100%
    sr.mem  = memory * 1024;     //Kilobytes
    sr.disk = system_ds_usage;   //MB
}

/* -------------------------------------------------------------------------- */

void VirtualMachineXML::add_capacity(HostShareCapacity &sr)
{
    cpu    += sr.cpu;
    memory += sr.mem;
    system_ds_usage += sr.disk;

    vm_template->set(sr.nodes);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineXML::reset_capacity(HostShareCapacity &sr)
{
    sr.cpu  = cpu;
    sr.mem  = memory;
    sr.disk = system_ds_usage;

    if ( vm_template != 0 )
    {
        vm_template->remove("NUMA_NODE", sr.nodes);
    }

    cpu    = 0;
    memory = 0;
    system_ds_usage = 0;
}

/* -------------------------------------------------------------------------- */

bool VirtualMachineXML::test_image_datastore_capacity(
    ImageDatastorePoolXML * img_dspool, string & error_msg) const
{
    for (auto ds_it = ds_usage.begin(); ds_it != ds_usage.end(); ++ds_it)
    {
        DatastoreXML* ds = img_dspool->get(ds_it->first);

        if (ds == 0 || !ds->test_capacity(ds_it->second))
        {
            ostringstream oss;

            oss << "Image Datastore " << ds_it->first
                << " does not have enough capacity";

            error_msg = oss.str();
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */

void VirtualMachineXML::add_image_datastore_capacity(
        ImageDatastorePoolXML * img_dspool)
{
    for (auto ds_it = ds_usage.begin(); ds_it != ds_usage.end(); ++ds_it)
    {
        DatastoreXML *ds = img_dspool->get(ds_it->first);

        if (ds == 0)
        {
            continue;
        }

        ds->add_capacity(ds_it->second);
    }
}

//******************************************************************************
// Functions to schedule network interfaces (NIC)
//******************************************************************************

VirtualMachineNicXML * VirtualMachineXML::get_nic(int nic_id) const
{
    VirtualMachineNicXML * n = 0;

    auto it = nics.find(nic_id);

    if ( it != nics.end() )
    {
        n = it->second;
    }

    return n;
}

/* -------------------------------------------------------------------------- */

const string& VirtualMachineXML::get_nic_rank(int nic_id) const
{
    static std::string es;

    auto it = nics.find(nic_id);

    if ( it != nics.end() )
    {
        return it->second->get_rank();
    }

    return es;
};

/* -------------------------------------------------------------------------- */

const string& VirtualMachineXML::get_nic_requirements(int nic_id) const
{
    static std::string es;

    auto it = nics.find(nic_id);

    if ( it != nics.end() )
    {
        return it->second->get_requirements();
    }

    return es;
}

//******************************************************************************
// Logging
//******************************************************************************

ostream& operator<<(ostream& os, VirtualMachineXML& vm)
{
    const vector<Resource *> resources = vm.match_hosts.get_resources();

    vector<Resource *>::const_reverse_iterator  i;

    if (resources.empty())
    {
        return os;
    }

    os << "Virtual Machine: " << vm.oid << endl << endl;

    os << "\tPRI\tID - HOSTS"<< endl
       << "\t------------------------"  << endl;

    for (i = resources.rbegin(); i != resources.rend(); ++i)
    {
        os << "\t" << (*i)->priority << "\t" << (*i)->oid << endl;
    }

    os << endl;

    os << "\tPRI\tID - DATASTORES"<< endl
       << "\t------------------------"  << endl;

    const vector<Resource *> ds_resources = vm.match_datastores.get_resources();

    for (i = ds_resources.rbegin(); i != ds_resources.rend(); ++i)
    {
        os << "\t" << (*i)->priority << "\t" << (*i)->oid << endl;
    }

    os << endl;

    const set<int>& nics_ids = vm.get_nics_ids();

    for (auto nic_id : nics_ids)
    {
        os << "\tNIC_ID: "<< nic_id << endl
        << "\t-----------------------------------"  << endl;
        os << "\tPRI\tID - NETWORKS"<< endl
        << "\t------------------------"  << endl;

        const vector<Resource *> net_resources = vm.nics[nic_id]->get_match_networks();

        for (i = net_resources.rbegin(); i != net_resources.rend(); ++i)
        {
            os << "\t" << (*i)->priority << "\t" << (*i)->oid << endl;
        }

        os << endl;
    }

    return os;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::log(const string &st)
{
    if ( user_template == 0 || st.empty())
    {
        return;
    }
    ostringstream oss;

    oss << one_util::log_time() << ": " << st;

    string sched_message = oss.str();

    sched_message = one_util::gsub(sched_message, "\"",  "\\\"");

    user_template->replace("SCHED_MESSAGE", sched_message);

    oss.str("");
    oss << "SCHED_MESSAGE = \"" << sched_message << "\"";

    update(oss.str(), true);    // Send the update to oned
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineXML::clear_log()
{
    string st;

    if (user_template == 0)
    {
        return false;
    }

    user_template->get("SCHED_MESSAGE", st);

    if (st.empty())
    {
        return false;
    }

    user_template->erase("SCHED_MESSAGE");

    update("SCHED_MESSAGE = \"\"", true);   // Send update to oned

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineXML::parse_action_name(string& action_st)
{
    one_util::tolower(action_st);

    if (   action_st != "terminate"
        && action_st != "terminate-hard"
        && action_st != "undeploy"
        && action_st != "undeploy-hard"
        && action_st != "hold"
        && action_st != "release"
        && action_st != "stop"
        && action_st != "suspend"
        && action_st != "resume"
        && action_st != "reboot"
        && action_st != "reboot-hard"
        && action_st != "poweroff"
        && action_st != "poweroff-hard"
        && action_st != "snapshot-create"
        && action_st != "snapshot-revert"
        && action_st != "snapshot-delete"
        && action_st != "disk-snapshot-create"
        && action_st != "disk-snapshot-revert"
        && action_st != "disk-snapshot-delete"
        && action_st != "backup"

        // Compatibility with 4.x
        && action_st != "shutdown"
        && action_st != "shutdown-hard"
        && action_st != "delete")
    {
        return -1;
    }

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::init_external_attrs(const vector<const SingleAttribute *>& attrs)
{
    for (const auto &sa : attrs)
    {
        auto ext_atr = one_util::split(sa->value(), ':', true);

        if (ext_atr.size() != 2)
        {
            ext_atr = one_util::split(sa->value(), '/', true);

            if (ext_atr.empty())
            {
                NebulaLog::warn("SCHED", "Wrong format for external attribute: "
                    + sa->value());
                continue;
            }

            external_attributes.insert(make_pair(sa->value(), *ext_atr.rbegin()));
        }
        else
        {
            external_attributes.insert(make_pair(ext_atr[0], ext_atr[1]));
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// We have to duplicate method from VirtualMachine.h, otherwise we get into linking hell
static string state_to_str(VirtualMachine::VmState state)
{
    string st;

    switch (state)
    {
        case VirtualMachine::INIT:
            st = "INIT"; break;
        case VirtualMachine::PENDING:
            st = "PENDING"; break;
        case VirtualMachine::HOLD:
            st = "HOLD"; break;
        case VirtualMachine::ACTIVE:
            st = "ACTIVE"; break;
        case VirtualMachine::STOPPED:
            st = "STOPPED"; break;
        case VirtualMachine::SUSPENDED:
            st = "SUSPENDED"; break;
        case VirtualMachine::DONE:
            st = "DONE"; break;
        case VirtualMachine::POWEROFF:
            st = "POWEROFF"; break;
        case VirtualMachine::UNDEPLOYED:
            st = "UNDEPLOYED"; break;
        case VirtualMachine::CLONING:
            st = "CLONING"; break;
        case VirtualMachine::CLONING_FAILURE:
            st = "CLONING_FAILURE"; break;
    }

    return st;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::to_json(json &vm_json)
{
    vm_json["ID"]  = oid;
    vm_json["STATE"] = state_to_str(static_cast<VirtualMachine::VmState>(state));

    // -------------------------------------------------------------------------
    // Add matching Hosts
    // -------------------------------------------------------------------------
    const vector<Resource *>& hosts = match_hosts.get_resources();

    json hosts_json = json::array();

    for (const auto& h : hosts)
    {
        hosts_json += h->oid;
    }

    vm_json["HOST_IDS"] = hosts_json;

    // -------------------------------------------------------------------------
    // Add requirements
    // -------------------------------------------------------------------------
    json req;

    req["CPU"]      = cpu;
    req["MEMORY"]    = memory * 1024;
    req["DISK_SIZE"] = system_ds_usage;

    vm_json["CAPACITY"] = req;

    // -------------------------------------------------------------------------
    // Add custom attributes
    // -------------------------------------------------------------------------

    map<string, string> custom_attributes;

    for (const auto& attr : external_attributes)
    {
        string value;
        xpath(value, attr.first.c_str(), "");

        if (value.empty())
        {
            continue;
        }

        custom_attributes.insert(make_pair(attr.second, value));
    }

    vm_json["VM_ATTRIBUTES"] = custom_attributes;
}

//******************************************************************************
// Updates to oned
//******************************************************************************

bool VirtualMachineXML::update(const string &vm_template, bool append)
{
    xmlrpc_c::value result;

    try
    {
        Client::client()->call("one.vm.update", "isi", &result, oid,
                               vm_template.c_str(),
                               append ? 1 : 0);
    }
    catch (exception const& e)
    {
        return false;
    }

    vector<xmlrpc_c::value> values =
            xmlrpc_c::value_array(result).vectorValueValue();

    return xmlrpc_c::value_boolean(values[0]);
}
