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

#include "RequestManagerDatastore.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void DatastoreEnable::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributes& att)
{
    int     id          = xmlrpc_c::value_int(paramList.getInt(1));
    bool    enable_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    int     rc;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    auto ds = pool->get<Datastore>(id);

    if ( ds == nullptr )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = ds->enable(enable_flag, att.resp_msg);

    if ( rc != 0  )
    {
        failure_response(INTERNAL, att);

        return;
    }

    pool->update(ds.get());

    success_response(id, att);
}
