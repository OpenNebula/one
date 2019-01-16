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

#include "QuotaVirtualMachine.h"
#include "Quotas.h"
#include "VirtualMachine.h"
#include "VirtualMachineDisk.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * QuotaVirtualMachine::VM_METRICS[] = {"VMS", "RUNNING_VMS", "CPU", 
    "RUNNING_CPU", "MEMORY", "RUNNING_MEMORY", "SYSTEM_DISK_SIZE"};

const int QuotaVirtualMachine::NUM_VM_METRICS  = 7;

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

    if ( tmpl->get("MEMORY", memory) == false  || memory < 0 )
    {
        error = "MEMORY attribute must be a positive integer value";
        return false;
    }

    if ( tmpl->get("CPU", cpu) == false || cpu < 0 )
    {
        error = "CPU attribute must be a positive float or integer value";
        return false;
    }

    size = VirtualMachineDisks::system_ds_size(tmpl);

    if ( tmpl->get("VMS", vms) == false )
    {
        vms = 1;
    }

    if ( tmpl->get("RUNNING_MEMORY", running_memory) )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", running_memory));
    }
    else
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", 0));
    }

    if ( tmpl->get("RUNNING_CPU", running_cpu) )
    {
        vm_request.insert(make_pair("RUNNING_CPU", running_cpu));
    }
    else
    {
        vm_request.insert(make_pair("RUNNING_CPU", 0));
    }

    if ( tmpl->get("RUNNING_VMS", running_vms) )
    {
        vm_request.insert(make_pair("RUNNING_VMS", running_vms));
    }
    else
    {
        vm_request.insert(make_pair("RUNNING_VMS", 0));
    }

    vm_request.insert(make_pair("VMS", vms));
    vm_request.insert(make_pair("MEMORY", memory));
    vm_request.insert(make_pair("CPU", cpu));
    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    return check_quota("", vm_request, default_quotas, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaVirtualMachine::del(Template * tmpl)
{
    map<string, float> vm_request;

    int         memory, running_memory, running_vms, vms;
    float       cpu, running_cpu;
    long long   size;

    if ( tmpl->get("MEMORY", memory) == false )
    {
        memory = 0;
    }

    if ( tmpl->get("CPU", cpu) == false )
    {
        cpu = 0;
    }

    if ( tmpl->get("VMS", vms) == false )
    {
        vms = 1;
    }

    if ( tmpl->get("RUNNING_MEMORY", running_memory) == false )
    {
        running_memory = 0;
    }

    if ( tmpl->get("RUNNING_CPU", running_cpu) == false )
    {
        running_cpu = 0;
    }

    if ( tmpl->get("RUNNING_VMS", running_vms) == false )
    {
        running_vms = 0;
    }

    size = VirtualMachineDisks::system_ds_size(tmpl);

    vm_request.insert(make_pair("VMS", vms));
    vm_request.insert(make_pair("MEMORY", memory));
    vm_request.insert(make_pair("CPU", cpu));
    vm_request.insert(make_pair("RUNNING_VMS", running_vms));
    vm_request.insert(make_pair("RUNNING_MEMORY", running_memory));
    vm_request.insert(make_pair("RUNNING_CPU", running_cpu));
    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    del_quota("", vm_request);
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

    delta_size = VirtualMachineDisks::system_ds_size(tmpl);

    if ( delta_size != 0 )
    {
        vm_request.insert(make_pair("SYSTEM_DISK_SIZE", delta_size));
    }

    return check_quota("", vm_request, default_quotas, error);
}
