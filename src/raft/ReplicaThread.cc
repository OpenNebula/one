/* -------------------------------------------------------------------------- */
/* Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                */
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

#include <errno.h>
#include <string>

#include "LogDB.h"
#include "RaftManager.h"
#include "ReplicaThread.h"
#include "Nebula.h"
#include "NebulaLog.h"

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication thread class & pool
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

const time_t ReplicaThread::max_retry_timeout = 300;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

extern "C" void * replication_thread(void *arg)
{
    ReplicaThread * rt;

    if ( arg == 0 )
    {
        return 0;
    }

    rt = static_cast<ReplicaThread *>(arg);

    rt->_thread_id = pthread_self();

    rt->do_replication();

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaThread::do_replication()
{
    int rc;

    bool retry_request = false;

    while ( _finalize == false )
    {
        pthread_mutex_lock(&mutex);

        while ( _pending_requests == false )
        {
            struct timespec timeout;

            timeout.tv_sec  = time(NULL) + retry_timeout;
            timeout.tv_nsec = 0;

            if ( pthread_cond_timedwait(&cond, &mutex, &timeout) == ETIMEDOUT )
            {
                _pending_requests = retry_request;
            }

            if ( _finalize )
            {
                return;
            }
        }

        _pending_requests = false;

        pthread_mutex_unlock(&mutex);

        rc = replicate();

        if ( rc == -1 )
        {
            if ( retry_timeout < max_retry_timeout )
            {
                retry_timeout = 2 * retry_timeout;
            }

            retry_request = true;
        }
        else
        {
            retry_timeout = 2;
            retry_request = false;
        }
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaThread::finalize()
{
    pthread_mutex_lock(&mutex);

    _finalize = true;

    _pending_requests = false;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaThread::add_request()
{
    pthread_mutex_lock(&mutex);

    _pending_requests = true;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

RaftReplicaThread::RaftReplicaThread(int fid):ReplicaThread(fid)
{
    Nebula& nd = Nebula::instance();

    logdb = nd.get_logdb();
    raftm = nd.get_raftm();
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

int RaftReplicaThread::replicate()
{
    std::string error;

    LogDBRecord lr;

    bool success = false;

    unsigned int follower_term = -1;

    unsigned int term  = raftm->get_term();

    int next_index = raftm->get_next_index(follower_id);

    if ( logdb->get_log_record(next_index, lr) != 0 )
    {
        ostringstream ess;

        ess << "Failed to load log record at index: " << next_index;

        NebulaLog::log("RCM", Log::ERROR, ess);

        return -1;
    }

    if ( raftm->xmlrpc_replicate_log(follower_id, &lr, success, follower_term,
                error) != 0 )
    {
        return -1;
    }

    if ( success )
    {
        raftm->replicate_success(follower_id);
    }
    else
    {
        if ( follower_term > term )
        {
            ostringstream ess;

            ess << "Follower " << follower_id << " term (" << follower_term
                << ") is higher than current (" << term << ")";

            NebulaLog::log("RCM", Log::INFO, ess);

            raftm->follower(follower_term);
        }
        else
        {
            raftm->replicate_failure(follower_id);
        }
    }

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

FedReplicaThread::FedReplicaThread(int zone_id):ReplicaThread(zone_id)
{
    Nebula& nd = Nebula::instance();

    frm = nd.get_frm();
};
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------


int FedReplicaThread::replicate()
{
    std::string error;

    bool success = false;

    int last;

    if ( frm->xmlrpc_replicate_log(follower_id, success, last, error) != 0 )
    {
        NebulaLog::log("FRM", Log::ERROR, error);
        return -1;
    }

    if ( success )
    {
        frm->replicate_success(follower_id);
    }
    else
    {
        frm->replicate_failure(follower_id, last);
    }

    return 0;
}

