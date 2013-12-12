/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "ZonePool.h"
#include "NebulaLog.h"


/* -------------------------------------------------------------------------- */

ZonePool::ZonePool(SqlDB * db)
    :PoolSQL(db, Zone::table, true)
{
    if (get_lastOID() == -1) //lastOID is set in PoolSQL::init_cb
    {
        // The first 100 Zone IDs are reserved for system Zones.
        // Regular ones start from ID 100

        set_update_lastOID(99);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ZonePool::allocate(
        Template *  zone_template,
        int *       oid,
        string&     error_str)
{
    Zone * zone;
    Zone * zone_aux = 0;

    string name;

    ostringstream oss;

    zone = new Zone(-1, zone_template);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    zone->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    zone_aux = get(name,false);

    if( zone_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(zone, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by Zone " << zone_aux->get_oid() << ".";
    error_str = oss.str();

error_name:
    delete zone;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ZonePool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    Zone * zone = static_cast<Zone*>(objsql);

    // Return error if the zone is a default one.
    if( zone->get_oid() < 100 )
    {
        error_msg = "System Zones (ID < 100) cannot be deleted.";
        NebulaLog::log("ZONE", Log::ERROR, error_msg);
        return -2;
    }

    return PoolSQL::drop(objsql, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
