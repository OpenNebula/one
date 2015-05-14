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

#include "Snapshot.h"

Snapshots::Snapshots(int _disk_id):
    snapshot_template(false,'=',"SNAPSHOTS"),
    next_snapshot(0),
    disk_id(_disk_id),
    active(-1)
{
    snapshot_template.add("DISK_ID",_disk_id);
};

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

    vector<Attribute *> vsnap;

    unsigned int id;
    bool         current;

    int num_snap = snapshot_template.get("SNAPSHOT", vsnap);

    for (int i=0; i < num_snap; i++)
    {
        VectorAttribute * snap = static_cast<VectorAttribute *>(vsnap[i]);

        snap->vector_value("ID", id);

        snap->vector_value("ACTIVE", current);

        if (current)
        {
            active = id;
        }

        if (id >= next_snapshot)
        {
            next_snapshot = id + 1;
        }

        snapshot_pool.insert(pair<unsigned int, VectorAttribute *>(id, snap));
    }

    int did;

    if (snapshot_template.get("DISK_ID", did))
    {
        disk_id = id;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::create_snapshot(unsigned int p_id, const string& tag,
        string& error)
{
    VectorAttribute * parent = get_snapshot(p_id);

    if (parent == 0)
    {
        error = "Parent snapshot not found.";
        return -1;
    }

    string psource = parent->vector_value("SOURCE");

    if (psource.empty())
    {
        error = "Parent snapshot has no source.";
        return -1;
    }

    VectorAttribute * snapshot = new VectorAttribute("SNAPSHOT");

    if (!tag.empty())
    {
        snapshot->replace("TAG",tag);
    }

    snapshot->replace("ID", next_snapshot++);

    snapshot->replace("DATE", static_cast<long long>(time(0)));

    snapshot->replace("PARENT", psource);

    snapshot_template.set(snapshot);

    snapshot_pool.insert(pair<unsigned int, VectorAttribute *>(next_snapshot, snapshot));

    return next_snapshot;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::delete_snapshot(unsigned int id)
{
    VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == 0)
    {
        return -1;
    }

    bool current;

    snapshot->vector_value("ACTIVE", current);

    if (current)
    {
        return -1;
    }

    snapshot_template.remove(snapshot);

    delete snapshot;

    snapshot_pool.erase(id);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Snapshots::active_snapshot(unsigned int id)
{
    VectorAttribute * snapshot = get_snapshot(id);

    if (snapshot == 0)
    {
        return -1;
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

VectorAttribute * Snapshots::get_snapshot(unsigned int id)
{
    map<unsigned int, VectorAttribute *>::iterator it;

    it = snapshot_pool.find(id);

    if (it == snapshot_pool.end())
    {
        return 0;
    }

    return it->second;
};

