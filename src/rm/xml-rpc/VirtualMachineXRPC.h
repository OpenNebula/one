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

#ifndef VIRTUAL_MACHINE_XRPC_H
#define VIRTUAL_MACHINE_XRPC_H

#include "RequestXRPC.h"
#include "VirtualMachineAPI.h"
#include "VirtualMachinePoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAllocateXRPC : public RequestXRPC, public VirtualMachineAllocateAPI
{
public:
    VirtualMachineAllocateXRPC() :
        RequestXRPC("one.vm.allocate",
                    "Allocates a new Virtual Machine",
                    "A:ss"),
        VirtualMachineAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineInfoXRPC : public RequestXRPC, public VirtualMachineInfoAPI
{
public:
    VirtualMachineInfoXRPC() :
        RequestXRPC("one.vm.info",
                    "Returns Virtual Machine information",
                    "A:sib"),
        VirtualMachineInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineUpdateXRPC : public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineUpdateXRPC() :
        RequestXRPC("one.vm.update",
                    "Updates a Virtual Machine",
                    "A:sisi"),
        VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineRenameXRPC : public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineRenameXRPC() :
        RequestXRPC("one.vm.rename",
                    "Renames a Virtual Machine",
                    "A:sis"),
        VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineChmodXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineChmodXRPC()
        : RequestXRPC("one.vm.chmod",
                      "Changes permission bits of a Virtual Machine",
                      "A:siiiiiiiiii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineChownXRPC : public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineChownXRPC()
        : RequestXRPC("one.vm.chown",
                      "Changes ownership of a Virtual Machine",
                      "A:siii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineLockXRPC : public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineLockXRPC()
        : RequestXRPC("one.vm.lock",
                      "Lock a Virtual Machine",
                      "A:siib")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineUnlockXRPC : public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineUnlockXRPC()
        : RequestXRPC("one.vm.unlock",
                      "Unlock a Virtual Machine",
                      "A:si")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDeployXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDeployXRPC()
        : RequestXRPC("one.vm.deploy",
                      "Deploy a Virtual Machine",
                      "A:siibis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineActionXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineActionXRPC()
        : RequestXRPC("one.vm.action",
                      "Performs an action on a Virtual Machine",
                      "A:ssi")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineMigrateXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineMigrateXRPC()
        : RequestXRPC("one.vm.migrate",
                      "Migrate a Virtual Machine",
                      "A:siibbii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSaveAsXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSaveAsXRPC()
        : RequestXRPC("one.vm.disksaveas",
                      "Save a Virtual Machine Disk",
                      "A:siissi")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotCreateXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotCreateXRPC()
        : RequestXRPC("one.vm.disksnapshotcreate",
                      "Create a snapshot of a Virtual Machine Disk",
                      "A:siis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotDeleteXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotDeleteXRPC()
        : RequestXRPC("one.vm.disksnapshotdelete",
                      "Delete a snapshot of a Virtual Machine Disk",
                      "A:siii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotRevertXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotRevertXRPC()
        : RequestXRPC("one.vm.disksnapshotrevert",
                      "Revert a Virtual Machine Disk to a snapshot",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotRenameXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotRenameXRPC()
        : RequestXRPC("one.vm.disksnapshotrename",
                      "Rename a snapshot of a Virtual Machine Disk",
                      "A:siiis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskAttachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskAttachXRPC()
        : RequestXRPC("one.vm.diskattach",
                      "Attach a disk to a Virtual Machine",
                      "A:sis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskDetachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskDetachXRPC()
        : RequestXRPC("one.vm.diskdetach",
                      "Detach a disk from a Virtual Machine",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskResizeXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskResizeXRPC()
        : RequestXRPC("one.vm.diskresize",
                      "Resize a disk of a Virtual Machine",
                      "A:siis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineNicAttachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineNicAttachXRPC()
        : RequestXRPC("one.vm.nicattach",
                      "Attach a NIC to a Virtual Machine",
                      "A:sis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineNicDetachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineNicDetachXRPC()
        : RequestXRPC("one.vm.nicdetach",
                      "Detach a NIC from a Virtual Machine",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineNicUpdateXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineNicUpdateXRPC()
        : RequestXRPC("one.vm.updatenic",
                      "Update NIC attributes, propagate the changes to host",
                      "A:siis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSGAttachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSGAttachXRPC()
        : RequestXRPC("one.vm.sgattach",
                      "Attach a Security Group to a Virtual Machine",
                      "A:siii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSGDetachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSGDetachXRPC()
        : RequestXRPC("one.vm.sgdetach",
                      "Detach a Security Group from a Virtual Machine",
                      "A:siii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotCreateXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSnapshotCreateXRPC()
        : RequestXRPC("one.vm.snapshotcreate",
                      "Create a snapshot of a Virtual Machine",
                      "A:sis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotDeleteXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSnapshotDeleteXRPC()
        : RequestXRPC("one.vm.snapshotdelete",
                      "Delete a snapshot of a Virtual Machine",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotRevertXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSnapshotRevertXRPC()
        : RequestXRPC("one.vm.snapshotrevert",
                      "Revert a Virtual Machine to a snapshot",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineResizeXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineResizeXRPC()
        : RequestXRPC("one.vm.resize",
                      "Resize a Virtual Machine",
                      "A:siis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineUpdateConfXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineUpdateConfXRPC()
        : RequestXRPC("one.vm.updateconf",
                      "Update the configuration of a Virtual Machine",
                      "A:sis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineRecoverXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineRecoverXRPC()
        : RequestXRPC("one.vm.recover",
                      "Recover a Virtual Machine",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineMonitoringXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineMonitoringXRPC()
        : RequestXRPC("one.vm.monitoring",
                      "Monitor a Virtual Machine",
                      "A:si")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSchedAddXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSchedAddXRPC()
        : RequestXRPC("one.vm.schedadd",
                      "Add a scheduled action to a Virtual Machine",
                      "A:sis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSchedUpdateXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSchedUpdateXRPC()
        : RequestXRPC("one.vm.schedupdate",
                      "Update a scheduled action for a Virtual Machine",
                      "A:siis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSchedDeleteXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSchedDeleteXRPC()
        : RequestXRPC("one.vm.scheddelete",
                      "Delete a scheduled action for a Virtual Machine",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineBackupXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineBackupXRPC()
        : RequestXRPC("one.vm.backup",
                      "Creates a new backup image for a Virtual Machine",
                      "A:siib")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineBackupCancelXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineBackupCancelXRPC()
        : RequestXRPC("one.vm.backupcancel",
                      "Cancel a backup operation for a Virtual Machine",
                      "A:si")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineRestoreXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineRestoreXRPC()
        : RequestXRPC("one.vm.restore",
                      "Restore a Virtual Machine from a backup",
                      "A:siiii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePciAttachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachinePciAttachXRPC()
        : RequestXRPC("one.vm.attachpci",
                      "Attach a PCI device to a Virtual Machine",
                      "A:sis")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePciDetachXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachinePciDetachXRPC()
        : RequestXRPC("one.vm.detachpci",
                      "Detach a PCI device from a Virtual Machine",
                      "A:sii")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineExecXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineExecXRPC()
        : RequestXRPC("one.vm.exec",
                      "Execute a command in a Virtual Machine",
                      "A:siss")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineExecRetryXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineExecRetryXRPC()
        : RequestXRPC("one.vm.retryexec",
                      "Retry to execute the last command executed in a Virtual Machine",
                      "A:si")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineExecCancelXRPC: public RequestXRPC, public VirtualMachineAPI
{
public:
    VirtualMachineExecCancelXRPC()
        : RequestXRPC("one.vm.cancelexec",
                      "Cancel the execution of the command being executed in a Virtual Machine",
                      "A:si")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfoXRPC : public RequestXRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolInfoXRPC()
        : RequestXRPC("one.vmpool.info",
                      "Returns the Virtual Machine pool",
                      "A:siiiis")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfoExtendedXRPC : public RequestXRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolInfoExtendedXRPC()
        : RequestXRPC("one.vmpool.infoextended",
                      "Returns the Virtual Machine pool in extended format",
                      "A:siiiis")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfoSetXRPC : public RequestXRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolInfoSetXRPC()
        : RequestXRPC("one.vmpool.infoset",
                      "Returns the Virtual Machine pool",
                      "A:ssb")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolMonitoringXRPC : public RequestXRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolMonitoringXRPC()
        : RequestXRPC("one.vmpool.monitoring",
                      "Returns the Virtual Machine monitoring records",
                      "A:sii")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolAccountingXRPC : public RequestXRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolAccountingXRPC()
        : RequestXRPC("one.vmpool.accounting",
                      "Returns the Virtual Machine history records",
                      "A:siii")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolShowbackCalculateXRPC : public RequestXRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolShowbackCalculateXRPC()
        : RequestXRPC("one.vmpool.calculateshowback",
                      "Processes all the history records, and stores the monthly cost for each VM",
                      "A:siiiii")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolShowbackListXRPC : public RequestXRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolShowbackListXRPC()
        : RequestXRPC("one.vmpool.showback",
                      "Returns the Virtual Machine showback records",
                      "A:siiiii")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
