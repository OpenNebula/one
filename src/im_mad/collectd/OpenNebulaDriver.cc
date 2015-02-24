/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <sstream>
#include <iostream>

#include <unistd.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netinet/in.h>
#include <errno.h>
#include <string.h>

#include "OpenNebulaDriver.h"
#include "ListenerThread.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int OpenNebulaDriver::read_one(std::string& message)
{
    fd_set             in_pipes;
    std::ostringstream oss;

    char c;
    int  rc;

    FD_ZERO(&in_pipes);
    FD_SET (0,&in_pipes);

    rc = select(1, &in_pipes, NULL, NULL, NULL);

    if (rc == -1)
    {
        return -1;
    }

    do
    {
        rc = read(0, (void *) &c, sizeof(char));
        oss << c;
    }
    while ( rc > 0 && c != '\n' );

    if (rc <= 0)
    {
        return -1;
    }

    message = oss.str();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OpenNebulaDriver::driver_loop()
{
    int rc;

    while (true)
    {
        std::string message;

        rc = read_one(message);

        if ( rc == -1 ) //Error in select or read from OpenNebula, exit
        {
            break;
        }

        std::istringstream is(message);
        std::string        action;

        if ( is.good() )
        {
            is >> action >> std::ws;
        }
        else
        {
            continue;
        }

        if (action == "INIT")
        {
            write2one("INIT SUCCESS\n",13);
        }
        else if (action == "FINALIZE")
        {
            break;
        }
        else
        {
            driver_action(action, is);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int IMCollectorDriver::init_collector()
{
    struct sockaddr_in im_server;
    int rc;

    int sock = socket(PF_INET, SOCK_DGRAM, IPPROTO_UDP);

    if ( sock < 0 )
    {
        std::cerr << strerror(errno);
        return -1;
    }

    im_server.sin_family = AF_INET;
    im_server.sin_port   = htons(_port);

    if (_address == "0.0.0.0")
    {
        im_server.sin_addr.s_addr = htonl (INADDR_ANY);
    }
    else if (inet_pton(AF_INET,_address.c_str(),&im_server.sin_addr.s_addr) < 0)
    {
        std::cerr << strerror(errno);
        return -1;
    }

    rc = bind(sock, (struct sockaddr *) &im_server, sizeof(struct sockaddr_in));

    if ( rc < 0 )
    {
        std::cerr << strerror(errno);
        return -1;
    }

    pool = new ListenerPool(1, sock, _threads);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void IMCollectorDriver::start_collector()
{
    pthread_attr_t attr;
    pthread_t id;

    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

    pthread_create(&id, &attr, flush_thread, (void *)this);

    pool->start_pool();

    start();

    pthread_attr_destroy(&attr);

    pthread_cancel(id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * flush_thread(void *arg)
{
    IMCollectorDriver * collectd = static_cast<IMCollectorDriver *>(arg);

    collectd->flush_loop();

    return 0;
}

/* -------------------------------------------------------------------------- */

void IMCollectorDriver::flush_loop()
{
    while(true)
    {
        sleep(_flush_period);

        pool->flush_pool();
    }
};
