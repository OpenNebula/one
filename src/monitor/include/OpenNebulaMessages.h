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

#ifndef OPENNEBULA_MESSAGES_H
#define OPENNEBULA_MESSAGES_H

#include "StreamManager.h"

/**
 * Messages between the Monitor daemon and OpenNebula daemon
 */
enum class OpenNebulaMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    HOST_LIST,
    UPDATE_HOST,
    DEL_HOST,
    START_MONITOR,
    STOP_MONITOR,
    HOST_STATE,
    VM_STATE,
    HOST_SYSTEM,
    RAFT_STATUS,
    ENUM_MAX
};

typedef StreamManager<OpenNebulaMessages> one_stream_t;

#endif /*OPENNEBULA_MESSAGES_H*/
