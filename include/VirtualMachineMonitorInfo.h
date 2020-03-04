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

#ifndef VIRTUAL_MACHINE_MONITOR_INFO_H_
#define VIRTUAL_MACHINE_MONITOR_INFO_H_

#include "Template.h"

#include <string>

/**
 *  Virtual Machine Monitor class, stores the monitor data for the VM
 */
class VirtualMachineMonitorInfo
{
public:
    VirtualMachineMonitorInfo()
        : _oid(-1)
        , _timestamp(0)
    {
    }

    VirtualMachineMonitorInfo(int oid, time_t timestamp)
        : _oid(oid)
        , _timestamp(timestamp)
    {
    }

    int oid() const { return _oid; }

    void oid(int oid) { _oid = oid; }

    time_t timestamp() const { return _timestamp; }

    void timestamp(time_t timestamp) { _timestamp = timestamp; }

    std::string to_xml() const;

    std::string to_xml_extended() const;

    std::string to_xml_short() const;

    /**
     *  Fills monitoring data from xml_string
     *  If some data are not contained, keep old data
     *  @return 0 on succes, -1 otherwise
     */
    int from_xml(const std::string& xml_string);

    int from_template(const Template &tmpl);

    /**
     * Reset monitoring data to zero
     */
    void reset_info();

private:
    int    _oid;
    time_t _timestamp;

    Template monitoring{false, '=', "MONITORING"};
};

#endif

