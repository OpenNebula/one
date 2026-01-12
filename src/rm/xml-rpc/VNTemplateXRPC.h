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

#ifndef VNTEMPLATE_XRPC_H
#define VNTEMPLATE_XRPC_H

#include "RequestXRPC.h"
#include "VNTemplateAPI.h"
#include "VNTemplatePoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateAllocateXRPC : public RequestXRPC, public VNTemplateAllocateAPI
{
public:
    VNTemplateAllocateXRPC() :
        RequestXRPC("one.vntemplate.allocate",
                    "Allocates a new VNTemplate",
                    "A:ss"),
        VNTemplateAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateDeleteXRPC : public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateDeleteXRPC() :
        RequestXRPC("one.vntemplate.delete",
                    "Deletes a VNTemplate",
                    "A:si"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateInfoXRPC : public RequestXRPC, public VNTemplateInfoAPI
{
public:
    VNTemplateInfoXRPC() :
        RequestXRPC("one.vntemplate.info",
                    "Returns VNTemplate information",
                    "A:sib"),
        VNTemplateInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateUpdateXRPC : public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateUpdateXRPC() :
        RequestXRPC("one.vntemplate.update",
                    "Updates a VNTemplate",
                    "A:sisi"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateRenameXRPC : public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateRenameXRPC() :
        RequestXRPC("one.vntemplate.rename",
                    "Renames a VNTemplate",
                    "A:sis"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateChmodXRPC: public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateChmodXRPC()
        : RequestXRPC("one.vntemplate.chmod",
                      "Changes permission bits of a VNTemplate",
                      "A:siiiiiiiiii")
        , VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateChownXRPC : public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateChownXRPC()
        : RequestXRPC("one.vntemplate.chown",
                      "Changes ownership of a VNTemplate",
                      "A:siii")
        , VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateLockXRPC : public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateLockXRPC()
        : RequestXRPC("one.vntemplate.lock",
                      "Lock a VNTemplate",
                      "A:siib")
        , VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateUnlockXRPC : public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateUnlockXRPC()
        : RequestXRPC("one.vntemplate.unlock",
                      "Unlock a VNTemplate",
                      "A:si")
        , VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateCloneXRPC: public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateCloneXRPC()
        : RequestXRPC("one.vntemplate.clone",
                      "Clone a VNTemplate",
                      "A:sis")
        , VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateInstantiateXRPC: public RequestXRPC, public VNTemplateAPI
{
public:
    VNTemplateInstantiateXRPC()
        : RequestXRPC("one.vntemplate.instantiate",
                      "Instantiate a VNTemplate",
                      "A:siss")
        , VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplatePoolInfoXRPC : public RequestXRPC, public VNTemplatePoolAPI
{
public:
    VNTemplatePoolInfoXRPC()
        : RequestXRPC("one.vntemplatepool.info",
                      "Returns the VNTemplate pool",
                      "A:s")
        , VNTemplatePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
