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

#ifndef IMAGE_XRPC_H
#define IMAGE_XRPC_H

#include "RequestXRPC.h"
#include "ImageAPI.h"
#include "ImagePoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageAllocateXRPC : public RequestXRPC, public ImageAllocateAPI
{
public:
    ImageAllocateXRPC() :
        RequestXRPC("one.image.allocate",
                    "Allocates a new Image",
                    "A:ssib"),
        ImageAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageDeleteXRPC : public RequestXRPC, public ImageAPI
{
public:
    ImageDeleteXRPC() :
        RequestXRPC("one.image.delete",
                    "Deletes a Image",
                    "A:sib"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageInfoXRPC : public RequestXRPC, public ImageInfoAPI
{
public:
    ImageInfoXRPC() :
        RequestXRPC("one.image.info",
                    "Returns Image information",
                    "A:sib"),
        ImageInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageUpdateXRPC : public RequestXRPC, public ImageAPI
{
public:
    ImageUpdateXRPC() :
        RequestXRPC("one.image.update",
                    "Updates a Image",
                    "A:sisi"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageRenameXRPC : public RequestXRPC, public ImageAPI
{
public:
    ImageRenameXRPC() :
        RequestXRPC("one.image.rename",
                    "Renames a Image",
                    "A:sis"),
        ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChmodXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageChmodXRPC()
        : RequestXRPC("one.image.chmod",
                      "Changes permission bits of a Image",
                      "A:siiiiiiiiii")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChownXRPC : public RequestXRPC, public ImageAPI
{
public:
    ImageChownXRPC()
        : RequestXRPC("one.image.chown",
                      "Changes ownership of a Image",
                      "A:siii")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageLockXRPC : public RequestXRPC, public ImageAPI
{
public:
    ImageLockXRPC()
        : RequestXRPC("one.image.lock",
                      "Lock an Image",
                      "A:siib")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageUnlockXRPC : public RequestXRPC, public ImageAPI
{
public:
    ImageUnlockXRPC()
        : RequestXRPC("one.image.unlock",
                      "Unlock an Image",
                      "A:si")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageCloneXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageCloneXRPC()
        : RequestXRPC("one.image.clone",
                      "Clones an existing Image",
                      "A:sisi")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageEnableXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageEnableXRPC()
        : RequestXRPC("one.image.enable",
                      "Enables or disables an Image",
                      "A:sib")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePersistentXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImagePersistentXRPC()
        : RequestXRPC("one.image.persistent",
                      "Makes an image persistent or non-persistent",
                      "A:sib")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChtypeXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageChtypeXRPC()
        : RequestXRPC("one.image.chtype",
                      "Changes the type of an Image",
                      "A:sis")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotDeleteXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageSnapshotDeleteXRPC()
        : RequestXRPC("one.image.snapshotdelete",
                      "Deletes a snapshot from an Image",
                      "A:sii")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotRevertXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageSnapshotRevertXRPC()
        : RequestXRPC("one.image.snapshotrevert",
                      "Reverts Image to a previous snapshot",
                      "A:sii")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageSnapshotFlattenXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageSnapshotFlattenXRPC()
        : RequestXRPC("one.image.snapshotflatten",
                      "Flattens the selected Image snapshot",
                      "A:sii")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageResizeXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageResizeXRPC()
        : RequestXRPC("one.image.resize",
                      "Resizes an Image",
                      "A:sis")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageRestoreXRPC: public RequestXRPC, public ImageAPI
{
public:
    ImageRestoreXRPC()
        : RequestXRPC("one.image.restore",
                      "Restores a VM backup",
                      "A:siis")
        , ImageAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImagePoolInfoXRPC : public RequestXRPC, public ImagePoolAPI
{
public:
    ImagePoolInfoXRPC()
        : RequestXRPC("one.imagepool.info",
                      "Returns the Image pool",
                      "A:siii")
        , ImagePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
