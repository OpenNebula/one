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

#include "TemplateXRPC.h"
#include "ClusterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributesXRPC&     att)
{
    int oid;

    auto ec = allocate(paramList.getString(1), // template
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = del(oid,                     // id
                  paramList.size() > 2 ? paramList.getBoolean(2) : false, // recursive
                  att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = info(paramList.getInt(1),     // id
                   paramList.size() > 2 ? paramList.getBoolean(2) : false, // extended
                   paramList.size() > 3 ? paramList.getBoolean(3) : false, // decrypt
                   xml,
                   att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void TemplateRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void TemplateCloneXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC&     att)
{
    int new_id = -1;

    auto ec = clone(paramList.getInt(1),     // id
                    paramList.getString(2),  // name
                    paramList.size() > 3 ? paramList.getBoolean(3) : false, // recursive
                    "",                      // extra attrs
                    false,                   // persistent
                    new_id,
                    att);

    response(ec, new_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateInstantiateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC&     att)
{
    int vid = -1;

    auto ec = instantiate(paramList.getInt(1),     // id
                          paramList.getString(2),  // name
                          paramList.size() > 3 ? paramList.getBoolean(3) : false, // hold
                          paramList.size() > 4 ? paramList.getString(4)  : "",    // extra template
                          paramList.size() > 5 ? paramList.getBoolean(5) : false, // persistent
                          vid,
                          att);

    response(ec, vid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateChmodXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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
                    paramList.size() > 11 ? paramList.getBoolean(11) : false, // recursive
                    att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateChownXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void TemplateLockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void TemplateUnlockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplatePoolInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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
