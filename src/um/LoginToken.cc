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

#include <sstream>

#include "LoginToken.h"
#include "NebulaUtil.h"
#include "ObjectXML.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* LoginTokenPool class                                                       */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const int LoginTokenPool::MAX_TOKENS = 10;

/* -------------------------------------------------------------------------- */

LoginTokenPool::~LoginTokenPool()
{
    reset();
}

/* -------------------------------------------------------------------------- */

void LoginTokenPool::reset()
{
    for (auto it = tokens.begin() ; it != tokens.end() ; ++it)
    {
        delete it->second;
    }

    tokens.clear();
}

/* -------------------------------------------------------------------------- */

int LoginTokenPool::set(std::string& utk, time_t valid, int egid)
{
    reset_expired(); // Expired token collector

    if (tokens.size() >= MAX_TOKENS || valid < -1 || valid == 0)
    {
        return -1;
    }

    LoginToken * tk = new LoginToken;

    utk = tk->set(utk, valid, egid);

    tokens.insert(std::pair<std::string, LoginToken *>(utk, tk));

    return 0;
}

/* -------------------------------------------------------------------------- */

int LoginTokenPool::reset(const std::string& utk)
{
    auto it = tokens.find(utk);

    if ( it == tokens.end() )
    {
        return -1;
    }

    delete it->second;

    tokens.erase(it);

    return 0;
}

/* -------------------------------------------------------------------------- */

void LoginTokenPool::reset_expired()
{
    for (auto it = tokens.begin(); it != tokens.end(); )
    {
        if ((it->second)->is_expired())
        {
            delete it->second;

            it = tokens.erase(it);
        }
        else
        {
            ++it;
        }
    }
}

/* -------------------------------------------------------------------------- */

bool LoginTokenPool::is_valid(const std::string& utk, int& egid, bool& exists_token)
{
    egid = -1;
    auto it = tokens.find(utk);

    if ( it == tokens.end() )
    {
        exists_token = false;
        return false;
    }

    exists_token = true;

    if ( it->second->is_valid(utk, egid) == true)
    {
        return true;
    }

    delete it->second;

    tokens.erase(it);

    return false;
}

/* -------------------------------------------------------------------------- */

void LoginTokenPool::from_xml_node(const std::vector<xmlNodePtr>& content)
{
    for (auto node : content)
    {
        LoginToken * tk = new LoginToken;
        std::string utk = tk->from_xml_node(node);

        tokens.insert(std::pair<std::string, LoginToken *>(utk, tk));
    }
}

/* -------------------------------------------------------------------------- */

std::string& LoginTokenPool::to_xml(std::string& xml) const
{
    std::ostringstream oss;

    for ( auto it = tokens.begin() ; it != tokens.end() ; ++it)
    {
        it->second->to_xml(oss);
    }

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* LoginToken class                                                           */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SessionToken::is_valid(const string& user_token) const
{
    return ((user_token == token) &&
            ((expiration_time == -1) || (time(0) < expiration_time)));
}

/* -------------------------------------------------------------------------- */

bool SessionToken::is_expired() const
{
    return ((time(0) > expiration_time) && (expiration_time != -1));
}

/* -------------------------------------------------------------------------- */

void SessionToken::reset()
{
    token.clear();
    expiration_time = 0;
}

/* -------------------------------------------------------------------------- */

const std::string& SessionToken::set(const std::string& user_token, time_t valid)
{
    if (valid == -1)
    {
        expiration_time = -1;
    }
    else if (valid > 0 )
    {
        expiration_time = time(0) + valid;
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

void LoginToken::to_xml(std::ostringstream& xml) const
{
    xml << "<LOGIN_TOKEN>"
        << "<TOKEN>" << token << "</TOKEN>"
        << "<EXPIRATION_TIME>" << expiration_time << "</EXPIRATION_TIME>"
        << "<EGID>" << egid << "</EGID>"
        << "</LOGIN_TOKEN>";
}

/* -------------------------------------------------------------------------- */

const std::string& LoginToken::from_xml_node(const xmlNodePtr node)
{
    ObjectXML oxml(node);

    oxml.xpath(token, "/LOGIN_TOKEN/TOKEN", "");
    oxml.xpath<time_t>(expiration_time, "/LOGIN_TOKEN/EXPIRATION_TIME", 0);
    oxml.xpath<int>(egid, "/LOGIN_TOKEN/EGID", -1);

    return token;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

