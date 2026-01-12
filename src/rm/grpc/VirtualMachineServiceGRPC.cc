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

#include "VirtualMachineServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status VirtualMachineService::Allocate(grpc::ServerContext* context,
                                             const one::vm::AllocateRequest* request,
                                             one::ResponseID* response)
{
    return VirtualMachineAllocateGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Info(grpc::ServerContext* context,
                                         const one::vm::InfoRequest* request,
                                         one::ResponseXML* response)
{
    return VirtualMachineInfoGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Update(grpc::ServerContext* context,
                                           const one::vm::UpdateRequest* request,
                                           one::ResponseID* response)
{
    return VirtualMachineUpdateGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Rename(grpc::ServerContext* context,
                                           const one::vm::RenameRequest* request,
                                           one::ResponseID* response)
{
    return VirtualMachineRenameGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Chmod(grpc::ServerContext* context,
                                          const one::vm::ChmodRequest* request,
                                          one::ResponseID* response)
{
    return VirtualMachineChmodGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Chown(grpc::ServerContext* context,
                                          const one::vm::ChownRequest* request,
                                          one::ResponseID* response)
{
    return VirtualMachineChownGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Lock(grpc::ServerContext* context,
                                         const one::vm::LockRequest* request,
                                         one::ResponseID* response)
{
    return VirtualMachineLockGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Unlock(grpc::ServerContext* context,
                                           const one::vm::UnlockRequest* request,
                                           one::ResponseID* response)
{
    return VirtualMachineUnlockGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Deploy(grpc::ServerContext* context,
                                           const one::vm::DeployRequest* request,
                                           one::ResponseID* response)
{
    return VirtualMachineDeployGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Action(grpc::ServerContext* context,
                                           const one::vm::ActionRequest* request,
                                           one::ResponseID* response)
{
    return VirtualMachineActionGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Migrate(grpc::ServerContext* context,
                                            const one::vm::MigrateRequest* request,
                                            one::ResponseID* response)
{
    return VirtualMachineMigrateGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskSaveAs(grpc::ServerContext* context,
                                               const one::vm::DiskSaveAsRequest* request,
                                               one::ResponseID* response)
{
    return VirtualMachineDiskSaveAsGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskSnapshotCreate(grpc::ServerContext* context,
                                                       const one::vm::DiskSnapshotCreateRequest* request,
                                                       one::ResponseID* response)
{
    return VirtualMachineDiskSnapshotCreateGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskSnapshotDelete(grpc::ServerContext* context,
                                                       const one::vm::DiskSnapshotDeleteRequest* request,
                                                       one::ResponseID* response)
{
    return VirtualMachineDiskSnapshotDeleteGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskSnapshotRevert(grpc::ServerContext* context,
                                                       const one::vm::DiskSnapshotRevertRequest* request,
                                                       one::ResponseID* response)
{
    return VirtualMachineDiskSnapshotRevertGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskSnapshotRename(grpc::ServerContext* context,
                                                       const one::vm::DiskSnapshotRenameRequest* request,
                                                       one::ResponseID* response)
{
    return VirtualMachineDiskSnapshotRenameGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskAttach(grpc::ServerContext* context,
                                               const one::vm::DiskAttachRequest* request,
                                               one::ResponseID* response)
{
    return VirtualMachineDiskAttachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskDetach(grpc::ServerContext* context,
                                               const one::vm::DiskDetachRequest* request,
                                               one::ResponseID* response)
{
    return VirtualMachineDiskDetachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::DiskResize(grpc::ServerContext* context,
                                               const one::vm::DiskResizeRequest* request,
                                               one::ResponseID* response)
{
    return VirtualMachineDiskResizeGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::NicAttach(grpc::ServerContext* context,
                                              const one::vm::NicAttachRequest* request,
                                              one::ResponseID* response)
{
    return VirtualMachineNicAttachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::NicDetach(grpc::ServerContext* context,
                                              const one::vm::NicDetachRequest* request,
                                              one::ResponseID* response)
{
    return VirtualMachineNicDetachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::NicUpdate(grpc::ServerContext* context,
                                              const one::vm::NicUpdateRequest* request,
                                              one::ResponseID* response)
{
    return VirtualMachineNicUpdateGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SGAttach(grpc::ServerContext* context,
                                             const one::vm::SGAttachRequest* request,
                                             one::ResponseID* response)
{
    return VirtualMachineSGAttachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SGDetach(grpc::ServerContext* context,
                                             const one::vm::SGDetachRequest* request,
                                             one::ResponseID* response)
{
    return VirtualMachineSGDetachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SnapshotCreate(grpc::ServerContext* context,
                                                   const one::vm::SnapshotCreateRequest* request,
                                                   one::ResponseID* response)
{
    return VirtualMachineSnapshotCreateGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SnapshotDelete(grpc::ServerContext* context,
                                                   const one::vm::SnapshotDeleteRequest* request,
                                                   one::ResponseID* response)
{
    return VirtualMachineSnapshotDeleteGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SnapshotRevert(grpc::ServerContext* context,
                                                   const one::vm::SnapshotRevertRequest* request,
                                                   one::ResponseID* response)
{
    return VirtualMachineSnapshotRevertGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Resize(grpc::ServerContext* context,
                                           const one::vm::ResizeRequest* request,
                                           one::ResponseID* response)
{
    return VirtualMachineResizeGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::UpdateConf(grpc::ServerContext* context,
                                               const one::vm::UpdateConfRequest* request,
                                               one::ResponseID* response)
{
    return VirtualMachineUpdateConfGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Recover(grpc::ServerContext* context,
                                            const one::vm::RecoverRequest* request,
                                            one::ResponseID* response)
{
    return VirtualMachineRecoverGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Monitoring(grpc::ServerContext* context,
                                               const one::vm::MonitoringRequest* request,
                                               one::ResponseXML* response)
{
    return VirtualMachineMonitoringGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SchedAdd(grpc::ServerContext* context,
                                             const one::vm::SchedAddRequest* request,
                                             one::ResponseID* response)
{
    return VirtualMachineSchedAddGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SchedUpdate(grpc::ServerContext* context,
                                                const one::vm::SchedUpdateRequest* request,
                                                one::ResponseID* response)
{
    return VirtualMachineSchedUpdateGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::SchedDelete(grpc::ServerContext* context,
                                                const one::vm::SchedDeleteRequest* request,
                                                one::ResponseID* response)
{
    return VirtualMachineSchedDeleteGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Backup(grpc::ServerContext* context,
                                           const one::vm::BackupRequest* request,
                                           one::ResponseID* response)
{
    return VirtualMachineBackupGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::BackupCancel(grpc::ServerContext* context,
                                                 const one::vm::BackupCancelRequest* request,
                                                 one::ResponseID* response)
{
    return VirtualMachineBackupCancelGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Restore(grpc::ServerContext* context,
                                            const one::vm::RestoreRequest* request,
                                            one::ResponseID* response)
{
    return VirtualMachineRestoreGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::PciAttach(grpc::ServerContext* context,
                                              const one::vm::PciAttachRequest* request,
                                              one::ResponseID* response)
{
    return VirtualMachinePciAttachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::PciDetach(grpc::ServerContext* context,
                                              const one::vm::PciDetachRequest* request,
                                              one::ResponseID* response)
{
    return VirtualMachinePciDetachGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::Exec(grpc::ServerContext* context,
                                         const one::vm::ExecRequest* request,
                                         one::ResponseID* response)
{
    return VirtualMachineExecGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::ExecRetry(grpc::ServerContext* context,
                                              const one::vm::ExecRetryRequest* request,
                                              one::ResponseID* response)
{
    return VirtualMachineExecRetryGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::ExecCancel(grpc::ServerContext* context,
                                               const one::vm::ExecCancelRequest* request,
                                               one::ResponseID* response)
{
    return VirtualMachineExecCancelGRPC().execute(context, request, response);
}

grpc::Status VirtualMachineService::PoolInfo(grpc::ServerContext* context,
                                             const one::vm::PoolInfoRequest* request,
                                             one::ResponseXML* response)
{
    return VirtualMachinePoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */

grpc::Status VirtualMachineService::PoolInfoExtended(grpc::ServerContext* context,
                                                     const one::vm::PoolInfoRequest* request,
                                                     one::ResponseXML* response)
{
    return VirtualMachinePoolInfoExtendedGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */

grpc::Status VirtualMachineService::PoolInfoSet(grpc::ServerContext* context,
                                                const one::vm::PoolInfoSetRequest* request,
                                                one::ResponseXML* response)
{
    return VirtualMachinePoolInfoSetGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */

grpc::Status VirtualMachineService::PoolMonitoring(grpc::ServerContext* context,
                                                   const one::vm::PoolMonitoringRequest* request,
                                                   one::ResponseXML* response)
{
    return VirtualMachinePoolMonitoringGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */

grpc::Status VirtualMachineService::PoolAccounting(grpc::ServerContext* context,
                                                   const one::vm::PoolAccountingRequest* request,
                                                   one::ResponseXML* response)
{
    return VirtualMachinePoolAccountingGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */

grpc::Status VirtualMachineService::PoolShowback(grpc::ServerContext* context,
                                                 const one::vm::PoolShowbackRequest* request,
                                                 one::ResponseXML* response)
{
    return VirtualMachinePoolShowbackListGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */

grpc::Status VirtualMachineService::PoolCalculateShowback(grpc::ServerContext* context,
                                                          const one::vm::PoolCalculateShowbackRequest* request,
                                                          one::ResponseXML* response)
{
    return VirtualMachinePoolShowbackCalculateGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachineAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       request->hold(),
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::ChmodRequest*>(_request);

    int oid = request->oid();

    auto ec = chmod(oid,
                    request->user_use(),
                    request->user_manage(),
                    request->user_admin(),
                    request->group_use(),
                    request->group_manage(),
                    request->group_admin(),
                    request->other_use(),
                    request->other_manage(),
                    request->other_admin(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineChownGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineLockGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid,
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDeployGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DeployRequest*>(_request);

    int oid = request->oid();

    auto ec = deploy(oid,
                     request->hid(),
                     request->no_overcommit(),
                     request->ds_id(),
                     request->nic_template(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineActionGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::ActionRequest*>(_request);

    int oid = request->oid();

    auto ec = action(oid,
                     request->action_name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineMigrateGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::MigrateRequest*>(_request);

    int oid = request->oid();

    auto ec = migrate(oid,
                      request->hid(),
                      request->live(),
                      request->no_overcommit(),
                      request->ds_id(),
                      request->migration_type(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskSaveAsGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskSaveAsRequest*>(_request);

    int image_id = -1;

    auto ec = disk_save_as(request->oid(),
                           request->disk_id(),
                           request->name(),
                           request->image_type(),
                           request->snap_id(),
                           image_id,
                           att);

    response(ec, image_id, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotCreateGRPC::request_execute(const google::protobuf::Message* _request,
                                                           google::protobuf::Message*       _response,
                                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskSnapshotCreateRequest*>(_request);

    int snap_id = -1;

    auto ec = disk_snapshot_create(request->oid(),
                                   request->disk_id(),
                                   request->name(),
                                   snap_id,
                                   att);

    response(ec, snap_id, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                                           google::protobuf::Message*       _response,
                                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskSnapshotDeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = disk_snapshot_delete(oid,
                                   request->disk_id(),
                                   request->snap_id(),
                                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotRevertGRPC::request_execute(const google::protobuf::Message* _request,
                                                           google::protobuf::Message*       _response,
                                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskSnapshotRevertRequest*>(_request);

    int oid = request->oid();

    auto ec = disk_snapshot_revert(oid,
                                   request->disk_id(),
                                   request->snap_id(),
                                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                                           google::protobuf::Message*       _response,
                                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskSnapshotRenameRequest*>(_request);

    int oid = request->oid();

    auto ec = disk_snapshot_rename(oid,
                                   request->disk_id(),
                                   request->snap_id(),
                                   request->name(),
                                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskAttachGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskAttachRequest*>(_request);

    int oid = request->oid();

    auto ec = disk_attach(oid,
                          request->template_(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskDetachGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskDetachRequest*>(_request);

    int oid = request->oid();

    auto ec = disk_detach(oid,
                          request->disk_id(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineDiskResizeGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::DiskResizeRequest*>(_request);

    int oid = request->oid();

    auto ec = disk_resize(oid,
                          request->disk_id(),
                          request->size(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineNicAttachGRPC::request_execute(const google::protobuf::Message* _request,
                                                  google::protobuf::Message*       _response,
                                                  RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::NicAttachRequest*>(_request);

    int oid = request->oid();

    auto ec = nic_attach(oid,
                         request->template_(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineNicDetachGRPC::request_execute(const google::protobuf::Message* _request,
                                                  google::protobuf::Message*       _response,
                                                  RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::NicDetachRequest*>(_request);

    int oid = request->oid();

    auto ec = nic_detach(oid,
                         request->nic_id(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineNicUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                                  google::protobuf::Message*       _response,
                                                  RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::NicUpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = nic_update(oid,
                         request->nic_id(),
                         request->template_(),
                         request->append(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSGAttachGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SGAttachRequest*>(_request);

    int oid = request->oid();

    auto ec = sg_attach(oid,
                        request->nic_id(),
                        request->sg_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSGDetachGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SGDetachRequest*>(_request);

    int oid = request->oid();

    auto ec = sg_detach(oid,
                        request->nic_id(),
                        request->sg_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSnapshotCreateGRPC::request_execute(const google::protobuf::Message* _request,
                                                       google::protobuf::Message*       _response,
                                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SnapshotCreateRequest*>(_request);

    int snap_id = -1;

    auto ec = snapshot_create(request->oid(),
                              request->name(),
                              snap_id,
                              att);

    response(ec, snap_id, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSnapshotDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                                       google::protobuf::Message*       _response,
                                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SnapshotDeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = snapshot_delete(oid,
                              request->snap_id(),
                              att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSnapshotRevertGRPC::request_execute(const google::protobuf::Message* _request,
                                                       google::protobuf::Message*       _response,
                                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SnapshotRevertRequest*>(_request);

    int oid = request->oid();

    auto ec = snapshot_revert(oid,
                              request->snap_id(),
                              att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineResizeGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::ResizeRequest*>(_request);

    int oid = request->oid();

    auto ec = resize(oid,
                     request->template_(),
                     request->no_overcommit(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineUpdateConfGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::UpdateConfRequest*>(_request);

    int oid = request->oid();

    auto ec = update_conf(oid,
                          request->template_(),
                          request->append(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineRecoverGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::RecoverRequest*>(_request);

    int oid = request->oid();

    auto ec = recover(oid,
                      request->operation(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineMonitoringGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::MonitoringRequest*>(_request);

    std::string xml;

    auto ec = monitoring(request->oid(),
                         xml,
                         att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSchedAddGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SchedAddRequest*>(_request);

    int sched_id = -1;

    auto ec = sched_add(request->oid(),
                        request->template_(),
                        sched_id,
                        att);

    response(ec, sched_id, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSchedUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                                    google::protobuf::Message*       _response,
                                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SchedUpdateRequest*>(_request);

    int sched_id = request->sched_id();

    auto ec = sched_update(request->oid(),
                           sched_id,
                           request->template_(),
                           att);

    response(ec, sched_id, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineSchedDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                                    google::protobuf::Message*       _response,
                                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::SchedDeleteRequest*>(_request);

    int sched_id = request->sched_id();

    auto ec = sched_delete(request->oid(),
                           sched_id,
                           att);

    response(ec, sched_id, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineBackupGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::BackupRequest*>(_request);

    int oid = request->oid();

    auto ec = backup(oid,
                     request->ds_id(),
                     request->reset(),
                     -1,
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineBackupCancelGRPC::request_execute(const google::protobuf::Message* _request,
                                                     google::protobuf::Message*       _response,
                                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::BackupCancelRequest*>(_request);

    int oid = request->oid();

    auto ec = backup_cancel(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineRestoreGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::RestoreRequest*>(_request);

    int oid = request->oid();

    auto ec = restore(oid,
                      request->image_id(),
                      request->increment_id(),
                      request->disk_id(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePciAttachGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PciAttachRequest*>(_request);

    int oid = request->oid();

    auto ec = pci_attach(oid,
                         request->template_(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePciDetachGRPC::request_execute(const google::protobuf::Message* _request,
                                                  google::protobuf::Message*       _response,
                                                  RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PciDetachRequest*>(_request);

    int oid = request->oid();

    auto ec = pci_detach(oid,
                         request->pci_id(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineExecGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::ExecRequest*>(_request);

    int oid = request->oid();

    auto ec = exec(oid,
                   request->cmd(),
                   request->cmd_stdin(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineExecRetryGRPC::request_execute(const google::protobuf::Message* _request,
                                                  google::protobuf::Message*       _response,
                                                  RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::ExecRetryRequest*>(_request);

    int oid = request->oid();

    auto ec = exec_retry(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachineExecCancelGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::ExecCancelRequest*>(_request);

    int oid = request->oid();

    auto ec = exec_cancel(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   request->state(),
                   request->filter(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePoolInfoExtendedGRPC::request_execute(const google::protobuf::Message* _request,
                                                         google::protobuf::Message*       _response,
                                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info_extended(request->filter_flag(),
                            request->start(),
                            request->end(),
                            request->state(),
                            request->filter(),
                            xml,
                            att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePoolInfoSetGRPC::request_execute(const google::protobuf::Message* _request,
                                                    google::protobuf::Message*       _response,
                                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PoolInfoSetRequest*>(_request);

    std::string xml;

    auto ec = info_set(request->ids(),
                       request->extended(),
                       xml,
                       att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePoolAccountingGRPC::request_execute(const google::protobuf::Message* _request,
                                                       google::protobuf::Message*       _response,
                                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PoolAccountingRequest*>(_request);

    std::string xml;

    auto ec = accounting(request->filter_flag(),
                         request->start_time(),
                         request->end_time(),
                         xml,
                         att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePoolMonitoringGRPC::request_execute(const google::protobuf::Message* _request,
                                                       google::protobuf::Message*       _response,
                                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PoolMonitoringRequest*>(_request);

    std::string xml;

    auto ec = monitoring(request->filter_flag(),
                         request->seconds(),
                         xml,
                         att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePoolShowbackCalculateGRPC::request_execute(const google::protobuf::Message* _request,
                                                              google::protobuf::Message*       _response,
                                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PoolCalculateShowbackRequest*>(_request);

    auto ec = showback_calc(request->start_month(),
                            request->start_year(),
                            request->end_month(),
                            request->end_year(),
                            att);

    response(ec, "", att);
}

/* ------------------------------------------------------------------------- */

void VirtualMachinePoolShowbackListGRPC::request_execute(const google::protobuf::Message* _request,
                                                         google::protobuf::Message*       _response,
                                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vm::PoolShowbackRequest*>(_request);

    std::string xml;

    auto ec = showback_list(request->filter_flag(),
                            request->start_month(),
                            request->start_year(),
                            request->end_month(),
                            request->end_year(),
                            xml,
                            att);

    response(ec, xml, att);
}

