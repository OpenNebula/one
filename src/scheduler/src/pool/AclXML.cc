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

#include "AclXML.h"
#include "AclRule.h"
#include "ObjectXML.h"
#include <vector>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclXML::set_up()
{
    xmlrpc_c::value result;

    try
    {
        client->call("one.acl.info", "", &result);

        vector<xmlrpc_c::value> values =
                xmlrpc_c::value_array(result).vectorValueValue();

        bool   success = xmlrpc_c::value_boolean(values[0]);
        string message = xmlrpc_c::value_string(values[1]);

        if( !success )
        {
            ostringstream oss;

            oss << "ONE returned error while retrieving the acls:" << endl;
            oss << message;

            NebulaLog::log("ACL", Log::ERROR, oss);
            return -1;
        }

        flush_rules();

        load_rules(message);

        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("ACL", Log::ERROR, oss);

        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclXML::load_rules(const string& xml_str)
{
    ObjectXML          acl_xml(xml_str);

    vector<xmlNodePtr>           rules;

    acl_xml.get_nodes("/ACL_POOL/ACL", rules);

    for (auto node : rules)
    {
        AclRule * rule = new AclRule(0, 0, 0, 0, 0);
        int       rc   = rule->from_xml(node);

        if ( rc == 0 )
        {
            acl_rules.insert( make_pair(rule->get_user(), rule) );
            acl_rules_oids.insert( make_pair(rule->get_oid(), rule) );
        }
    }

    acl_xml.free_nodes(rules);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclXML::flush_rules()
{
    for ( auto it = acl_rules.begin(); it != acl_rules.end(); it++ )
    {
        delete it->second;
    }

    acl_rules.clear();
    acl_rules_oids.clear();
}

