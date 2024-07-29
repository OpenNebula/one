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

#ifndef REPLICA_MANAGER_H_
#define REPLICA_MANAGER_H_

#include <string>
#include <map>
#include <vector>

class ReplicaThread;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication Manager. This is a generic replication manager it starts, stops
// and send control events to replica threads.
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
class ReplicaManager
{
public:
    /**
     *  Start the replication threads, one for each server in the zone
     */
    void start_replica_threads(std::vector<int>& fids);

    /**
     *  Stop the replication threads (leader becomes follower)
     */
    void stop_replica_threads();

    /**
     *  Triggers a replication event on the replica threads
     */
    void replicate();

    /**
     *  Triggers a replication event on the follower thread
     *    @param follower id
     */
    void replicate(int follower);

    /**
     *  Deletes a replication thread for a follower (e.g. server deleted)
     *    @param follower_id server id
     */
    void delete_replica_thread(int follower_id);

    /**
     *  Adds a replication thread for a follower (e.g. server add)
     *    @param follower_id server id
     */
    void add_replica_thread(int follower_id);

protected:
    ReplicaManager() {};

    virtual ~ReplicaManager()
    {
        stop_replica_threads();
    };

    virtual ReplicaThread * thread_factory(int follower_id) = 0;

private:
    /**
     *  The replication thread pool
     */
    std::map<int, ReplicaThread *> thread_pool;

    /**
     *  @param server_id of the follower
     *  @return pointer to the replica thread associated to a follower
     */
    ReplicaThread * get_thread(int server_id);
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// RaftReplicaManager to manage the raft replication thread pool
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
class RaftReplicaManager : public ReplicaManager
{
public:
    RaftReplicaManager():ReplicaManager() {};

    virtual ~RaftReplicaManager() {};

private:
    ReplicaThread * thread_factory(int follower_id) override;
};

class HeartBeatManager : public ReplicaManager
{
public:
    HeartBeatManager():ReplicaManager() {};

    virtual ~HeartBeatManager() {};

private:
    ReplicaThread * thread_factory(int follower_id) override;
};

#endif /*REPLICA_MANAGER_H_*/

