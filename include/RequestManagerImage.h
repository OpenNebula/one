/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_IMAGE_H
#define REQUEST_MANAGER_IMAGE_H

#include "Request.h"
#include "Nebula.h"
#include "ImagePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerImage: public Request
{
protected:
    RequestManagerImage(const std::string& method_name,
                        const std::string& help,
                        const std::string& params)
        :Request(method_name, params, help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();

        auth_object = PoolObjectSQL::IMAGE;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerImage() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageEnable : public RequestManagerImage
{
public:
    ImageEnable():
        RequestManagerImage("one.image.enable", "Enables or disables an image",
                            "A:sib") {};

    ~ImageEnable() {};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePersistent : public RequestManagerImage
{
public:
    ImagePersistent():
        RequestManagerImage("one.image.persistent",
                            "Makes an image persistent or non-persistent",
                            "A:sib") {};

    ~ImagePersistent() {};

    ErrorCode request_execute(int id, bool persis_flag, RequestAttributes& att);

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChangeType : public RequestManagerImage
{
public:
    ImageChangeType():
        RequestManagerImage("one.image.chtype", "Changes the type of an image",
                            "A:sis") {};

    ~ImageChangeType() {};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageClone : public RequestManagerImage
{
public:
    ImageClone():
        RequestManagerImage("one.image.clone", "Clones an existing image", "A:sis")
    {
        auth_op = AuthRequest::USE;
    };

    ~ImageClone() {};

    ErrorCode request_execute(int clone_id, const std::string &name, int ds_id,
                              bool persistent, int &new_id, RequestAttributes& att);

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotRevert : public RequestManagerImage
{
public:
    ImageSnapshotRevert():
        RequestManagerImage("one.image.snapshotrevert",
                            "Reverts image state to a previous snapshot", "A:sii") {};

    ~ImageSnapshotRevert() {};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotFlatten : public RequestManagerImage
{
public:
    ImageSnapshotFlatten():
        RequestManagerImage("one.image.snapshotflatten",
                            "Flattens the selected image snapshot", "A:sii") {};

    ~ImageSnapshotFlatten() {};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotDelete : public RequestManagerImage
{
public:
    ImageSnapshotDelete():
        RequestManagerImage("one.image.snapshotdelete",
                            "Deletes a snapshot from image", "A:sii") {};

    ~ImageSnapshotDelete() {};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageRestore : public RequestManagerImage
{
public:
    ImageRestore():
        RequestManagerImage("one.image.restore",
                            "Restores a VM backup", "A:siis")
    {
        auth_op = AuthRequest::USE;
    };

    ~ImageRestore() {};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
