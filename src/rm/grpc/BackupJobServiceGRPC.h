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

#ifndef BACKUPJOB_GRPC_H
#define BACKUPJOB_GRPC_H

#include "RequestGRPC.h"
#include "BackupJobAPI.h"
#include "BackupJobPoolAPI.h"

#include "backupjob.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class BackupJobService final : public one::backupjob::BackupJobService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::backupjob::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::backupjob::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::backupjob::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::backupjob::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::backupjob::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::backupjob::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::backupjob::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::backupjob::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Backup(grpc::ServerContext* context,
                        const one::backupjob::BackupRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Cancel(grpc::ServerContext* context,
                        const one::backupjob::CancelRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Retry(grpc::ServerContext* context,
                       const one::backupjob::RetryRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Priority(grpc::ServerContext* context,
                          const one::backupjob::PriorityRequest* request,
                          one::ResponseID* response) override;

    grpc::Status SchedAdd(grpc::ServerContext* context,
                          const one::backupjob::SchedAddRequest* request,
                          one::ResponseID* response) override;

    grpc::Status SchedDel(grpc::ServerContext* context,
                          const one::backupjob::SchedDelRequest* request,
                          one::ResponseID* response) override;

    grpc::Status SchedUpdate(grpc::ServerContext* context,
                             const one::backupjob::SchedUpdateRequest* request,
                             one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::backupjob::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::backupjob::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class BackupJobAllocateGRPC : public RequestGRPC, public BackupJobAllocateAPI
{
public:
    BackupJobAllocateGRPC() :
        RequestGRPC("one.backupjob.allocate", "/one.backupjob.BackupJobService/Allocate"),
        BackupJobAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobDeleteGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobDeleteGRPC() :
        RequestGRPC("one.backupjob.delete", "/one.backupjob.BackupJobService/Delete"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobUpdateGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobUpdateGRPC() :
        RequestGRPC("one.backupjob.update", "/one.backupjob.BackupJobService/Update"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobRenameGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobRenameGRPC() :
        RequestGRPC("one.backupjob.rename", "/one.backupjob.BackupJobService/Rename"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobChmodGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobChmodGRPC() :
        RequestGRPC("one.backupjob.chmod", "/one.backupjob.BackupJobService/Chmod"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobChownGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobChownGRPC() :
        RequestGRPC("one.backupjob.chown", "/one.backupjob.BackupJobService/Chown"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobLockGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobLockGRPC() :
        RequestGRPC("one.backupjob.lock", "/one.backupjob.BackupJobService/Lock"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobUnlockGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobUnlockGRPC() :
        RequestGRPC("one.backupjob.unlock", "/one.backupjob.BackupJobService/Unlock"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobBackupGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobBackupGRPC() :
        RequestGRPC("one.backupjob.backup", "/one.backupjob.BackupJobService/Backup"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobCancelGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobCancelGRPC() :
        RequestGRPC("one.backupjob.cancel", "/one.backupjob.BackupJobService/Cancel"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobRetryGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobRetryGRPC() :
        RequestGRPC("one.backupjob.retry", "/one.backupjob.BackupJobService/Retry"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobPriorityGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobPriorityGRPC() :
        RequestGRPC("one.backupjob.priority", "/one.backupjob.BackupJobService/Priority"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobSchedAddGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobSchedAddGRPC() :
        RequestGRPC("one.backupjob.schedadd", "/one.backupjob.BackupJobService/SchedAdd"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobSchedDelGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobSchedDelGRPC() :
        RequestGRPC("one.backupjob.scheddelete", "/one.backupjob.BackupJobService/SchedDel"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobSchedUpdateGRPC : public RequestGRPC, public BackupJobAPI
{
public:
    BackupJobSchedUpdateGRPC() :
        RequestGRPC("one.backupjob.schedupdate", "/one.backupjob.BackupJobService/SchedUpdate"),
        BackupJobAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class BackupJobInfoGRPC : public RequestGRPC, public BackupJobInfoAPI
{
public:
    BackupJobInfoGRPC() :
        RequestGRPC("one.backupjob.info", "/one.backupjob.BackupJobService/Info"),
        BackupJobInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobPoolInfoGRPC : public RequestGRPC, public BackupJobPoolAPI
{
public:
    BackupJobPoolInfoGRPC() :
        RequestGRPC("one.backupjobpool.info", "/one.backupjob.BackupJobService/PoolInfo"),
        BackupJobPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
