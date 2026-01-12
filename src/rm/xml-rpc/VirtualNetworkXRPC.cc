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

#include "VirtualNetworkXRPC.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC& att)
{
    int oid;

    auto ec = allocate(paramList.getString(1),  // template
                       paramList.getInt(2),     // cluster id
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del(oid,   // id
                  false, // force
                  att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC& att)
{
    string xml;

    auto ec = info(paramList.getInt(1),     // id
                   paramList.size() > 2 ? paramList.getBoolean(2) : false, // decrypt
                   xml,
                   att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // id
                     paramList.getString(2) ,  // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = rename(oid,                     // id
                     paramList.getString(2),  // name
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkChmodXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = chmod(paramList.getInt(1),  // id
                    paramList.getInt(2),  // user use
                    paramList.getInt(3),  // user manage
                    paramList.getInt(4),  // user admin
                    paramList.getInt(5),  // group use
                    paramList.getInt(6),  // group manage
                    paramList.getInt(7),  // group admin
                    paramList.getInt(8),  // other use
                    paramList.getInt(9),  // other manage
                    paramList.getInt(10), // other admin
                    att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkChownXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = chown(oid,                 // id
                    paramList.getInt(2), // user id
                    paramList.getInt(3), // group id
                    att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkLockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = lock(oid,                     // id
                   paramList.getInt(2),     // lock level
                   paramList.size() > 3 ? paramList.getBoolean(3) : false, // test
                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkUnlockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkAddARXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = add_ar(oid,                    // id
                     paramList.getString(2), // template
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkRmARXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = rm_ar(oid,                     // id
                    paramList.getInt(2),     // AR id
                    paramList.size() > 3 ? paramList.getBoolean(3) : false, // force
                    att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkUpdateARXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update_ar(oid,                    // id
                        paramList.getString(2), // template
                        att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkReserveXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributesXRPC& att)
{
    int net_id = -1;;

    auto ec = reserve(paramList.getInt(1),    // id
                      paramList.getString(2), // template
                      net_id,
                      att);

    response(ec, net_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkFreeARXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = free_ar(oid,                 // id
                      paramList.getInt(2), // AR id
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkHoldXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = hold(oid,                    // id
                   paramList.getString(2), // template
                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkReleaseXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = release(oid,                    // id
                      paramList.getString(2), // template
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkRecoverXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = recover(oid,                 // id
                      paramList.getInt(2), // operation
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkPoolInfoXRPC::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributesXRPC&      att)
{
    string xml;

    auto ec = info(paramList.getInt(1), // filter flag
                   paramList.getInt(2), // start ID
                   paramList.getInt(3), // end ID
                   xml,
                   att);

    response(ec, xml, att);
}
