/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <sstream>

#include "DatastoreXML.h"
#include "NebulaUtil.h"
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastoreXML::ds_num_paths = 2;

const char * DatastoreXML::ds_paths[] = {
    "/DATASTORE/TEMPLATE/",
    "/DATASTORE/"
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DatastoreXML::init_attributes()
{
    xpath(oid,        "/DATASTORE/ID",          -1);
    xpath(cluster_id, "/DATASTORE/CLUSTER_ID",  -1);
    xpath(free_mb,    "/DATASTORE/FREE_MB",     0);

    long long total_mb, used_mb, limit_mb;

    xpath(total_mb, "/DATASTORE/TOTAL_MB", 0);
    xpath(used_mb,  "/DATASTORE/USED_MB",  0);

    monitored = (free_mb != 0 || total_mb != 0 || used_mb != 0);

    int rc = xpath(limit_mb, "/DATASTORE/TEMPLATE/LIMIT_MB", 0);

    if (rc == 0)
    {
        long long free_limited = limit_mb - used_mb;

        if (free_limited < 0)
        {
            free_mb = 0;
        }
        else if (free_limited < free_mb)
        {
            free_mb = free_limited;
        }
    }

    string shared_st;
    this->xpath(shared_st, "/DATASTORE/TEMPLATE/SHARED", "YES");

    shared = one_util::toupper(shared_st) == "YES";

    ObjectXML::paths     = ds_paths;
    ObjectXML::num_paths = ds_num_paths;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool DatastoreXML::test_capacity(long long vm_disk_mb, string & error) const
{
    bool fits = (vm_disk_mb < free_mb) || (vm_disk_mb == 0);

    if (!fits)
    {
        if (NebulaLog::log_level() >= Log::DDEBUG)
        {
            ostringstream oss;

            oss << "Not enough capacity. "
                << "Requested: " << vm_disk_mb << " MB, "
                << "Available: " << free_mb << " MB";

            error = oss.str();
        }
        else
        {
            error = "Not enough capacity.";
        }
    }

    return fits;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
