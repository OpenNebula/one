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


#include "VMGroupPool.h"

int VMGroupPool::allocate(int uid, int gid, const string& uname,
        const string& gname, int umask, Template * vmgroup_template, int * oid,
        string& error_str)
{
    VMGroup * vmgrp;
    VMGroup * vmgrp_aux = 0;

    string name;

    ostringstream os;

    vmgrp = new VMGroup(uid, gid, uname, gname, umask, vmgroup_template);

    vmgrp->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    vmgrp_aux = get(name, uid, false);

    if( vmgrp_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(vmgrp, error_str);

    return *oid;

error_duplicated:
    os << "NAME is already taken by VMGroup " << vmgrp_aux->get_oid() << ".";
    error_str = os.str();

error_name:
    delete vmgrp;
    *oid = -1;

    return *oid;
}

