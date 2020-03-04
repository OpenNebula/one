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

#include "VirtualMachineMonitorInfo.h"
#include "ObjectXML.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

using namespace std;

#define xml_print(name, value) "<"#name">" << value << "</"#name">"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachineMonitorInfo::to_xml() const
{
    string monitor_str;

    return monitoring.to_xml(monitor_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachineMonitorInfo::to_xml_extended() const
{
    string monitor_str;
    ostringstream oss;

    oss << "<MONITORING>";

    oss << xml_print(TIMESTAMP, _timestamp);
    oss << xml_print(ID, _oid);
    oss << monitoring.to_xml(monitor_str);

    oss << "</MONITORING>";

    // todo add Template (CPU and MEMORY)
    return oss.str();
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
            << "<CPU>"    << one_util::escape_xml(cpu)    <<  "</CPU>"
            << "<MEMORY>" << one_util::escape_xml(memory) <<  "</MEMORY>"
            << "<STATE>"  << one_util::escape_xml(state)  <<  "</STATE>"
            << "</MONITORING>";
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineMonitorInfo::from_xml(const std::string& xml_string)
{
    ObjectXML xml(xml_string);

    int rc = xml.xpath(_timestamp, "/MONITORING/TIMESTAMP", 0L);
    rc += xml.xpath(_oid, "/MONITORING/ID", -1);

    if (rc < 0)
    {
        return -1;
    }

    vector<xmlNodePtr> content;
    xml.get_nodes("/MONITORING/MONITORING", content);

    if (!content.empty())
    {
        monitoring.from_xml_node(content[0]);

        xml.free_nodes(content);
        content.clear();
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineMonitorInfo::from_template(const Template &tmpl)
{
    int tmp;
    if (tmpl.get("OID", tmp))
    {
        _oid = tmp;
    }

    if (_oid < 0)
    {
        return -1;
    }

    monitoring.merge(&tmpl);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineMonitorInfo::reset_info()
{
    _timestamp = time(0);

    monitoring.replace("CPU","0.0");

    monitoring.replace("MEMORY","0");
}