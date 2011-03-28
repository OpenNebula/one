/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "PoolObjectSQL.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select(SqlDB *db)
{
    ostringstream   oss;
    int             rc;
    int             boid;

    set_callback(
            static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

    oss << "SELECT body FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::select(SqlDB *db, const string& _name, int _uid)
{
    ostringstream oss;

    int rc;
    char * sql_name;

    sql_name = db->escape_str(_name.c_str());

    if ( sql_name == 0 )
    {
        return -1;
    }

    set_callback(
            static_cast<Callbackable::Callback>(&PoolObjectSQL::select_cb));

    oss << "SELECT body FROM " << table << " WHERE name = '" <<_name << "'";

    if ( _uid != -1 )
    {
        oss << " AND uid = " << _uid;
    }

    name  = "";
    uid   = -1;

    rc = db->exec(oss, this);

    unset_callback();

    db->free_str(sql_name);

    if ((rc != 0) || (_name != name) || (_uid != uid))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolObjectSQL::drop(SqlDB *db)
{
    ostringstream oss;
    int rc;

    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}
