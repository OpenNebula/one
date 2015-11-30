/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_CHOWN_H_
#define REQUEST_MANAGER_CHOWN_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerChown : public Request
{
protected:
    RequestManagerChown(const string& method_name,
                        const string& help,
                        const string& params = "A:siii")
        :Request(method_name,params,help)
    {
        auth_op = AuthRequest::MANAGE;

        Nebula& nd = Nebula::instance();
        gpool = nd.get_gpool();
        upool = nd.get_upool();
    };

    ~RequestManagerChown(){};

    /* -------------------------------------------------------------------- */

    GroupPool * gpool;
    UserPool  * upool;

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att);

    PoolObjectSQL * get_and_quota(int                       oid,
                                  int                       new_uid,
                                  int                       new_gid,
                                  RequestAttributes&        att);

    /**
     * Checks if the new owner cannot has other object with the same name (if
     * the pool does not allow it)
     *
     * @param oid Object id
     * @param noid New owner user id
     * @param att the specific request attributes
     *
     * @return 0 if the operation is allowed, -1 otherwise
     */
    virtual int check_name_unique(int oid, int noid, RequestAttributes& att);

    virtual PoolObjectSQL * get(const string& name, int uid, bool lock) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineChown : public RequestManagerChown
{
public:
    VirtualMachineChown():
        RequestManagerChown("VirtualMachineChown",
                            "Changes ownership of a virtual machine")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineChown(){};

    int check_name_unique(int oid, int noid, RequestAttributes& att)
    {
        return 0;
    };

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return 0;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateChown : public RequestManagerChown
{
public:
    TemplateChown():
        RequestManagerChown("TemplateChown",
                            "Changes ownership of a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateChown(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<VMTemplatePool*>(pool)->get(name, uid, lock);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkChown: public RequestManagerChown
{
public:
    VirtualNetworkChown():
        RequestManagerChown("VirtualNetworkChown",
                           "Changes ownership of a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkChown(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<VirtualNetworkPool*>(pool)->get(name, uid, lock);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChown: public RequestManagerChown
{
public:
    ImageChown():
        RequestManagerChown("ImageChown",
                            "Changes ownership of an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageChown(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<ImagePool*>(pool)->get(name, uid, lock);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChown : public RequestManagerChown
{
public:
    UserChown():
        RequestManagerChown("UserChown",
                            "Changes ownership of a user",
                            "A:sii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    ~UserChown(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att);

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return 0;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreChown: public RequestManagerChown
{
public:
    DatastoreChown():
        RequestManagerChown("Datastore",
                           "Changes ownership of a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreChown(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return 0;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentChown : public RequestManagerChown
{
public:
    DocumentChown():
        RequestManagerChown("DocumentChown",
                            "Changes ownership of a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentChown(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return 0;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupChown: public RequestManagerChown
{
public:
    SecurityGroupChown():
        RequestManagerChown("SecurityGroupChown",
                            "Changes ownership of a security group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupChown(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<SecurityGroupPool*>(pool)->get(name, uid, lock);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterChown: public RequestManagerChown
{
public:
    VirtualRouterChown():
        RequestManagerChown("VirtualRouterChown",
                            "Changes ownership of a virtual router")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterChown(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<VirtualRouterPool*>(pool)->get(name, uid, lock);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
