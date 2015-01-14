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

#ifndef _OPENNEBULA_DRIVER_H
#define _OPENNEBULA_DRIVER_H

#include <unistd.h>
#include <string>

class OpenNebulaDriver
{
public:

    OpenNebulaDriver(){};

    virtual ~OpenNebulaDriver(){};

    void start()
    {
        driver_loop();
    };

protected:

    void write2one(const char * buf, size_t bsize) const
    {
        write(1, buf, bsize);
    };


    void write2one(const std::string& buf) const
    {
        write2one(buf.c_str(), buf.size());
    }

private:

    /**
     *  Main driver loop. reads actions from OpenNebula core and deals with them
     */
    void driver_loop();

    /**
     *  Read OpenNebula message
     *  @param message from OpenNebula
     *  @retuen 0 on success
     */
    int read_one(std::string& message);

    /**
     *  Generic Driver Action
     */
    virtual void driver_action(const std::string& action,
        std::istringstream &is) = 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * flush_thread(void *arg);

class ListenerPool;

class IMCollectorDriver: public OpenNebulaDriver
{
public:

    IMCollectorDriver(std::string address, int port, int threads,
        int flush_period)
        :OpenNebulaDriver(),_address(address),_port(port),_threads(threads),
        _flush_period(flush_period){};

    virtual ~IMCollectorDriver(){};

    int init_collector();

    void flush_loop();

    void start_collector();

private:
    void driver_action(const std::string& action, std::istringstream &is){};

    std::string _address;

    int _port;

    int _threads;

    int _flush_period;

    ListenerPool *pool;
};

#endif
