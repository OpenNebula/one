/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#include "DispatchManager.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "VirtualMachine.h"

using namespace std;

/* -------------------------------------------------------------------------- */

int DispatchManager::start()
{
    NebulaLog::log("DiM",Log::INFO,"Starting Dispatch Manager...");

    Listener::start();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::init_managers()
{
    Nebula& nd = Nebula::instance();

    tm  = nd.get_tm();
    vmm = nd.get_vmm();
    lcm = nd.get_lcm();

    imagem = nd.get_imagem();

    hpool       = nd.get_hpool();
    vmpool      = nd.get_vmpool();
    clpool      = nd.get_clpool();
    vrouterpool = nd.get_vrouterpool();
    upool       = nd.get_upool();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::get_quota_template(VirtualMachine * vm,
        VirtualMachineTemplate& quota_tmpl, bool only_running) const
{
    std::string memory, cpu;

    vm->get_template_attribute("MEMORY", memory);
    vm->get_template_attribute("CPU", cpu);

    if ( (vm->get_state() == VirtualMachine::ACTIVE) ||
         (vm->get_state() == VirtualMachine::PENDING) ||
         (vm->get_state() == VirtualMachine::CLONING) ||
         (vm->get_state() == VirtualMachine::CLONING_FAILURE) ||
         (vm->get_state() == VirtualMachine::HOLD) )
    {
        quota_tmpl.add("RUNNING_MEMORY", memory);
        quota_tmpl.add("RUNNING_CPU", cpu);
        quota_tmpl.add("RUNNING_VMS", 1);

        if (only_running)
        {
            quota_tmpl.add("MEMORY", 0);
            quota_tmpl.add("CPU", 0);
            quota_tmpl.add("VMS", 0);
        }
        else
        {
            quota_tmpl.add("MEMORY", memory);
            quota_tmpl.add("CPU", cpu);
            quota_tmpl.add("VMS", 1);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

