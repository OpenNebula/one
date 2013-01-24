/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef REQUEST_MANAGER_RENAME_H_
#define REQUEST_MANAGER_RENAME_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerRename : public Request
{
protected:
    RequestManagerRename(const string& method_name,
                         const string& help,
                         const string& params = "A:sis")
        :Request(method_name,params,help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    virtual ~RequestManagerRename(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                        RequestAttributes& att);

    virtual PoolObjectSQL * get(const string& name, int uid, bool lock) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineRename : public RequestManagerRename
{
public:
    VirtualMachineRename():
        RequestManagerRename("VirtualMachineRename","Renames a virtual machine")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return 0;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateRename : public RequestManagerRename
{
public:
    TemplateRename():
        RequestManagerRename("TemplateRename",
                             "Renames a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<VMTemplatePool*>(pool)->get(name, uid, lock);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkRename: public RequestManagerRename
{
public:
    VirtualNetworkRename():
        RequestManagerRename("VirtualNetworkRename","Renames a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<VirtualNetworkPool*>(pool)->get(name, uid, lock);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageRename: public RequestManagerRename
{
public:
    ImageRename():
        RequestManagerRename("ImageRename", "Renames an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<ImagePool*>(pool)->get(name, uid, lock);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentRename : public RequestManagerRename
{
public:
    DocumentRename():
        RequestManagerRename("DocumentRename", "Renames a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return 0;
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
