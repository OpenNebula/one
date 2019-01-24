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

#include "ListenerThread.h"

#include <unistd.h>
#include <sys/socket.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const size_t ListenerThread::MESSAGE_SIZE = 100000;

pthread_mutex_t ListenerThread::mutex = PTHREAD_MUTEX_INITIALIZER;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ListenerThread::monitor_loop()
{
    char   buffer[MESSAGE_SIZE];
    size_t rc;

    struct sockaddr addr;
    socklen_t addr_size = sizeof(struct sockaddr);

    while(true)
    {
        rc = recvfrom(socket, buffer, MESSAGE_SIZE, 0, &addr, &addr_size);

        if (rc > 0 && rc < MESSAGE_SIZE)
        {
            lock();

            write(fd, buffer, rc);

            unlock();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * listener_main(void *arg)
{
    ListenerThread * listener = static_cast<ListenerThread *>(arg);

    listener->monitor_loop();

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ListenerPool::~ListenerPool()
{
    std::vector<ListenerThread>::iterator it;

    for(it = listeners.begin() ; it != listeners.end(); ++it)
    {
        pthread_cancel((*it).thread_id());
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ListenerPool::start_pool()
{
    pthread_attr_t attr;
    pthread_t id;

    std::vector<ListenerThread>::iterator it;

    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

    for(it = listeners.begin() ; it != listeners.end(); ++it)
    {
        pthread_create(&id, &attr, listener_main, (void *)&(*it));

        (*it).thread_id(id);
    }

    pthread_attr_destroy(&attr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

