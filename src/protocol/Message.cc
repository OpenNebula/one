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

#include "Message.h"
#include "MonitorDriverMessages.h"
#include "ProtocolMessages.h"

template<>
const EString<MonitorDriverMessages> monitor_msg_t::_type_str(
{
    {"UNDEFINED", MonitorDriverMessages::UNDEFINED},
    {"INIT", MonitorDriverMessages::INIT},
    {"FINALIZE", MonitorDriverMessages::FINALIZE},
    {"MONITOR_VM", MonitorDriverMessages::MONITOR_VM},
    {"MONITOR_HOST", MonitorDriverMessages::MONITOR_HOST},
    {"BEACON_HOST", MonitorDriverMessages::BEACON_HOST},
    {"SYSTEM_HOST", MonitorDriverMessages::SYSTEM_HOST},
    {"STATE_VM", MonitorDriverMessages::STATE_VM},
    {"START_MONITOR", MonitorDriverMessages::START_MONITOR},
    {"STOP_MONITOR", MonitorDriverMessages::STOP_MONITOR},
    {"LOG", MonitorDriverMessages::LOG}
});

template<>
const EString<InformationManagerMessages> im_msg_t::_type_str(
{
    {"UNDEFINED", InformationManagerMessages::UNDEFINED},
    {"INIT", InformationManagerMessages::INIT},
    {"FINALIZE", InformationManagerMessages::FINALIZE},
    {"HOST_LIST", InformationManagerMessages::HOST_LIST},
    {"UPDATE_HOST", InformationManagerMessages::UPDATE_HOST},
    {"DEL_HOST", InformationManagerMessages::DEL_HOST},
    {"START_MONITOR", InformationManagerMessages::START_MONITOR},
    {"STOP_MONITOR", InformationManagerMessages::STOP_MONITOR},
    {"HOST_STATE", InformationManagerMessages::HOST_STATE},
    {"VM_STATE", InformationManagerMessages::VM_STATE},
    {"HOST_SYSTEM", InformationManagerMessages::HOST_SYSTEM},
    {"RAFT_STATUS", InformationManagerMessages::RAFT_STATUS},
});

template<>
const EString<ImageManagerMessages> image_msg_t::_type_str(
{
    {"UNDEFINED", ImageManagerMessages::UNDEFINED},
    {"INIT", ImageManagerMessages::INIT},
    {"FINALIZE", ImageManagerMessages::FINALIZE},
    {"CP", ImageManagerMessages::CP},
    {"CLONE", ImageManagerMessages::CLONE},
    {"STAT", ImageManagerMessages::STAT},
    {"MKFS", ImageManagerMessages::MKFS},
    {"RM", ImageManagerMessages::RM},
    {"MONITOR", ImageManagerMessages::MONITOR},
    {"SNAP_DELETE", ImageManagerMessages::SNAP_DELETE},
    {"SNAP_REVERT", ImageManagerMessages::SNAP_REVERT},
    {"SNAP_FLATTEN", ImageManagerMessages::SNAP_FLATTEN},
    {"INCREMENT_FLATTEN", ImageManagerMessages::INCREMENT_FLATTEN},
    {"RESTORE", ImageManagerMessages::RESTORE},
    {"LOG", ImageManagerMessages::LOG},
});

template<>
const EString<AuthManagerMessages> auth_msg_t::_type_str(
{
    {"UNDEFINED", AuthManagerMessages::UNDEFINED},
    {"INIT", AuthManagerMessages::INIT},
    {"FINALIZE", AuthManagerMessages::FINALIZE},
    {"AUTHORIZE", AuthManagerMessages::AUTHORIZE},
    {"AUTHENTICATE", AuthManagerMessages::AUTHENTICATE},
    {"LOG", AuthManagerMessages::LOG},
});

template<>
const EString<IPAMManagerMessages> ipam_msg_t::_type_str(
{
    {"UNDEFINED", IPAMManagerMessages::UNDEFINED},
    {"INIT", IPAMManagerMessages::INIT},
    {"FINALIZE", IPAMManagerMessages::FINALIZE},
    {"REGISTER_ADDRESS_RANGE", IPAMManagerMessages::REGISTER_ADDRESS_RANGE},
    {"UNREGISTER_ADDRESS_RANGE", IPAMManagerMessages::UNREGISTER_ADDRESS_RANGE},
    {"GET_ADDRESS", IPAMManagerMessages::GET_ADDRESS},
    {"ALLOCATE_ADDRESS", IPAMManagerMessages::ALLOCATE_ADDRESS},
    {"FREE_ADDRESS", IPAMManagerMessages::FREE_ADDRESS},
    {"VNET_CREATE", IPAMManagerMessages::VNET_CREATE},
    {"VNET_DELETE", IPAMManagerMessages::VNET_DELETE},
    {"LOG", IPAMManagerMessages::LOG},
});

template<>
const EString<MarketPlaceManagerMessages> market_msg_t::_type_str(
{
    {"UNDEFINED", MarketPlaceManagerMessages::UNDEFINED},
    {"INIT", MarketPlaceManagerMessages::INIT},
    {"FINALIZE", MarketPlaceManagerMessages::FINALIZE},
    {"IMPORT", MarketPlaceManagerMessages::IMPORT},
    {"DELETE", MarketPlaceManagerMessages::DELETE},
    {"MONITOR", MarketPlaceManagerMessages::MONITOR},
    {"LOG", MarketPlaceManagerMessages::LOG},
});

template<>
const EString<TransferManagerMessages> transfer_msg_t::_type_str(
{
    {"UNDEFINED", TransferManagerMessages::UNDEFINED},
    {"INIT", TransferManagerMessages::INIT},
    {"FINALIZE", TransferManagerMessages::FINALIZE},
    {"TRANSFER", TransferManagerMessages::TRANSFER},
    {"DRIVER_CANCEL", TransferManagerMessages::DRIVER_CANCEL},
    {"LOG", TransferManagerMessages::LOG},
});

template<>
const EString<VMManagerMessages> vm_msg_t::_type_str(
{
    {"UNDEFINED", VMManagerMessages::UNDEFINED},
    {"INIT", VMManagerMessages::INIT},
    {"FINALIZE", VMManagerMessages::FINALIZE},
    {"DEPLOY", VMManagerMessages::DEPLOY},
    {"SHUTDOWN", VMManagerMessages::SHUTDOWN},
    {"RESET", VMManagerMessages::RESET},
    {"REBOOT", VMManagerMessages::REBOOT},
    {"CANCEL", VMManagerMessages::CANCEL},
    {"CLEANUP", VMManagerMessages::CLEANUP},
    {"CHECKPOINT", VMManagerMessages::CHECKPOINT},
    {"SAVE", VMManagerMessages::SAVE},
    {"RESTORE", VMManagerMessages::RESTORE},
    {"MIGRATE", VMManagerMessages::MIGRATE},
    {"ATTACHDISK", VMManagerMessages::ATTACHDISK},
    {"DETACHDISK", VMManagerMessages::DETACHDISK},
    {"ATTACHNIC", VMManagerMessages::ATTACHNIC},
    {"DETACHNIC", VMManagerMessages::DETACHNIC},
    {"SNAPSHOTCREATE", VMManagerMessages::SNAPSHOTCREATE},
    {"SNAPSHOTREVERT", VMManagerMessages::SNAPSHOTREVERT},
    {"SNAPSHOTDELETE", VMManagerMessages::SNAPSHOTDELETE},
    {"DISKSNAPSHOTCREATE", VMManagerMessages::DISKSNAPSHOTCREATE},
    {"DISKSNAPSHOTREVERT", VMManagerMessages::DISKSNAPSHOTREVERT},
    {"RESIZEDISK", VMManagerMessages::RESIZEDISK},
    {"UPDATECONF", VMManagerMessages::UPDATECONF},
    {"UPDATESG", VMManagerMessages::UPDATESG},
    {"DRIVER_CANCEL", VMManagerMessages::DRIVER_CANCEL},
    {"LOG", VMManagerMessages::LOG},
    {"RESIZE", VMManagerMessages::RESIZE},
    {"BACKUP", VMManagerMessages::BACKUP},
    {"UPDATENIC", VMManagerMessages::UPDATENIC},
    {"BACKUPCANCEL", VMManagerMessages::BACKUPCANCEL},
});

template<>
const EString<HookManagerMessages> hook_msg_t::_type_str(
{
    {"UNDEFINED", HookManagerMessages::UNDEFINED},
    {"INIT", HookManagerMessages::INIT},
    {"FINALIZE", HookManagerMessages::FINALIZE},
    {"EXECUTE", HookManagerMessages::EXECUTE},
    {"RETRY", HookManagerMessages::RETRY},
    {"LOG", HookManagerMessages::LOG},
});
