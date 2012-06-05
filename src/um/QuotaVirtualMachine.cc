/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * QuotaVirtualMachine::VM_METRICS[] = {"VMS", "CPU", "MEMORY"};

const int QuotaVirtualMachine::NUM_VM_METRICS  = 3;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::get_quota(const string& id, VectorAttribute **va)
{
    vector<Attribute*> values;
    int num;

    *va = 0;

    num = get(template_name, values);

    if ( num == 0 )
    {
        return 0;
    }

    *va = dynamic_cast<VectorAttribute *>(values[0]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaVirtualMachine::check(Template * tmpl,  string& error)
{
    map<string, int> vm_request;

    int memory;
    int cpu;

    if ( tmpl->get("MEMORY", memory) == false )
    {
        error = "MEMORY not defined for VM";
        return false;
    }

    if ( tmpl->get("CPU", cpu) == false )
    {
        error = "CPU not defined for VM";
        return false;
    }

    vm_request.insert(make_pair("VMS",1));
    vm_request.insert(make_pair("MEMORY", memory));
    vm_request.insert(make_pair("CPU", cpu));
    
    return check_quota("", vm_request, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaVirtualMachine::del(Template * tmpl)
{
    map<string, int> vm_request;

    int memory;
    int cpu;

    if ( tmpl->get("MEMORY", memory) == false )
    {
        return;
    }

    if ( tmpl->get("CPU", cpu) == false )
    {
        return;
    }

    vm_request.insert(make_pair("VMS",1));
    vm_request.insert(make_pair("MEMORY", memory));
    vm_request.insert(make_pair("CPU", cpu));
    
    del_quota("", vm_request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
