/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineXRPC.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineAllocateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC& att)
{
    int oid;

    auto ec = allocate(paramList.getString(1),  // Template
                       paramList.size() > 2 ? paramList.getBoolean(2) : false, // Hold
                       oid,
                       att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC& att)
{
    string xml;

    auto ec = info(paramList.getInt(1),     // id
                   paramList.size() > 2 ? paramList.getBoolean(2) : false, // decrypt
                   xml,
                   att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update(oid,                      // id
                     paramList.getString(2) ,  // template
                     paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = rename(oid,                     // id
                     paramList.getString(2),  // name
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineChmodXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = chmod(paramList.getInt(1),  // id
                    paramList.getInt(2),  // user use
                    paramList.getInt(3),  // user manage
                    paramList.getInt(4),  // user admin
                    paramList.getInt(5),  // group use
                    paramList.getInt(6),  // group manage
                    paramList.getInt(7),  // group admin
                    paramList.getInt(8),  // other use
                    paramList.getInt(9),  // other manage
                    paramList.getInt(10), // other admin
                    att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineChownXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                              RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = chown(oid,                 // id
                    paramList.getInt(2), // user id
                    paramList.getInt(3), // group id
                    att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineLockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = lock(oid,                     // id
                   paramList.getInt(2),     // lock level
                   paramList.size() > 3 ? paramList.getBoolean(3) : false, // test
                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineUnlockXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC&     att)
{
    int oid = paramList.getInt(1);

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDeployXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = deploy(oid,
                     paramList.getInt(2),                                    // hid
                     paramList.size() > 3 ? paramList.getBoolean(3) : false, // enforce
                     paramList.size() > 4 ? paramList.getInt(4)     : -1,    // ds_id
                     paramList.size() > 5 ? paramList.getString(5)  : "",    // template
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineActionXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(2);

    auto ec = action(oid,                    // oid
                     paramList.getString(1), // action
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineMigrateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = migrate(oid,
                      paramList.getInt(2),     // hid
                      paramList.getBoolean(3), // live
                      paramList.size() > 4 ? paramList.getBoolean(4) : false, // enforce
                      paramList.size() > 5 ? paramList.getInt(5)     : -1,    // ds_id
                      paramList.size() > 6 ? paramList.getInt(6)     :  0,    // migration type
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSaveAsXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC& att)
{
    int image_id = -1;

    auto ec = disk_save_as(paramList.getInt(1),     // oid
                           paramList.getInt(2),     // disk_id
                           paramList.getString(3),  // image name
                           paramList.getString(4),  // image type
                           paramList.getInt(5),     // snap_id
                           image_id,
                           att);

    response(ec, image_id, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotCreateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                           RequestAttributesXRPC& att)
{
    int snap_id = -1;

    auto ec = disk_snapshot_create(paramList.getInt(1),    // oid
                                   paramList.getInt(2),    // disk_id
                                   paramList.getString(3), // name
                                   snap_id,
                                   att);

    response(ec, snap_id, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                           RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = disk_snapshot_delete(oid,
                                   paramList.getInt(2), // disk_id
                                   paramList.getInt(3), // snap_id
                                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotRevertXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                           RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = disk_snapshot_revert(oid,    // oid
                                   paramList.getInt(2), // disk_id
                                   paramList.getInt(3), // snap_id
                                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotRenameXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                           RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = disk_snapshot_rename(oid,
                                   paramList.getInt(2), // disk_id
                                   paramList.getInt(3), // snap_id
                                   paramList.getString(4), // new_name
                                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskAttachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = disk_attach(oid,
                          paramList.getString(2), // template
                          att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskDetachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = disk_detach(oid,
                          paramList.getInt(2), // disk_id
                          att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineDiskResizeXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = disk_resize(oid,
                          paramList.getInt(2), // disk_id
                          paramList.getString(3), // new_size
                          att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineNicAttachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                  RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = nic_attach(oid,
                         paramList.getString(2), // template
                         att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineNicDetachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                  RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = nic_detach(oid,
                         paramList.getInt(2), // nic_id
                         att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineNicUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                  RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = nic_update(oid,
                         paramList.getInt(2),    // nic_id
                         paramList.getString(3), // template
                         paramList.size() > 4 ? paramList.getInt(4) : 0,    // append
                         att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSGAttachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = sg_attach(oid,
                        paramList.getInt(2), // nic id
                        paramList.getInt(3), // secgroup id
                        att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSGDetachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = sg_detach(oid,
                        paramList.getInt(2), // nic id
                        paramList.getInt(3), // secgroup id
                        att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSnapshotCreateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                       RequestAttributesXRPC& att)
{
    int snap_id = -1;

    auto ec = snapshot_create(paramList.getInt(1),    // oid
                              paramList.getString(2), // name
                              snap_id,
                              att);

    response(ec, snap_id, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSnapshotDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                       RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = snapshot_delete(oid,
                              paramList.getInt(2), // snap_id
                              att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSnapshotRevertXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                       RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = snapshot_revert(oid,
                              paramList.getInt(2), // snap_id
                              att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineResizeXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = resize(oid,
                     paramList.getString(2), // template
                     paramList.size() > 3 ? paramList.getBoolean(3) : true, // enforce
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineUpdateConfXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = update_conf(oid,
                          paramList.getString(2), // template
                          paramList.size() > 3 ? paramList.getInt(3) : 0, // append
                          att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineRecoverXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = recover(oid,
                      paramList.getInt(2), // operation
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineMonitoringXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC& att)
{
    string xml;

    auto ec = monitoring(paramList.getInt(1),
                         xml,
                         att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSchedAddXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC& att)
{
    int sched_id = -1;

    auto ec = sched_add(paramList.getInt(1),    // oid
                        paramList.getString(2), // template
                        sched_id,
                        att);

    response(ec, sched_id, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSchedUpdateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                    RequestAttributesXRPC& att)
{
    int sched_id = paramList.getInt(2);

    auto ec = sched_update(paramList.getInt(1),    // oid
                           sched_id,
                           paramList.getString(3), // template
                           att);

    response(ec, sched_id, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineSchedDeleteXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                    RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = sched_delete(oid,
                           paramList.getInt(2), // sched id
                           att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineBackupXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                               RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = backup(oid,
                     paramList.size() > 2 ? paramList.getInt(2) : -1,        // ds id
                     paramList.size() > 3 ? paramList.getBoolean(3) : false, // reset
                     -1,
                     att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineBackupCancelXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                     RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = backup_cancel(oid,
                            att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineRestoreXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = restore(oid,
                      paramList.getInt(2), // image id
                      paramList.getInt(3), // increment id
                      paramList.getInt(4), // disk id
                      att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePciAttachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                  RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = pci_attach(oid,
                         paramList.getString(2), // template
                         att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePciDetachXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                  RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = pci_detach(oid,
                         paramList.getInt(2), // pci id
                         att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineExecXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = exec(oid,
                   paramList.getString(2), // command
                   paramList.getString(3), // command stdin
                   att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineExecRetryXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                  RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = exec_retry(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineExecCancelXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                   RequestAttributesXRPC& att)
{
    int oid = paramList.getInt(1);

    auto ec = exec_cancel(oid, att);

    response(ec, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePoolInfoXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                 RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = info(paramList.getInt(1),                                // filter flag
                   paramList.getInt(2),                                // start ID
                   paramList.getInt(3),                                // end ID
                   paramList.getInt(4),                                // state
                   paramList.size() > 5 ? paramList.getString(5) : "", // json query
                   xml,
                   att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePoolInfoExtendedXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                         RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = info_extended(paramList.getInt(1),    // filter flag
                            paramList.getInt(2),    // start ID
                            paramList.getInt(3),    // end ID
                            paramList.getInt(4),    // state
                            paramList.size() > 5 ? paramList.getString(5) : "", // json query
                            xml,
                            att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePoolInfoSetXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                    RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = info_set(paramList.getString(1),  // ids
                       paramList.getBoolean(2), // extended
                       xml,
                       att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePoolMonitoringXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                       RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = monitoring(paramList.getInt(1), // filter flag
                         paramList.size() > 2 ? paramList.getInt(2) : -1, // seconds
                         xml,
                         att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePoolAccountingXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                       RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = accounting(paramList.getInt(1), // filter flag
                         paramList.getInt(2), // time start
                         paramList.getInt(3), // time end
                         xml,
                         att);

    response(ec, xml, att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePoolShowbackCalculateXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                              RequestAttributesXRPC&     att)
{
    auto ec = showback_calc(paramList.getInt(1), // start month
                            paramList.getInt(2), // start year
                            paramList.getInt(3), // end month
                            paramList.getInt(4), // end year
                            att);

    response(ec, " ", att);
}

/* -------------------------------------------------------------------------- */

void VirtualMachinePoolShowbackListXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                                         RequestAttributesXRPC&     att)
{
    string xml;

    auto ec = showback_list(paramList.getInt(1), // filter flag
                            paramList.getInt(2), // start month
                            paramList.getInt(3), // start year
                            paramList.getInt(4), // end month
                            paramList.getInt(5), // end year
                            xml,
                            att);

    response(ec, xml, att);
}
