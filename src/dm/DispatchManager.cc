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

#include "DispatchManager.h"
#include "Nebula.h"
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * dm_action_loop(void *arg)
{
    DispatchManager *  dm;

    if ( arg == 0 )
    {
        return 0;
    }

    dm = static_cast<DispatchManager *>(arg);

    NebulaLog::log("DiM",Log::INFO,"Dispatch Manager started.");

    dm->am.loop();

    NebulaLog::log("DiM",Log::INFO,"Dispatch Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int DispatchManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    NebulaLog::log("DiM",Log::INFO,"Starting Dispatch Manager...");

    rc = pthread_create(&dm_thread, &pattr, dm_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::user_action(const ActionRequest& ar)
{
    const DMAction& dm_ar = static_cast<const DMAction& >(ar);
    int vid   = dm_ar.vm_id();

    switch (dm_ar.action())
    {
        case DMAction::SUSPEND_SUCCESS:
            suspend_success_action(vid);
            break;

        case DMAction::STOP_SUCCESS:
            stop_success_action(vid);
            break;

        case DMAction::UNDEPLOY_SUCCESS:
            undeploy_success_action(vid);
            break;

        case DMAction::POWEROFF_SUCCESS:
            poweroff_success_action(vid);
            break;

        case DMAction::DONE:
            done_action(vid);
            break;

        case DMAction::RESUBMIT:
            resubmit_action(vid);
            break;
    }
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
        VirtualMachineTemplate& quota_tmpl, bool only_running)
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

