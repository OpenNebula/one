/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REPLICA_REQUEST_H_
#define REPLICA_REQUEST_H_

#include "SyncRequest.h"

/**
 * This class represents a log entry replication request. The replication request
 * is synchronous: once it has been replicated in a majority of followers the
 * client is notified (SqlDB::exec_wr() call) and DB updated.
 */
class ReplicaRequest : public SyncRequest
{
public:
    ReplicaRequest(unsigned int i):_index(i), _to_commit(-1), _replicas(1){};

    ~ReplicaRequest(){};

    /**
     *  This function updates the number of replicas of the record and decrement
     *  the number of servers left to reach majority consensus. If it reaches 0,
     *  the client is notified
     *      @return number of replicas for this log
     */
    int inc_replicas()
    {
        int __replicas;

        _replicas++;

        if ( _to_commit > 0 )
        {
            _to_commit--;
        }

        __replicas = _replicas;

        if ( _to_commit == 0 )
        {
            result  = true;
            timeout = false;

            notify();
        }

        return __replicas;
    }

    /* ---------------------------------------------------------------------- */
    /* Class access methods                                                   */
    /* ---------------------------------------------------------------------- */
    int index()
    {
        return _index;
    }

    int replicas()
    {
        return _replicas;
    }

    int to_commit()
    {
        return _to_commit;
    }

    void to_commit(int c)
    {
        _to_commit = c;
    }

private:
    /**
     *  Index for this log entry
     */
    unsigned int _index;

    /**
     *  Remaining number of servers that need to replicate this record to commit
     *  it. Initialized to ( Number_Servers - 1 ) / 2
     */
    int _to_commit;

    /**
     *  Total number of replicas for this entry
     */
    int _replicas;
};

#endif /*REPLICA_REQUEST_H_*/

