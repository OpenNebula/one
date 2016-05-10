/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerImage: public Request
{
protected:
    RequestManagerImage(const string& method_name,
                        const string& help,
                        const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();

        auth_object = PoolObjectSQL::IMAGE;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerImage(){};

    /* --------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageEnable : public RequestManagerImage
{
public:
    ImageEnable():
        RequestManagerImage("ImageEnable", "Enables or disables an image",
                "A:sib"){};

    ~ImageEnable(){};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePersistent : public RequestManagerImage
{
public:
    ImagePersistent():
        RequestManagerImage("ImagePersistent",
                            "Makes an image persistent or non-persistent",
                            "A:sib"){};

    ~ImagePersistent(){};

    ErrorCode request_execute(int id, bool persis_flag, RequestAttributes& att);

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChangeType : public RequestManagerImage
{
public:
    ImageChangeType():
        RequestManagerImage("ImageChangeType", "Changes the type of an image",
                            "A:sis"){};

    ~ImageChangeType(){};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageClone : public RequestManagerImage
{
public:
    ImageClone():
        RequestManagerImage("ImageClone", "Clones an existing image", "A:sis")
    {
        auth_op = AuthRequest::USE;
    };

    ~ImageClone(){};

    ErrorCode request_execute(int clone_id, const string &name, int ds_id,
        int &new_id, RequestAttributes& att);

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotRevert : public RequestManagerImage
{
public:
    ImageSnapshotRevert():
        RequestManagerImage("ImageSnapshotRevert",
                "Reverts image state to a previous snapshot", "A:sii"){};

    ~ImageSnapshotRevert(){};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotFlatten : public RequestManagerImage
{
public:
    ImageSnapshotFlatten():
        RequestManagerImage("ImageSnapshotFlatten",
                "Flattens the selected image snapshot", "A:sii"){};

    ~ImageSnapshotFlatten(){};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotDelete : public RequestManagerImage
{
public:
    ImageSnapshotDelete():
        RequestManagerImage("ImageSnapshotDelete",
                "Deletes a snapshot from image", "A:sii"){};

    ~ImageSnapshotDelete(){};

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
