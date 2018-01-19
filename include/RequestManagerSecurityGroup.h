/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_SECURITY_GROUP_H_
#define REQUEST_MANAGER_SECURITY_GROUP_H_

#include "Request.h"
#include "Nebula.h"

class SecurityGroupCommit : public Request
{
public:
    SecurityGroupCommit() : Request("one.secgroup.commit", "A:sib",
        "Commit security group changes to VMs")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();

        auth_object = PoolObjectSQL::SECGROUP;
        auth_op     = AuthRequest::MANAGE;
    };

    ~SecurityGroupCommit(){};

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att);
};


#endif
