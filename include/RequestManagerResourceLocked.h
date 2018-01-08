/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_RESOURCE_LOCKED_H_
#define REQUEST_MANAGER_RESOURCE_LOCKED_H_

#include "Request.h"
#include "Nebula.h"
#include "PoolObjectSQL.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerResourceLocked: public Request
{
protected:
    RequestManagerResourceLocked(const string& method_name,
                                 const string& params,
                                 const string& help,
                                 const int _id_location)
        :Request(method_name, params, help)
    {
        id_location = _id_location;
    };

    ~RequestManagerResourceLocked(){};

    /* -------------------------------------------------------------------- */

    bool is_locked(xmlrpc_c::paramList const& paramList, RequestAttributes& att)
    {
        int id      = xmlrpc_c::value_int(paramList.getInt(id_location));
        PoolObjectSQL *obj = pool->get(id, true);
        PoolObjectSQL::LockStates lck_obj = obj->get_lock_state();
        obj->unlock();
        if (!((auth_object & PoolObjectSQL::LockableObject) == 0) && ((int)auth_op <=  (int)lck_obj))
        {
            return true;
        }
        return false;
    };
private:
    int id_location;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

#endif
