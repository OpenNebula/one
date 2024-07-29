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

#ifndef PROTOCOL_MESSAGES_H
#define PROTOCOL_MESSAGES_H

#include "Message.h"

/**
 * Messages between the Monitor daemon and OpenNebula daemon
 */
enum class InformationManagerMessages : unsigned short int
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

using im_msg_t = Message<InformationManagerMessages, true, true, false, false>;


/**
 * Image Manager Driver messages
 */
enum class ImageManagerMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    CP,
    CLONE,
    STAT,
    MKFS,
    RM,
    MONITOR,
    SNAP_DELETE,
    SNAP_REVERT,
    SNAP_FLATTEN,
    RESTORE,
    INCREMENT_FLATTEN,
    LOG,
    ENUM_MAX
};

using image_msg_t = Message<ImageManagerMessages, false, false, false, false>;


/**
 * Auth Manager Driver messages
 */
enum class AuthManagerMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    AUTHORIZE,
    AUTHENTICATE,
    LOG,
    ENUM_MAX
};

using auth_msg_t = Message<AuthManagerMessages, false, false, false, false>;


/**
 * IPAM Manager Driver messages
 */
enum class IPAMManagerMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    REGISTER_ADDRESS_RANGE,
    UNREGISTER_ADDRESS_RANGE,
    GET_ADDRESS,
    ALLOCATE_ADDRESS,
    FREE_ADDRESS,
    VNET_CREATE,
    VNET_DELETE,
    LOG,
    ENUM_MAX
};

using ipam_msg_t = Message<IPAMManagerMessages, false, false, false, false>;


/**
 * MarketPlace Manager Driver messages
 */
enum class MarketPlaceManagerMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    IMPORT,
    DELETE,
    MONITOR,
    LOG,
    ENUM_MAX
};

using market_msg_t = Message<MarketPlaceManagerMessages, false, false, false, false>;


/**
 * Transfer Manager Driver messages
 */
enum class TransferManagerMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    TRANSFER,
    DRIVER_CANCEL,
    LOG,
    ENUM_MAX
};

using transfer_msg_t = Message<TransferManagerMessages, false, false, false, false>;


/**
 * Virtual Machine Driver messages
 */
enum class VMManagerMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    DEPLOY,
    SHUTDOWN,
    RESET,
    REBOOT,
    CANCEL,
    CLEANUP,
    CHECKPOINT,
    SAVE,
    RESTORE,
    MIGRATE,
    ATTACHDISK,
    DETACHDISK,
    ATTACHNIC,
    DETACHNIC,
    SNAPSHOTCREATE,
    SNAPSHOTREVERT,
    SNAPSHOTDELETE,
    DISKSNAPSHOTCREATE,
    DISKSNAPSHOTREVERT,
    RESIZEDISK,
    UPDATECONF,
    UPDATESG,
    DRIVER_CANCEL,
    LOG,
    RESIZE,
    BACKUP,
    UPDATENIC,
    BACKUPCANCEL,
    ENUM_MAX
};

using vm_msg_t = Message<VMManagerMessages, false, false, false, false>;


/**
 * Virtual Machine Driver messages
 */
enum class HookManagerMessages : unsigned short int
{
    UNDEFINED = 0,
    INIT,
    FINALIZE,
    EXECUTE,
    RETRY,
    LOG,
    ENUM_MAX
};

using hook_msg_t = Message<HookManagerMessages, false, false, false, false>;


#endif /*PROTOCOL_MESSAGES_H*/
