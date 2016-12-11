/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachine.h"
#include "Nebula.h"


// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// System Snapshot Interface
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
//
int VirtualMachine::new_snapshot(string& name, int& snap_id)
{
    int num_snaps;
    int id;
    int max_id = -1;

    vector<VectorAttribute *> snaps;

    num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        snaps[i]->vector_value("SNAPSHOT_ID", id);

        if (id > max_id)
        {
            max_id = id;
        }
    }

    snap_id = max_id + 1;

    if (name.empty())
    {
        ostringstream oss;

        oss << "snapshot-" << snap_id;

        name = oss.str();
    }

    VectorAttribute * snap = new VectorAttribute("SNAPSHOT");
    snap->replace("SNAPSHOT_ID", snap_id);
    snap->replace("NAME", name);
    snap->replace("TIME", (int)time(0));
    snap->replace("HYPERVISOR_ID", "");

    snap->replace("ACTIVE", "YES");

    obj_template->set(snap);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::set_active_snapshot(int snap_id)
{
    int s_id;

    vector<VectorAttribute *> snaps;
    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        snaps[i]->vector_value("SNAPSHOT_ID", s_id);

        if ( s_id == snap_id )
        {
            snaps[i]->replace("ACTIVE", "YES");
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::update_snapshot_id(string& hypervisor_id)
{
    vector<VectorAttribute  *> snaps;
    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        if ( snaps[i]->vector_value("ACTIVE") == "YES" )
        {
            snaps[i]->replace("HYPERVISOR_ID", hypervisor_id);
            break;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_active_snapshot()
{
    vector<VectorAttribute  *> snaps;

    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        if ( snaps[i]->vector_value("ACTIVE") == "YES" )
        {
            snaps[i]->remove("ACTIVE");
            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_active_snapshot()
{
    vector<VectorAttribute *> snaps;
    int num_snaps = obj_template->get("SNAPSHOT", snaps);

    for(int i=0; i<num_snaps; i++)
    {
        if ( snaps[i]->vector_value("ACTIVE") == "YES" )
        {
            delete obj_template->remove(snaps[i]);

            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_snapshots()
{
    obj_template->erase("SNAPSHOT");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

