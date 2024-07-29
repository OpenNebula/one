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

#include "VirtualMachine.h"
#include "Nebula.h"

using namespace std;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// System Snapshot Interface
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

bool VirtualMachine::has_snapshots()
{
    vector<VectorAttribute *> snaps;

    return obj_template->get("SNAPSHOT", snaps) > 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

VectorAttribute* VirtualMachine::new_snapshot(string& name, int& snap_id)
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
    snap->replace("ACTION", "CREATE");

    // Compute snapshot max system DS size (memory size + disks size*factor)
    float disk_factor = 0;

    Nebula::instance().get_configuration_attribute("VM_SNAPSHOT_FACTOR",
                                                   disk_factor);

    int system_disk_size = disks.system_ds_size(false) * disk_factor;

    int mem_size = 0;
    obj_template->get("MEMORY", mem_size);

    system_disk_size += mem_size;

    snap->replace("SYSTEM_DISK_SIZE", system_disk_size);

    obj_template->set(snap);

    return snap;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int set_active_snapshot(int snap_id, const string& action,
                        vector<VectorAttribute *>& snaps)
{
    int s_id;

    for ( auto snap : snaps )
    {
        snap->vector_value("SNAPSHOT_ID", s_id);

        if ( s_id == snap_id )
        {
            snap->replace("ACTIVE", "YES");
            snap->replace("ACTION", action);
            return 0;
        }
    }

    return -1;
}

int VirtualMachine::set_revert_snapshot(int snap_id)
{
    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    return set_active_snapshot(snap_id, "REVERT", snaps);
}

int VirtualMachine::set_delete_snapshot(int snap_id)
{
    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    return set_active_snapshot(snap_id, "DELETE", snaps);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::update_snapshot_id(const string& hypervisor_id)
{
    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    for ( auto snap : snaps )
    {
        if ( snap->vector_value("ACTIVE") == "YES" )
        {
            snap->replace("HYPERVISOR_ID", hypervisor_id);
            break;
        }
    }
}

void VirtualMachine::update_snapshot_id()
{
    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    for ( auto snap : snaps )
    {
        if ( snap->vector_value("ACTIVE") == "YES" )
        {
            string snap_id = snap->vector_value("SNAPSHOT_ID");
            snap->replace("HYPERVISOR_ID", snap_id);
            break;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string VirtualMachine::get_snapshot_action() const
{
    string action;

    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    for ( auto snap : snaps )
    {
        if ( snap->vector_value("ACTIVE") == "YES" )
        {
            action = snap->vector_value("ACTION");
            break;
        }
    }

    return action;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute* VirtualMachine::get_active_snapshot() const
{
    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    for ( auto snap : snaps )
    {
        if ( snap->vector_value("ACTIVE") == "YES" )
        {
            return snap;
        }
    }

    return nullptr;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_active_snapshot()
{
    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    for ( auto snap : snaps )
    {
        if ( snap->vector_value("ACTIVE") == "YES" )
        {
            snap->remove("ACTIVE");
            snap->remove("ACTION");
            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_active_snapshot()
{
    vector<VectorAttribute *> snaps;

    obj_template->get("SNAPSHOT", snaps);

    for ( auto snap : snaps )
    {
        if ( snap->vector_value("ACTIVE") == "YES" )
        {
            delete obj_template->remove(snap);

            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_snapshots(Template& snapshots)
{
    vector<VectorAttribute*> attrs;
    obj_template->remove("SNAPSHOT", attrs);

    snapshots.set(attrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

long long VirtualMachine::get_snapshots_system_size(Template *tmpl)
{
    long long total_size = 0, size = 0;
    vector<VectorAttribute *> snaps;

    tmpl->get("SNAPSHOT", snaps);

    for ( auto snap : snaps )
    {
        if ( snap->vector_value("SYSTEM_DISK_SIZE", size) == 0 )
        {
            total_size += size;
        }
    }

    return total_size;
}
