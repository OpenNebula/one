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

#include "AclRule.h"
#include "AuthRequest.h"
#include "PoolObjectSQL.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const long long AclRule::INDIVIDUAL_ID = 0x0000000100000000LL;
const long long AclRule::GROUP_ID      = 0x0000000200000000LL;
const long long AclRule::ALL_ID        = 0x0000000400000000LL;
const long long AclRule::CLUSTER_ID    = 0x0000000800000000LL;

const long long AclRule::NONE_ID       = 0x1000000000000000LL;

const std::array<PoolObjectSQL::ObjectType, 19> AclRule::pool_objects =
{
    PoolObjectSQL::VM,
    PoolObjectSQL::HOST,
    PoolObjectSQL::NET,
    PoolObjectSQL::IMAGE,
    PoolObjectSQL::USER,
    PoolObjectSQL::TEMPLATE,
    PoolObjectSQL::GROUP,
    PoolObjectSQL::DATASTORE,
    PoolObjectSQL::CLUSTER,
    PoolObjectSQL::DOCUMENT,
    PoolObjectSQL::ZONE,
    PoolObjectSQL::SECGROUP,
    PoolObjectSQL::VDC,
    PoolObjectSQL::VROUTER,
    PoolObjectSQL::MARKETPLACE,
    PoolObjectSQL::MARKETPLACEAPP,
    PoolObjectSQL::VMGROUP,
    PoolObjectSQL::VNTEMPLATE,
    PoolObjectSQL::BACKUPJOB
};

const std::array<AuthRequest::Operation, 4> AclRule::auth_operations =
{
    AuthRequest::USE,
    AuthRequest::MANAGE,
    AuthRequest::ADMIN,
    AuthRequest::CREATE
};

const long long AclRule::INVALID_CLUSTER_OBJECTS =
        PoolObjectSQL::VM | PoolObjectSQL::IMAGE | PoolObjectSQL::USER |
        PoolObjectSQL::TEMPLATE | PoolObjectSQL::GROUP | PoolObjectSQL::ACL |
        PoolObjectSQL::CLUSTER | PoolObjectSQL::DOCUMENT | PoolObjectSQL::ZONE |
        PoolObjectSQL::SECGROUP | PoolObjectSQL::VDC | PoolObjectSQL::VROUTER |
        PoolObjectSQL::MARKETPLACE | PoolObjectSQL::MARKETPLACEAPP |
        PoolObjectSQL::VMGROUP | PoolObjectSQL::VNTEMPLATE;

const long long AclRule::INVALID_GROUP_OBJECTS =
        PoolObjectSQL::HOST | PoolObjectSQL::GROUP | PoolObjectSQL::CLUSTER |
        PoolObjectSQL::ZONE | PoolObjectSQL::VDC;

const long long AclRule::FEDERATED_OBJECTS =
        PoolObjectSQL::USER | PoolObjectSQL::GROUP | PoolObjectSQL::ZONE |
        PoolObjectSQL::ACL | PoolObjectSQL::VDC;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool AclRule::malformed(string& error_str) const
{
    ostringstream oss;
    bool error = false;
    long long resource_type;

    // Check user

    if ( (user & INDIVIDUAL_ID) != 0 && (user & GROUP_ID) != 0 )
    {
        error = true;
        oss << "[user] INDIVIDUAL (#) and GROUP (@) bits are exclusive";
    }

    if ( (user & INDIVIDUAL_ID) != 0 && (user & ALL_ID) != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[user] INDIVIDUAL (#) and ALL (*) bits are exclusive";
    }

    if ( (user & GROUP_ID) != 0 && (user & ALL_ID) != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[user] GROUP (@) and ALL (*) bits are exclusive";
    }

    if ( (user & 0x700000000LL) == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[user] is missing one of the INDIVIDUAL, GROUP or ALL bits";
    }

    if ( user_id() < 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[user] ID cannot be negative";
    }

    if ( (user & ALL_ID) != 0 && user_id() != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "when using the ALL bit, [user] ID must be 0";
    }

    // Check resource

    if ( ( (resource & INDIVIDUAL_ID) != 0 && (resource & 0xF00000000LL) != INDIVIDUAL_ID ) ||
         ( (resource & GROUP_ID)      != 0 && (resource & 0xF00000000LL) != GROUP_ID ) ||
         ( (resource & CLUSTER_ID)    != 0 && (resource & 0xF00000000LL) != CLUSTER_ID ) ||
         ( (resource & ALL_ID)        != 0 && (resource & 0xF00000000LL) != ALL_ID )
       )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] INDIVIDUAL (#), GROUP (@), CLUSTER (%) "
            << "and ALL (*) bits are exclusive";
    }

    resource_type = resource_code() & 0xFFFFFFF000000000LL;

    if ((resource & CLUSTER_ID) && (resource_type & INVALID_CLUSTER_OBJECTS))
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] CLUSTER(%) selector can be applied only to "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::DATASTORE) << ", "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::HOST) << " and "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::NET) << " types";
    }

    if ((resource & GROUP_ID) && (resource_type & INVALID_GROUP_OBJECTS))
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] GROUP(@) selector cannot be applied to "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::HOST) << ", "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::GROUP) << ", "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::CLUSTER) << ", "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::ZONE) << " or "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::VDC) << " types";
    }

    if ( (resource & 0xF00000000LL) == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] is missing one of the INDIVIDUAL, GROUP, CLUSTER or ALL bits";
    }

    if ( resource_id() < 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] ID cannot be negative";
    }

    if ( (resource & ALL_ID) != 0 && resource_id() != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "when using the ALL bit, [resource] ID must be 0";
    }

    if ( (resource & 0xFFFFFFF000000000LL) == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] type is missing";
    }

    if ( (resource & 0xFE80000000000000LL) != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "wrong [resource] type";
    }

    // Check rights

    if ( rights == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "wrong [rights], it cannot be 0";
    }

    if ( rights > 0xFLL )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "wrong [rights], it cannot be bigger than 0xF";
    }

    // Check zone

    if ( (zone & GROUP_ID) != 0 )
    {
        error = true;
        oss << "[zone] GROUP (@) bit is not supported";
    }

    if ( (zone & INDIVIDUAL_ID) != 0 && (zone & ALL_ID) != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[zone] INDIVIDUAL (#) and ALL (*) bits are exclusive";
    }

    if ( (zone & 0x700000000LL) == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[zone] is missing one of the INDIVIDUAL or ALL bits";
    }

    if ( zone_id() < 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[zone] ID cannot be negative";
    }

    if ( (zone & ALL_ID) != 0 && zone_id() != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "when using the ALL bit, [zone] ID must be 0";
    }

    if ((zone & ALL_ID) &&
        (resource & INDIVIDUAL_ID) &&
        ( (resource_type & FEDERATED_OBJECTS) != resource_type ) )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] INDIVIDUAL(#) selector cannot be applied "
            << "to ALL zones, except for "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::USER) << ", "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::GROUP) << " and "
            << PoolObjectSQL::type_to_str(PoolObjectSQL::ZONE) << " types";
    }

    if ( error )
    {
        error_str = oss.str();
    }

    return error;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AclRule::build_str()
{
    ostringstream oss;

    if ( (user & GROUP_ID) != 0 )
    {
        oss << "@" << user_id();
    }
    else if ( (user & INDIVIDUAL_ID) != 0 )
    {
        oss << "#" << user_id();
    }
    else if ( (user & ALL_ID) != 0 )
    {
        oss << "*";
    }
    else
    {
        oss << "??";
    }

    oss << " ";

    bool prefix = false;

    for (const auto& pobject: pool_objects)
    {
        if ( (resource & pobject) != 0 )
        {
            if ( prefix )
            {
                oss << "+";
            }

            oss << PoolObjectSQL::type_to_str(pobject);
            prefix = true;
        }
    }

    oss << "/";

    if ( (resource & GROUP_ID) != 0 )
    {
        oss << "@" << resource_id();
    }
    else if ( (resource & INDIVIDUAL_ID) != 0 )
    {
        oss << "#" << resource_id();
    }
    else if ( (resource & CLUSTER_ID) != 0 )
    {
        oss << "%" << resource_id();
    }
    else if ( (resource & ALL_ID) != 0 )
    {
        oss << "*";
    }
    else
    {
        oss << "??";
    }

    oss << " ";

    prefix = false;

    for (const auto &aoperation : auth_operations)
    {
        if ( (rights & aoperation) != 0 )
        {
            if ( prefix )
            {
                oss << "+";
            }

            oss << AuthRequest::operation_to_str(aoperation);
            prefix = true;
        }
    }

    oss << " ";

    if ( (zone & INDIVIDUAL_ID) != 0 )
    {
        oss << "#" << zone_id();
    }
    else if ( (zone & ALL_ID) != 0 )
    {
        oss << "*";
    }
    else
    {
        oss << "??";
    }

    str = oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& AclRule::to_xml(string& xml) const
{
    ostringstream   oss;

    oss <<
        "<ACL>"
        "<ID>"       << oid              << "</ID>"          <<
        "<USER>"     << hex << user      << "</USER>"        <<
        "<RESOURCE>" << hex << resource  << "</RESOURCE>"    <<
        "<RIGHTS>"   << hex << rights    << "</RIGHTS>"      <<
        "<ZONE>"     << hex << zone      << "</ZONE>"        <<
        "<STRING>"   << str              << "</STRING>"      <<
        "</ACL>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AclRule::from_xml(xmlNodePtr node)
{
    int rc = 0;

    for (xmlNodePtr acl = node->children ; acl != 0 ; acl = acl->next)
    {
        if ( acl->type != XML_ELEMENT_NODE )
        {
            rc = -1;
            break;
        }

        xmlNodePtr elem = acl->children;

        if ( elem->type != XML_TEXT_NODE )
        {
            rc = -1;
            break;
        }

        string        name = reinterpret_cast<const char*>(acl->name);
        istringstream iss(reinterpret_cast<const char*>(elem->content));

        if (name == "ID")
        {
            iss >> oid;
        }
        else if (name == "USER")
        {
            iss >> hex >> user;
        }
        else if (name == "RESOURCE")
        {
            iss >> hex >> resource;
        }
        else if (name == "RIGHTS")
        {
            iss >> hex >> rights;
        }
        else if (name == "ZONE")
        {
            iss >> hex >> zone;
        }
        else if (name == "STRING")
        {
            str = iss.str();
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
