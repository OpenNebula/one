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

#ifndef REQUEST_MANAGER_CONNECTION_H_
#define REQUEST_MANAGER_CONNECTION_H_

#include "RequestManager.h"


/**
 *  The connection manager class synchronizes the connection and manager threads
 */
class ConnectionManager
{
public:
    ConnectionManager(RequestManager *_rm, int mc):rm(_rm), connections(0),
    max_connections(mc)
    {
        pthread_mutex_init(&mutex,0);

        pthread_cond_init(&cond,0);

    };

    ~ConnectionManager()
    {
        pthread_mutex_destroy(&mutex);

        pthread_cond_destroy(&cond);
    };

    /**
     *  Increments number of active connections
     */
    int add()
    {
        pthread_mutex_lock(&mutex);

        int temp_connections = ++connections;

        pthread_mutex_unlock(&mutex);

        return temp_connections;
    };

    /**
     *  Decrements number of active connections and signals management thread
     */
    void del()
    {
        pthread_mutex_lock(&mutex);

        --connections;

        pthread_cond_signal(&cond);

        pthread_mutex_unlock(&mutex);
    };

    /**
     *  Waits for active connections to be under the max_connection threshold
     */
    void wait()
    {
        pthread_mutex_lock(&mutex);

        while ( connections >= max_connections )
        {
            pthread_cond_wait(&cond, &mutex);
        }

        pthread_mutex_unlock(&mutex);
    };

    /**
     *  Run an xmlrpc connection
     *    @param fd connected socket
     */
    void run_connection(int fd)
    {
        xmlrpc_c::serverAbyss * as = rm->create_abyss();

        as->runConn(fd);

        delete as;
    };

private:
    /**
     *  Synchronization for connection threads and listener thread
     */
    pthread_mutex_t mutex;
    pthread_cond_t  cond;

    /**
     *  RequestManager to create an AbyssSever class to handle each request
     */
    RequestManager * rm;

    /**
     *  Number of active connections
     */
    int connections;

    /**
     *  Max number of active connections
     */
    int max_connections;
};

#endif
