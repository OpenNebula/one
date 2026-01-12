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

#include "ImageServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status ImageService::Allocate(grpc::ServerContext* context,
                                    const one::image::AllocateRequest* request,
                                    one::ResponseID* response)
{
    return ImageAllocateGRPC().execute(context, request, response);
}

grpc::Status ImageService::Delete(grpc::ServerContext* context,
                                  const one::image::DeleteRequest* request,
                                  one::ResponseID* response)
{
    return ImageDeleteGRPC().execute(context, request, response);
}

grpc::Status ImageService::Info(grpc::ServerContext* context,
                                const one::image::InfoRequest* request,
                                one::ResponseXML* response)
{
    return ImageInfoGRPC().execute(context, request, response);
}

grpc::Status ImageService::Update(grpc::ServerContext* context,
                                  const one::image::UpdateRequest* request,
                                  one::ResponseID* response)
{
    return ImageUpdateGRPC().execute(context, request, response);
}

grpc::Status ImageService::Rename(grpc::ServerContext* context,
                                  const one::image::RenameRequest* request,
                                  one::ResponseID* response)
{
    return ImageRenameGRPC().execute(context, request, response);
}

grpc::Status ImageService::Chmod(grpc::ServerContext* context,
                                 const one::image::ChmodRequest* request,
                                 one::ResponseID* response)
{
    return ImageChmodGRPC().execute(context, request, response);
}

grpc::Status ImageService::Chown(grpc::ServerContext* context,
                                 const one::image::ChownRequest* request,
                                 one::ResponseID* response)
{
    return ImageChownGRPC().execute(context, request, response);
}

grpc::Status ImageService::Lock(grpc::ServerContext* context,
                                const one::image::LockRequest* request,
                                one::ResponseID* response)
{
    return ImageLockGRPC().execute(context, request, response);
}

grpc::Status ImageService::Unlock(grpc::ServerContext* context,
                                  const one::image::UnlockRequest* request,
                                  one::ResponseID* response)
{
    return ImageUnlockGRPC().execute(context, request, response);
}

grpc::Status ImageService::Clone(grpc::ServerContext* context,
                                 const one::image::CloneRequest* request,
                                 one::ResponseID* response)
{
    return ImageCloneGRPC().execute(context, request, response);
}

grpc::Status ImageService::Enable(grpc::ServerContext* context,
                                  const one::image::EnableRequest* request,
                                  one::ResponseID* response)
{
    return ImageEnableGRPC().execute(context, request, response);
}

grpc::Status ImageService::Persistent(grpc::ServerContext* context,
                                      const one::image::PersistentRequest* request,
                                      one::ResponseID* response)
{
    return ImagePersistentGRPC().execute(context, request, response);
}

grpc::Status ImageService::Chtype(grpc::ServerContext* context,
                                  const one::image::ChtypeRequest* request,
                                  one::ResponseID* response)
{
    return ImageChtypeGRPC().execute(context, request, response);
}

grpc::Status ImageService::SnapshotDelete(grpc::ServerContext* context,
                                          const one::image::SnapshotDeleteRequest* request,
                                          one::ResponseID* response)
{
    return ImageSnapshotDeleteGRPC().execute(context, request, response);
}

grpc::Status ImageService::SnapshotRevert(grpc::ServerContext* context,
                                          const one::image::SnapshotRevertRequest* request,
                                          one::ResponseID* response)
{
    return ImageSnapshotRevertGRPC().execute(context, request, response);
}

grpc::Status ImageService::SnapshotFlatten(grpc::ServerContext* context,
                                           const one::image::SnapshotFlattenRequest* request,
                                           one::ResponseID* response)
{
    return ImageSnapshotFlattenGRPC().execute(context, request, response);
}

grpc::Status ImageService::Restore(grpc::ServerContext* context,
                                   const one::image::RestoreRequest* request,
                                   one::ResponseXML* response)
{
    return ImageRestoreGRPC().execute(context, request, response);
}

grpc::Status ImageService::PoolInfo(grpc::ServerContext* context,
                                    const one::image::PoolInfoRequest* request,
                                    one::ResponseXML* response)
{
    return ImagePoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       request->ds_id(),
                       request->skip_capacity_check(),
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del_image(oid,
                        request->force(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void ImageUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::ChmodRequest*>(_request);

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

void ImageChownGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageLockGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid,
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageCloneGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::CloneRequest*>(_request);

    int new_id = -1;

    auto ec = clone(request->oid(),
                    request->name(),
                    request->ds_id(),
                    false,
                    new_id,
                    att);

    response(ec, new_id, att);
}

/* ------------------------------------------------------------------------- */

void ImageEnableGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::EnableRequest*>(_request);

    int oid = request->oid();

    auto ec = enable(oid,
                     request->enable(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImagePersistentGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::PersistentRequest*>(_request);

    int oid = request->oid();

    auto ec = persistent(oid,
                         request->persistent(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageChtypeGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::ChtypeRequest*>(_request);

    int oid = request->oid();

    auto ec = change_type(oid,
                          request->type(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageSnapshotDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::SnapshotDeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = snapshot_delete(oid,
                              request->snapshot_id(),
                              att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageSnapshotRevertGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::SnapshotRevertRequest*>(_request);

    int oid = request->oid();

    auto ec = snapshot_revert(oid,
                              request->snapshot_id(),
                              att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageSnapshotFlattenGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::SnapshotFlattenRequest*>(_request);

    int oid = request->oid();

    auto ec = snapshot_flatten(oid,
                               request->snapshot_id(),
                               att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ImageRestoreGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::RestoreRequest*>(_request);

    auto ec = restore(request->oid(),
                      request->ds_id(),
                      request->opt_tmpl(),
                      att);

    response(ec, att.resp_msg, att);
}

/* ------------------------------------------------------------------------- */

void ImagePoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::image::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}
