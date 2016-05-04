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

#include <string>
#include <vector>

#include <pthread.h>

/**
 *  This class implements a listener thread for the IM collector. It receives
 *  messages from a UDP port and stores it in a BUFFER. The class is controlled
 *  by two parameters
 *    - BUFFER_SIZE the number of pre-allocated capacity to store monitor
 *      messages. It should be roughly equal to the number of hosts per thread
 *    - MESSAGE_SIZE the size of each monitor message (100K by default). Each VM
 *      needs ~100bytes so ~1000VMs per host
 */
class ListenerThread
{
public:
    /**
     *  @param _socket descriptor to listen for messages
     */
    ListenerThread(int _socket):socket(_socket)
    {
        pthread_mutex_init(&mutex,0);

        monitor_data.reserve(BUFFER_SIZE);
    };

    ~ListenerThread()
    {
        pthread_mutex_destroy(&mutex);
    };

    /**
     *  Write the contents of the message buffer to a descriptor. Buffer is
     *  cleared
     *    @param fd file descriptor to send monitor data.
     */
    void flush_buffer(int fd);

    /**
     *  Waits for UDP messages in a loop and store them in a buffer
     */
    void monitor_loop();

    /**
     *  Set the thread ID for the listener
     */
    void thread_id(pthread_t id)
    {
        _thread_id = id;
    }

    /**
     *  Get the thread ID of the listener
     */
    pthread_t thread_id()
    {
        return _thread_id;
    }

private:
    static const size_t MESSAGE_SIZE; /**< Monitor message size */
    static const size_t BUFFER_SIZE;  /**< Pre-allocated capacoty */

    pthread_mutex_t mutex;
    pthread_t       _thread_id;

    std::vector<std::string> monitor_data;

    int socket;

    void lock()
    {
        pthread_mutex_lock(&mutex);
    }

    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Main function for each listener, starts the monitor loop
 */
extern "C" void * listener_main(void *arg);

/**
 *  Represents a pool of listener threads, it should be periodically flushed to
 *  a file descriptor
 */
class ListenerPool
{
public:
    /**
     *  @param fd descriptor to flush the data
     *  @param sock socket for the UDP connections
     *  @param num number of threads in the pool
     */
    ListenerPool(int fd, int sock, size_t num)
        :listeners(num, ListenerThread(sock)), out_fd(fd), socket(sock){};

    ~ListenerPool();

    void start_pool();

    void flush_pool();

private:
    std::vector<ListenerThread> listeners;

    int out_fd;
    int socket;
};
