/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

/* ************************************************************************** */
/* BackupJob Pool                                                             */
/* ************************************************************************** */

#include "BackupJobPool.h"
#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupJobPool::allocate (
        int                      uid,
        int                      gid,
        const string&            uname,
        const string&            gname,
        int                      umask,
        unique_ptr<Template>     templ,
        int *                    oid,
        string&                  error_str)
{
    string          name;
    ostringstream   oss;

    int db_oid;

    BackupJob *bj = new BackupJob(uid, gid, uname, gname, umask, move(templ));

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------
    bj->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    db_oid = exist(name, uid);

    if( db_oid != -1 )
    {
        goto error_duplicated;
    }

    // ---------------------------------------------------------------------
    // Insert the Object in the pool & Register the image in the repository
    // ---------------------------------------------------------------------
    *oid = PoolSQL::allocate(bj, error_str);

    if ( *oid != -1 )
    {
        // todo trigger hook object created
    }

    return *oid;

error_duplicated:
    oss << "NAME is already taken by BACKUP JOB " << db_oid << ".";
    error_str = oss.str();

    goto error_common;

error_name:
error_common:
    delete bj;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

