/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerLock.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerLock::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int     oid     = xmlrpc_c::value_int(paramList.getInt(1));
    string  owner   = xmlrpc_c::value_string(paramList.getString(2));

    PoolObjectSQL * object;
    string          error_str;
    int             rc;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = lock_db(object, owner);

    pool->update(object);

    object->unlock();

    success_response((rc == 0), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUnlock::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int     oid     = xmlrpc_c::value_int(paramList.getInt(1));
    string  owner   = xmlrpc_c::value_string(paramList.getString(2));

    PoolObjectSQL * object;
    string          error_str;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    unlock_db(object, owner);

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}
