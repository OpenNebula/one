/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
#include "ScheduledAction.h"
#include "DatastoreXML.h"
#include "DatastorePoolXML.h"
#include "NebulaUtil.h"
#include "History.h"
#include "RankScheduler.h"

void VirtualMachineXML::init_attributes()
{
    vector<xmlNodePtr> nodes;

    int rc;
    int action;

    string automatic_requirements;
    string automatic_ds_requirements;
    string automatic_nic_requirements;

    xpath(oid, "/VM/ID", -1);
    xpath(uid, "/VM/UID", -1);
    xpath(gid, "/VM/GID", -1);

    xpath(state, "/VM/STATE", -1);

    xpath<long int>(memory, "/VM/TEMPLATE/MEMORY", 0);
    xpath<float>(cpu, "/VM/TEMPLATE/CPU", 0);

    // ------------------------ RANK & DS_RANK ---------------------------------

    rc = xpath(rank, "/VM/USER_TEMPLATE/SCHED_RANK", "");

    if (rc != 0)
    {
        // Compatibility with previous versions
        xpath(rank, "/VM/USER_TEMPLATE/RANK", "");
    }

    xpath(ds_rank, "/VM/USER_TEMPLATE/SCHED_DS_RANK", "");

    // ------------------- HOST REQUIREMENTS -----------------------------------

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

    // ------------------- DS REQUIREMENTS -------------------------------------

    xpath(automatic_ds_requirements, "/VM/TEMPLATE/AUTOMATIC_DS_REQUIREMENTS", "");

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

    // ------------------- NIC REQUIREMENTS -------------------------------------

    xpath(automatic_nic_requirements, "/VM/TEMPLATE/AUTOMATIC_NIC_REQUIREMENTS", "");

    if (get_nodes("/VM/TEMPLATE/NIC", nodes) > 0)
    {
        std::string net_mode;

        vector<xmlNodePtr>::iterator it_nodes;

        for (it_nodes = nodes.begin(); it_nodes != nodes.end(); ++it_nodes)
        {
            VirtualMachineTemplate * nic_template = new VirtualMachineTemplate;

            nic_template->from_xml_node(*it_nodes);

            bool rc = nic_template->get("NETWORK_MODE", net_mode);
            one_util::toupper(net_mode);

            if ( rc && net_mode == "AUTO" )
            {
                std::string requirements, rank;
                int nic_id;

                nic_template->get("NIC_ID", nic_id);

                nics_ids_auto.insert(nic_id);

                VirtualMachineNicXML * the_nic = new VirtualMachineNicXML();

                nics.insert(make_pair(nic_id, the_nic));

                if ( nic_template->get("SCHED_REQUIREMENTS", requirements) )
                {
                    if ( !automatic_nic_requirements.empty() )
                    {
                        ostringstream oss;

                        oss << automatic_nic_requirements << " & ( " << requirements << " )";

                        requirements = oss.str();
                    }

                    the_nic->set_requirements(requirements);
                }

                if ( nic_template->get("SCHED_RANK", rank) )
                {
                    the_nic->set_rank(rank);
                }
            }

            delete nic_template;
        }

        free_nodes(nodes);
    }

    nodes.clear();

    // ---------------- HISTORY HID, DSID, RESCHED & TEMPLATE ------------------

    xpath(hid,  "/VM/HISTORY_RECORDS/HISTORY/HID", -1);
    xpath(dsid, "/VM/HISTORY_RECORDS/HISTORY/DS_ID", -1);

    xpath(resched, "/VM/RESCHED", 0);

    xpath(action, "/VM/HISTORY_RECORDS/HISTORY/ACTION", -1);

    xpath(stime,  "/VM/STIME", (time_t) 0);

    resume = (action == History::STOP_ACTION ||
              action == History::UNDEPLOY_ACTION ||
              action == History::UNDEPLOY_HARD_ACTION );

    if (get_nodes("/VM/TEMPLATE", nodes) > 0)
    {
        vm_template = new VirtualMachineTemplate;

        vm_template->from_xml_node(nodes[0]);

        free_nodes(nodes);
    }
    else
    {
        vm_template = 0;
    }

    nodes.clear();

    if (get_nodes("/VM/USER_TEMPLATE", nodes) > 0)
    {
        user_template = new VirtualMachineTemplate;

        user_template->from_xml_node(nodes[0]);

        free_nodes(nodes);
    }
    else
    {
        user_template = 0;
    }

    if (vm_template != 0)
    {
        init_storage_usage();
    }
    else
    {
        system_ds_usage = 0;
    }

    vector<VectorAttribute*> attrs;

    public_cloud = (user_template->get("PUBLIC_CLOUD", attrs) > 0);

    if (public_cloud == false)
    {
        attrs.clear();
        public_cloud = (user_template->get("EC2", attrs) > 0);
    }

    only_public_cloud = false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

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

    for (i = resources.rbegin(); i != resources.rend() ; i++)
    {
        os << "\t" << (*i)->priority << "\t" << (*i)->oid << endl;
    }

    os << endl;

    os << "\tPRI\tID - DATASTORES"<< endl
       << "\t------------------------"  << endl;

    const vector<Resource *> ds_resources = vm.match_datastores.get_resources();

    for (i = ds_resources.rbegin(); i != ds_resources.rend() ; i++)
    {
        os << "\t" << (*i)->priority << "\t" << (*i)->oid << endl;
    }

    os << endl;

    set<int> nics_ids = vm.get_nics_ids();

    for (set<int>::iterator it = nics_ids.begin(); it != nics_ids.end(); it++)
    {
        os << "\tNIC_ID: "<< *it << endl
        << "\t-----------------------------------"  << endl;
        os << "\tPRI\tID - NETWORKS"<< endl
        << "\t------------------------"  << endl;

        const vector<Resource *> net_resources = vm.nics[*it]->get_match_networks();

        for (i = net_resources.rbegin(); i != net_resources.rend() ; i++)
        {
            os << "\t" << (*i)->priority << "\t" << (*i)->oid << endl;
        }

        os << endl;
    }

    return os;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::add_requirements(float c, long int m, long long d)
{
    cpu    += c;
    memory += m;
    system_ds_usage += d;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::reset_requirements(float& c, int& m, long long& d)
{
    c = cpu;
    m = memory;
    d = system_ds_usage;

    cpu    = 0;
    memory = 0;
    system_ds_usage = 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::get_requirements (int& cpu, int& memory,
    long long& disk, vector<VectorAttribute *> &pci)
{
    pci.clear();

    if (vm_template != 0)
    {
        vm_template->get("PCI", pci);
    }

    if (this->memory == 0 || this->cpu == 0)
    {
        cpu    = 0;
        memory = 0;
        disk   = 0;

        return;
    }

    cpu    = (int) (this->cpu * 100);//now in 100%
    memory = this->memory * 1024;    //now in Kilobytes
    disk   = this->system_ds_usage;  // MB
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// TODO: use VirtualMachine::isVolatile(disk)
bool isVolatile(const VectorAttribute * disk)
{
    string type = disk->vector_value("TYPE");

    one_util::toupper(type);

    return ( type == "SWAP" || type == "FS");
}

map<int,long long> VirtualMachineXML::get_storage_usage()
{
    return ds_usage;
}

void VirtualMachineXML::init_storage_usage()
{
    vector<Attribute  *>            disks;
    vector<Attribute*>::iterator    it;

    long long   size;
    long long   snapshot_size;
    string      st;
    int         ds_id;
    bool        clone;

    system_ds_usage = 0;

    int num = vm_template->remove("DISK", disks);

    for (it=disks.begin(); it != disks.end(); it++)
    {
        const VectorAttribute * disk = dynamic_cast<const VectorAttribute*>(*it);

        if (disk == 0)
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

            if (ds_usage.count(ds_id) == 0)
            {
                ds_usage[ds_id] = 0;
            }

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
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::log(const string &st)
{
    if ( user_template == 0 || st.empty())
    {
        return;
    }
    ostringstream oss;

    oss << one_util::log_time() << " : " << st;

    user_template->replace("SCHED_MESSAGE", oss.str());
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

bool VirtualMachineXML::test_image_datastore_capacity(
    ImageDatastorePoolXML * img_dspool, string & error_msg) const
{
    map<int,long long>::const_iterator ds_it;
    DatastoreXML* ds;

    for (ds_it = ds_usage.begin(); ds_it != ds_usage.end(); ++ds_it)
    {
        ds = img_dspool->get(ds_it->first);

        if (ds == 0 || !ds->test_capacity(ds_it->second))
        {
            ostringstream oss;

            oss << "Image Datastore " << ds->get_oid()
                << " does not have enough capacity";

            error_msg = oss.str();
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::add_image_datastore_capacity(
        ImageDatastorePoolXML * img_dspool)
{
    map<int,long long>::const_iterator ds_it;

    DatastoreXML *ds;

    for (ds_it = ds_usage.begin(); ds_it != ds_usage.end(); ++ds_it)
    {
        ds = img_dspool->get(ds_it->first);

        if (ds == 0) //Should never reach here
        {
            continue;
        }

        ds->add_capacity(ds_it->second);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::set_only_public_cloud()
{
    only_public_cloud = true;

    ostringstream oss;

    oss << "VM " << oid << ": Local Datastores do not have enough capacity. "
            << "This VM can be only deployed in a Public Cloud Host.";

    NebulaLog::log("SCHED",Log::INFO,oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineXML::is_only_public_cloud() const
{
    return only_public_cloud;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
