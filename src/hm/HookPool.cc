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

#include "Hook.h"
#include "HookAPI.h"
#include "HookPool.h"

using namespace std;


int HookPool::allocate(unique_ptr<Template> tmpl, string& error_str)
{
    Hook * hook;
    int db_oid;
    string name;

    ostringstream oss;

    int oid = -1;

    tmpl->get("NAME", name);

    if (!PoolObjectSQL::name_is_valid(name, error_str))
    {
        goto error_name;
    }

    db_oid = exist(name);

    if ( db_oid != -1 )
    {
        goto error_duplicated;
    }

    hook = new Hook(move(tmpl));

    oid = PoolSQL::allocate(hook, error_str);

    return oid;

error_duplicated:
    oss << "NAME is already taken by Hook " << db_oid << ".";
    error_str = oss.str();

    goto error_common;
error_name:
    oss << "Invalid name.";
    error_str = oss.str();

error_common:
    oid = -1;

    return oid;
}
