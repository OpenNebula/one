/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#include "HostShareDatastore.h"
#include "HostShareCapacity.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShareDatastore::set_monitorization(Template& ht)
{
    vector<VectorAttribute *> vector_ds;

    // -------------------------------------------------------------------------
    // Get overall datastore information
    // -------------------------------------------------------------------------
    ht.get("DS_LOCATION_TOTAL_MB", max_disk);
    ht.erase("DS_LOCATION_TOTAL_MB");

    ht.get("DS_LOCATION_FREE_MB", free_disk);
    ht.erase("DS_LOCATION_FREE_MB");

    ht.get("DS_LOCATION_USED_MB", used_disk);
    ht.erase("DS_LOCATION_USED_MB");

    update();

    // -------------------------------------------------------------------------
    // Get system datastore monitorization for non shared
    // -------------------------------------------------------------------------
    erase("DS"); //clear current DS information

    ht.remove("DS", vector_ds);

    for (auto ds: vector_ds)
    {
        set(ds);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShareDatastore::add(HostShareCapacity &sr)
{
    disk_usage += sr.disk;

    replace("DISK_USAGE", disk_usage);
}

/* -------------------------------------------------------------------------- */

void HostShareDatastore::del(HostShareCapacity &sr)
{
    disk_usage -= sr.disk;

    replace("DISK_USAGE", disk_usage);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShareDatastore::update()
{
    replace("DISK_USAGE", disk_usage);

    replace("MAX_DISK",  max_disk);
    replace("FREE_DISK", free_disk);
    replace("USED_DISK", used_disk);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShareDatastore::from_xml_node(const xmlNodePtr node)
{
    if ( Template::from_xml_node(node) != 0 )
    {
        return -1;
    }

    if ( !get("DISK_USAGE", disk_usage) )
    {
        disk_usage = 0;
    }

    if ( !get("MAX_DISK", max_disk) )
    {
        max_disk = 0;
    }

    if ( !get("FREE_DISK", free_disk))
    {
        free_disk = 0;
    }

    if ( !get("USED_DISK", used_disk))
    {
        used_disk = 0;
    }

    update();

    return 0;
}

