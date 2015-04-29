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
    oid        = atoi(((*this)["/DATASTORE/ID"] )[0].c_str() );
    cluster_id = atoi(((*this)["/DATASTORE/CLUSTER_ID"] )[0].c_str() );
    free_mb    = atoll(((*this)["/DATASTORE/FREE_MB"])[0].c_str());

    long long total_mb  = atoll(((*this)["/DATASTORE/TOTAL_MB"])[0].c_str());
    long long used_mb   = atoll(((*this)["/DATASTORE/USED_MB"])[0].c_str());

    monitored = (free_mb != 0 || total_mb != 0 || used_mb != 0);

    vector<string> strings = ((*this)["/DATASTORE/TEMPLATE/LIMIT_MB"]);

    if (!strings.empty())
    {
        long long limit_mb = atoll(strings[0].c_str());
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
