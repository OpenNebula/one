/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
    snap->replace("ACTION", "CREATE");

    obj_template->set(snap);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int set_active_snapshot(int snap_id, const string& action,
        vector<VectorAttribute *>& snaps)
{
    int s_id;

    vector<VectorAttribute *>::iterator it;

    for ( it = snaps.begin() ; it != snaps.end() ; ++it )
    {
        (*it)->vector_value("SNAPSHOT_ID", s_id);

        if ( s_id == snap_id )
        {
            (*it)->replace("ACTIVE", "YES");
            (*it)->replace("ACTION", action);
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
    vector<VectorAttribute *>::iterator it;

    obj_template->get("SNAPSHOT", snaps);

    for ( it = snaps.begin() ; it != snaps.end() ; ++it )
    {
        if ( (*it)->vector_value("ACTIVE") == "YES" )
        {
            (*it)->replace("HYPERVISOR_ID", hypervisor_id);
            break;
        }
    }
}

void VirtualMachine::update_snapshot_id()
{
    vector<VectorAttribute *> snaps;
    vector<VectorAttribute *>::iterator it;

    obj_template->get("SNAPSHOT", snaps);

    for ( it = snaps.begin() ; it != snaps.end() ; ++it )
    {
        if ( (*it)->vector_value("ACTIVE") == "YES" )
        {
            string snap_id = (*it)->vector_value("SNAPSHOT_ID");
            (*it)->replace("HYPERVISOR_ID", snap_id);
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
    vector<VectorAttribute *>::iterator it;

    obj_template->get("SNAPSHOT", snaps);

    for ( it = snaps.begin() ; it != snaps.end() ; ++it )
    {
        if ( (*it)->vector_value("ACTIVE") == "YES" )
        {
            action = (*it)->vector_value("ACTION");
            break;
        }
    }

    return action;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::clear_active_snapshot()
{
    vector<VectorAttribute *> snaps;
    vector<VectorAttribute *>::iterator it;

    obj_template->get("SNAPSHOT", snaps);

    for ( it = snaps.begin() ; it != snaps.end() ; ++it )
    {
        if ( (*it)->vector_value("ACTIVE") == "YES" )
        {
            (*it)->remove("ACTIVE");
            (*it)->remove("ACTION");
            return;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::delete_active_snapshot()
{
    vector<VectorAttribute *> snaps;
    vector<VectorAttribute *>::iterator it;

    obj_template->get("SNAPSHOT", snaps);

    for ( it = snaps.begin() ; it != snaps.end() ; ++it )
    {
        if ( (*it)->vector_value("ACTIVE") == "YES" )
        {
            delete obj_template->remove(*it);

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

