/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineBase.h"
#include "VMActions.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineBase::from_xml(const std::string &xml_str)
{
    int rc = update_from_str(xml_str);

    if (rc != 0)
    {
        return rc;
    }

    return init_attributes();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachineBase::to_xml() const
{
    // todo
    return "";
}

/******************************************************************************/
/******************************************************************************/
/*  INITIALIZE VM object attributes from its XML representation               */
/******************************************************************************/
/******************************************************************************/

int VirtualMachineBase::init_attributes()
{
    std::vector<xmlNodePtr> nodes;
    std::vector<VectorAttribute*> attrs;

    int rc;
    int action;
    int tmp;

    /**************************************************************************/
    /* VM attributes and flags                                                */
    /**************************************************************************/
    rc = xpath(_oid, "/VM/ID", -1);
    rc += xpath(_uid, "/VM/UID", -1);
    rc += xpath(_gid, "/VM/GID", -1);

    rc += xpath(_name, "/VM/NAME", "not_found");
    rc += xpath(_uname, "/VM/UNAME", "not_found");
    rc += xpath(_gname, "/VM/GNAME", "not_found");

    rc += xpath(tmp, "/VM/STATE", -1);
    active = tmp == 3;

    rc += xpath(tmp, "/VM/RESCHED", 0);
    resched = tmp == 1;

    xpath(action, "/VM/HISTORY_RECORDS/HISTORY/ACTION", -1);
    resume = (action == VMActions::STOP_ACTION || action == VMActions::UNDEPLOY_ACTION
              || action == VMActions::UNDEPLOY_HARD_ACTION );

    xpath(hid, "/VM/HISTORY_RECORDS/HISTORY/HID", -1);
    xpath(dsid, "/VM/HISTORY_RECORDS/HISTORY/DS_ID", -1);

    rc += xpath(stime, "/VM/STIME", (time_t) 0);

    /**************************************************************************/
    /*  VM Capacity memory, cpu and disk (system ds storage)                  */
    /**************************************************************************/
    xpath<long int>(memory, "/VM/TEMPLATE/MEMORY", 0);

    xpath<float>(cpu, "/VM/TEMPLATE/CPU", 0);

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
        user_template = make_unique<VirtualMachineTemplate>();

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
        user_template = nullptr;
    }

    if (vm_template != nullptr)
    {
        init_storage_usage();
    }
    else
    {
        system_ds_usage = 0;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static bool isVolatile(const VectorAttribute * disk)
{
    string type = disk->vector_value("TYPE");

    one_util::toupper(type);

    return ( type == "SWAP" || type == "FS");
}

/* -------------------------------------------------------------------------- */

void VirtualMachineBase::init_storage_usage()
{
    vector<VectorAttribute *> disks;

    long long   size;
    long long   snapshot_size;
    string      st;
    int         ds_id;
    bool        clone;

    system_ds_usage = 0;

    int num = vm_template->remove("DISK", disks);

    for (auto disk : disks)
    {
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

            ds_usage.emplace(ds_id, 0); // no-op if element already exists

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

    for (int i = 0; i < num ; i++)
    {
        delete disks[i];
    }
}

//******************************************************************************
// Logging
//******************************************************************************

ostream& operator<<(ostream& os, VirtualMachineBase& vm)
{
    os << "Virtual Machine: " << vm._oid << endl << endl;

    os << endl;

    return os;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


