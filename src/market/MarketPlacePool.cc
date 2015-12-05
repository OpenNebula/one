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

#include "MarketPlacePool.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlacePool::allocate(
        int                   uid,
        int                   gid,
        const std::string&    uname,
        const std::string&    gname,
        int                   umask,
        MarketPlaceTemplate * mp_template,
        int *                 oid,
        std::string&          error_str)
{
    MarketPlace * mp;
    MarketPlace * mp_aux = 0;

    std::string name;

    ostringstream oss;

    mp = new MarketPlace(uid, gid, uname, gname, umask, mp_template);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    mp->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    mp_aux = get(name, false);

    if( mp_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(mp, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by MARKETPLACE " << mp_aux->get_oid() << ".";
    error_str = oss.str();

error_name:
    delete mp;
    *oid = -1;

    return *oid;
}

