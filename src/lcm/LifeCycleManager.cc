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

#include "LifeCycleManager.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "Request.h"

/* -------------------------------------------------------------------------- */

int LifeCycleManager::start()
{
    NebulaLog::log("LCM", Log::INFO, "Starting Life-cycle Manager...");

    Listener::start();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::init_managers()
{
    Nebula& nd = Nebula::instance();

    tm      = nd.get_tm();
    vmm     = nd.get_vmm();
    dm      = nd.get_dm();
    imagem  = nd.get_imagem();

    vmpool = nd.get_vmpool();
    hpool  = nd.get_hpool();
    ipool  = nd.get_ipool();
    dspool = nd.get_dspool();
    sgpool = nd.get_secgrouppool();
    clpool = nd.get_clpool();
    vnpool = nd.get_vnpool();
    bjpool = nd.get_bjpool();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
