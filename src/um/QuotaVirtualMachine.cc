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

#include "QuotaVirtualMachine.h"
#include "Quotas.h"
#include "VirtualMachine.h"
#include "VirtualMachineDisk.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::vector<std::string> QuotaVirtualMachine::VM_METRICS = {"VMS", "RUNNING_VMS", "CPU",
                                                            "RUNNING_CPU", "MEMORY", "RUNNING_MEMORY", "SYSTEM_DISK_SIZE"
                                                           };

std::vector<std::string> QuotaVirtualMachine::VM_GENERIC;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::get_quota(const string& id, VectorAttribute **va)
{
    *va = get(template_name);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaVirtualMachine::check(Template * tmpl,
                                Quotas& default_quotas,
                                string& error)
{
    map<string, float> vm_request;

    int         memory, running_memory;
    int         vms, running_vms;
    float       cpu, running_cpu;
    long long   size;

    if ( tmpl->get("MEMORY", memory)  )
    {
        if ( memory < 0 )
        {
            error = "MEMORY attribute must be a positive integer value";
            return false;
        }

        vm_request.insert(make_pair("MEMORY", memory));
    }

    if ( tmpl->get("CPU", cpu) )
    {
        if ( cpu < 0 )
        {
            error = "CPU attribute must be a positive float or integer value";
            return false;
        }

        vm_request.insert(make_pair("CPU", cpu));
    }

    size = VirtualMachineDisks::system_ds_size(tmpl, true);

    size += VirtualMachine::get_snapshots_system_size(tmpl);

    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    if ( tmpl->get("VMS", vms) )
    {
        vm_request.insert(make_pair("VMS", vms));
    }

    if ( tmpl->get("RUNNING_MEMORY", running_memory) )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", running_memory));
    }

    if ( tmpl->get("RUNNING_CPU", running_cpu) )
    {
        vm_request.insert(make_pair("RUNNING_CPU", running_cpu));
    }

    if ( tmpl->get("RUNNING_VMS", running_vms) )
    {
        vm_request.insert(make_pair("RUNNING_VMS", running_vms));
    }

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;
        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    return check_quota("", vm_request, default_quotas, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaVirtualMachine::add(Template * tmpl)
{
    map<string, float> vm_request;

    float value;

    if ( tmpl->get("MEMORY", value) )
    {
        vm_request.insert(make_pair("MEMORY", value));
    }

    if ( tmpl->get("CPU", value) )
    {
        vm_request.insert(make_pair("CPU", value));
    }

    if ( tmpl->get("VMS", value) )
    {
        vm_request.insert(make_pair("VMS", value));
    }

    if ( tmpl->get("RUNNING_MEMORY", value) )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", value));
    }

    if ( tmpl->get("RUNNING_CPU", value) )
    {
        vm_request.insert(make_pair("RUNNING_CPU", value));
    }

    if ( tmpl->get("RUNNING_VMS", value) )
    {
        vm_request.insert(make_pair("RUNNING_VMS", value));
    }

    long long size = VirtualMachineDisks::system_ds_size(tmpl, true);

    size += VirtualMachine::get_snapshots_system_size(tmpl);

    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;
        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    add_quota("", vm_request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaVirtualMachine::del(Template * tmpl)
{
    map<string, float> vm_request;

    int         memory, running_memory, running_vms, vms;
    float       cpu, running_cpu;
    long long   size;

    if ( tmpl->get("MEMORY", memory) )
    {
        vm_request.insert(make_pair("MEMORY", memory));
    }

    if ( tmpl->get("CPU", cpu) )
    {
        vm_request.insert(make_pair("CPU", cpu));
    }

    if ( tmpl->get("VMS", vms) )
    {
        vm_request.insert(make_pair("VMS", vms));
    }

    if ( tmpl->get("RUNNING_MEMORY", running_memory) )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", running_memory));
    }

    if ( tmpl->get("RUNNING_CPU", running_cpu) )
    {
        vm_request.insert(make_pair("RUNNING_CPU", running_cpu));
    }

    if ( tmpl->get("RUNNING_VMS", running_vms) )
    {
        vm_request.insert(make_pair("RUNNING_VMS", running_vms));
    }

    size = VirtualMachineDisks::system_ds_size(tmpl, true);

    size += VirtualMachine::get_snapshots_system_size(tmpl);

    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;
        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    del_quota("", vm_request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::add_metric_generic(const std::string& metric)
{
    if (std::find(VM_METRICS.begin(), VM_METRICS.end(), metric) != VM_METRICS.end())
    {
        return -1;
    }

    VM_METRICS.push_back(metric);
    VM_METRICS.push_back("RUNNING_" + metric);
    VM_GENERIC.push_back(metric);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void QuotaVirtualMachine::add_running_quota_generic(Template& tmpl)
{
    for (const string& metric : VM_GENERIC)
    {
        string value;
        if (tmpl.get(metric, value))
        {
            tmpl.add("RUNNING_" + metric, value);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::get_default_quota(
        const string& id,
        Quotas& default_quotas,
        VectorAttribute **va)
{
    return default_quotas.vm_get(id, va);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaVirtualMachine::update(Template * tmpl,
                                 Quotas& default_quotas,
                                 string& error)
{
    map<string, float> vm_request;

    int         delta_memory, delta_running_memory, delta_running_vms;
    float       delta_cpu, delta_running_cpu;
    long long   delta_size;


    if ( tmpl->get("MEMORY", delta_memory) == true )
    {
        vm_request.insert(make_pair("MEMORY", delta_memory));
    }

    if ( tmpl->get("RUNNING_MEMORY", delta_running_memory) == true )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", delta_running_memory));
    }

    if ( tmpl->get("RUNNING_VMS", delta_running_vms) == true )
    {
        vm_request.insert(make_pair("RUNNING_VMS", delta_running_vms));
    }

    if ( tmpl->get("CPU", delta_cpu) == true )
    {
        vm_request.insert(make_pair("CPU", delta_cpu));
    }

    if ( tmpl->get("RUNNING_CPU", delta_running_cpu) == true )
    {
        vm_request.insert(make_pair("RUNNING_CPU", delta_running_cpu));
    }

    delta_size = VirtualMachineDisks::system_ds_size(tmpl, true);

    delta_size += VirtualMachine::get_snapshots_system_size(tmpl);

    if ( delta_size != 0 )
    {
        vm_request.insert(make_pair("SYSTEM_DISK_SIZE", delta_size));
    }

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;
        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    return check_quota("", vm_request, default_quotas, error);
}
