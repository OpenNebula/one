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

#ifndef REQUEST_MANAGER_CHMOD_H_
#define REQUEST_MANAGER_CHMOD_H_

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

class RequestManagerChmod : public Request
{
protected:
    RequestManagerChmod(const std::string& method_name, const std::string& help,
                        const std::string& params = "A:siiiiiiiiii"):
        Request(method_name, params, help) {};

    ~RequestManagerChmod() {};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    virtual ErrorCode chmod(PoolSQL * pool, int oid, int owner_u, int owner_m,
                            int owner_a, int group_u, int group_m, int group_a, int other_u,
                            int other_m, int other_a, bool recursive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineChmod : public RequestManagerChmod
{
public:
    VirtualMachineChmod():
        RequestManagerChmod("one.vm.chmod",
                            "Changes permission bits of a virtual machine")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineChmod() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateChmod : public RequestManagerChmod
{
public:
    TemplateChmod():
        RequestManagerChmod("one.template.chmod", "Changes permission bits of a "
                            "virtual machine template", "A:siiiiiiiiiib")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateChmod() {};

    ErrorCode request_execute(PoolSQL * pool, int oid, int owner_u, int owner_m,
                              int owner_a, int group_u, int group_m, int group_a, int other_u,
                              int other_m, int other_a, bool recursive, RequestAttributes& att)
    {
        return chmod(pool, oid, owner_u, owner_m, owner_a, group_u, group_m,
                     group_a, other_u, other_m, other_a, recursive, att);
    }

protected:

    ErrorCode chmod(PoolSQL * pool, int oid, int owner_u, int owner_m,
                    int owner_a, int group_u, int group_m, int group_a, int other_u,
                    int other_m, int other_a, bool recursive, RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkTemplateChmod : public RequestManagerChmod
{
public:
    VirtualNetworkTemplateChmod():
        RequestManagerChmod("one.vntemplate.chmod", "Changes permission bits of a "
                            "virtual network template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    ~VirtualNetworkTemplateChmod() {};

    ErrorCode request_execute(PoolSQL * pool, int oid, int owner_u, int owner_m,
                              int owner_a, int group_u, int group_m, int group_a, int other_u,
                              int other_m, int other_a, bool recursive, RequestAttributes& att)
    {
        return chmod(pool, oid, owner_u, owner_m, owner_a, group_u, group_m,
                     group_a, other_u, other_m, other_a, recursive, att);
    }
};

/* ------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkChmod: public RequestManagerChmod
{
public:
    VirtualNetworkChmod():
        RequestManagerChmod("one.vn.chmod",
                            "Changes permission bits of a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkChmod() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChmod: public RequestManagerChmod
{
public:
    ImageChmod():
        RequestManagerChmod("one.image.chmod",
                            "Changes permission bits of an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageChmod() {};

    ErrorCode request_execute(PoolSQL * pool, int oid, int owner_u, int owner_m,
                              int owner_a, int group_u, int group_m, int group_a, int other_u,
                              int other_m, int other_a, RequestAttributes& att)
    {
        return chmod(pool, oid, owner_u, owner_m, owner_a, group_u, group_m,
                     group_a, other_u, other_m, other_a, false, att);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreChmod: public RequestManagerChmod
{
public:
    DatastoreChmod():
        RequestManagerChmod("one.datastore.chmod",
                            "Changes permission bits of a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreChmod() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentChmod : public RequestManagerChmod
{
public:
    DocumentChmod():
        RequestManagerChmod("one.document.chmod",
                            "Changes permission bits of a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentChmod() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupChmod: public RequestManagerChmod
{
public:
    SecurityGroupChmod():
        RequestManagerChmod("one.secgroup.chmod",
                            "Changes permission bits of a security group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupChmod() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterChmod: public RequestManagerChmod
{
public:
    VirtualRouterChmod():
        RequestManagerChmod("one.vrouter.chmod",
                            "Changes permission bits of a virtual router")
    {
        Nebula& nd  = Nebula::instance();
        vrpool      = nd.get_vrouterpool();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterChmod() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

private:

    VirtualRouterPool  * vrpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceChmod: public RequestManagerChmod
{
public:
    MarketPlaceChmod():
        RequestManagerChmod("one.market.chmod",
                            "Changes permission bits of a marketplace")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceChmod() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppChmod: public RequestManagerChmod
{
public:
    MarketPlaceAppChmod():
        RequestManagerChmod("one.marketapp.chmod",
                            "Changes permission bits of a marketplace app")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppChmod() {};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupChmod: public RequestManagerChmod
{
public:
    VMGroupChmod():
        RequestManagerChmod("one.vmgroup.chmod",
                            "Changes permission bits of a vm group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };

    ~VMGroupChmod() {};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobChmod: public RequestManagerChmod
{
public:
    BackupJobChmod():
        RequestManagerChmod("one.backupjob.chmod",
                            "Changes permission bits of a Backup Job")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_bjpool();
        auth_object = PoolObjectSQL::BACKUPJOB;
    }
};

#endif
