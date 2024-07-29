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

#ifndef DRIVER_H_
#define DRIVER_H_

#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#include <fcntl.h>
#include <string.h>

#include <string>
#include <thread>
#include <atomic>
#include "StreamManager.h"

/**
 *  This class wraps the execution of a driver and setups a pipe as communication
 *  channel
 */
template <typename MSG>
class Driver
{
public:
    using message_t = MSG;

    /**
     *  A call to the start() method is needed to start the driver
     *    @param c the command to execute the driver
     *    @param a the arguments for the command
     *    @param th true to execute driver action in a thread
     *    @param ct max number of concurrent threads
     */
    Driver(const std::string& c, const std::string& a, int ct)
        : cmd(c)
        , arg(a)
        , concurrency(ct)
    {}

    ~Driver()
    {
        if (stream_thr.joinable())
        {
            stream_thr.join();
        }
    }

    /**
     *  Starts the driver and listener thread.
     *    @param error string
     *    @return 0 on success
     */
    int start(std::string& error)
    {
        if ( start_driver(error) == -1 )
        {
            return -1;
        }

        start_listener();

        return 0;
    }

    /**
     *  Stop the driver and the listener thread
     *    @param secs seconds to wait for the process to finish
     */
    void stop(int secs)
    {
        terminate.store(true);

        stop_driver(secs);
    }

    /**
     *  Send a message string to the driver
     */
    void write(const std::string&  str) const
    {
        (void) ::write(to_drv, str.c_str(), str.size());
    };

    /**
     *  Send a message to the driver
     */
    void write(const MSG& msg) const
    {
        msg.write_to(to_drv);
    };

    /**
     *  Register an action for a given message type. This function needs to be
     *  call before using start
     *    @param t message type
     *    @param a callback function
     */
    void register_action(typename MSG::msg_enum t,
                         std::function<void(std::unique_ptr<MSG>)> a)
    {
        streamer.register_action(t, a);
    };

protected:
    Driver() = default;

    void cmd_(const std::string& c) { cmd = c; }

    void arg_(const std::string& a) { arg = a; }

    void concurency_(int c) { concurrency = c; }

private:
    /**
     *  Communication pipe file descriptor (daemon <- driver)
     */
    int from_drv = -1;

    /**
     *  Communication pipe file descriptor (daemon -> driver)
     */
    int to_drv = -1;

    /**
     *  Driver configuration: path and arguments
     */
    std::string cmd;

    std::string arg;

    int  concurrency = 0;

    /**
     *  Process ID of the driver
     */
    pid_t pid = -1;

    /**
     *  Class to read lines from the stream
     */
    StreamManager<MSG> streamer;

    std::thread stream_thr;

    /**
     *  sync listner thread termination
     */
    std::atomic<bool> terminate = {false};

    /**
     *  Starts the driver. This function creates a new process and sets up the
     *  communication pipes.
     *    @param error string
     *    @return 0 on success
     */
    int start_driver(std::string& error);

    /**
     *  Stop the driver, closes the pipes.
     *    @param secs seconds to wait for the process to finish
     */
    void stop_driver(int secs);

    /**
     *  Starts the listener thread. The thread will reload the driver process if
     *  it fails (EOF on pipe)
     */
    void start_listener();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Driver Template Implementation                                             */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename MSG>
void Driver<MSG>
::stop_driver(int secs)
{
    if ( pid == -1 )
    {
        return;
    }

    char buf[]="FINALIZE\n";

    ::write(to_drv, buf, strlen(buf));

    close(from_drv);
    close(to_drv);

    bool success = false;

    for (int i=0; i < secs; ++i)
    {
        int status;

        if ( waitpid(pid, &status, WNOHANG) != 0 )
        {
            success = true;
            break;
        }

        sleep(1);
    }

    if (!success)
    {
        kill(pid, SIGKILL);
    };
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename MSG>
int Driver<MSG>
::start_driver(std::string& error)
{
    // Open communication pipes
    int to_drv_pipe[2];
    int from_drv_pipe[2];

    if ( pipe(to_drv_pipe) == -1 || pipe(from_drv_pipe) == -1 )
    {
        error = "Cannot create driver pipes, ";
        error.append(strerror(errno));

        return -1;
    }

    //Create a new process for the driver
    pid = fork();

    switch (pid)
    {
        case -1: // Error
            error = "Error forking to start driver, ";
            error.append(strerror(errno));
            return -1;

        case 0:  // Child process (driver)
            close(to_drv_pipe[1]);
            close(from_drv_pipe[0]);

            if ( dup2(to_drv_pipe[0], 0) != 0 || dup2(from_drv_pipe[1], 1) != 1 )
            {
                error = "Error setting communication pipes, ";
                error.append(strerror(errno));
                return -1;
            }

            close(to_drv_pipe[0]);
            close(from_drv_pipe[1]);

            close(2);

            execlp(cmd.c_str(), cmd.c_str(), arg.c_str(), (char*)NULL);

            error = "Error starting driver, ";
            error.append(strerror(errno));
            return -1;

        default:
            break;
    }

    // Parent process (daemon)
    close(to_drv_pipe[0]);
    close(from_drv_pipe[1]);

    to_drv   = to_drv_pipe[1];
    from_drv = from_drv_pipe[0];

    fcntl(to_drv, F_SETFD, FD_CLOEXEC);
    fcntl(from_drv, F_SETFD, FD_CLOEXEC);

    //Send INIT command and wait for response (INIT [SUCCESS|FAILURE]) up to 10s
    char   buffer[32];
    fd_set rfds;

    struct timeval tv;

    FD_ZERO(&rfds);
    FD_SET(from_drv, &rfds);

    tv.tv_sec  = 10;
    tv.tv_usec = 0;

    write("INIT\n");

    int rc = select(from_drv + 1, &rfds, 0, 0, &tv);

    if ( rc <= 0 )
    {
        error = "Driver initialization time out\n";
        return -1;
    }

    rc = read(from_drv, (void *) buffer, sizeof(char) * 31);

    buffer[rc]='\0';

    std::istringstream iss(buffer);

    std::string action;
    std::string result;

    iss >> action >> result >> std::ws;

    if ( action != "INIT" || result != "SUCCESS" )
    {
        error = "Driver initialization failed\n";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename MSG>
void Driver<MSG>
::start_listener()
{
    streamer.fd(from_drv);

    stream_thr = std::thread([this]()
    {
        while(streamer.action_loop(concurrency) == -1 && !terminate.load())
        {
            std::string error;

            stop_driver(1);

            start_driver(error);

            streamer.fd(from_drv);
        }
    });
}

#endif /*DRIVER_H_*/
