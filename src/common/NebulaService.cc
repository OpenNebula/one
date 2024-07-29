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

#include "NebulaService.h"

using std::string;

NebulaService* NebulaService::nebula_service = nullptr;

Log::MessageType NebulaService::get_debug_level(Log::MessageType default_) const
{
    Log::MessageType clevel = default_;
    int              log_level_int;

    const VectorAttribute * log = config->get("LOG");

    if (log != 0)
    {
        const string& value = log->vector_value("DEBUG_LEVEL");

        log_level_int = std::atoi(value.c_str());

        if (Log::ERROR <= log_level_int && log_level_int <= Log::DDDEBUG)
        {
            clevel = static_cast<Log::MessageType>(log_level_int);
        }
    }

    return clevel;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

NebulaLog::LogType NebulaService::get_log_system(NebulaLog::LogType default_) const
{
    NebulaLog::LogType log_system = default_;

    const VectorAttribute * log = config->get("LOG");

    if (log != 0)
    {
        string value = log->vector_value("SYSTEM");
        log_system   = NebulaLog::str_to_type(value);
    }

    return log_system;
}
