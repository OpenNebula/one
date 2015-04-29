/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <math.h>
#include <sstream>

#include "HostXML.h"
#include "NebulaUtil.h"
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
int HostXML::host_num_paths =  4;

const char *HostXML::host_paths[] = {
    "/HOST/TEMPLATE/",
    "/HOST/HOST_SHARE/",
    "/HOST/",
    "/HOST/CLUSTER_TEMPLATE/"};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostXML::init_attributes()
{
    oid         = atoi(((*this)["/HOST/ID"] )[0].c_str() );
    cluster_id  = atoi(((*this)["/HOST/CLUSTER_ID"] )[0].c_str() );

    mem_usage   = atoll(((*this)["/HOST/HOST_SHARE/MEM_USAGE"])[0].c_str());
    cpu_usage   = atoll(((*this)["/HOST/HOST_SHARE/CPU_USAGE"])[0].c_str());

    max_mem     = atoll(((*this)["/HOST/HOST_SHARE/MAX_MEM"])[0].c_str());
    max_cpu     = atoll(((*this)["/HOST/HOST_SHARE/MAX_CPU"])[0].c_str());

    free_disk   = atoll(((*this)["/HOST/HOST_SHARE/FREE_DISK"])[0].c_str());

    running_vms = atoll(((*this)["/HOST/HOST_SHARE/RUNNING_VMS"])[0].c_str());

    public_cloud = false;

    vector<string> public_cloud_vector = (*this)["/HOST/TEMPLATE/PUBLIC_CLOUD"];

    if (public_cloud_vector.size() > 0)
    {
        string pc = public_cloud_vector[0];

        one_util::toupper(pc);

        public_cloud = pc == "YES";
    }

    vector<string> ds_ids     = (*this)["/HOST/HOST_SHARE/DATASTORES/DS/ID"];
    vector<string> ds_free_mb = (*this)["/HOST/HOST_SHARE/DATASTORES/DS/FREE_MB"];

    int id;
    long long disk;

    for (size_t i = 0; i < ds_ids.size() && i < ds_free_mb.size(); i++)
    {
        id   = atoi(ds_ids[i].c_str());
        disk = atoll(ds_free_mb[i].c_str());

        ds_free_disk[id] = disk;
    }

    //Init search xpath routes

    ObjectXML::paths     = host_paths;
    ObjectXML::num_paths = host_num_paths;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostXML::search(const char *name, int& value)
{
    string s_name(name);

    if (s_name == "CURRENT_VMS")
    {
        vector<string>::iterator it;
        istringstream  iss;
        int id;

        vector<string> results = (*this)["/HOST/VMS/ID"];

        for (it=results.begin(); it!=results.end(); it++)
        {
            iss.clear();
            iss.str(*it);

            iss >> id;

            if (!iss.fail() && id == value)
            {
                return 0; //VMID found in VMS value is VMID
            }
        }

        value = -1; //VMID not found in VMS value is -1

        return 0;
    }
    else
    {
        return ObjectXML::search(name, value);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HostXML::test_capacity(long long cpu, long long mem, string & error) const
{
    bool fits = (((max_cpu  - cpu_usage ) >= cpu) &&
                ((max_mem  - mem_usage ) >= mem));

    if (!fits)
    {
        if (NebulaLog::log_level() >= Log::DDEBUG)
        {
            ostringstream oss;

            oss << "Not enough capacity. "
                << "Requested: "
                << cpu << " CPU, "
                << mem << " KB MEM; "
                << "Available: "
                << (max_cpu  - cpu_usage ) << " CPU, "
                << (max_mem  - mem_usage ) << " KB MEM";

            error = oss.str();
        }
        else
        {
            error = "Not enough capacity.";
        }
    }

    return fits;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HostXML::test_ds_capacity(int dsid, long long vm_disk_mb)
{
    if (ds_free_disk.count(dsid) == 0)
    {
        ds_free_disk[dsid] = free_disk;
    }

    return (vm_disk_mb < ds_free_disk[dsid]);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostXML::add_ds_capacity(int dsid, long long vm_disk_mb)
{
    if (ds_free_disk.count(dsid) == 0)
    {
        ds_free_disk[dsid] = free_disk;
    }

    ds_free_disk[dsid] -= vm_disk_mb;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
