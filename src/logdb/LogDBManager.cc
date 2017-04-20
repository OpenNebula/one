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

#include "LogDBManager.h"
#include "Nebula.h"
#include "NebulaLog.h"

// ----------------------------------------------------------------------------
// Thread wrapper functions
// ----------------------------------------------------------------------------
extern "C" void * logdb_manager_loop(void *arg)
{
    LogDBManager * dbm;

    if ( arg == 0 )
    {
        return 0;
    }

    dbm = static_cast<LogDBManager *>(arg);

    NebulaLog::log("DBM",Log::INFO,"LogDB Replication Manager started.");

    dbm->am.loop();

    NebulaLog::log("DBM",Log::INFO,"LogDB Replication Manager stopped.");

    return 0;
}

extern "C" void * replication_thread(void *arg)
{
    LogDBManager::ReplicaThread * rt;

    if ( arg == 0 )
    {
        return 0;
    }

    rt = static_cast<LogDBManager::ReplicaThread *>(arg);

    rt->do_replication();

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::finalize_action(const ActionRequest& ar)
{
    NebulaLog::log("DBM",Log::INFO,"Stopping LogDB Manager...");
};

void LogDBManager::user_action(const ActionRequest& ar)
{

};

void LogDBManager::start(const ActionRequest& ar)
{

};

void LogDBManager::stop(const ActionRequest& ar)
{

};

void LogDBManager::replicate(const ActionRequest& ar)
{

};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

