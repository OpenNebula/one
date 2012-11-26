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

#include "DefaultQuotas.h"
#include "ObjectXML.h"

string& DefaultQuotas::to_xml(string& xml) const
{
    ostringstream oss;

    string ds_quota_xml;
    string net_quota_xml;
    string vm_quota_xml;
    string image_quota_xml;

    oss << "<" << root_elem << ">"
        << datastore_quota.to_xml(ds_quota_xml)
        << network_quota.to_xml(net_quota_xml)
        << vm_quota.to_xml(vm_quota_xml)
        << image_quota.to_xml(image_quota_xml)
        << "</" << root_elem << ">";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int                rc = 0;

    ObjectXML *object_xml = new ObjectXML(xml);

    object_xml->get_nodes(ds_xpath, content);

    if (!content.empty())
    {
        rc += datastore_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);
    content.clear();

    object_xml->get_nodes(net_xpath, content);

    if (!content.empty())
    {
        rc += network_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);
    content.clear();

    object_xml->get_nodes(vm_xpath, content);

    if (!content.empty())
    {
        rc += vm_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);
    content.clear();

    object_xml->get_nodes(img_xpath, content);

    if (!content.empty())
    {
        rc += image_quota.from_xml_node(content[0]);
    }

    object_xml->free_nodes(content);

    delete object_xml;

    return rc;
}
