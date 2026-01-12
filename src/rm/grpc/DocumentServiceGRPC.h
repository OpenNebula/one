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

#ifndef DOCUMENT_GRPC_H
#define DOCUMENT_GRPC_H

#include "RequestGRPC.h"
#include "DocumentAPI.h"
#include "DocumentPoolAPI.h"

#include "document.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentService final : public one::document::DocumentService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::document::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::document::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::document::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::document::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::document::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::document::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::document::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::document::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Clone(grpc::ServerContext* context,
                       const one::document::CloneRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::document::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::document::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentAllocateGRPC : public RequestGRPC, public DocumentAllocateAPI
{
public:
    DocumentAllocateGRPC() :
        RequestGRPC("one.document.allocate", "/one.document.DocumentService/Allocate"),
        DocumentAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentDeleteGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentDeleteGRPC() :
        RequestGRPC("one.document.delete", "/one.document.DocumentService/Delete"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentUpdateGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentUpdateGRPC() :
        RequestGRPC("one.document.update", "/one.document.DocumentService/Update"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentRenameGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentRenameGRPC() :
        RequestGRPC("one.document.rename", "/one.document.DocumentService/Rename"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentChmodGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentChmodGRPC() :
        RequestGRPC("one.document.chmod", "/one.document.DocumentService/Chmod"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentChownGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentChownGRPC() :
        RequestGRPC("one.document.chown", "/one.document.DocumentService/Chown"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentLockGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentLockGRPC() :
        RequestGRPC("one.document.lock", "/one.document.DocumentService/Lock"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentUnlockGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentUnlockGRPC() :
        RequestGRPC("one.document.unlock", "/one.document.DocumentService/Unlock"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentCloneGRPC : public RequestGRPC, public DocumentAPI
{
public:
    DocumentCloneGRPC() :
        RequestGRPC("one.document.clone", "/one.document.DocumentService/Clone"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DocumentInfoGRPC : public RequestGRPC, public DocumentInfoAPI
{
public:
    DocumentInfoGRPC() :
        RequestGRPC("one.document.info", "/one.document.DocumentService/Info"),
        DocumentInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class DocumentPoolInfoGRPC : public RequestGRPC, public DocumentPoolAPI
{
public:
    DocumentPoolInfoGRPC() :
        RequestGRPC("one.documentpool.info", "/one.document.DocumentService/PoolInfo"),
        DocumentPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
