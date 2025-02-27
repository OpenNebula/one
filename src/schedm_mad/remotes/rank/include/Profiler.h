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

#ifndef PROFILER_H_
#define PROFILER_H_

#include "NebulaLog.h"
#include "NebulaUtil.h"

#include <memory>
#include <string>
#include <sstream>

class Profiler
{
public:
    Profiler(const std::string& start_message, const std::string& _end_message)
        :end_message(_end_message)
    {
        clock_gettime(CLOCK_MONOTONIC, &estart);

        if (!start_message.empty())
        {
            NebulaLog::log("SCHED", Log::DDEBUG, start_message);
        }
    };

    Profiler()
        : Profiler("", "") {};

    ~Profiler()
    {
        double time = get_elapsed_time();

        if (!end_message.empty())
        {
            std::ostringstream oss;

            oss << end_message << " Total time: " << one_util::float_to_str(time) << "s";
            NebulaLog::log("SCHED", Log::DDEBUG, oss);
        }
    }

    double get_elapsed_time()
    {
        struct timespec eend;

        clock_gettime(CLOCK_MONOTONIC, &eend);

        return (eend.tv_sec + (eend.tv_nsec * pow(10, -9))) -
               (estart.tv_sec+(estart.tv_nsec*pow(10, -9)));
    }

private:
    std::string end_message;

    struct timespec estart;
};

#endif /*PROFILER_H_*/
