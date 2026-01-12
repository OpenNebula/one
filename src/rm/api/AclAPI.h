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

#ifndef ACL_API_H
#define ACL_API_H

#include "Request.h"
#include "Nebula.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclAPI
{
protected:
    AclAPI(Request &r) : request(r)
    {
        request.auth_object(PoolObjectSQL::ACL);
        request.auth_op(AuthRequest::MANAGE);

        aclm = Nebula::instance().get_aclm();
    };

    virtual ~AclAPI() = default;

    /* API calls */
    Request::ErrorCode add_rule(const std::string& user,
                                const std::string& resource,
                                const std::string& rights,
                                const std::string& zone,
                                int &acl_id,
                                RequestAttributes& att);

    Request::ErrorCode del_rule(int acl_id, RequestAttributes& att);

    Request::ErrorCode info(std::string& xml, RequestAttributes& att);

    /* Helpers */
    AclManager * aclm;

    Request& request;
};

#endif
