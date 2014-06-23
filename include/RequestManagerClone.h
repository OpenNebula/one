/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef REQUEST_MANAGER_CLONE_H
#define REQUEST_MANAGER_CLONE_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerClone: public Request
{
protected:
    RequestManagerClone(const string& method_name,
                             const string& help,
                             const string& params = "A:sis")
        :Request(method_name,params,help)
    {};

    ~RequestManagerClone(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att);

    virtual Template * clone_template(PoolObjectSQL* obj) = 0;

    virtual int pool_allocate(
            int                         source_id,
            Template *                  tmpl,
            int&                        id,
            string&                     error_str,
            RequestAttributes&          att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMTemplateClone : public RequestManagerClone
{
public:
    VMTemplateClone():
        RequestManagerClone("VMTemplateClone",
                            "Clone an existing virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();

        auth_object = PoolObjectSQL::TEMPLATE;
        auth_op     = AuthRequest::USE;
    };

    ~VMTemplateClone(){};

    /* -------------------------------------------------------------------- */

    Template * clone_template(PoolObjectSQL* obj)
    {
        return static_cast<VMTemplate*>(obj)->clone_template();
    };

    int pool_allocate(
            int                         source_id,
            Template *                  tmpl,
            int&                        id,
            string&                     error_str,
            RequestAttributes&          att)
    {
        VMTemplatePool * tpool = static_cast<VMTemplatePool *>(pool);

        VirtualMachineTemplate * ttmpl =
                static_cast<VirtualMachineTemplate *>(tmpl);

        return tpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                ttmpl, &id, error_str);
    };
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentClone : public RequestManagerClone
{
public:
    DocumentClone():
        RequestManagerClone("DocumentClone",
                            "Clone an existing generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();

        auth_object = PoolObjectSQL::DOCUMENT;
        auth_op     = AuthRequest::USE;
    };

    ~DocumentClone(){};

    /* -------------------------------------------------------------------- */

    Template * clone_template(PoolObjectSQL* obj)
    {
        return static_cast<Document*>(obj)->clone_template();
    };

    int pool_allocate(
            int                         source_id,
            Template *                  tmpl,
            int&                        id,
            string&                     error_str,
            RequestAttributes&          att)
    {
        DocumentPool * docpool = static_cast<DocumentPool *>(pool);
        Document * doc = docpool->get(source_id, true);

        return docpool->allocate(att.uid, att.gid, att.uname, att.gname,
            att.umask, doc->get_document_type(), tmpl, &id, error_str);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
