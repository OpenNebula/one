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

#ifndef VIRTUAL_MACHINE_MONITOR_INFO_H_
#define VIRTUAL_MACHINE_MONITOR_INFO_H_

#include "Template.h"

#include <string>

/**
 *  Virtual Machine Monitor class, stores the monitor data for the VM in
 *  template format.
 *
 *  The template is free format but the following keys are used:
 *    - ID of the VM (mandatory)
 *    - TIMESTAMP of the monitoring record (mandatory)
 *    - CPU, MEMORY
 *
 *  Example:
 *
 *  <MONITORING>
 *      <TIMESTAMP>1584698508</TIMESTAMP>
 *      <ID>0</ID>
 *      <CPU><![CDATA[5.02]]></CPU>
 *      <DISKRDBYTES><![CDATA[346366848]]></DISKRDBYTES>
 *      <DISKRDIOPS><![CDATA[9935]]></DISKRDIOPS>
 *      <DISKWRBYTES><![CDATA[1058840064]]></DISKWRBYTES>
 *      <DISKWRIOPS><![CDATA[107167]]></DISKWRIOPS>
 *      <MEMORY><![CDATA[1098912]]></MEMORY>
 *      <NETRX><![CDATA[567412942]]></NETRX>
 *      <NETTX><![CDATA[3592223]]></NETTX>
 *  </MONITORING>
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

    /**
     *  @return a xml string representation of the monitoring record
     */
    std::string to_xml() const;

    /**
     *  @return a xml string including only STATE, CPU and MEMORY attributes
     */
    std::string to_xml_short() const;

    /**
     *  Loads an exisiting monitoring record from xml_string.
     *    @param xml_string representation
     *    @return 0 on succes, -1 otherwise
     */
    int from_xml(const std::string& xml_string);

    /**
     *  The contents of the provided template are merged with any previous
     *  exisiting data, preserving it.
     *    @param tmpl with monitoring attributes
     *    @return 0 on succes, -1 otherwise
     */
    int from_template(const Template &tmpl);

    // -------------------------------------------------------------------------
    // Class set/getters
    // -------------------------------------------------------------------------
    int oid() const { return _oid; }

    void oid(int oid) { _oid = oid; }

    time_t timestamp() const { return _timestamp; }

    void timestamp(time_t timestamp) { _timestamp = timestamp; }

private:
    int    _oid;
    time_t _timestamp;

    Template monitoring{false, '=', "MONITORING"};
};

#endif

