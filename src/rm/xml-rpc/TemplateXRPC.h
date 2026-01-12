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

#ifndef TEMPLATE_XRPC_H
#define TEMPLATE_XRPC_H

#include "RequestXRPC.h"
#include "TemplateAPI.h"
#include "TemplatePoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateAllocateXRPC : public RequestXRPC, public TemplateAllocateAPI
{
public:
    TemplateAllocateXRPC() :
        RequestXRPC("one.template.allocate",
                    "Allocates a new Template",
                    "A:ss"),
        TemplateAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateDeleteXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateDeleteXRPC() :
        RequestXRPC("one.template.delete",
                    "Deletes a Template",
                    "A:si"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateInfoXRPC : public RequestXRPC, public TemplateInfoAPI
{
public:
    TemplateInfoXRPC() :
        RequestXRPC("one.template.info",
                    "Returns Template information",
                    "A:sibb"),
        TemplateInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateUpdateXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateUpdateXRPC() :
        RequestXRPC("one.template.update",
                    "Updates a Template",
                    "A:sisi"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateRenameXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateRenameXRPC() :
        RequestXRPC("one.template.rename",
                    "Renames a Template",
                    "A:sis"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateCloneXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateCloneXRPC() :
        RequestXRPC("one.template.clone",
                    "Clone a Virtual Machine template",
                    "A:sisb"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateInstantiateXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateInstantiateXRPC() :
        RequestXRPC("one.template.instantiate",
                    "Instantiates a new Virtual Machine using a template",
                    "A:sisbs"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateChmodXRPC: public RequestXRPC, public TemplateAPI
{
public:
    TemplateChmodXRPC()
        : RequestXRPC("one.template.chmod",
                      "Changes permission bits of a Template",
                      "A:siiiiiiiiiib")
        , TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateChownXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateChownXRPC()
        : RequestXRPC("one.template.chown",
                      "Changes ownership of a Template",
                      "A:siii")
        , TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateLockXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateLockXRPC()
        : RequestXRPC("one.template.lock",
                      "Lock a Template",
                      "A:siib")
        , TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateUnlockXRPC : public RequestXRPC, public TemplateAPI
{
public:
    TemplateUnlockXRPC()
        : RequestXRPC("one.template.unlock",
                      "Unlock a MarektPlaceApp",
                      "A:si")
        , TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplatePoolInfoXRPC : public RequestXRPC, public TemplatePoolAPI
{
public:
    TemplatePoolInfoXRPC()
        : RequestXRPC("one.templatepool.info",
                      "Returns the Template pool",
                      "A:siii")
        , TemplatePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
