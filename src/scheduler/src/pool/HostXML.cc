/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "HostXML.h"


float HostXML::hypervisor_mem;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostXML::init_attributes()
{
    oid         = atoi(((*this)["/HOST/ID"] )[0].c_str() );

    disk_usage  = atoll(((*this)["/HOST/HOST_SHARE/DISK_USAGE"])[0].c_str());
    mem_usage   = atoll(((*this)["/HOST/HOST_SHARE/MEM_USAGE"])[0].c_str());
    cpu_usage   = atoll(((*this)["/HOST/HOST_SHARE/CPU_USAGE"])[0].c_str());

    max_disk    = atoll(((*this)["/HOST/HOST_SHARE/MAX_DISK"])[0].c_str());
    max_mem     = atoll(((*this)["/HOST/HOST_SHARE/MAX_MEM"])[0].c_str());
    max_cpu     = atoll(((*this)["/HOST/HOST_SHARE/MAX_CPU"])[0].c_str());

    running_vms = atoll(((*this)["/HOST/HOST_SHARE/RUNNING_VMS"])[0].c_str());

    //Reserve memory for the hypervisor
    max_mem = static_cast<int>(hypervisor_mem * static_cast<float>(max_mem));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

