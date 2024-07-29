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

#include <sstream>

#include "DatastoreXML.h"
#include "NebulaUtil.h"
#include "NebulaLog.h"
#include "ObjectCollection.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastoreXML::ds_num_paths = 2;

const char * DatastoreXML::ds_paths[] =
{
    "/DATASTORE/TEMPLATE/",
    "/DATASTORE/"
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DatastoreXML::init_attributes()
{
    xpath(oid,  "/DATASTORE/ID",          -1);

    ObjectCollection cluster_collection("CLUSTERS");
    cluster_collection.from_xml(this, "/DATASTORE/");

    cluster_ids = cluster_collection.get_collection();

    xpath(uid,      "/DATASTORE/UID",  -1);
    xpath(gid,      "/DATASTORE/GID",  -1);

    xpath(owner_u, "/DATASTORE/PERMISSIONS/OWNER_U", 0);
    xpath(owner_m, "/DATASTORE/PERMISSIONS/OWNER_M", 0);
    xpath(owner_a, "/DATASTORE/PERMISSIONS/OWNER_A", 0);

    xpath(group_u, "/DATASTORE/PERMISSIONS/GROUP_U", 0);
    xpath(group_m, "/DATASTORE/PERMISSIONS/GROUP_M", 0);
    xpath(group_a, "/DATASTORE/PERMISSIONS/GROUP_A", 0);

    xpath(other_u, "/DATASTORE/PERMISSIONS/OTHER_U", 0);
    xpath(other_m, "/DATASTORE/PERMISSIONS/OTHER_M", 0);
    xpath(other_a, "/DATASTORE/PERMISSIONS/OTHER_A", 0);

    xpath<long long>(free_mb, "/DATASTORE/FREE_MB", 0);

    long long total_mb, used_mb, limit_mb;

    xpath<long long>(total_mb, "/DATASTORE/TOTAL_MB", 0);
    xpath<long long>(used_mb,  "/DATASTORE/USED_MB",  0);

    monitored = (free_mb != 0 || total_mb != 0 || used_mb != 0);

    int rc = xpath<long long>(limit_mb, "/DATASTORE/TEMPLATE/LIMIT_MB", 0);

    if (rc == 0)
    {
        free_mb = limit_mb - used_mb;

        if (free_mb < 0)
        {
            free_mb = 0;
        }
    }

    string shared_st;
    this->xpath(shared_st, "/DATASTORE/TEMPLATE/SHARED", "YES");

    shared = one_util::icasecmp(shared_st, "YES");

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

void DatastoreXML::get_permissions(PoolObjectAuth& auth)
{
    auth.obj_type = PoolObjectSQL::DATASTORE;

    auth.oid = oid;
    auth.uid = uid;
    auth.gid = gid;
    auth.cids = cluster_ids;

    auth.owner_u = owner_u;
    auth.owner_m = owner_m;
    auth.owner_a = owner_a;

    auth.group_u = group_u;
    auth.group_m = group_m;
    auth.group_a = group_a;

    auth.other_u = other_u;
    auth.other_m = other_m;
    auth.other_a = other_a;
}
