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

#ifndef EXECUTE_HOOK_H_
#define EXECUTE_HOOK_H_

#define EXECUTE_HOOK_MAX_ARG 50

#include <string>

class ExecuteHook
{
public:
    ExecuteHook(const std::string& _name, const std::string& _cmd,
                const std::string& _arg, const std::string& rl);

    ~ExecuteHook() = default;

    void execute();

private:
    /**
     *  Name of the Hook
     */
    std::string name;

    /**
     *  The command to be executed
     */
    std::string cmd;

    /**
     *  The arguments for the command
     */
    const char * c_args[EXECUTE_HOOK_MAX_ARG];

    std::string args[EXECUTE_HOOK_MAX_ARG];
};

#endif
