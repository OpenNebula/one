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

#include "AclAPI.h"
#include "AclManager.h"
#include "AclRule.h"
#include "SharedAPI.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode AclAPI::add_rule(const std::string& user,
                                    const std::string& resource,
                                    const std::string& rights,
                                    const std::string& zone,
                                    int& acl_id,
                                    RequestAttributes& att)
{
    if ( auto ec = SharedAPI::basic_authorization(nullptr, -1, request.auth_object(), att);
         ec != Request::SUCCESS )
    {
        return ec;
    }

    long long user_l;
    long long resource_l;
    long long rights_l;
    long long zone_l;

    istringstream iss;

    iss.str(user);
    iss >> hex >> user_l;

    iss.clear();
    iss.str(resource);
    iss >> hex >> resource_l;

    iss.clear();
    iss.str(rights);
    iss >> hex >> rights_l;

    if (!zone.empty())
    {
        iss.clear();
        iss.str(zone);
        iss >> hex >> zone_l;
    }
    else
    {
        zone_l = AclRule::INDIVIDUAL_ID | Nebula::instance().get_zone_id();
    }

    acl_id = aclm->add_rule(user_l, resource_l, rights_l, zone_l, att.resp_msg);

    if ( acl_id < 0 )
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode AclAPI::del_rule(int acl_id, RequestAttributes& att)
{
    if ( auto ec = SharedAPI::basic_authorization(nullptr, -1, request.auth_object(), att);
         ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = aclm->del_rule(acl_id, att.resp_msg);

    if ( rc < 0 )
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode AclAPI::info(string& xml, RequestAttributes& att)
{
    int rc;
    ostringstream oss;

    if ( auto ec = SharedAPI::basic_authorization(nullptr, -1, request.auth_object(), att);
         ec != Request::SUCCESS )
    {
        return ec;
    }

    rc = aclm->dump(oss);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal Database error";

        return Request::INTERNAL;
    }

    xml = oss.str();

    return Request::SUCCESS;
}

