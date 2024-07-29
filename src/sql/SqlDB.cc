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

#include "SqlDB.h"
#include "NebulaLog.h"

#include <unistd.h>
#include <csignal>
#include <thread>

int SqlDB::exec(std::ostringstream& cmd, Callbackable* obj, bool quiet)
{
    int rc = exec_ext(cmd, obj, quiet);

    if (rc != 0)
    {
        consecutive_errors++;
        rc = -1;

        if (errors_limit > 0 && consecutive_errors > errors_limit)
        {
            NebulaLog::error("SQL", "Lost connection to DB server, exiting...");

            // Kill the master process. The call is in the thread to avoid deadlock
            std::thread thr([] { kill(getpid(), SIGTERM); });
            thr.detach();
        }
    }
    else
    {
        consecutive_errors = 0;
    }

    return rc;
}
