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

#include <math.h>
#include "HostXML.h"


void HostXML::get_capacity(int& cpu, int& memory, float threshold) const
{
    vector<string> result;

    memory      = free_mem;
    cpu         = free_cpu;

    /* eg. 96.7 >= 0.9 * 100, We need to round */
    if ( cpu >= static_cast<int>(threshold * static_cast<float>(max_cpu)) )
    {
        cpu = static_cast<int>(ceil(static_cast<float>(cpu)/100.0) * 100);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostXML::init_attributes()
{
    oid         = atoi(((*this)["/HOST/ID"] )[0].c_str() );

    disk_usage  = atoi(((*this)["/HOST/HOST_SHARE/DISK_USAGE"])[0].c_str());
    mem_usage   = atoi(((*this)["/HOST/HOST_SHARE/MEM_USAGE"])[0].c_str());
    cpu_usage   = atoi(((*this)["/HOST/HOST_SHARE/CPU_USAGE"])[0].c_str());

    max_disk    = atoi(((*this)["/HOST/HOST_SHARE/MAX_DISK"])[0].c_str());
    max_mem     = atoi(((*this)["/HOST/HOST_SHARE/MAX_MEM"])[0].c_str());
    max_cpu     = atoi(((*this)["/HOST/HOST_SHARE/MAX_CPU"])[0].c_str());

    free_disk   = atoi(((*this)["/HOST/HOST_SHARE/FREE_DISK"])[0].c_str());
    free_mem    = atoi(((*this)["/HOST/HOST_SHARE/FREE_MEM"])[0].c_str());
    free_cpu    = atoi(((*this)["/HOST/HOST_SHARE/FREE_CPU"])[0].c_str());

    running_vms = atoi(((*this)["/HOST/HOST_SHARE/RUNNING_VMS"])[0].c_str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

