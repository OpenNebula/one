/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "AuthManager.h"
#include "ObjectXML.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const long long AclRule::INDIVIDUAL_ID  = 0x100000000LL;
const long long AclRule::GROUP_ID       = 0x200000000LL;
const long long AclRule::ALL_ID         = 0x400000000LL;

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

    if ( (resource & 0xFF000000000LL) == 0 )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "[resource] type is missing";
    }

    if ( (resource & 0xFFFFF00000000000LL) != 0 )
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

    if ( rights > 0x1FFLL )
    {
        if ( error )
        {
            oss << "; ";
        }

        error = true;
        oss << "wrong [rights], it cannot be bigger than 0x1FF";
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
    else
    {
        oss << "*";
    }

    oss << " ";

    AuthRequest::Object objects[] = {
            AuthRequest::VM,
            AuthRequest::HOST,
            AuthRequest::NET,
            AuthRequest::IMAGE,
            AuthRequest::USER,
            AuthRequest::TEMPLATE,
            AuthRequest::GROUP
    };

    bool prefix = false;

    for ( int i = 0; i < 7; i++ )
    {
        if ( (resource & objects[i]) != 0 )
        {
            if ( prefix )
            {
                oss << "+";
            }

            oss << AuthRequest::Object_to_str( objects[i] );
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
    else
    {
        oss << "*";
    }

    oss << " ";


    AuthRequest::Operation operations[] = {
            AuthRequest::CREATE,
            AuthRequest::DELETE,
            AuthRequest::USE,
            AuthRequest::MANAGE,
            AuthRequest::INFO,
            AuthRequest::INFO_POOL,
            AuthRequest::INFO_POOL_MINE,
            AuthRequest::INSTANTIATE,
            AuthRequest::CHOWN
    };

    prefix = false;

    for ( int i = 0; i < 9; i++ )
    {
        if ( (rights & operations[i]) != 0 )
        {
            if ( prefix )
            {
                oss << "+";
            }

            oss << AuthRequest::Operation_to_str( operations[i] );
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

int AclRule::from_xml(const string &xml_str)
{
    int rc = 0;

    string tmp_error;

    ObjectXML xml_obj(xml_str);

    rc += xml_obj.xpath(oid     ,    "/ACL/ID"      ,      0);
    rc += xml_obj.xpath(user    ,    "/ACL/USER"    ,      0);
    rc += xml_obj.xpath(resource,    "/ACL/RESOURCE",      0);
    rc += xml_obj.xpath(rights  ,    "/ACL/RIGHTS"  ,      0);
    rc += xml_obj.xpath(str     ,    "/ACL/STRING"  ,      "");

    if ( (rc != 0) || malformed(tmp_error) )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
