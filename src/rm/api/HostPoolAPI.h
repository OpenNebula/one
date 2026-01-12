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

#ifndef HOST_POOL_API_H
#define HOST_POOL_API_H

#include "PoolSharedAPI.h"
#include "Nebula.h"
#include "HostPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolAPI : public PoolSharedAPI
{
protected:

    HostPoolAPI(Request &r)
        : PoolSharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::HOST);

        hpool = Nebula::instance().get_hpool();
        pool = hpool;
    }

    /* API calls */
    Request::ErrorCode monitoring(int seconds,
                                  std::string& xml,
                                  RequestAttributes& att);

    /* Helpers */
    HostPool* hpool;
};

#endif
