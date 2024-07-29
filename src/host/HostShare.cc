/* ------------------------------------------------------------------------*/
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems             */
/*                                                                         */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may */
/* not use this file except in compliance with the License. You may obtain */
/* a copy of the License at                                                */
/*                                                                         */
/* http://www.apache.org/licenses/LICENSE-2.0                              */
/*                                                                         */
/* Unless required by applicable law or agreed to in writing, software     */
/* distributed under the License is distributed on an "AS IS" BASIS,       */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.*/
/* See the License for the specific language governing permissions and     */
/* limitations under the License.                                          */
/* ------------------------------------------------------------------------*/

#include <limits.h>

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <iomanip>

#include <math.h>

#include "HostShare.h"

using namespace std;

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

HostShare::HostShare():
    ObjectXML(),
    mem_usage(0),
    cpu_usage(0),
    total_mem(0),
    total_cpu(0),
    max_mem(0),
    max_cpu(0),
    running_vms(0),
    vms_thread(1) {};

ostream& operator<<(ostream& os, const HostShare& hs)
{
    string str;

    os << hs.to_xml(str);

    return os;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& HostShare::to_xml(string& xml) const
{
    string ds_xml, pci_xml, numa_xml;
    ostringstream   oss;

    oss << "<HOST_SHARE>"
        << "<MEM_USAGE>"  << mem_usage  << "</MEM_USAGE>"
        << "<CPU_USAGE>"  << cpu_usage  << "</CPU_USAGE>"
        << "<TOTAL_MEM>"  << total_mem  << "</TOTAL_MEM>"
        << "<TOTAL_CPU>"  << total_cpu  << "</TOTAL_CPU>"
        << "<MAX_MEM>"    << max_mem    << "</MAX_MEM>"
        << "<MAX_CPU>"    << max_cpu    << "</MAX_CPU>"
        << "<RUNNING_VMS>"<<running_vms <<"</RUNNING_VMS>"
        << "<VMS_THREAD>" << vms_thread <<"</VMS_THREAD>"
        << ds.to_xml(ds_xml)
        << pci.to_xml(pci_xml)
        << numa.to_xml(numa_xml)
        << "</HOST_SHARE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int HostShare::from_xml_node(const xmlNodePtr node)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    ObjectXML::update_from_node(node);

    rc += xpath<long long>(mem_usage, "/HOST_SHARE/MEM_USAGE", -1);
    rc += xpath<long long>(cpu_usage, "/HOST_SHARE/CPU_USAGE", -1);

    rc += xpath<long long>(total_mem, "/HOST_SHARE/TOTAL_MEM", -1);
    rc += xpath<long long>(total_cpu, "/HOST_SHARE/TOTAL_CPU", -1);

    rc += xpath<long long>(max_mem, "/HOST_SHARE/MAX_MEM", -1);
    rc += xpath<long long>(max_cpu, "/HOST_SHARE/MAX_CPU", -1);

    rc += xpath<long long>(running_vms, "/HOST_SHARE/RUNNING_VMS", -1);

    xpath<unsigned int>(vms_thread, "/HOST_SHARE/VMS_THREAD", 1);

    // ------------ Datastores ---------------

    ObjectXML::get_nodes("/HOST_SHARE/DATASTORES", content);

    if( content.empty())
    {
        return -1;
    }

    rc += ds.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    // ------------ PCI Devices ---------------

    ObjectXML::get_nodes("/HOST_SHARE/PCI_DEVICES", content);

    if( content.empty())
    {
        return -1;
    }

    rc += pci.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    // ------------ NUMA Nodes ---------------

    ObjectXML::get_nodes("/HOST_SHARE/NUMA_NODES/NODE", content);

    if(!content.empty())
    {
        rc += numa.from_xml_node(content, vms_thread);

        ObjectXML::free_nodes(content);

        if (rc != 0)
        {
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void set_reserved_metric(long long& value, long long mvalue,
                                string& reserved)
{
    bool abs = true;

    if ( reserved.empty() )
    {
        value = mvalue;
        return;
    }

    if (std::isspace(reserved.back()))
    {
        reserved = one_util::trim(reserved);
    }

    if (reserved.back() == '%')
    {
        abs = false;
        reserved.erase(reserved.end()-1);
    }

    istringstream iss(reserved);

    iss >> value;

    if (iss.fail() || !iss.eof())
    {
        value = mvalue;
        return;
    }

    if (abs)
    {
        value = mvalue - value;
    }
    else
    {
        value = mvalue * ( 1 - (value / 100.0));
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShare::set_monitorization(Template& ht, string& rcpu, string& rmem)
{
    ht.get("TOTALCPU", total_cpu);
    ht.erase("TOTALCPU");
    set_reserved_metric(max_cpu, total_cpu, rcpu);

    ht.get("TOTALMEMORY", total_mem);
    ht.erase("TOTALMEMORY");
    set_reserved_metric(max_mem, total_mem, rmem);

    set_monitorization(ht);
}

void HostShare::set_monitorization(Template& ht)
{
    ds.set_monitorization(ht);

    pci.set_monitorization(ht);

    numa.set_monitorization(ht, vms_thread);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShare::update_capacity(Template& ht, string& rcpu, string& rmem)
{
    unsigned int vthread;

    string cpu_ids;

    set_reserved_metric(max_cpu, total_cpu, rcpu);
    set_reserved_metric(max_mem, total_mem, rmem);

    if ( ht.get("VMS_THREAD", vthread) )
    {
        if ( vthread == 0 )
        {
            vthread = 1;

            ht.replace("VMS_THREAD", 1);
        }

        vms_thread = vthread;

        numa.update_cpu_usage(vms_thread);
    }

    if ( ht.get("ISOLCPUS", cpu_ids) )
    {
        numa.reserve_cpus(cpu_ids);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostShare::PinPolicy HostShare::str_to_pin_policy(std::string& pp_s)
{
    one_util::toupper(pp_s);

    if ( pp_s == "NONE" )
    {
        return PP_NONE;
    }
    else if ( pp_s == "CORE" )
    {
        return PP_CORE;
    }
    else if ( pp_s == "THREAD" )
    {
        return PP_THREAD;
    }
    else if ( pp_s == "SHARED" )
    {
        return PP_SHARED;
    }

    return PP_NONE;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HostShare::test_compute(int cpu, long long mem, std::string &error) const
{
    bool cpu_fit  = (max_cpu  - cpu_usage ) >= cpu;
    bool mem_fit  = (max_mem  - mem_usage ) >= mem;

    bool fits = cpu_fit && mem_fit;

    if ( fits )
    {
        return true;
    }

    ostringstream oss;

    if (!cpu_fit)
    {
        oss << "Not enough CPU: " << cpu << "/" << max_cpu - cpu_usage;
    }
    else if (!mem_fit)
    {
        oss << "Not enough memory: " << mem << "/" << max_mem - mem_usage;
    }

    error = oss.str();

    return false;
}

/* -------------------------------------------------------------------------- */

bool HostShare::test_pci(vector<VectorAttribute *>& pci_devs, string& error) const
{
    error = "Unavailable PCI device.";

    return pci.test(pci_devs);
}

/* -------------------------------------------------------------------------- */

bool HostShare::test_numa(HostShareCapacity &sr, string& error) const
{
    error = "Cannot allocate NUMA topology";

    return numa.test(sr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShare::add(HostShareCapacity &sr)
{
    cpu_usage  += sr.cpu;
    mem_usage  += sr.mem;

    ds.add(sr);

    pci.add(sr.pci, sr.vmid);

    numa.add(sr);

    running_vms++;
}

/* -------------------------------------------------------------------------- */

void HostShare::del(HostShareCapacity &sr)
{
    cpu_usage  -= sr.cpu;
    mem_usage  -= sr.mem;

    ds.del(sr);

    pci.del(sr.pci, sr.vmid);

    numa.del(sr);

    running_vms--;
}

/* -------------------------------------------------------------------------- */

void HostShare::revert_pci(HostShareCapacity &sr)
{
    pci.revert(sr.pci);
}

/* -------------------------------------------------------------------------- */

bool HostShare::test(HostShareCapacity& sr, string& error) const
{
    if ( !test_compute(sr.cpu, sr.mem, error) )
    {
        return false;
    }

    if ( !test_pci(sr.pci, error) )
    {
        return false;
    }

    if ( !test_numa(sr, error) )
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

