/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#ifndef _OPENNEBULA_DRIVER_H
#define _OPENNEBULA_DRIVER_H

#include <atomic>
#include <string>
#include <unistd.h>

#include "OpenNebulaMessages.h"
#include "NebulaLog.h"

/**
 * Class template providing interface to OpenNebula deamon, and can be the base
 * for C++ OpenNebula drivers
 *
 *   +------------------+
 *   |  OpenNebula oned |
 *   +------------------+
 *               ^
 *       |       |   Actions are resigtered in a stdin streamer.
 *       |       |   Responses are sent through stdout.
 *       V
 *   +-(stdin)-(stdout)-+
 *   |  Monitor Daemon  |
 *   +------------------+
 *
 *   Template parameter is a enumeration of protocol message types that
 *   MUST include UNDEFINED, INIT and FINALIZE message types.
 */
template <typename E>
class OpenNebulaDriver
{
public:

    OpenNebulaDriver() : oned_reader(0, &OpenNebulaDriver::_undefined)
    {
        register_action(E::INIT, &OpenNebulaDriver::_init);

        register_action(E::FINALIZE, &OpenNebulaDriver::_finalize);
    }

    virtual ~OpenNebulaDriver() = default;

    /**
     * Start reading messages from oned, blocking call. Messages will be
     * processed sequentially in the main thread.
     */
    void start_driver()
    {
        oned_reader.action_loop(0);
    }

protected:
    using message_t = std::unique_ptr<Message<E>>;

    /**
     *  Streamer for stdin
     */
    StreamManager<E> oned_reader;

    /**
     *  Register an action when a message is received in the driver stream
     *    @param m the OpenNebulaMessage recevied
     *    @param f the message callback
     */
    void register_action(E m, std::function<void(message_t)> f)
    {
        oned_reader.register_action(m, f);
    }

    /**
     * Process INIT message from oned, send SUCCESS response
     */
    static void _init(message_t msg)
    {
        write2one("INIT SUCCESS\n");
    }

    /**
     * Process FINALIZE message from oned, send SUCCESS response,
     * terminate execution loop
     */
    static void _finalize(message_t msg)
    {
        write2one("FINALIZE SUCCESS\n");

        close(0); //will end start_driver()
    }

    /**
     * Default action for undefined messages
     */
    static void _undefined(message_t msg)
    {
        NebulaLog::warn("MON", "Undefined message: " + msg->payload());
    }

    /**
     * Write string to oned (stdout)
     */
    static void write2one(const std::string& buf)
    {
        write(1, buf.c_str(), buf.size());
    }

    /**
     * Write an OpenNebulaMessage to oned (stdout)
     */
    static void write2one(const Message<E>& msg)
    {
        msg.write_to(1, false);
    }
};

#endif // _OPENNEBULA_DRIVER_H
