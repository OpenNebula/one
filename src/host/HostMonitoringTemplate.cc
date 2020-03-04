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

#include "HostMonitoringTemplate.h"
#include "ObjectXML.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

using namespace std;

#define xml_print(name, value) "<"#name">" << value << "</"#name">"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int CapacityMonitoring::from_template(const Template &tmpl)
{
    int value;
    if (tmpl.get("FREECPU", value))
    {
        add("FREE_CPU", value);
    }
    if (tmpl.get("USEDCPU", value))
    {
        add("USED_CPU", value);
    }
    if (tmpl.get("FREEMEMORY", value))
    {
        add("FREE_MEMORY", value);
    }
    if (tmpl.get("USEDMEMORY", value))
    {
        add("USED_MEMORY", value);
    }
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemMonitoring::from_template(const Template &tmpl)
{
    int value;
    if (tmpl.get("CPUSPEED", value))
    {
        add("CPU_SPEED", value);
    }
    if (tmpl.get("NETTX", value))
    {
        add("NETTX", value);
    }
    if (tmpl.get("NETRX", value))
    {
        add("NETRX", value);
    }
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string HostMonitoringTemplate::to_xml() const
{
    if (_oid == -1)
    {
        return "<MONITORING/>";
    }

    string capacity_s;
    string system_s;

    ostringstream oss;

    oss << "<MONITORING>";

    oss << xml_print(TIMESTAMP, _timestamp);
    oss << xml_print(ID, _oid);
    oss << capacity.to_xml(capacity_s);
    oss << system.to_xml(system_s);

    oss << "</MONITORING>";

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostMonitoringTemplate::from_xml(const std::string& xml_string)
{
    ObjectXML xml(xml_string);

    int rc = xml.xpath(_timestamp, "/MONITORING/TIMESTAMP", 0L);
    rc += xml.xpath(_oid, "/MONITORING/ID", -1);

    if (rc < 0)
    {
        return -1;
    }

    // ------------ Capacity ---------------
    vector<xmlNodePtr> content;
    xml.get_nodes("/MONITORING/CAPACITY", content);

    if (!content.empty())
    {
        capacity.from_xml_node(content[0]);

        xml.free_nodes(content);
        content.clear();
    }

    // ------------ System ---------------
    xml.get_nodes("/MONITORING/SYSTEM", content);

    if (!content.empty())
    {
        system.from_xml_node(content[0]);

        xml.free_nodes(content);
        content.clear();
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostMonitoringTemplate::from_template(const Template &tmpl)
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

    int rc = capacity.from_template(tmpl);
    rc += system.from_template(tmpl);

    return rc;
}
