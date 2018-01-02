/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
#include <stdexcept>
#include <iomanip>

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
    xpath(oid,         "/HOST/ID",                     -1);
    xpath(cluster_id,  "/HOST/CLUSTER_ID",             -1);
    xpath<long long>(mem_usage, "/HOST/HOST_SHARE/MEM_USAGE",   0);
    xpath<long long>(cpu_usage, "/HOST/HOST_SHARE/CPU_USAGE",   0);
    xpath<long long>(max_mem,   "/HOST/HOST_SHARE/MAX_MEM",     0);
    xpath<long long>(max_cpu,   "/HOST/HOST_SHARE/MAX_CPU",     0);
    xpath<long long>(free_disk, "/HOST/HOST_SHARE/FREE_DISK",   0);
    xpath<long long>(running_vms, "/HOST/HOST_SHARE/RUNNING_VMS", 0);

    string public_cloud_st;

    xpath(public_cloud_st, "/HOST/TEMPLATE/PUBLIC_CLOUD", "");
    public_cloud = (one_util::toupper(public_cloud_st) == "YES");

    //-------------------- HostShare Datastores ------------------------------
    vector<string> ds_ids;
    vector<string> ds_free;

    xpaths(ds_ids, "/HOST/HOST_SHARE/DATASTORES/DS/ID");
    xpaths(ds_free,"/HOST/HOST_SHARE/DATASTORES/DS/FREE_MB");

    int id;
    long long disk;

    for (size_t i = 0; i < ds_ids.size() && i < ds_free.size(); i++)
    {
        id   = atoi(ds_ids[i].c_str());
        disk = atoll(ds_free[i].c_str());

        ds_free_disk[id] = disk;
    }

    //-------------------- HostShare PCI Devices ------------------------------
    vector<xmlNodePtr> content;

    get_nodes("/HOST/HOST_SHARE/PCI_DEVICES", content);

    if( !content.empty())
    {
        pci.from_xml_node(content[0]);

        free_nodes(content);

        content.clear();
    }

    //-------------------- Init search xpath routes ---------------------------
    ObjectXML::paths     = host_paths;
    ObjectXML::num_paths = host_num_paths;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HostXML::test_capacity(long long cpu, long long mem,
    vector<VectorAttribute *>& p, string & error)
{
    bool pci_fits = pci.test(p);
    bool fits     = ((max_cpu  - cpu_usage ) >= cpu) &&
                    ((max_mem  - mem_usage ) >= mem) &&
                    pci_fits;
    if (!fits)
    {
        if (NebulaLog::log_level() >= Log::DDEBUG)
        {
            if ( pci_fits )
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
                error = "Unavailable PCI device.";
            }
        }
        else
        {
            if ( pci_fits )
            {
                error = "Not enough capacity.";
            }
            else
            {
                error = "Unavailable PCI device.";
            }
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

ostream& operator<<(ostream& o, const HostXML& p)
{
    map<int, long long>::const_iterator it;

    o << "ID          : " << p.oid          << endl;
    o << "CLUSTER_ID  : " << p.cluster_id   << endl;
    o << "MEM_USAGE   : " << p.mem_usage    << endl;
    o << "CPU_USAGE   : " << p.cpu_usage    << endl;
    o << "MAX_MEM     : " << p.max_mem      << endl;
    o << "MAX_CPU     : " << p.max_cpu      << endl;
    o << "FREE_DISK   : " << p.free_disk    << endl;
    o << "RUNNING_VMS : " << p.running_vms  << endl;
    o << "PUBLIC      : " << p.public_cloud << endl;

    o << endl
      << right << setw(5)  << "DSID" << " "
      << right << setw(15) << "FREE_MB" << " "
      << endl << setw(30) << setfill('-') << "-" << setfill (' ') << endl;

        for (it = p.ds_free_disk.begin() ; it != p.ds_free_disk.end() ; it++)
        {
            o << right << setw(5) << it->first << " "
              << right << setw(15)<< it->second<< " " <<  endl;
        }

    o << endl << p.pci;

    return o;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostXML::get_permissions(PoolObjectAuth& auth)
{
    set<int> cids;

    cids.insert(cluster_id);

    auth.oid      = oid;
    auth.cids     = cids;
    auth.obj_type = PoolObjectSQL::HOST;
}
