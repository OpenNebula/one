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


#include "VirtualNetworkPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkPoolAPI::info(int filter_flag,
                                               int start_id,
                                               int end_id,
                                               std::string& xml,
                                               RequestAttributes& att)
{
    int limit_end_id = -1;

    if ( filter_flag < PoolSQL::GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        return Request::RPC_API;
    }

    /* ---------------------------------------------------------------------- */
    /*  Build where filters to get ois from:                                  */
    /*    - vnets (owner, permissions & ACL)                                  */
    /*    - reservations (owner, permission & not VNET\* nor VNET/% ACLs)     */
    /* ---------------------------------------------------------------------- */

    std::string where_vnets, where_reserv;
    std::ostringstream where_string;

    where_filter(att, filter_flag, start_id, end_id, "pid = -1", "", false,
                 false, false, where_vnets);

    where_filter(att, filter_flag, start_id, end_id, "pid != -1", "", true,
                 true, false, where_reserv);

    where_string << "( " << where_vnets << " ) OR ( " << where_reserv << " ) ";

    /* ---------------------------------------------------------------------- */
    /*  Build pagination limits                                               */
    /* ---------------------------------------------------------------------- */

    if ( end_id < -1 )
    {
        limit_end_id = -end_id;
    }

    /* ---------------------------------------------------------------------- */
    /*  Get the VNET pool                                                     */
    /* ---------------------------------------------------------------------- */
    std::string desc;

    Nebula::instance().get_configuration_attribute(att.uid, att.gid,
                                                   "API_LIST_ORDER", desc);

    int rc = pool->dump(xml, where_string.str(), start_id, limit_end_id,
                        one_util::toupper(desc) == "DESC");

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
