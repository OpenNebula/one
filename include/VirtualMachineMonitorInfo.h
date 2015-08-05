/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef VIRTUAL_MACHINE_MONITOR_INFO_H_
#define VIRTUAL_MACHINE_MONITOR_INFO_H_

#include "Template.h"

#include <string.h>

using namespace std;

/**
 *  Virtual Machine Monitor class, stores the monitor data for the VM
 */
class VirtualMachineMonitorInfo : public Template
{
public:
    VirtualMachineMonitorInfo():Template(false,'=',"MONITORING"){};

    ~VirtualMachineMonitorInfo(){};

    /**
     *  Update the monitoring information with data from the probes
     *    @param monitor_data of the VM
     *    @param error description if any
     *    @return 0 on success
     */
    int update(const string& monitor_data, string& error)
    {
        char * error_c = 0;

        clear();

        int rc = parse(monitor_data, &error_c);

        if (rc != 0)
        {
            error = error_c;

            free(error_c);
        }

        return rc;
    };

    char remove_state()
    {
        string state_str;

        get("STATE", state_str);

        erase("STATE");

        if (state_str.empty())
        {
            return '-';
        }

        return state_str[0];
    };
};

#endif

