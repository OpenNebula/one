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
#include <iomanip>

#include "VirtualNetworkXML.h"
#include "NebulaUtil.h"
#include "NebulaLog.h"
#include "ObjectCollection.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkXML::net_num_paths = 2;

const char * VirtualNetworkXML::net_paths[] =
{
    "/VNET/TEMPLATE/",
    "/VNET/"
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkXML::init_attributes()
{
    xpath(oid,  "/VNET/ID",          -1);

    ObjectCollection cluster_collection("CLUSTERS");
    cluster_collection.from_xml(this, "/VNET/");

    cluster_ids = cluster_collection.get_collection();

    xpath(uid,      "/VNET/UID",  -1);
    xpath(gid,      "/VNET/GID",  -1);

    xpath(owner_u, "/VNET/PERMISSIONS/OWNER_U", 0);
    xpath(owner_m, "/VNET/PERMISSIONS/OWNER_M", 0);
    xpath(owner_a, "/VNET/PERMISSIONS/OWNER_A", 0);

    xpath(group_u, "/VNET/PERMISSIONS/GROUP_U", 0);
    xpath(group_m, "/VNET/PERMISSIONS/GROUP_M", 0);
    xpath(group_a, "/VNET/PERMISSIONS/GROUP_A", 0);

    xpath(other_u, "/VNET/PERMISSIONS/OTHER_U", 0);
    xpath(other_m, "/VNET/PERMISSIONS/OTHER_M", 0);
    xpath(other_a, "/VNET/PERMISSIONS/OTHER_A", 0);

    //-------------------- AR_POOL used leases ------------------------------
    vector<string> ar_size;
    vector<string> ar_used_leases;

    xpaths(ar_size, "/VNET/AR_POOL/AR/SIZE");
    xpaths(ar_used_leases, "/VNET/AR_POOL/AR/USED_LEASES");

    int used_leases;

    free_leases = 0;

    for (size_t i = 0; i < ar_size.size() ; i++)
    {
        free_leases += atoi(ar_size[i].c_str());
    }

    xpath(used_leases, "/VNET/USED_LEASES", 0);

    free_leases -= used_leases;

    ObjectXML::paths     = net_paths;
    ObjectXML::num_paths = net_num_paths;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualNetworkXML::test_leases(string & error) const
{
    bool fits = (free_leases > 0);

    if (!fits)
    {
        if (NebulaLog::log_level() >= Log::DDEBUG)
        {
            ostringstream oss;

            oss << "Not enough free leases. "
                << "Requested: 1 LEASES, "
                << "Available: " << free_leases << " LEASES";

            error = oss.str();
        }
        else
        {
            error = "Not enough free leases.";
        }
    }

    return fits;
}


void VirtualNetworkXML::get_permissions(PoolObjectAuth& auth) const
{
    auth.obj_type = PoolObjectSQL::NET;

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& o, const VirtualNetworkXML& p)
{
    o << right << setw(8)  << p.oid         << " "
      << right << setw(8)  << p.free_leases << " ";

    return o;
}
