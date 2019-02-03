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

#ifndef REPLICA_THREAD_H_
#define REPLICA_THREAD_H_

#include <pthread.h>

extern "C" void * replication_thread(void *arg);

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication thread class. This is a generic replicaton thread, it is used
// to send information to a given server (follower). This class needs to be
// specialized to implement the specific replication logic.
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
class ReplicaThread
{
public:
    ReplicaThread(int _follower_id):follower_id(_follower_id), _finalize(false),
        _pending_requests(false), retry_timeout(1e8)
    {
        pthread_mutex_init(&mutex, 0);

        pthread_cond_init(&cond, 0);
    };


    virtual ~ReplicaThread(){};

    /**
     *  Notify this replica thread that are new records in the log to replicate
     */
    void add_request();

    /**
     *  Exists the replication thread
     */
    void finalize();

    /**
     *  @return the ID of the thread
     */
    pthread_t thread_id() const
    {
        return _thread_id;
    }
protected:
    /**
     * Specific logic for the replicate process
     */
    virtual int replicate() = 0;

    /**
     * ID of follower to replicate state to
     */
    int follower_id;

private:
    /**
     *  Wrapper function to handle the replication loop and timeouts. It makes
     *  use of the virtual function to replicate to actually start the replica-
     *  tion process.
     */
    void do_replication();

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
};

// -----------------------------------------------------------------------------
// Raft replication thread, it implements the Ratf replication algorithm on
// followers
// -----------------------------------------------------------------------------
class LogDB;
class RaftManager;

class RaftReplicaThread : public ReplicaThread
{
public:
    RaftReplicaThread(int follower_id);

    virtual ~RaftReplicaThread(){};

private:
    /**
     * Specific logic for the replicate process
     */
    int replicate();

    /**
     * Pointers to other components
     */
    LogDB * logdb;

    RaftManager * raftm;
};

// -----------------------------------------------------------------------------
// Federation replica thread. It replicates SQL commands on zone slaves for
// federated pools
// -----------------------------------------------------------------------------
class FedReplicaManager;

class FedReplicaThread : public ReplicaThread
{
public:
    FedReplicaThread(int zone_id);

    virtual ~FedReplicaThread(){};

private:
    /**
     * Specific logic for the replicate process
     */
    int replicate();

    /**
     * Pointers to other components
     */
    FedReplicaManager * frm;
};

// -----------------------------------------------------------------------------
// Thread to send hearbeats to each follower
// -----------------------------------------------------------------------------
class HeartBeatThread : public ReplicaThread
{
public:
    HeartBeatThread(int follower_id);

    virtual ~HeartBeatThread(){};

private:
    /**
     *  Error statistics for follower
     */
    time_t last_error;

    int num_errors;

    /**
     * Specific logic for the replicate process
     */
    int replicate();

    /**
     * Pointers to other components
     */
    RaftManager * raftm;
};

#endif
