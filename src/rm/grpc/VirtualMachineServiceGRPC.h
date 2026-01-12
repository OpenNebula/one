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

#ifndef VIRTUAL_MACHINE_GRPC_H
#define VIRTUAL_MACHINE_GRPC_H

#include "RequestGRPC.h"
#include "VirtualMachineAPI.h"
#include "VirtualMachinePoolAPI.h"

#include "vm.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineService final : public one::vm::VirtualMachineService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::vm::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::vm::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::vm::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::vm::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::vm::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::vm::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::vm::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::vm::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Deploy(grpc::ServerContext* context,
                        const one::vm::DeployRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Action(grpc::ServerContext* context,
                        const one::vm::ActionRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Migrate(grpc::ServerContext* context,
                         const one::vm::MigrateRequest* request,
                         one::ResponseID* response) override;

    grpc::Status DiskSaveAs(grpc::ServerContext* context,
                            const one::vm::DiskSaveAsRequest* request,
                            one::ResponseID* response) override;

    grpc::Status DiskSnapshotCreate(grpc::ServerContext* context,
                                    const one::vm::DiskSnapshotCreateRequest* request,
                                    one::ResponseID* response) override;

    grpc::Status DiskSnapshotDelete(grpc::ServerContext* context,
                                    const one::vm::DiskSnapshotDeleteRequest* request,
                                    one::ResponseID* response) override;

    grpc::Status DiskSnapshotRevert(grpc::ServerContext* context,
                                    const one::vm::DiskSnapshotRevertRequest* request,
                                    one::ResponseID* response) override;

    grpc::Status DiskSnapshotRename(grpc::ServerContext* context,
                                    const one::vm::DiskSnapshotRenameRequest* request,
                                    one::ResponseID* response) override;

    grpc::Status DiskAttach(grpc::ServerContext* context,
                            const one::vm::DiskAttachRequest* request,
                            one::ResponseID* response) override;

    grpc::Status DiskDetach(grpc::ServerContext* context,
                            const one::vm::DiskDetachRequest* request,
                            one::ResponseID* response) override;

    grpc::Status DiskResize(grpc::ServerContext* context,
                            const one::vm::DiskResizeRequest* request,
                            one::ResponseID* response) override;

    grpc::Status NicAttach(grpc::ServerContext* context,
                           const one::vm::NicAttachRequest* request,
                           one::ResponseID* response) override;

    grpc::Status NicDetach(grpc::ServerContext* context,
                           const one::vm::NicDetachRequest* request,
                           one::ResponseID* response) override;

    grpc::Status NicUpdate(grpc::ServerContext* context,
                           const one::vm::NicUpdateRequest* request,
                           one::ResponseID* response) override;

    grpc::Status SGAttach(grpc::ServerContext* context,
                          const one::vm::SGAttachRequest* request,
                          one::ResponseID* response) override;

    grpc::Status SGDetach(grpc::ServerContext* context,
                          const one::vm::SGDetachRequest* request,
                          one::ResponseID* response) override;

    grpc::Status SnapshotCreate(grpc::ServerContext* context,
                                const one::vm::SnapshotCreateRequest* request,
                                one::ResponseID* response) override;

    grpc::Status SnapshotDelete(grpc::ServerContext* context,
                                const one::vm::SnapshotDeleteRequest* request,
                                one::ResponseID* response) override;

    grpc::Status SnapshotRevert(grpc::ServerContext* context,
                                const one::vm::SnapshotRevertRequest* request,
                                one::ResponseID* response) override;

    grpc::Status Resize(grpc::ServerContext* context,
                        const one::vm::ResizeRequest* request,
                        one::ResponseID* response) override;

    grpc::Status UpdateConf(grpc::ServerContext* context,
                            const one::vm::UpdateConfRequest* request,
                            one::ResponseID* response) override;

    grpc::Status Recover(grpc::ServerContext* context,
                         const one::vm::RecoverRequest* request,
                         one::ResponseID* response) override;

    grpc::Status Monitoring(grpc::ServerContext* context,
                            const one::vm::MonitoringRequest* request,
                            one::ResponseXML* response) override;

    grpc::Status SchedAdd(grpc::ServerContext* context,
                          const one::vm::SchedAddRequest* request,
                          one::ResponseID* response) override;

    grpc::Status SchedUpdate(grpc::ServerContext* context,
                             const one::vm::SchedUpdateRequest* request,
                             one::ResponseID* response) override;

    grpc::Status SchedDelete(grpc::ServerContext* context,
                             const one::vm::SchedDeleteRequest* request,
                             one::ResponseID* response) override;

    grpc::Status Backup(grpc::ServerContext* context,
                        const one::vm::BackupRequest* request,
                        one::ResponseID* response) override;

    grpc::Status BackupCancel(grpc::ServerContext* context,
                              const one::vm::BackupCancelRequest* request,
                              one::ResponseID* response) override;

    grpc::Status Restore(grpc::ServerContext* context,
                         const one::vm::RestoreRequest* request,
                         one::ResponseID* response) override;

    grpc::Status PciAttach(grpc::ServerContext* context,
                           const one::vm::PciAttachRequest* request,
                           one::ResponseID* response) override;

    grpc::Status PciDetach(grpc::ServerContext* context,
                           const one::vm::PciDetachRequest* request,
                           one::ResponseID* response) override;

    grpc::Status Exec(grpc::ServerContext* context,
                      const one::vm::ExecRequest* request,
                      one::ResponseID* response) override;

    grpc::Status ExecRetry(grpc::ServerContext* context,
                           const one::vm::ExecRetryRequest* request,
                           one::ResponseID* response) override;

    grpc::Status ExecCancel(grpc::ServerContext* context,
                            const one::vm::ExecCancelRequest* request,
                            one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::vm::PoolInfoRequest* request,
                          one::ResponseXML* response) override;

    grpc::Status PoolInfoExtended(grpc::ServerContext* context,
                                  const one::vm::PoolInfoRequest* request,
                                  one::ResponseXML* response) override;

    grpc::Status PoolInfoSet(grpc::ServerContext* context,
                             const one::vm::PoolInfoSetRequest* request,
                             one::ResponseXML* response) override;

    grpc::Status PoolMonitoring(grpc::ServerContext* context,
                                const one::vm::PoolMonitoringRequest* request,
                                one::ResponseXML* response) override;

    grpc::Status PoolAccounting(grpc::ServerContext* context,
                                const one::vm::PoolAccountingRequest* request,
                                one::ResponseXML* response) override;

    grpc::Status PoolShowback(grpc::ServerContext* context,
                              const one::vm::PoolShowbackRequest* request,
                              one::ResponseXML* response) override;

    grpc::Status PoolCalculateShowback(grpc::ServerContext* context,
                                       const one::vm::PoolCalculateShowbackRequest* request,
                                       one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAllocateGRPC : public RequestGRPC, public VirtualMachineAllocateAPI
{
public:
    VirtualMachineAllocateGRPC()
        : RequestGRPC("one.vm.allocate", "/one.vm.VirtualMachineService/Allocate")
        , VirtualMachineAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineInfoGRPC : public RequestGRPC, public VirtualMachineInfoAPI
{
public:
    VirtualMachineInfoGRPC()
        : RequestGRPC("one.vm.info", "/one.vm.VirtualMachineService/Info")
        , VirtualMachineInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineUpdateGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineUpdateGRPC()
        : RequestGRPC("one.vm.update", "/one.vm.VirtualMachineService/Update")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineRenameGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineRenameGRPC()
        : RequestGRPC("one.vm.rename", "/one.vm.VirtualMachineService/Rename")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineChmodGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineChmodGRPC()
        : RequestGRPC("one.vm.chmod", "/one.vm.VirtualMachineService/Chmod")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineChownGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineChownGRPC()
        : RequestGRPC("one.vm.chown", "/one.vm.VirtualMachineService/Chown")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineLockGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineLockGRPC()
        : RequestGRPC("one.vm.lock", "/one.vm.VirtualMachineService/Lock")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineUnlockGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineUnlockGRPC()
        : RequestGRPC("one.vm.unlock", "/one.vm.VirtualMachineService/Unlock")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDeployGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDeployGRPC()
        : RequestGRPC("one.vm.deploy", "/one.vm.VirtualMachineService/Deploy")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineActionGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineActionGRPC()
        : RequestGRPC("one.vm.action", "/one.vm.VirtualMachineService/Action")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineMigrateGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineMigrateGRPC()
        : RequestGRPC("one.vm.migrate", "/one.vm.VirtualMachineService/Migrate")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSaveAsGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSaveAsGRPC()
        : RequestGRPC("one.vm.disksaveas", "/one.vm.VirtualMachineService/DiskSaveAs")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotCreateGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotCreateGRPC()
        : RequestGRPC("one.vm.disksnapshotcreate", "/one.vm.VirtualMachineService/DiskSnapshotCreate")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotDeleteGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotDeleteGRPC()
        : RequestGRPC("one.vm.disksnapshotdelete", "/one.vm.VirtualMachineService/DiskSnapshotDelete")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotRevertGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotRevertGRPC()
        : RequestGRPC("one.vm.disksnapshotrevert", "/one.vm.VirtualMachineService/DiskSnapshotRevert")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotRenameGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskSnapshotRenameGRPC()
        : RequestGRPC("one.vm.disksnapshotrename", "/one.vm.VirtualMachineService/DiskSnapshotRename")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskAttachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskAttachGRPC()
        : RequestGRPC("one.vm.attach", "/one.vm.VirtualMachineService/DiskAttach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskDetachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskDetachGRPC()
        : RequestGRPC("one.vm.detach", "/one.vm.VirtualMachineService/DiskDetach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineDiskResizeGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineDiskResizeGRPC()
        : RequestGRPC("one.vm.diskresize", "/one.vm.VirtualMachineService/DiskResize")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineNicAttachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineNicAttachGRPC()
        : RequestGRPC("one.vm.attachnic", "/one.vm.VirtualMachineService/NicAttach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineNicDetachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineNicDetachGRPC()
        : RequestGRPC("one.vm.detachnic", "/one.vm.VirtualMachineService/NicDetach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineNicUpdateGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineNicUpdateGRPC()
        : RequestGRPC("one.vm.updatenic", "/one.vm.VirtualMachineService/NicUpdate")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSGAttachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSGAttachGRPC()
        : RequestGRPC("one.vm.sgattach", "/one.vm.VirtualMachineService/SGAttach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSGDetachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSGDetachGRPC()
        : RequestGRPC("one.vm.sgdetach", "/one.vm.VirtualMachineService/SGDetach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotCreateGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSnapshotCreateGRPC()
        : RequestGRPC("one.vm.snapshotcreate", "/one.vm.VirtualMachineService/SnapshotCreate")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotDeleteGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSnapshotDeleteGRPC()
        : RequestGRPC("one.vm.snapshotdelete", "/one.vm.VirtualMachineService/SnapshotDelete")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotRevertGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSnapshotRevertGRPC()
        : RequestGRPC("one.vm.snapshotrevert", "/one.vm.VirtualMachineService/SnapshotRevert")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineResizeGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineResizeGRPC()
        : RequestGRPC("one.vm.resize", "/one.vm.VirtualMachineService/Resize")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineUpdateConfGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineUpdateConfGRPC()
        : RequestGRPC("one.vm.updateconf", "/one.vm.VirtualMachineService/UpdateConf")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineRecoverGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineRecoverGRPC()
        : RequestGRPC("one.vm.recover", "/one.vm.VirtualMachineService/Recover")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineMonitoringGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineMonitoringGRPC()
        : RequestGRPC("one.vm.monitoring", "/one.vm.VirtualMachineService/Monitoring")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSchedAddGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSchedAddGRPC()
        : RequestGRPC("one.vm.schedadd", "/one.vm.VirtualMachineService/SchedAdd")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSchedUpdateGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSchedUpdateGRPC()
        : RequestGRPC("one.vm.schedupdate", "/one.vm.VirtualMachineService/SchedUpdate")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineSchedDeleteGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineSchedDeleteGRPC()
        : RequestGRPC("one.vm.scheddelete", "/one.vm.VirtualMachineService/SchedDelete")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineBackupGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineBackupGRPC()
        : RequestGRPC("one.vm.backup", "/one.vm.VirtualMachineService/Backup")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineBackupCancelGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineBackupCancelGRPC()
        : RequestGRPC("one.vm.backupcancel", "/one.vm.VirtualMachineService/BackupCancel")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineRestoreGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineRestoreGRPC()
        : RequestGRPC("one.vm.restore", "/one.vm.VirtualMachineService/Restore")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePciAttachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachinePciAttachGRPC()
        : RequestGRPC("one.vm.attachpci", "/one.vm.VirtualMachineService/PciAttach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePciDetachGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachinePciDetachGRPC()
        : RequestGRPC("one.vm.detachpci", "/one.vm.VirtualMachineService/PciDetach")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineExecGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineExecGRPC()
        : RequestGRPC("one.vm.exec", "/one.vm.VirtualMachineService/Exec")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineExecRetryGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineExecRetryGRPC()
        : RequestGRPC("one.vm.retryexec", "/one.vm.VirtualMachineService/ExecRetry")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachineExecCancelGRPC : public RequestGRPC, public VirtualMachineAPI
{
public:
    VirtualMachineExecCancelGRPC()
        : RequestGRPC("one.vm.cancelexec", "/one.vm.VirtualMachineService/ExecCancel")
        , VirtualMachineAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfoGRPC : public RequestGRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolInfoGRPC()
        : RequestGRPC("one.vmpool.info", "/one.vm.VirtualMachineService/PoolInfo")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfoExtendedGRPC : public RequestGRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolInfoExtendedGRPC()
        : RequestGRPC("one.vmpool.infoextended", "/one.vm.VirtualMachineService/PoolInfoExtended")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePoolInfoSetGRPC : public RequestGRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolInfoSetGRPC()
        : RequestGRPC("one.vmpool.infoset", "/one.vm.VirtualMachineService/PoolInfoSet")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePoolMonitoringGRPC : public RequestGRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolMonitoringGRPC()
        : RequestGRPC("one.vmpool.monitoring", "/one.vm.VirtualMachineService/PoolMonitoring")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePoolAccountingGRPC : public RequestGRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolAccountingGRPC()
        : RequestGRPC("one.vmpool.accounting", "/one.vm.VirtualMachineService/PoolAccounting")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePoolShowbackCalculateGRPC : public RequestGRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolShowbackCalculateGRPC()
        : RequestGRPC("one.vmpool.calculateshowback", "/one.vm.VirtualMachineService/PoolCalculateShowback")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualMachinePoolShowbackListGRPC : public RequestGRPC, public VirtualMachinePoolAPI
{
public:
    VirtualMachinePoolShowbackListGRPC()
        : RequestGRPC("one.vmpool.showback", "/one.vm.VirtualMachineService/PoolShowback")
        , VirtualMachinePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
