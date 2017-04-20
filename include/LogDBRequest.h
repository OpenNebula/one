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

#ifndef LOG_DB_REQUEST_H_
#define LOG_DB_REQUEST_H_

#include <string>
#include <sstream>

#include "SyncRequest.h"

/**
 * This class represents a log entry replication request. The replication request
 * is synchronous: once it has been replicated in a majority of followers the
 * client is notified (SqlDB::exec_wr() call) and DB updated.
 */
class LogDBRequest : public SyncRequest
{
public:
    LogDBRequest(unsigned int i, unsigned int t, const std::ostringstream& o);

    LogDBRequest(unsigned int i, unsigned int t, const char * s);

    virtual ~LogDBRequest(){};

    /**
     *  This function decrements the number of remaining server to replicate
     *  this entry. If it reaches 0, the client is notified
     *    @return number of replicas for this log
     */
    int replicated();

    /* ---------------------------------------------------------------------- */
    /* Class access methods                                                   */
    /* ---------------------------------------------------------------------- */
    unsigned int index()
    {
        return _index;
    };

    unsigned int term()
    {
        return _term;
    };

    const std::string& sql()
    {
        return _sql;
    };

private:
    pthread_mutex_t mutex;

    /**
     *  Index for this log entry
     */
    unsigned int _index;

    /**
     *  Term where this log entry was generated
     */
    unsigned int _term;

    /**
     *  SQL command to exec in the DB to update (INSERT, REPLACE, DROP)
     */
    std::string _sql;

    /**
     *  Remaining number of servers that need to replicate this record to commit
     *  it. Initialized to ( Number_Servers - 1 ) / 2
     */
    int to_commit;

    /**
     *  Total number of replicas for this entry
     */
    int replicas;

    /**
     *  Function to lock the request
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the request
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };
};


#endif /*LOG_DB_REQUEST_H_*/

