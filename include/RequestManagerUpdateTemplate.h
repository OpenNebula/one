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

#ifndef REQUEST_MANAGER_UPDATE_TEMPLATE_H
#define REQUEST_MANAGER_UPDATE_TEMPLATE_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerUpdateTemplate: public Request
{
protected:
    RequestManagerUpdateTemplate(const string& method_name,
                                 const string& help)
        :Request(method_name, "A:sis", help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerUpdateTemplate(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    virtual int replace_template(PoolObjectSQL * object, const string & tmpl,
            const RequestAttributes &att, string &error_str);

    virtual int append_template(PoolObjectSQL * object, const string & tmpl,
            const RequestAttributes &att, string &error_str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    TemplateUpdateTemplate():
        RequestManagerUpdateTemplate("TemplateUpdateTemplate",
                                     "Updates a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    VirtualMachineUpdateTemplate():
        RequestManagerUpdateTemplate("VirtualMachineUpdateTemplate",
                                     "Updates a virtual machine user template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    ImageUpdateTemplate():
        RequestManagerUpdateTemplate("ImageUpdateTemplate",
                                     "Updates an image template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    HostUpdateTemplate():
        RequestManagerUpdateTemplate("HostUpdateTemplate",
                                     "Updates a host template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
        auth_op     = AuthRequest::ADMIN;
    };

    ~HostUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    VirtualNetworkUpdateTemplate():
        RequestManagerUpdateTemplate("VirtualNetworkUpdateTemplate",
                                     "Updates a vnet template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
        auth_op     = AuthRequest::MANAGE;
    };

    ~VirtualNetworkUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    UserUpdateTemplate():
        RequestManagerUpdateTemplate("UserUpdateTemplate",
                                     "Updates a user template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    ~UserUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    DatastoreUpdateTemplate():
        RequestManagerUpdateTemplate("DatastoreUpdateTemplate",
                                     "Updates a datastore template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    DocumentUpdateTemplate():
        RequestManagerUpdateTemplate("DocumentUpdateTemplate",
                                     "Updates a document template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    ClusterUpdateTemplate():
        RequestManagerUpdateTemplate("ClusterUpdateTemplate",
                                     "Updates a cluster template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    ZoneUpdateTemplate():
        RequestManagerUpdateTemplate("ZoneUpdateTemplate",
                                     "Updates a zone template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
    };

    ~ZoneUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    GroupUpdateTemplate():
        RequestManagerUpdateTemplate("GroupUpdateTemplate",
                                     "Updates a Group template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_gpool();
        auth_object = PoolObjectSQL::GROUP;
    };

    ~GroupUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    SecurityGroupUpdateTemplate():
        RequestManagerUpdateTemplate("SecurityGroupUpdateTemplate",
                                     "Updates a security group template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    VdcUpdateTemplate():
        RequestManagerUpdateTemplate("VdcUpdateTemplate",
                                     "Updates a VDC template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
    };

    ~VdcUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    VirtualRouterUpdateTemplate():
        RequestManagerUpdateTemplate("VirtualRouterUpdateTemplate",
                                     "Updates a virtual router template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    MarketPlaceUpdateTemplate():
        RequestManagerUpdateTemplate("MarketPlaceUpdateTemplate",
                                     "Updates a virtual router template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_mppool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceUpdateTemplate(){};
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
