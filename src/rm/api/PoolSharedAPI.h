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

#ifndef POOL_SHARED_API_
#define POOL_SHARED_API_

#include "RequestAttributes.h"
#include "Request.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class PoolSharedAPI
{
protected:
    PoolSharedAPI(Request& r)
        : request(r)
    {
        request.leader_only(false);
        request.zone_disabled(true);
    }

    virtual ~PoolSharedAPI() = default;

    virtual Request::ErrorCode info(int filter_flag,
                                    int start_id,
                                    int end_id,
                                    std::string& xml,
                                    RequestAttributes& att);

    void where_filter(RequestAttributes& att,
                      int                filter_flag,
                      int                start_id,
                      int                end_id,
                      const std::string& and_clause,
                      const std::string& or_clause,
                      bool               disable_all_acl,
                      bool               disable_cluster_acl,
                      bool               disable_group_acl,
                      std::string&       where_string);

    Request::ErrorCode dump(RequestAttributes& att,
                            int                filter_flag,
                            int                start_id,
                            int                end_id,
                            const std::string& and_clause,
                            const std::string& or_clause,
                            std::string&       xml);

    /*
    *  True to gather full info
    */
    bool extended = false;

    PoolSQL *pool = nullptr;

    Request& request;
};

#endif
