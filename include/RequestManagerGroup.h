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

#ifndef REQUEST_MANAGER_GROUP_H
#define REQUEST_MANAGER_GROUP_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerGroup: public Request
{
protected:
    RequestManagerGroup(const string& method_name,
                        const string& help,
                        const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_gpool();

        auth_object = PoolObjectSQL::GROUP;
    };

    virtual ~RequestManagerGroup(){};

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupSetQuota : public RequestManagerGroup
{
public:
    GroupSetQuota():
        RequestManagerGroup("GroupSetQuota",
                           "Sets group quota limits",
                           "A:sis")
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~GroupSetQuota(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
