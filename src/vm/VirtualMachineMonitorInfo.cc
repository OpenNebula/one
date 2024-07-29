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

#include "VirtualMachineMonitorInfo.h"
#include "ObjectXML.h"
#include "Attribute.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

using namespace std;

#define xml_print(name, value) "<"#name">" << one_util::escape_xml(value) \
                                           << "</"#name">"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachineMonitorInfo::to_xml() const
{
    string tmp;

    return monitoring.to_xml(tmp);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachineMonitorInfo::to_xml_short() const
{
    ostringstream oss;
    string cpu, memory, state;

    if (monitoring.empty())
    {
        oss << "<MONITORING/>";
    }
    else
    {
        monitoring.get("CPU", cpu);
        monitoring.get("MEMORY", memory);
        monitoring.get("STATE", state);

        oss << "<MONITORING>"
            << xml_print(CPU, cpu)
            << xml_print(MEMORY, memory)
            << xml_print(STATE, state)
            << "</MONITORING>";
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineMonitorInfo::from_xml(const std::string& xml_string)
{
    int rc = monitoring.from_xml(xml_string);

    if (rc < 0 || !monitoring.get("TIMESTAMP", _timestamp)
        || !monitoring.get("ID", _oid))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineMonitorInfo::from_template(const Template &tmpl)
{
    monitoring.merge(&tmpl);

    monitoring.replace("ID", _oid);
    monitoring.replace("TIMESTAMP", _timestamp);

    return 0;
}

