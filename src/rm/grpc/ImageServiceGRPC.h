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

#ifndef IMAGE_GRPC_H
#define IMAGE_GRPC_H

#include "RequestGRPC.h"
#include "ImageAPI.h"
#include "ImagePoolAPI.h"

#include "image.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageService final : public one::image::ImageService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::image::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::image::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::image::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::image::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::image::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::image::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::image::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::image::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::image::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Clone(grpc::ServerContext* context,
                       const one::image::CloneRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Enable(grpc::ServerContext* context,
                        const one::image::EnableRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Persistent(grpc::ServerContext* context,
                            const one::image::PersistentRequest* request,
                            one::ResponseID* response) override;

    grpc::Status Chtype(grpc::ServerContext* context,
                        const one::image::ChtypeRequest* request,
                        one::ResponseID* response) override;

    grpc::Status SnapshotDelete(grpc::ServerContext* context,
                                const one::image::SnapshotDeleteRequest* request,
                                one::ResponseID* response) override;

    grpc::Status SnapshotRevert(grpc::ServerContext* context,
                                const one::image::SnapshotRevertRequest* request,
                                one::ResponseID* response) override;

    grpc::Status SnapshotFlatten(grpc::ServerContext* context,
                                 const one::image::SnapshotFlattenRequest* request,
                                 one::ResponseID* response) override;

    grpc::Status Resize(grpc::ServerContext* context,
                        const one::image::ResizeRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Restore(grpc::ServerContext* context,
                         const one::image::RestoreRequest* request,
                         one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::image::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageAllocateGRPC : public RequestGRPC, public ImageAllocateAPI
{
public:
    ImageAllocateGRPC() :
        RequestGRPC("one.image.allocate", "/one.image.ImageService/Allocate"),
        ImageAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageDeleteGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageDeleteGRPC() :
        RequestGRPC("one.image.delete", "/one.image.ImageService/Delete"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageInfoGRPC : public RequestGRPC, public ImageInfoAPI
{
public:
    ImageInfoGRPC() :
        RequestGRPC("one.image.info", "/one.image.ImageService/Info"),
        ImageInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageUpdateGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageUpdateGRPC() :
        RequestGRPC("one.image.update", "/one.image.ImageService/Update"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageRenameGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageRenameGRPC() :
        RequestGRPC("one.image.rename", "/one.image.ImageService/Rename"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageChmodGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageChmodGRPC() :
        RequestGRPC("one.image.chmod", "/one.image.ImageService/Chmod"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageChownGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageChownGRPC() :
        RequestGRPC("one.image.chown", "/one.image.ImageService/Chown"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageLockGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageLockGRPC() :
        RequestGRPC("one.image.lock", "/one.image.ImageService/Lock"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageUnlockGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageUnlockGRPC() :
        RequestGRPC("one.image.unlock", "/one.image.ImageService/Unlock"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageCloneGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageCloneGRPC() :
        RequestGRPC("one.image.clone", "/one.image.ImageService/Clone"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageEnableGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageEnableGRPC() :
        RequestGRPC("one.image.enable", "/one.image.ImageService/Enable"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImagePersistentGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImagePersistentGRPC() :
        RequestGRPC("one.image.persistent", "/one.image.ImageService/Persistent"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageChtypeGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageChtypeGRPC() :
        RequestGRPC("one.image.chtype", "/one.image.ImageService/Chtype"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageSnapshotDeleteGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageSnapshotDeleteGRPC() :
        RequestGRPC("one.image.snapshotdelete", "/one.image.ImageService/SnapshotDelete"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageSnapshotRevertGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageSnapshotRevertGRPC() :
        RequestGRPC("one.image.snapshotrevert", "/one.image.ImageService/SnapshotRevert"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageSnapshotFlattenGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageSnapshotFlattenGRPC() :
        RequestGRPC("one.image.snapshotflatten", "/one.image.ImageService/SnapshotFlatten"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageResizeGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageResizeGRPC() :
        RequestGRPC("one.image.resize", "/one.image.ImageService/Resize"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ImageRestoreGRPC : public RequestGRPC, public ImageAPI
{
public:
    ImageRestoreGRPC() :
        RequestGRPC("one.image.restore", "/one.image.ImageService/Restore"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePoolInfoGRPC : public RequestGRPC, public ImagePoolAPI
{
public:
    ImagePoolInfoGRPC() :
        RequestGRPC("one.imagepool.info", "/one.image.ImageService/PoolInfo"),
        ImagePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
