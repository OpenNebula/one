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

#include "DispatchManager.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "VirtualMachine.h"

using namespace std;

/* -------------------------------------------------------------------------- */

int DispatchManager::start()
{
    NebulaLog::log("DiM", Log::INFO, "Starting Dispatch Manager...");

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
    vnpool      = nd.get_vnpool();
    vrouterpool = nd.get_vrouterpool();
    upool       = nd.get_upool();
    sgpool      = nd.get_secgrouppool();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

