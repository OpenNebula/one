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

#ifndef STREAM_MANAGER_H
#define STREAM_MANAGER_H

#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <string.h>

#include <map>
#include <thread>
#include <memory>
#include <string>
#include <functional>
#include <mutex>
#include <condition_variable>

#include "Message.h"
#include "StringBuffer.h"

/**
 *  This class manages a stream to process Messages. The StreamManager
 *  thread reads from the stream for input messages and executed the associated
 *  action in a separated (detached) thread.
 */
template <typename E>
class StreamManager
{
public:
    using callback_t = std::function<void(std::unique_ptr<Message<E>>)>;

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    /**
     *  @param fd file descriptor for the stream
     *  @param error_cbk function to execute on error (parse error or UNDEFINED)
     */
    StreamManager(int __fd, callback_t error_cbk):_fd(__fd)
    {
        register_action(E::UNDEFINED, error_cbk);
    };

    StreamManager(callback_t error_cbk):StreamManager(-1, error_cbk){};

    StreamManager():StreamManager(-1, [](std::unique_ptr<Message<E> > m){}){};

    ~StreamManager()
    {
        close(_fd);
    };

    /**
     * Associate a function to be executed when a message of the given type is
     * read
     *   @param t the message type
     *   @param a callback function to be executed
     */
    void register_action(E t, callback_t a);

    /**
     *  Reads messages from the stream and execute callbacks. This method should
     *  be run in a separated thread.
     *    @param concurrency number of concurrent actions, use 0 to run all the
     *    actions sequetianlly in this thread.
     */
    virtual int action_loop(int concurrency);

    /**
     *  Sets the file descriptor for the stream
     *    @param fd file descriptor
     */
    void fd(int __fd)
    {
        _fd = __fd;
    }

    /**
     *  Look for the associated callback for the message and execute it
     *    @param msg read from the stream
     */
    void do_action(std::unique_ptr<Message<E> >& msg, bool threaded);

protected:
    /**
     *  Read a line from the stream
     *    @return -1 in case of error or EOL
     */
    virtual int read_line(std::string& line)
    {
        return buffer.read_line(_fd, line);
    }

private:
    int _fd;

    std::mutex _mutex;

    std::condition_variable _cond;

    int _concurrency;

    std::map<E, callback_t > actions;

    StringBuffer buffer;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Stream Manager Implementation                                              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E>
void StreamManager<E>::register_action(E t, callback_t a)
{
    auto ret = actions.insert({t, a});

    if (!ret.second)
    {
        ret.first->second = a;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E>
void StreamManager<E>::do_action(std::unique_ptr<Message<E> >& msg, bool thr)
{
    const auto it = actions.find(msg->type());

    if (it == actions.end())
    {
        return;
    }

    const auto action = it->second;
    Message<E> * mptr = msg.release();

    if (thr)
    {
        std::unique_lock<std::mutex> lock(_mutex);

        while( _concurrency <= 0 )
        {
            _cond.wait(lock);
        }

        --_concurrency;

        lock.unlock();

        std::thread action_thread([this, action, mptr]{
            action(std::unique_ptr<Message<E>>{mptr});

            std::unique_lock<std::mutex> lock(_mutex);

            _concurrency++;

            lock.unlock();

            _cond.notify_one();
        });

        action_thread.detach();
    }
    else
    {
        action(std::unique_ptr<Message<E>>{mptr});
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E>
int StreamManager<E>::action_loop(int concurrency)
{
    bool threaded = concurrency > 0;
    _concurrency  = concurrency;

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

        std::unique_ptr<Message<E>> msg{new Message<E>};

        msg->parse_from(line, false);

        do_action(msg, threaded); //Errors are handled by the UNDEFINED action
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*STREAM_MANAGER_H*/
