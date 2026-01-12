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

#ifndef DOCUMENT_XRPC_H
#define DOCUMENT_XRPC_H

#include "RequestXRPC.h"
#include "DocumentAPI.h"
#include "DocumentPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentAllocateXRPC : public RequestXRPC, public DocumentAllocateAPI
{
public:
    DocumentAllocateXRPC() :
        RequestXRPC("one.document.allocate",
                    "Allocates a new generic document",
                    "A:ssi"),
        DocumentAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentDeleteXRPC : public RequestXRPC, public DocumentAPI
{
public:
    DocumentDeleteXRPC() :
        RequestXRPC("one.document.delete",
                    "Deletes a generic document",
                    "A:si"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentUpdateXRPC : public RequestXRPC, public DocumentAPI
{
public:
    DocumentUpdateXRPC() :
        RequestXRPC("one.document.update",
                    "Updates a document template",
                    "A:sisi"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentRenameXRPC : public RequestXRPC, public DocumentAPI
{
public:
    DocumentRenameXRPC() :
        RequestXRPC("one.document.rename",
                    "Renames a generic document",
                    "A:sis"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentChmodXRPC: public RequestXRPC, public DocumentAPI
{
public:
    DocumentChmodXRPC()
        : RequestXRPC("one.document.chmod",
                      "Changes permission bits of a generic document",
                      "A:siiiiiiiiii")
        , DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentChownXRPC : public RequestXRPC, public DocumentAPI
{
public:
    DocumentChownXRPC()
        : RequestXRPC("one.document.chown",
                      "Changes ownership of a generic document",
                      "A:siii")
        , DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentLockXRPC : public RequestXRPC, public DocumentAPI
{
public:
    DocumentLockXRPC()
        : RequestXRPC("one.document.lock",
                      "Tries to acquire the object's lock",
                      "A:siib")
        , DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentUnlockXRPC : public RequestXRPC, public DocumentAPI
{
public:
    DocumentUnlockXRPC()
        : RequestXRPC("one.document.unlock",
                      "Unlocks the object",
                      "A:si")
        , DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentCloneXRPC : public RequestXRPC, public DocumentAPI
{
public:
    DocumentCloneXRPC() :
        RequestXRPC("one.document.clone",
                    "Clone existing document",
                    "A:sis"),
        DocumentAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentInfoXRPC : public RequestXRPC, public DocumentInfoAPI
{
public:
    DocumentInfoXRPC() :
        RequestXRPC("one.document.info",
                    "Returns generic document information",
                    "A:sib"),
        DocumentInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentPoolInfoXRPC : public RequestXRPC, public DocumentPoolAPI
{
public:
    DocumentPoolInfoXRPC() :
        RequestXRPC("one.documentpool.info",
                      "Returns the generic document pool",
                      "A:siiii"),
        DocumentPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
