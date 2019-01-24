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

#include "Snapshots.h"
#include "NebulaUtil.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Snapshots::Snapshots(int _disk_id, AllowOrphansMode _orphans):
    snapshot_template(false,'=',"SNAPSHOTS"),
    next_snapshot(0),
    active(-1),
    disk_id(_disk_id),
    orphans(_orphans),
    current_base(-1)
{
    if (_disk_id != -1)
    {
        snapshot_template.add("DISK_ID", _disk_id);
    }

    snapshot_template.add("ALLOW_ORPHANS", allow_orphans_mode_to_str(_orphans));

    snapshot_template.add("NEXT_SNAPSHOT", 0);

    snapshot_template.add("CURRENT_BASE", -1);
};

Snapshots::Snapshots(const Snapshots& s):
    snapshot_template(s.snapshot_template),
    next_snapshot(0),
    active(-1),
    disk_id(-1),
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
        disk_id       = s.disk_id;
        orphans       = s.orphans;
        current_base  = s.current_base;

        snapshot_template = s.snapshot_template;

        snapshot_pool.clear();

        init();
    }

    return *this;
}

Snapshots::~Snapshots(){};

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
        disk_id = did;
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

        if (parent != 0)
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

        if (parent == 0)
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
    int parent_id;

    VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == 0)
    {
        return;
    }

    if (orphans == DENY || orphans == MIXED)
    {
        snapshot->vector_value("PARENT", parent_id);

        //Remove this snapshot from parent's children
        if (parent_id != -1)
        {
            set<int> child_set;

            VectorAttribute * parent = get_snapshot(parent_id);

            if (parent != 0)
            {
                string children = parent->vector_value("CHILDREN");

                one_util::split_unique(children, ',', child_set);

                child_set.erase(id);

                children = one_util::join(child_set.begin(), child_set.end(), ',');

                if (children.empty())
                {
                    parent->remove("CHILDREN");
                }
                else
                {
                    parent->replace("CHILDREN", children);
                }
            }
        }
    }

    snapshot_template.remove(snapshot);

    delete snapshot;

    snapshot_pool.erase(id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::active_snapshot(int id, bool revert)
{
    if (static_cast<int>(id) == active)
    {
        return 0;
    }

    VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == 0)
    {
        return -1;
    }

    if (revert && (orphans == MIXED))
    {
        current_base = id;
        snapshot_template.replace("CURRENT_BASE", id);
    }

    snapshot->replace("ACTIVE", true);

    snapshot = get_snapshot(active);

    if (snapshot != 0)
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

    if (snapshot == 0)
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
    map<int, VectorAttribute *>::const_iterator it;

    it = snapshot_pool.find(id);

    if (it == snapshot_pool.end())
    {
        return 0;
    }

    return it->second;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Snapshots::get_snapshot_attribute(int id, const char * name) const
{
    const VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == 0)
    {
        return "";
    }

    return snapshot->vector_value(name);
}

/* -------------------------------------------------------------------------- */

long long Snapshots::get_snapshot_size(int id) const
{
    long long snap_size = 0;

    const VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot != 0)
    {
        snapshot->vector_value("SIZE", snap_size);
    }

    return snap_size;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Snapshots::test_delete(int id, string& error) const
{
    bool   current;
    string children;

    const VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == 0)
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
/* -------------------------------------------------------------------------- */

long long Snapshots::get_total_size() const
{
    map<int, VectorAttribute *>::const_iterator it;
    long long size_mb, total_mb = 0;

    for ( it = snapshot_pool.begin(); it !=  snapshot_pool.end(); it++)
    {
        if (it->second->vector_value("SIZE", size_mb) == 0)
        {
            total_mb += size_mb;
        }
    }

    return total_mb;
}

