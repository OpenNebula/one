/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef TCP_STREAM_H
#define TCP_STREAM_H


#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>

#include <unistd.h>
#include <sys/select.h>
#include <errno.h>
#include <string.h>

#include <atomic>
#include <vector>

#include "StreamManager.h"

/**
 *
 */
template<typename MSG>
class TCPStream : public StreamManager<MSG>
{
public:
    using callback_t = std::function<void(std::unique_ptr<MSG>)>;

    TCPStream(const std::string &address, unsigned int port, callback_t error):
        StreamManager<MSG>(error),
        _socket(-1),
        _address(address),
        _port(port)
    {
    }

    TCPStream(const std::string &address, unsigned int port):
        _socket(-1), _address(address), _port(port)
    {
    }

    virtual ~TCPStream() = default;

    /**
     *  This functions initializes the UDP socket for the stream. It must be
     *  called once before using the streamer
     *    @param threads number od threads to listen on the socket
     */
    int action_loop(int threads, std::string& error);

    /**
     *  Stops the listner threads and free resources
     */
    void stop()
    {
        terminate = true;

        shutdown(_socket, SHUT_RDWR);

        for(auto& th : listener_threads)
        {
            th.join();
        }

        close(_socket);
    }

protected:

    int read_line(std::string& line) override;

private:
    int _socket;

    std::string _address;

    unsigned int _port;

    std::vector<std::thread> listener_threads;

    std::atomic<bool> terminate{false};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* UDPStream Implementation                                                   */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
template<typename MSG>
int TCPStream<MSG>
::action_loop(int threads, std::string& error)
{
    struct addrinfo hints;
    struct addrinfo *res;

    memset(&hints, 0, sizeof(struct addrinfo));
    hints.ai_family   = AF_UNSPEC;
    hints.ai_flags    = AI_PASSIVE; //0.0.0.0 or ::
    hints.ai_socktype = SOCK_STREAM;

    int rc = getaddrinfo(_address.c_str(), std::to_string(_port).c_str(), &hints, &res);

    if ( rc != 0 )
    {
        error = gai_strerror(rc);
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* Create TCP socket for incoming monitord client connections             */
    /* ---------------------------------------------------------------------- */
    _socket = socket(res->ai_family, res->ai_socktype | SOCK_NONBLOCK,
                     res->ai_protocol);

    if ( _socket < 0 )
    {
        error = strerror(errno);
        return -1;
    }

    int on = 1;

    rc = setsockopt(_socket, SOL_SOCKET, SO_REUSEADDR, &on, sizeof(int));

    if ( rc == -1 )
    {
        error = strerror(errno);
        return -1;
    }

    rc = bind(_socket, res->ai_addr, res->ai_addrlen);

    freeaddrinfo(res);

    if ( rc < 0 )
    {
        error = strerror(errno);
        return -1;
    }

    rc = listen(_socket, threads);

    if ( rc < 0 )
    {
        error = strerror(errno);
        return -1;
    }

    this->fd(_socket);

    /* ---------------------------------------------------------------------- */
    /* Start a pool of threads to read incoming TCP driver messages           */
    /* ---------------------------------------------------------------------- */

    for (int i = 0 ; i < threads; ++i)
    {
        std::thread action_thread = std::thread([this]
        {
            while (true)
            {
                std::string line;

                if (read_line(line) != 0)
                {
                    return -1;
                }

                if (line.empty())
                {
                    continue;
                }

                std::unique_ptr<MSG> msg{new MSG};

                msg->parse_from(line);

                this->do_action(msg, false);
            }
        });

        listener_threads.push_back(std::move(action_thread));
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
#define BUFFER_SIZE 65536

template<typename MSG>
int TCPStream<MSG>
::read_line(std::string& line)
{
    char buffer[BUFFER_SIZE];

    ssize_t rc;

    struct sockaddr_storage addr;
    socklen_t addr_size = sizeof(struct sockaddr_storage);

    fd_set rfds;

    while (1)
    {
        FD_ZERO(&rfds);
        FD_SET(_socket, &rfds);

        rc = select(_socket+1, &rfds, nullptr, nullptr, nullptr);

        if (terminate)
        {
            return -1;
        }

        if ( rc == -1)
        {
            return -1;
        }
        else if ( rc > 0 )
        {
            break;
        }
    }

    line.clear();

    int sd = accept(_socket, (struct sockaddr *) &addr, &addr_size);

    if ( sd == -1 )
    {
        return 0;
    }

    while (1)
    {
        rc = recv(sd, buffer, BUFFER_SIZE, 0);

        if (rc <= 0)
        {
            close(sd);
            break;
        }

        line.append(buffer, rc);
    }

    if ( rc == -1 )
    {
        line.clear();
        return 0;
    }

    return 0;
}

#endif /*TCP_STREAM_H*/
