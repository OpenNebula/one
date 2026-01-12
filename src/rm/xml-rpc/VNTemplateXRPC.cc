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

#include "VNTemplateXRPC.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplateAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC& att)
{
    int oid;

    auto ec = allocate(paramList.getString(1),       // Template
                       ClusterPool::NONE_CLUSTER_ID, // cluster id
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplateDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = del(oid,   // id
                  false, // recursive
                  att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplateInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VNTemplateUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VNTemplateRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VNTemplateChmodXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VNTemplateChownXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VNTemplateLockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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

void VNTemplateUnlockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplateCloneXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributesXRPC& att)
{
    int new_id = -1;

    auto ec = clone(paramList.getInt(1),    // oid
                    paramList.getString(2), // enable
                    false,
                    "",
                    new_id,
                    att);

    response(ec, new_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplateInstantiateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributesXRPC& att)
{
    int net_id = -1;

    auto ec = instantiate(paramList.getInt(1),    // oid
                          paramList.getString(2), // enable
                          paramList.getString(3), // extra template
                          net_id,
                          att);

    response(ec, net_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VNTemplatePoolInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
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
