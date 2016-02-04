/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#include <sstream>

#include "LoginToken.h"
#include "NebulaUtil.h"
#include "ObjectXML.h"

using namespace std;

bool LoginToken::is_valid(const string& user_token) const
{
    return ((user_token == token) &&
            ((expiration_time == -1) || (time(0) < expiration_time)));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const std::string& LoginToken::set(const std::string& user_token, time_t valid)
{
    if (valid == -1)
    {
        expiration_time = -1;
    }
    else if (valid > 0 )
    {
        expiration_time = time(0) + valid;
    }
    else
    {
        expiration_time = 0;
    }

    if (!user_token.empty())
    {
        token = user_token;
    }
    else
    {
        token = one_util::random_password();
    }

    return token;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LoginToken::reset()
{
    token.clear();
    expiration_time = 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& LoginToken::to_xml(std::string& sxml) const
{
    std::ostringstream xml;

    if ( expiration_time == 0 )
    {
        xml << "<LOGIN_TOKEN/>";
    }
    else
    {
        xml << "<LOGIN_TOKEN>"
            << "<TOKEN>" << token << "</TOKEN>"
            << "<EXPIRATION_TIME>" << expiration_time << "</EXPIRATION_TIME>"
            << "</LOGIN_TOKEN>";
    }

    sxml = xml.str();

    return sxml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LoginToken::from_xml_node(const xmlNodePtr node)
{
    ObjectXML oxml(node);

    oxml.xpath(token, "/LOGIN_TOKEN/TOKEN", "");
    oxml.xpath<time_t>(expiration_time, "/LOGIN_TOKEN/EXPIRATION_TIME", 0);
}
