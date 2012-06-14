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

#include "AclRule.h"
#include "AuthRequest.h"
#include "PoolObjectSQL.h"
    
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const long long AclRule::INDIVIDUAL_ID  = 0x0000000100000000LL;
const long long AclRule::GROUP_ID       = 0x0000000200000000LL;
const long long AclRule::ALL_ID         = 0x0000000400000000LL;

const long long AclRule::NONE_ID        = 0x1000000000000000LL;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool AclRule::malformed(string& error_str) const
{
    ostringstream oss;
    bool error = false;

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

    if ( (resource & INDIVIDUAL_ID) != 0 && (resource & GROUP_ID) != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] INDIVIDUAL (#) and GROUP (@) bits are exclusive";
    }

    if ( (resource & INDIVIDUAL_ID) != 0 && (resource & ALL_ID) != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] INDIVIDUAL (#) and ALL (*) bits are exclusive";
    }

    if ( (resource & GROUP_ID) != 0 && (resource & ALL_ID) != 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] GROUP (@) and ALL (*) bits are exclusive";
    }

    if ( (resource & 0x700000000LL) == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] is missing one of the INDIVIDUAL, GROUP or ALL bits";
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

    if ( (resource & 0xFFF000000000LL) == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] type is missing";
    }

    if ( (resource & 0xFFFF000000000000LL) != 0 )
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

    PoolObjectSQL::ObjectType objects[] = {
            PoolObjectSQL::VM,
            PoolObjectSQL::HOST,
            PoolObjectSQL::NET,
            PoolObjectSQL::IMAGE,
            PoolObjectSQL::USER,
            PoolObjectSQL::TEMPLATE,
            PoolObjectSQL::GROUP,
            PoolObjectSQL::DATASTORE,
            PoolObjectSQL::CLUSTER
    };

    bool prefix = false;

    for ( int i = 0; i < 9; i++ )
    {
        if ( (resource & objects[i]) != 0 )
        {
            if ( prefix )
            {
                oss << "+";
            }

            oss << PoolObjectSQL::type_to_str( objects[i] );
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
    else if ( (resource & ALL_ID) != 0 )
    {
        oss << "*";
    }
    else
    {
        oss << "??";
    }


    oss << " ";


    AuthRequest::Operation operations[] = {
            AuthRequest::USE,
            AuthRequest::MANAGE,
            AuthRequest::ADMIN,
            AuthRequest::CREATE
    };

    prefix = false;

    for ( int i = 0; i < 4; i++ )
    {
        if ( (rights & operations[i]) != 0 )
        {
            if ( prefix )
            {
                oss << "+";
            }

            oss << AuthRequest::operation_to_str( operations[i] );
            prefix = true;
        }
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
        else if (name == "STRING")
        {
            str = iss.str();
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

