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

const time_t ReplicaThread::max_retry_timeout = 2.5e9;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

extern "C" void * replication_thread(void *arg)
{
    ReplicaThread * rt;

    int oldstate;

    if ( arg == 0 )
    {
        return 0;
    }

    rt = static_cast<ReplicaThread *>(arg);

    rt->_thread_id = pthread_self();

    pthread_setcancelstate(PTHREAD_CANCEL_ENABLE, &oldstate);

    pthread_setcanceltype(PTHREAD_CANCEL_DEFERRED, &oldstate);

    rt->do_replication();

    NebulaLog::log("RCM", Log::INFO, "Replication thread stopped");

    delete rt;

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

static void set_timeout(struct timespec& timeout, time_t nsec )
{
    clock_gettime(CLOCK_REALTIME, &timeout);

    timeout.tv_nsec += nsec;

    while ( timeout.tv_nsec >= 1000000000 )
    {
        timeout.tv_sec  += 1;
        timeout.tv_nsec -= 1000000000;
    }
}

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

            set_timeout(timeout, retry_timeout);

            if ( pthread_cond_timedwait(&cond, &mutex, &timeout) == ETIMEDOUT )
            {
                _pending_requests = retry_request || _pending_requests;
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
            retry_timeout = 1e8;
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

    uint64_t next_index = raftm->get_next_index(follower_id);

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
        std::ostringstream oss;

        oss << "Faild to replicate log record at index: " << next_index
            << " on follower: " << follower_id << ", error: " << error;

        NebulaLog::log("RCM", Log::DEBUG, oss);

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

    uint64_t last;

    int rc = frm->xmlrpc_replicate_log(follower_id, success, last, error);

    if ( rc == -1 )
    {
        NebulaLog::log("FRM", Log::ERROR, error);
        return -1;
    }
    else if ( rc == -2 )
    {
        return 0;
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

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

HeartBeatThread::HeartBeatThread(int fid):ReplicaThread(fid), last_error(0),
    num_errors(0)
{
    Nebula& nd = Nebula::instance();

    raftm = nd.get_raftm();
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

int HeartBeatThread::replicate()
{
    int rc;

	bool success;

	std::string error;

	unsigned int fterm;
    unsigned int term  = raftm->get_term();

	LogDBRecord lr;

	lr.index = 0;
	lr.prev_index = 0;

	lr.term = 0;
	lr.prev_term = 0;

	lr.sql = "";

	lr.timestamp = 0;
    lr.fed_index = UINT64_MAX;

    rc = raftm->xmlrpc_replicate_log(follower_id, &lr, success, fterm, error);

    if ( rc == -1 )
    {
        num_errors++;

        if ( last_error == 0 )
        {
            last_error = time(0);
            num_errors = 1;
        }
        else if ( last_error + 60 < time(0) )
        {
            if ( num_errors > 10 )
            {
                std::ostringstream oss;

                oss << "Detetected error condition on follower "
                    << follower_id <<". Last error was: " << error;

                NebulaLog::log("RCM", Log::INFO, oss);
            }

            last_error = 0;
        }
    }
    else if ( success == false && fterm > term )
    {
        std::ostringstream oss;

        oss << "Follower " << follower_id << " term (" << fterm
            << ") is higher than current (" << term << ")";

        NebulaLog::log("RCM", Log::INFO, oss);

        raftm->follower(fterm);
    }

    return 0;
}

