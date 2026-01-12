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

#include "MarketPlaceAppXRPC.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC&     att)
{
    int oid;

    auto ec = allocate(paramList.getString(1), // template
                       paramList.getInt(2),    // MarketPlace ID
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = del(oid,      // id
                  false,    // recursive
                  att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC&     att)
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

void MarketPlaceAppUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
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

void MarketPlaceAppRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = rename(oid,                     // id
                     paramList.getString(2),  // name
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppChmodXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void MarketPlaceAppChownXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void MarketPlaceAppEnableXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = enable(oid,                     // id
                     paramList.getBoolean(2), // enable
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppLockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void MarketPlaceAppUnlockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = unlock(oid,
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppAllocateDBXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC&     att)
{
    int oid;

    auto ec = allocate_db(oid,                     // id
                          paramList.getString(2),  // xml
                          att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppUpdateDBXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = update_db(oid,                     // id
                        paramList.getString(2),  // xml
                        att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppDropDBXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = drop_db(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceAppPoolInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = info(paramList.getInt(1), // filter flag
                   paramList.getInt(2), // start ID
                   paramList.getInt(3), // end ID
                   xml,
                   att);

    response(ec, xml, att);
}
