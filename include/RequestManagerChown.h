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

#ifndef REQUEST_MANAGER_CHOWN_H_
#define REQUEST_MANAGER_CHOWN_H_

#include "Request.h"
#include "Nebula.h"

#include "BackupJobPool.h"
#include "DatastorePool.h"
#include "DocumentPool.h"
#include "ImagePool.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "SecurityGroupPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "VirtualRouterPool.h"
#include "VMGroupPool.h"
#include "VMTemplatePool.h"
#include "VNTemplatePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerChown : public Request
{
protected:
    RequestManagerChown(const std::string& method_name,
                        const std::string& help,
                        const std::string& params = "A:siii")
        :Request(method_name, params, help)
    {
        auth_op = AuthRequest::MANAGE;

        Nebula& nd = Nebula::instance();
        gpool = nd.get_gpool();
        upool = nd.get_upool();
    };

    ~RequestManagerChown() {};

    /* -------------------------------------------------------------------- */

    GroupPool * gpool;
    UserPool  * upool;

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    std::unique_ptr<PoolObjectSQL> get_and_quota(int                oid,
                                                 int                new_uid,
                                                 int                new_gid,
                                                 RequestAttributes& att)
    {
        return get_and_quota(oid, new_uid, new_gid, att, pool, auth_object);
    }

    std::unique_ptr<PoolObjectSQL> get_and_quota(
            int                       oid,
            int                       new_uid,
            int                       new_gid,
            RequestAttributes&        att,
            PoolSQL *                 pool,
            PoolObjectSQL::ObjectType auth_object);

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
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineChown : public RequestManagerChown
{
public:
    VirtualMachineChown():
        RequestManagerChown("one.vm.chown",
                            "Changes ownership of a virtual machine")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineChown() {};

    int check_name_unique(int oid, int noid, RequestAttributes& att) override
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
        RequestManagerChown("one.template.chown",
                            "Changes ownership of a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateChown() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkTemplateChown : public RequestManagerChown
{
public:
    VirtualNetworkTemplateChown():
        RequestManagerChown("one.vntemplate.chown",
                            "Changes ownership of a virtual network template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    ~VirtualNetworkTemplateChown() {};
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkChown: public RequestManagerChown
{
public:
    VirtualNetworkChown():
        RequestManagerChown("one.vn.chown",
                            "Changes ownership of a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkChown() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChown: public RequestManagerChown
{
public:
    ImageChown():
        RequestManagerChown("one.image.chown",
                            "Changes ownership of an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageChown() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserChown : public RequestManagerChown
{
public:
    UserChown():
        RequestManagerChown("one.user.chgrp",
                            "Changes ownership of a user",
                            "A:sii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    ~UserChown() {};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att)  override;

    int check_name_unique(int oid, int noid, RequestAttributes& att) override
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
        RequestManagerChown("one.datastore.chown",
                            "Changes ownership of a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreChown() {};

    int check_name_unique(int oid, int noid, RequestAttributes& att) override
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
        RequestManagerChown("one.document.chown",
                            "Changes ownership of a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentChown() {};

    int check_name_unique(int oid, int noid, RequestAttributes& att) override
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
        RequestManagerChown("one.secgroup.chown",
                            "Changes ownership of a security group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupChown() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterChown: public RequestManagerChown
{
public:
    VirtualRouterChown():
        RequestManagerChown("one.vrouter.chown",
                            "Changes ownership of a virtual router")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterChown() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceChown: public RequestManagerChown
{
public:
    MarketPlaceChown():
        RequestManagerChown("one.market.chown",
                            "Changes ownership of a marketplace")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceChown() {};

    int check_name_unique(int oid, int noid, RequestAttributes& att) override
    {
        return 0;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppChown: public RequestManagerChown
{
public:
    MarketPlaceAppChown():
        RequestManagerChown("one.marketapp.chown",
                            "Changes ownership of a marketplace app")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppChown() {};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupChown: public RequestManagerChown
{
public:
    VMGroupChown():
        RequestManagerChown("one.vmgroup.chown",
                            "Changes ownership of a vm group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };

    ~VMGroupChown() {};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobChown: public RequestManagerChown
{
public:
    BackupJobChown():
        RequestManagerChown("one.backupjob.chown",
                            "Changes ownership of a Backup Job")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_bjpool();
        auth_object = PoolObjectSQL::BACKUPJOB;
    }
};


#endif
