/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
#include <algorithm>

#include "Snapshots.h"
#include "NebulaUtil.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Snapshots::Snapshots(int __disk_id, AllowOrphansMode _orphans):
    snapshot_template(false,'=',"SNAPSHOTS"),
    next_snapshot(0),
    active(-1),
    _disk_id(__disk_id),
    orphans(_orphans),
    current_base(-1)
{
    if (__disk_id != -1)
    {
        snapshot_template.add("DISK_ID", __disk_id);
    }

    snapshot_template.add("ALLOW_ORPHANS", allow_orphans_mode_to_str(_orphans));

    snapshot_template.add("NEXT_SNAPSHOT", 0);

    snapshot_template.add("CURRENT_BASE", -1);
};

Snapshots::Snapshots(const Snapshots& s):
    snapshot_template(s.snapshot_template),
    next_snapshot(0),
    active(-1),
    _disk_id(-1),
    orphans(DENY),
    current_base(-1)
{
    init();
}

Snapshots& Snapshots::operator= (const Snapshots& s)
{
    if (this != &s)
    {
        next_snapshot = s.next_snapshot;
        active        = s.active;
        _disk_id      = s._disk_id;
        orphans       = s.orphans;
        current_base  = s.current_base;

        snapshot_template = s.snapshot_template;

        snapshot_pool.clear();

        init();
    }

    return *this;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::from_xml_node(const xmlNodePtr node)
{
    int rc = snapshot_template.from_xml_node(node);

    if (rc != 0)
    {
        return -1;
    }

    init();

    return 0;
}

/* -------------------------------------------------------------------------- */

void Snapshots::init()
{
    vector<VectorAttribute *> snap;

    int  id;
    bool current;

    int num_snap = snapshot_template.get("SNAPSHOT", snap);

    for (int i=0; i < num_snap; i++)
    {
        snap[i]->vector_value("ID", id);

        snap[i]->vector_value("ACTIVE", current);

        if (current)
        {
            active = id;
        }

        snapshot_pool.insert(pair<int, VectorAttribute *>(id, snap[i]));
    }

    int did;

    if (snapshot_template.get("DISK_ID", did))
    {
        _disk_id = did;
    }

    snapshot_template.get("NEXT_SNAPSHOT", next_snapshot);

    string orphans_str;

    if (snapshot_template.get("ALLOW_ORPHANS", orphans_str) == false)
    {
        orphans = DENY;
    }
    else
    {
        orphans = str_to_allow_orphans_mode(one_util::toupper(orphans_str));
    }

    if (snapshot_template.get("CURRENT_BASE", current_base) == false)
    {
        current_base = -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::create_snapshot(const string& name, long long size_mb)
{
    VectorAttribute * snapshot = new VectorAttribute("SNAPSHOT");

    if (!name.empty())
    {
        snapshot->replace("NAME", name);
    }

    snapshot->replace("SIZE", size_mb);
    snapshot->replace("ID", next_snapshot);
    snapshot->replace("DATE", static_cast<long long>(time(0)));

    if (orphans == DENY)
    {
        if (add_child_deny(snapshot) == -1)
        {
            return -1;
        }
    }
    else if (orphans == MIXED)
    {
        add_child_mixed(snapshot);
    }
    else //ALLOW
    {
        snapshot->replace("PARENT", "-1");
    }

    snapshot_template.replace("NEXT_SNAPSHOT", next_snapshot + 1);

    snapshot_template.set(snapshot);

    snapshot_pool.insert(
            pair<int, VectorAttribute *>(next_snapshot, snapshot));

    return next_snapshot++;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Snapshots::add_child_mixed(VectorAttribute *snapshot)
{
    snapshot->replace("PARENT", current_base);

    if (current_base != -1)
    {
        VectorAttribute * parent = get_snapshot(current_base);

        if (parent != nullptr)
        {
            string children = parent->vector_value("CHILDREN");

            if (children.empty())
            {
                parent->replace("CHILDREN", next_snapshot);
            }
            else
            {
                ostringstream oss;

                oss << children << "," << next_snapshot;

                parent->replace("CHILDREN", oss.str());
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::add_child_deny(VectorAttribute *snapshot)
{
    snapshot->replace("PARENT", active);

    if (active != -1)
    {
        VectorAttribute * parent = get_snapshot(active);

        if (parent == nullptr)
        {
            delete snapshot;
            return -1;
        }

        string children = parent->vector_value("CHILDREN");

        if (children.empty())
        {
            parent->replace("CHILDREN", next_snapshot);
        }
        else
        {
            ostringstream oss;

            oss << children << "," << next_snapshot;

            parent->replace("CHILDREN", oss.str());
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Snapshots::delete_snapshot(int id)
{
    VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == nullptr)
    {
        return;
    }

    switch(orphans)
    {
        case DENY:
        case MIXED:
        {
            int parent_id;

            // -----------------------------------------------------------------
            // Remove this snapshot from parent's children
            // -----------------------------------------------------------------
            snapshot->vector_value("PARENT", parent_id);

            if (parent_id == -1)
            {
                break;
            }

            VectorAttribute * parent = get_snapshot(parent_id);

            if (parent == nullptr)
            {
                break;
            }

            string children = parent->vector_value("CHILDREN");

            set<int> child_set;

            one_util::split_unique(children, ',', child_set);

            child_set.erase(id);

            // -----------------------------------------------------------------
            // Add snapshot child to parent's children
            //
            // Only DENY for in-line chain removal of snapshots (1 child)
            // -----------------------------------------------------------------
            string my_children = snapshot->vector_value("CHILDREN");

            set<int> my_child_set;

            one_util::split_unique(my_children, ',', my_child_set);

            if ( my_child_set.size() == 1 )
            {
                int child_id = *my_child_set.begin();

                child_set.insert(child_id);

                VectorAttribute * child = get_snapshot(child_id);

                if ( child != nullptr )
                {
                    child->replace("PARENT", parent_id);
                }
            }

            children = one_util::join(child_set.begin(), child_set.end(), ',');

            if (children.empty())
            {
                parent->remove("CHILDREN");
            }
            else
            {
                parent->replace("CHILDREN", children);
            }

            // -----------------------------------------------------------------
            // Set parent to ACTIVE if this snapshot id the active one
            //
            // Only DENY when deleting the active snapshot
            // -----------------------------------------------------------------
            if (active == id)
            {
                active = parent_id;

                parent->replace("ACTIVE", true);
            }

            break;
        }

        case ALLOW:
        case FORMAT: //At this point allow orpahn should be mapped to DENY/ALLOW
            break;
    }

    snapshot_template.remove(snapshot);

    delete snapshot;

    snapshot_pool.erase(id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::active_snapshot(int id, bool revert)
{
    if (id == active)
    {
        return 0;
    }

    VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == nullptr)
    {
        return -1;
    }

    if (orphans == MIXED)
    {
        if (!revert)
        {
            return 0;
        }

        current_base = id;
        snapshot_template.replace("CURRENT_BASE", id);
    }

    snapshot->replace("ACTIVE", true);

    snapshot = get_snapshot(active);

    if (snapshot != nullptr)
    {
        snapshot->remove("ACTIVE");
    }

    active = id;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::rename_snapshot(int id, const string& name, string& str_error)
{
    VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == nullptr)
    {
        str_error = "Snapshot does not exist";
        return -1;
    }

    snapshot->replace("NAME", name);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const VectorAttribute * Snapshots::get_snapshot(int id) const
{
    auto it = snapshot_pool.find(id);

    if (it == snapshot_pool.end())
    {
        return nullptr;
    }

    return it->second;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Snapshots::snapshot_attribute(int id, const char * name) const
{
    const VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == nullptr)
    {
        return "";
    }

    return snapshot->vector_value(name);
}

/* -------------------------------------------------------------------------- */

long long Snapshots::snapshot_size(int id) const
{
    long long snap_size = 0;

    const VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot != nullptr)
    {
        snapshot->vector_value("SIZE", snap_size);
    }

    return snap_size;
}

/* -------------------------------------------------------------------------- */

static int children_count(const VectorAttribute *snap, std::string& children)
{
    if (snap == nullptr)
    {
        return -1;
    }

    children.clear();

    if (snap->vector_value("CHILDREN", children) == -1 || children.empty())
    {
        return 0;
    }

    return std::count(children.begin(), children.end(), ',') + 1;
}

int Snapshots::children(int id, std::string& children) const
{
    if (id <= -1)
    {
        return -1;
    }

    return children_count(get_snapshot(id), children);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Snapshots::test_delete_image(int id, string& error) const
{
    bool   current;
    string children;

    const VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == nullptr)
    {
        error = "Snapshot does not exist";
        return false;
    }

    if (orphans == DENY || orphans == MIXED)
    {
        snapshot->vector_value("ACTIVE", current);

        if (current)
        {
            error = "Cannot delete the active snapshot";
            return false;
        }

        snapshot->vector_value("CHILDREN", children);

        if (!children.empty())
        {
            error = "Cannot delete snapshot with children";
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */

bool Snapshots::test_delete(int id, bool persistent, string& error) const
{
    string childs;
    int    ccount, p_ccount, c_ccount, p_id, c_id;

    const VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == nullptr)
    {
        error = "Snapshot does not exist";
        return false;
    }

    switch(orphans)
    {
        case DENY:
            if ( persistent && id == 0 )
            {
                error = "Cannot delete snapshot 0 for persistent disk images";
                return false;
            }

            ccount = children_count(snapshot, childs);

            if ( ccount > 1 )
            {
                error = "Cannot delete snapshot with more than one children";
                return false;
            }
            else if ( ccount == 0 )
            {
                return true;
            }
            else if ( ccount == 1 && active == id)
            {
                error = "Cannot delete the active snapshot with children";
                return false;
            }

            // -------------------------------------------------------------
            // Check the child (ccount == 1)
            // -------------------------------------------------------------
            if (snapshot->vector_value("CHILDREN", c_id) == 0)
            {
                c_ccount = children(c_id, childs);

                if ( c_ccount > 1 || ( c_ccount == 1 && active == c_id ) )
                {
                    error = "Cannot delete snapshot if child has children";
                    return false;
                }
            }

            // -----------------------------------------------------------------
            // Check the parent
            // -----------------------------------------------------------------
            if ( snapshot->vector_value("PARENT", p_id) == 0 && p_id != -1)
            {
                p_ccount = children(p_id, childs);

                if ( p_ccount > 1 )
                {
                    error = "Cannot delete snapshot if parent has more than one child";
                    return false;
                }
            }

            break;

        case MIXED:
            if (id == active)
            {
                error = "Cannot delete the active snapshot";
                return false;
            }

            ccount = children_count(snapshot, childs);

            if (ccount != 0)
            {
                error = "Cannot delete snapshot with children";
                return false;
            }

            break;

        case ALLOW:
            break;

        case FORMAT:
            //At this point allow orpahn should be mapped to DENY/ALLOW
            error = "Inconsistent snapshot orphan mode";
            return false;
    }

    return true;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

long long Snapshots::total_size() const
{
    long long size_mb, total_mb = 0;

    for ( auto it = snapshot_pool.begin(); it !=  snapshot_pool.end(); it++)
    {
        if (it->second->vector_value("SIZE", size_mb) == 0)
        {
            total_mb += size_mb;
        }
    }

    return total_mb;
}

