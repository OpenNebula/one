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

#ifndef REQUEST_MANAGER_DATASTORE_H
#define REQUEST_MANAGER_DATASTORE_H

#include "Request.h"
#include "Nebula.h"
#include "DatastorePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerDatastore: public Request
{
protected:
    RequestManagerDatastore(const std::string& method_name,
                            const std::string& help,
                            const std::string& params)
        :Request(method_name, params, help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();

        auth_object = PoolObjectSQL::DATASTORE;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerDatastore() = default;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreEnable : public RequestManagerDatastore
{
public:
    DatastoreEnable(): RequestManagerDatastore("one.datastore.enable",
                                                   "Enables or disables an datastore", "A:sib") {};

    ~DatastoreEnable() = default;

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
