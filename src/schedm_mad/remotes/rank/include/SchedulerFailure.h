/* -------------------------------------------------------------------------- */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                */
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

#ifndef SCHEDULER_FAILURE_H_
#define SCHEDULER_FAILURE_H_

#include <string>
#include <map>
#include <set>
#include <iostream>

class SchedulerFailure
{
public:
    /**
     * Type of failure
     */
    enum FailureType
    {
        NONE              = 0,
        HOST_NULL         = 1,
        HOST_REQUIREMENTS = 2,
        HOST_CPU          = 3,
        HOST_MEMORY       = 4,
        HOST_NUMA         = 5,
        HOST_PCI          = 6,
        HOST_DISPATCH     = 7,
        HOST_AFFINITY     = 8,
        DS_NULL           = 9,
        DS_CLUSTER        = 10,
        DS_CAPACITY       = 11,
        DS_NONE           = 12,
        DS_MONITOR        = 13,
        NET_NULL          = 14,
        NET_CLUSTER       = 15,
        NET_LEASES        = 16,
        NET_ROLLBACK      = 17
    };

    /**
     *  Return the string representation of a FailureType
     *    @param ft the failure
     *    @return the string
     */
    static std::string failure_to_string(FailureType ft);

    /**
     *  Return the string representation of a FailureType
     *    @param str_type string representing the FailureType
     *    @return the FailureType (defaults to NONE)
     */
    static FailureType str_to_failure_type(std::string& str_type);

    /**
     * Logs all the failures associated to a VM that has failed to be scheduled
     *    @param host_failures map of failures per host
     *    @return the log
     */
    static std::ostringstream log_failures(std::map<FailureType, std::set<int>> &host_failures);
};

#endif // SCHEDULER_FAILURE_H_
