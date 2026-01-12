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

#ifndef VIRTUALNETWORK_POOL_API_H
#define VIRTUALNETWORK_POOL_API_H

#include "PoolSharedAPI.h"
#include "Nebula.h"
#include "VirtualNetworkPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkPoolAPI : public PoolSharedAPI
{
protected:

    VirtualNetworkPoolAPI(Request &r)
        : PoolSharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::VNTEMPLATE);

        pool = Nebula::instance().get_vnpool();
    }

    /* API calls */

    /* Helpers */
};

#endif
