
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

#include "BackupJobServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status BackupJobService::Allocate(grpc::ServerContext*              context,
                                        const one::backupjob::AllocateRequest* request,
                                        one::ResponseID*                  response)
{
    return BackupJobAllocateGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Delete(grpc::ServerContext* context,
                                      const one::backupjob::DeleteRequest* request,
                                      one::ResponseID* response)
{
    return BackupJobDeleteGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Update(grpc::ServerContext* context,
                                      const one::backupjob::UpdateRequest* request,
                                      one::ResponseID* response)
{
    return BackupJobUpdateGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Rename(grpc::ServerContext* context,
                                      const one::backupjob::RenameRequest* request,
                                      one::ResponseID* response)
{
    return BackupJobRenameGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Chmod(grpc::ServerContext* context,
                                     const one::backupjob::ChmodRequest* request,
                                     one::ResponseID* response)
{
    return BackupJobChmodGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Chown(grpc::ServerContext* context,
                                     const one::backupjob::ChownRequest* request,
                                     one::ResponseID* response)
{
    return BackupJobChownGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Lock(grpc::ServerContext* context,
                                    const one::backupjob::LockRequest* request,
                                    one::ResponseID* response)
{
    return BackupJobLockGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Unlock(grpc::ServerContext* context,
                                      const one::backupjob::UnlockRequest* request,
                                      one::ResponseID* response)
{
    return BackupJobUnlockGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Backup(grpc::ServerContext* context,
                                      const one::backupjob::BackupRequest* request,
                                      one::ResponseID* response)
{
    return BackupJobBackupGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Cancel(grpc::ServerContext* context,
                                      const one::backupjob::CancelRequest* request,
                                      one::ResponseID* response)
{
    return BackupJobCancelGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Retry(grpc::ServerContext* context,
                                     const one::backupjob::RetryRequest* request,
                                     one::ResponseID* response)
{
    return BackupJobRetryGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Priority(grpc::ServerContext* context,
                                        const one::backupjob::PriorityRequest* request,
                                        one::ResponseID* response)
{
    return BackupJobPriorityGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::SchedAdd(grpc::ServerContext* context,
                                        const one::backupjob::SchedAddRequest* request,
                                        one::ResponseID* response)
{
    return BackupJobSchedAddGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::SchedDel(grpc::ServerContext* context,
                                        const one::backupjob::SchedDelRequest* request,
                                        one::ResponseID* response)
{
    return BackupJobSchedDelGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::SchedUpdate(grpc::ServerContext* context,
                                           const one::backupjob::SchedUpdateRequest* request,
                                           one::ResponseID* response)
{
    return BackupJobSchedUpdateGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::Info(grpc::ServerContext* context,
                                    const one::backupjob::InfoRequest* request,
                                    one::ResponseXML* response)
{
    return BackupJobInfoGRPC().execute(context, request, response);
}

grpc::Status BackupJobService::PoolInfo(grpc::ServerContext* context,
                                        const one::backupjob::PoolInfoRequest* request,
                                        one::ResponseXML* response)
{
    return BackupJobPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


void BackupJobAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::backupjob::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::ChmodRequest*>(_request);

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

void BackupJobChownGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobLockGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobBackupGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::BackupRequest*>(_request);

    int oid = request->oid();

    auto ec = backup(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobCancelGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::CancelRequest*>(_request);

    int oid = request->oid();

    auto ec = cancel(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobRetryGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::RetryRequest*>(_request);

    int oid = request->oid();

    auto ec = retry(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobPriorityGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::PriorityRequest*>(_request);

    int oid = request->oid();

    auto ec = priority(oid,
                       request->priority(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobSchedAddGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::SchedAddRequest*>(_request);

    int sa_id;

    auto ec = sched_add(request->oid(),
                        request->template_(),
                        sa_id,
                        att);

    response(ec, sa_id, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobSchedDelGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::SchedDelRequest*>(_request);

    int sa_id = request->sa_id();

    auto ec = sched_delete(request->oid(),
                           sa_id,
                           att);

    response(ec, sa_id, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobSchedUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::SchedUpdateRequest*>(_request);

    int sa_id = request->sa_id();

    auto ec = sched_update(request->oid(),
                           sa_id,
                           request->template_(),
                           att);

    response(ec, sa_id, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   false,           // decrypt
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void BackupJobPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::backupjob::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(), request->start(), request->end(), xml, att);

    response(ec, xml, att);
}
