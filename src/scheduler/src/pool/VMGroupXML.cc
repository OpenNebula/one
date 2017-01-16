/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "VMGroupXML.h"

void VMGroupXML::init_attributes()
{
    vector<xmlNodePtr>       content;
    std::vector<std::string> srules;

    std::vector<std::string>::iterator it;

    xpath(oid, "/VM_GROUP/ID", -1);
    xpath(name,"/VM_GROUP/NAME", "undefined");

    // VMGroup roles
    get_nodes("/VM_GROUP/ROLES", content);

    if (!content.empty())
    {
        roles.from_xml_node(content[0]);
    }

    free_nodes(content);

    content.clear();

    xpaths(srules, "/VM_GROUP/TEMPLATE/AFFINED");

    for ( it = srules.begin() ; it != srules.end(); ++it )
    {
        std::set<int> id_set;

        roles.names_to_ids(*it, id_set);

        VMGroupRule rule(VMGroupRule::AFFINED, id_set);

        rules.insert(rule);
    }

    rules.clear();

    xpaths(srules, "/VM_GROUP/TEMPLATE/ANTI_AFFINED");

    for ( it = srules.begin() ; it != srules.end(); ++it )
    {
        std::set<int> id_set;

        roles.names_to_ids(*it, id_set);

        VMGroupRule rule(VMGroupRule::ANTI_AFFINED, id_set);

        rules.insert(rule);
    }
};

