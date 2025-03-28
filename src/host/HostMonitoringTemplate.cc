/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

using namespace std;

#define xml_print(name, value) "<"#name">" << value << "</"#name">"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template <typename T>
static void get_set(const Template &tmpl, Template *dst,
        const std::map<std::string, std::string>& key_map)
{
    T value;

    for (const auto& [probe_k, monitor_k] : key_map)
    {
        if (tmpl.get(probe_k, value))
        {
            dst->add(monitor_k, value);
        }
    }
}

int CapacityMonitoring::from_template(const Template &tmpl)
{
    static std::map<std::string, std::string> capacity_map = {
        {"FREECPU", "FREE_CPU"},
        {"USEDCPU", "USED_CPU"},
        {"FREEMEMORY", "FREE_MEMORY"},
        {"USEDMEMORY", "USED_MEMORY"},
    };

    static std::map<std::string, std::string> forecast_map = {
        {"FREECPU_FORECAST",        "FREE_CPU_FORECAST"},
        {"FREECPU_FORECAST_FAR",    "FREE_CPU_FORECAST_FAR"},
        {"USEDCPU_FORECAST",        "USED_CPU_FORECAST"},
        {"USEDCPU_FORECAST_FAR",    "USED_CPU_FORECAST_FAR"},
        {"FREEMEMORY_FORECAST",     "FREE_MEMORY_FORECAST"},
        {"FREEMEMORY_FORECAST_FAR", "FREE_MEMORY_FORECAST_FAR"},
        {"USEDMEMORY_FORECAST",     "USED_MEMORY_FORECAST"},
        {"USEDMEMORY_FORECAST_FAR", "USED_MEMORY_FORECAST_FAR"}
    };

    get_set<unsigned long>(tmpl, this, capacity_map);

    get_set<double>(tmpl, this, forecast_map);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemMonitoring::from_template(const Template &tmpl)
{
    static std::map<std::string, std::string> system_map = {
        {"CPUSPEED", "CPU_SPEED"},
        {"NETTX",    "NETTX"},
        {"NETRX",    "NETRX"},
    };

    static std::map<std::string, std::string> forecast_map = {
        {"NETTX_BW",              "NETTX_BW"},
        {"NETTX_BW_FORECAST",     "NETTX_BW_FORECAST"},
        {"NETTX_BW_FORECAST_FAR", "NETTX_BW_FORECAST_FAR"},
        {"NETRX_BW",              "NETRX_BW"},
        {"NETRX_BW_FORECAST",     "NETRX_BW_FORECAST"},
        {"NETRX_BW_FORECAST_FAR", "NETRX_BW_FORECAST_FAR"}
    };

    get_set<unsigned long>(tmpl, this, system_map);

    get_set<double>(tmpl, this, forecast_map);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string NUMAMonitoring::to_xml() const
{
    ostringstream oss;
    string node_str;

    for (const auto& node : nodes)
    {
        oss << node.second.to_xml(node_str);
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int NUMAMonitoring::from_xml(ObjectXML& xml, const std::string& xpath_prefix)
{
    vector<xmlNodePtr> content;

    xml.get_nodes(xpath_prefix + "NUMA_NODE", content);

    for (const auto node_xml : content)
    {
        NUMAMonitoringNode node;
        node.from_xml_node(node_xml);

        unsigned int id;
        node.get("NODE_ID", id);
        nodes[id] = node;
    }

    xml.free_nodes(content);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int NUMAMonitoring::from_template(const Template &tmpl)
{
    // Parse HugePages
    vector<const VectorAttribute*> huge_pages;

    tmpl.get("HUGEPAGE", huge_pages);

    for (const auto* page : huge_pages)
    {
        int node_id;
        unsigned long size;
        unsigned long fr;

        if (page->vector_value("NODE_ID", node_id) != 0)
        {
            NebulaLog::warn("HMM", "Hugepage doesn't contain node ID: "
                            + page->marshall(","));

            continue;
        }

        if (page->vector_value("SIZE", size) != 0)
        {
            NebulaLog::warn("HMM", "Hugepage doesn't contain size: "
                            + page->marshall(","));

            continue;
        }

        page->vector_value("FREE", fr);

        set_huge_page(node_id, size, fr);
    }

    // Parse Memory nodes
    vector<const VectorAttribute*> mem_nodes;

    tmpl.get("MEMORY_NODE", mem_nodes);

    for (const auto* mem : mem_nodes)
    {
        int node_id;
        unsigned long used;
        unsigned long fr;

        if (mem->vector_value("NODE_ID", node_id) != 0)
        {
            NebulaLog::warn("HMM", "Memory node doesn't contain node ID: "
                            + mem->marshall(","));

            continue;
        }

        mem->vector_value("USED", used);
        mem->vector_value("FREE", fr);

        set_memory(node_id, used, fr);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void NUMAMonitoring::set_huge_page(unsigned int node_id, unsigned long size, unsigned long fr)
{
    NUMAMonitoringNode* node;

    auto it = nodes.find(node_id);
    if ( it != nodes.end())
    {
        node = &it->second;
    }
    else
    {
        auto res = nodes.insert(make_pair(node_id, NUMAMonitoringNode()));
        node = &res.first->second;
        node->add("NODE_ID", node_id);
    }

    auto vatt = new VectorAttribute("HUGEPAGE");
    vatt->replace("SIZE", size);
    vatt->replace("FREE", fr);

    node->set(vatt);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void NUMAMonitoring::set_memory(unsigned int node_id, unsigned long used, unsigned long fr)
{
    NUMAMonitoringNode* node;

    auto it = nodes.find(node_id);
    if ( it != nodes.end())
    {
        node = &it->second;
    }
    else
    {
        auto res = nodes.insert(make_pair(node_id, NUMAMonitoringNode()));
        node = &res.first->second;
        node->add("NODE_ID", node_id);
    }

    auto vatt = new VectorAttribute("MEMORY");
    vatt->replace("USED", used);
    vatt->replace("FREE", fr);

    node->set(vatt);
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
    oss << numa.to_xml();

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
    }

    // ------------ System ---------------
    xml.get_nodes("/MONITORING/SYSTEM", content);

    if (!content.empty())
    {
        system.from_xml_node(content[0]);

        xml.free_nodes(content);
    }

    // ------------ NUMA ---------------
    numa.from_xml(xml, "/MONITORING/");

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
    rc += numa.from_template(tmpl);

    return rc;
}
