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

#include <math.h>
#include <sstream>
#include <stdexcept>
#include <iomanip>

#include "HostXML.h"
#include "NebulaUtil.h"
#include "NebulaLog.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
int HostXML::host_num_paths = 7;

const char *HostXML::host_paths[] =
{
    "/HOST/TEMPLATE/",
    "/HOST/HOST_SHARE/",
    "/HOST/HOST_SHARE/DATASTORES/",
    "/HOST/MONITORING/CAPACITY/",
    "/HOST/MONITORING/SYSTEM/",
    "/HOST/",
    "/HOST/CLUSTER_TEMPLATE/"
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShareXML::init_attributes(ObjectXML * host)
{
    //------------------ HostShare Computing Capacity --------------------------
    host->xpath<long long>(mem_usage, "/HOST/HOST_SHARE/MEM_USAGE", 0);
    host->xpath<long long>(cpu_usage, "/HOST/HOST_SHARE/CPU_USAGE", 0);

    host->xpath<long long>(max_mem, "/HOST/HOST_SHARE/MAX_MEM", 0);
    host->xpath<long long>(max_cpu, "/HOST/HOST_SHARE/MAX_CPU", 0);

    host->xpath<long long>(free_disk, "/HOST/HOST_SHARE/DATASTORES/FREE_DISK", 0);
    host->xpath<long long>(running_vms, "/HOST/HOST_SHARE/RUNNING_VMS", 0);

    //-------------------- HostShare Datastores ------------------------------
    std::vector<int> ds_ids;
    std::vector<long long> ds_free;

    host->xpaths<int>(ds_ids, "/HOST/HOST_SHARE/DATASTORES/DS/ID");
    host->xpaths<long long>(ds_free, "/HOST/HOST_SHARE/DATASTORES/DS/FREE_MB");

    for (size_t i = 0; i < ds_ids.size() && i < ds_free.size(); i++)
    {
        ds_free_disk[ds_ids[i]] = ds_free[i];
    }

    //-------------------- HostShare PCI Devices ------------------------------
    vector<xmlNodePtr> content;

    host->get_nodes("/HOST/HOST_SHARE/PCI_DEVICES", content);

    if( !content.empty())
    {
        pci.from_xml_node(content[0]);

        host->free_nodes(content);
    }

    //---------------------- HostShare NUMA Nodes ------------------------------
    unsigned int vms_thread;

    host->xpath<unsigned int>(vms_thread, "/HOST/HOST_SHARE/VMS_THREAD", 1);

    host->get_nodes("/HOST/HOST_SHARE/NUMA_NODES/NODE", content);

    if(!content.empty())
    {
        numa.from_xml_node(content, vms_thread);

        host->free_nodes(content);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HostShareXML::test_capacity(HostShareCapacity &sr, string & error)
{
    bool pci_fit  = pci.test(sr.pci);
    bool numa_fit = numa.test(sr);
    bool cpu_fit  = (max_cpu  - cpu_usage ) >= sr.cpu;
    bool mem_fit  = (max_mem  - mem_usage ) >= sr.mem;

    bool fits = cpu_fit && mem_fit && numa_fit && pci_fit;

    if ( fits )
    {
        return true;
    }

    ostringstream oss;

    if (!cpu_fit)
    {
        oss << "Not enough CPU capacity: " << sr.cpu << "/" << max_cpu  - cpu_usage;
    }
    else if (!mem_fit)
    {
        oss << "Not enough memory: " << sr.mem << "/" << max_mem  - mem_usage;
    }
    else if (!numa_fit)
    {
        oss << "Cannot allocate NUMA topology";
    }
    else if (!pci_fit)
    {
        oss <<  "Unavailable PCI device.";
    }

    error = oss.str();

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& o, const HostShareXML& s)
{
    o << "MEM_USAGE   : " << s.mem_usage   << endl;
    o << "CPU_USAGE   : " << s.cpu_usage   << endl;
    o << "MAX_MEM     : " << s.max_mem     << endl;
    o << "MAX_CPU     : " << s.max_cpu     << endl;
    o << "FREE_DISK   : " << s.free_disk   << endl;
    o << "RUNNING_VMS : " << s.running_vms << endl;
    o << endl;

    o << right << setw(5)  << "DSID" << " " << right << setw(15) << "FREE_MB"
      << " " << endl << setw(30) << setfill('-') << "-" << setfill (' ') << endl;

    for (auto it = s.ds_free_disk.begin() ; it != s.ds_free_disk.end() ; ++it)
    {
        o << right << setw(5) << it->first << " "
          << right << setw(15)<< it->second<< " " <<  endl;
    }

    o << endl << s.pci;

    o << endl << s.numa;

    return o;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostXML::init_attributes()
{
    std::string public_cloud_st;

    //--------------------- Init host attributes -------------------------------
    xpath(oid,         "/HOST/ID",                     -1);
    xpath(cluster_id,  "/HOST/CLUSTER_ID",             -1);

    xpath(public_cloud_st, "/HOST/TEMPLATE/PUBLIC_CLOUD", "");
    public_cloud = (one_util::toupper(public_cloud_st) == "YES");

    share.init_attributes(this);

    //-------------------- Init search xpath routes ---------------------------
    ObjectXML::paths     = host_paths;
    ObjectXML::num_paths = host_num_paths;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& o, const HostXML& p)
{
    o << "ID          : " << p.oid        << endl;
    o << "CLUSTER_ID  : " << p.cluster_id << endl;
    o << "PUBLIC      : " << p.public_cloud << endl;
    o << p.share;

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

