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

#ifndef REPLICA_MANAGER_H_
#define REPLICA_MANAGER_H_

#include <xmlrpc-c/client.hpp>
#include <string>
#include <map>
#include <vector>

class LogDBRecord;

extern "C" void * replication_thread(void *arg);

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication thread class
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
class ReplicaThread
{
public:
    ReplicaThread(int follower_id);

    virtual ~ReplicaThread(){};

    /**
     *  Main replication logic for the thread, it sends log records to followers
     *  and handle errors
     */
    void do_replication();

    /**
     *  Notify this replica thread that are new records in the log to replicate
     */
    void add_request();

    /**
     *  Exists the replication thread
     */
    void finalize();

    pthread_t thread_id() const
    {
        return _thread_id;
    }

private:
    /**
     * C linkage function to start the thread
     *   @param arg pointer to "this"
     */
    friend void * replication_thread(void *arg);

    // -------------------------------------------------------------------------
    // pthread synchronization variables
    // -------------------------------------------------------------------------
    pthread_t _thread_id;

    pthread_mutex_t mutex;

    pthread_cond_t cond;

    bool _finalize;

    bool _pending_requests;

    time_t retry_timeout;

    static const time_t max_retry_timeout;

    // -------------------------------------------------------------------------
    // Information of the replication target server and leader
    // -------------------------------------------------------------------------
    int follower_id;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication Manager
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
class ReplicaManager
{
public:
    ReplicaManager(){};

    virtual ~ReplicaManager()
    {
        stop_replica_threads();
    };

    /**
     *  Start the replication threads, one for each server in the zone
     */
    void start_replica_threads(std::vector<unsigned int>& fids);

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

#endif /*REPLICA_MANAGER_H_*/

