/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#ifndef RAFT_HOOK_H_
#define RAFT_HOOK_H_

#include <string>

#include "Hook.h"

class RaftHook : public Hook
{
public:
    RaftHook(const std::string& name,
             const std::string& command,
             const std::string& arg):
        Hook(name, command, arg, Hook::UPDATE, false){};

    ~RaftHook(){};

    void do_hook(void *arg);
};

class RaftLeaderHook : public RaftHook
{
public:
    RaftLeaderHook(const std::string& command, const std::string& arg):
        RaftHook("RAFT_LEADER_HOOK", command, arg){};

    ~RaftLeaderHook(){};
};

class RaftFollowerHook : public RaftHook
{
public:
    RaftFollowerHook(const std::string& command, const std::string& arg):
        RaftHook("RAFT_FOLLOWER_HOOK", command, arg){};

    ~RaftFollowerHook(){};
};

#endif
