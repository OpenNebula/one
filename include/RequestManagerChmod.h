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

#ifndef REQUEST_MANAGER_CHMOD_H_
#define REQUEST_MANAGER_CHMOD_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerChmod : public Request
{
protected:
    RequestManagerChmod(const string& method_name, const string& help,
        const string& params = "A:siiiiiiiiii"):
            Request(method_name, params, help){};

    ~RequestManagerChmod(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
        RequestAttributes& att);

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
        RequestManagerChmod("VirtualMachineChmod",
                            "Changes permission bits of a virtual machine")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateChmod : public RequestManagerChmod
{
public:
    TemplateChmod():
        RequestManagerChmod("TemplateChmod", "Changes permission bits of a "
            "virtual machine template", "A:siiiiiiiiiib")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateChmod(){};

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
        int other_m, int other_a, bool recursive, RequestAttributes& att);
};

/* ------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkChmod: public RequestManagerChmod
{
public:
    VirtualNetworkChmod():
        RequestManagerChmod("VirtualNetworkChmod",
                           "Changes permission bits of a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageChmod: public RequestManagerChmod
{
public:
    ImageChmod():
        RequestManagerChmod("ImageChmod",
                            "Changes permission bits of an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageChmod(){};

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
        RequestManagerChmod("DatastoreChmod",
                           "Changes permission bits of a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentChmod : public RequestManagerChmod
{
public:
    DocumentChmod():
        RequestManagerChmod("DocumentChmod",
                            "Changes permission bits of a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupChmod: public RequestManagerChmod
{
public:
    SecurityGroupChmod():
        RequestManagerChmod("SecurityGroupChmod",
                            "Changes permission bits of a security group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterChmod: public RequestManagerChmod
{
public:
    VirtualRouterChmod():
        RequestManagerChmod("VirtualRouterChmod",
                            "Changes permission bits of a virtual router")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceChmod: public RequestManagerChmod
{
public:
    MarketPlaceChmod():
        RequestManagerChmod("MarketPlaceChmod",
                           "Changes permission bits of a marketplace")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceChmod(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppChmod: public RequestManagerChmod
{
public:
    MarketPlaceAppChmod():
        RequestManagerChmod("MarketPlaceAppChmod",
                           "Changes permission bits of a marketplace app")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppChmod(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
