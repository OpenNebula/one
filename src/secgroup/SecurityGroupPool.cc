/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "SecurityGroupPool.h"

/* -------------------------------------------------------------------------- */

SecurityGroupPool::SecurityGroupPool(SqlDB * db)
    :PoolSQL(db, SecurityGroup::table, true, true)
{
    //lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        // The first 100 IDs are reserved for system Security Groups.
        // Regular ones start from ID 100

        set_update_lastOID(99);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroupPool::allocate(
        int             uid,
        int             gid,
        const string&   uname,
        const string&   gname,
        int             umask,
        Template *      sgroup_template,
        int *           oid,
        string&         error_str)
{
    SecurityGroup * secgroup;
    SecurityGroup * secgroup_aux = 0;

    string name;

    ostringstream oss;

    secgroup = new SecurityGroup(uid, gid, uname, gname, umask, sgroup_template);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    secgroup->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    secgroup_aux = get(name,uid,false);

    if( secgroup_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(secgroup, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by SecurityGroup " << secgroup_aux->get_oid() << ".";
    error_str = oss.str();

error_name:
    delete secgroup;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroupPool::update(SecurityGroup * securitygroup)
{
    return securitygroup->update(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
