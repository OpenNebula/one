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

#ifndef MONITOR_H_
#define MONITOR_H_

#include <memory>

#include "NebulaService.h"
#include "HostRPCPool.h"
#include "VMRPCPool.h"
#include "MonitorDriverMessages.h"
#include "HostMonitorManager.h"

class Monitor : public NebulaService
{
public:
    Monitor(const std::string& filename, const std::string& oned_filename)
        : conf_filename(filename)
        , oned_filename(oned_filename)
    {
    }

    /**
     *  Read configuration file and starts monitornig. (Blocking call)
     */
    void start();

private:
    // -------------------------------------------------------------------------
    // Pools
    // -------------------------------------------------------------------------
    std::unique_ptr<HostRPCPool> hpool;
    std::unique_ptr<VMRPCPool>   vmpool;

    // -------------------------------------------------------------------------
    //  Daemon Modules
    // -------------------------------------------------------------------------
    std::unique_ptr<SqlDB> sqlDB;

    std::unique_ptr<HostMonitorManager> hm;

    // -------------------------------------------------------------------------
    //  Configuration attributes
    // -------------------------------------------------------------------------
    std::string conf_filename;
    std::string oned_filename;
};

#endif // MONITOR_H_
