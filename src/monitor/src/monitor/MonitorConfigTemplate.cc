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

#include "MonitorConfigTemplate.h"

/* -------------------------------------------------------------------------- */
/*  Configuration Defaults                                                    */
/* -------------------------------------------------------------------------- */
void MonitorConfigTemplate::set_conf_default()
{
    VectorAttribute * va;
    /*
     HOST_MONITORING_EXPIRATION_TIME
     VM_MONITORING_EXPIRATION_TIME
     DB
     LOG
     NETWORK
     PROBES_PERIOD
     */

    // Timers
    set_conf_single("MANAGER_TIMER", "15");
    set_conf_single("MONITORING_INTERVAL_HOST", "180");
    set_conf_single("HOST_MONITORING_EXPIRATION_TIME", "43200");
    set_conf_single("VM_MONITORING_EXPIRATION_TIME", "43200");

    va = new VectorAttribute("DB", {{"CONNECTIONS", "15"}});
    conf_default.insert(make_pair(va->name(), va));

    va = new VectorAttribute("LOG", {{"SYSTEM", "FILE"}, {"DEBUG_LEVEL", "3"}});
    conf_default.insert(make_pair(va->name(), va));

    va = new VectorAttribute("NETWORK", {{"ADDRESS", "0.0.0.0"},
        {"PORT", "4124"}, {"THREADS", "16"}
    });
    conf_default.insert(make_pair(va->name(), va));

    va = new VectorAttribute("PROBES_PERIOD", {{"SYSTEM_HOST", "600"},
        {"MONITOR_HOST", "120"}, {"MONITOR_VM", "90"}, {"STATUS_VM", "10"}
    });
    conf_default.insert(make_pair(va->name(), va));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
