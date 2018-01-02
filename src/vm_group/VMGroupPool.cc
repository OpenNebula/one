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

#include "VMGroupPool.h"
#include "AuthRequest.h"

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VMGroup * VMGroupPool::get_from_attribute(const VectorAttribute *va, int _uid)
{
    VMGroup * vmgroup = 0;

    string vmg_name = va->vector_value("VMGROUP_NAME");
    int vmg_id;

    if ( !vmg_name.empty() )
    {
        int vmg_uid;

        if ( va->vector_value("VMGROUP_UID", vmg_uid) == -1 )
        {
            vmg_uid = _uid;
        }

        vmgroup = get(vmg_name, vmg_uid, true);
    }
    else if ( va->vector_value("VMGROUP_ID", vmg_id) == 0 )
    {
        vmgroup = get(vmg_id, true);
    }

    return vmgroup;
}

/* -------------------------------------------------------------------------- */

int VMGroupPool::vmgroup_attribute(VectorAttribute * va, int uid, int vid,
    string& error)
{
    string vmg_role = va->vector_value("ROLE");

    if ( vmg_role.empty() )
    {
        error = "Missing role name in VM Group definition";
        return -1;
    }

    VMGroup * vmgroup = get_from_attribute(va, uid);

    if ( vmgroup == 0 )
    {
        error = "Cannot find VM Group to associate the VM";
        return -1;
    }

    va->replace("VMGROUP_ID", vmgroup->get_oid());

    int rc = vmgroup->add_vm(vmg_role, vid);

    if ( rc != 0 )
    {
        error = "Role does not exist in VM Group";
    }
    else
    {
        update(vmgroup);
    }

    vmgroup->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupPool::del_vm(const VectorAttribute * va, int vid)
{
    int vmg_id;

    if ( va->vector_value("VMGROUP_ID", vmg_id) == -1 )
    {
        return;
    }

    string vmg_role = va->vector_value("ROLE");

    if ( vmg_role.empty() )
    {
        return;
    }

    VMGroup * vmgroup = get(vmg_id, true);

    if ( vmgroup == 0 )
    {
        return;
    }

    vmgroup->del_vm(vmg_role, vid);

    update(vmgroup);

    vmgroup->unlock();
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupPool::authorize(const VectorAttribute * va, int uid,AuthRequest* ar)
{
    PoolObjectAuth perm;

    VMGroup * vmgroup = get_from_attribute(va, uid);

    if ( vmgroup == 0 )
    {
        return;
    }

    vmgroup->get_permissions(perm);

    vmgroup->unlock();

    ar->add_auth(AuthRequest::USE, perm);
}


