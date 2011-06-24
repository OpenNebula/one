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
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const long long AclRule::INDIVIDUAL_ID  = 0x100000000LL;
const long long AclRule::GROUP_ID       = 0x200000000LL;
const long long AclRule::ALL_ID         = 0x400000000LL;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string AclRule::to_str() const
{
    ostringstream oss;

    oss << "USER:";
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

    oss << " RESOURCE:";

    AuthRequest::Object objects[] = {
            AuthRequest::VM,
            AuthRequest::HOST,
            AuthRequest::NET,
            AuthRequest::IMAGE,
            AuthRequest::USER,
            AuthRequest::TEMPLATE,
            AuthRequest::GROUP,
            AuthRequest::ACL
    };

    bool prefix = false;

    for ( int i = 0; i < 8; i++ )
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

    oss << " OPERATION:";


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

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& AclRule::to_xml(string& xml) const
{
    ostringstream   oss;

    oss <<
    "<RULE>"
       "<USER>"     << hex << user      << "</USER>"        <<
       "<RESOURCE>" << hex << resource  << "</RESOURCE>"    <<
       "<RIGHTS>"   << hex << rights    << "</RIGHTS>"      <<

       // TODO: Element DEBUG contains a human friendly string
       "<DEBUG>"    << to_str()         << "</DEBUG>"       <<

       "</RULE>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
