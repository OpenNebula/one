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

#ifndef IMAGE_API_H
#define IMAGE_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "ImagePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageAPI : public SharedAPI
{
public:
    ImageAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::IMAGE);
        request.auth_op(AuthRequest::MANAGE);

        ipool = Nebula::instance().get_ipool();
        pool = ipool;
    }

    Request::ErrorCode del_image(int oid,
                                 bool force,
                                 RequestAttributes& att);

    Request::ErrorCode clone(int source_id,
                             const std::string& name,
                             int ds_id,
                             bool persistent,
                             int &new_id,
                             RequestAttributes& att);

protected:
    /* API calls */
    Request::ErrorCode del(int oid,
                           bool recursive,
                           RequestAttributes& att) = delete;

    Request::ErrorCode enable(int oid,
                              bool enable_flag,
                              RequestAttributes& att);

    Request::ErrorCode persistent(int oid,
                                  bool persistent_flag,
                                  RequestAttributes& att);

    Request::ErrorCode change_type(int oid,
                                   std::string type,
                                   RequestAttributes& att);

    Request::ErrorCode snapshot_delete(int oid,
                                       int snap_id,
                                       RequestAttributes& att);

    Request::ErrorCode snapshot_revert(int oid,
                                       int snap_id,
                                       RequestAttributes& att);

    Request::ErrorCode snapshot_flatten(int oid,
                                        int snap_id,
                                        RequestAttributes& att);

    Request::ErrorCode restore(int oid,
                               int ds_id,
                               const std::string& opt_tmpl,
                               RequestAttributes& att);

    /* Helpers */
    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    ImagePool* ipool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ImageAllocateAPI : public ImageAPI
{
protected:
    ImageAllocateAPI(Request &r)
        : ImageAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& str_tmpl,
                                int ds_id,
                                bool skip_capacity_check,
                                int& oid,
                                RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ImageInfoAPI : public ImageAPI
{
protected:
    ImageInfoAPI(Request &r)
        : ImageAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
