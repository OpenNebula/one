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

#ifndef REQUEST_MANAGER_INFO_H_
#define REQUEST_MANAGER_INFO_H_

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerInfo: public Request
{
protected:
    RequestManagerInfo(const string& method_name,
                       const string& help)
        :Request(method_name, "A:si", help)
    {
        auth_op = AuthRequest::USE;
    };

    ~RequestManagerInfo(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    /* -------------------------------------------------------------------- */

    virtual void to_xml(RequestAttributes& att, PoolObjectSQL * object,
        string& str)
    {
        object->to_xml(str);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineInfo : public RequestManagerInfo
{
public:
    VirtualMachineInfo():
        RequestManagerInfo("VirtualMachineInfo",
                           "Returns virtual machine instance information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineInfo(){};

    /* -------------------------------------------------------------------- */

    void to_xml(RequestAttributes& att, PoolObjectSQL * object, string& str)
    {
        static_cast<VirtualMachine *>(object)->to_xml_extended(str);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateInfo : public RequestManagerInfo
{
public:
    TemplateInfo():
        RequestManagerInfo("TemplateInfo",
                           "Returns virtual machine template information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateInfo(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkInfo: public RequestManagerInfo
{
public:
    VirtualNetworkInfo():
        RequestManagerInfo("VirtualNetworkInfo",
                           "Returns virtual network information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkInfo(){};

    /* -------------------------------------------------------------------- */

    void to_xml(RequestAttributes& att, PoolObjectSQL * object, string& str);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageInfo: public RequestManagerInfo
{
public:
    ImageInfo():
        RequestManagerInfo("ImageInfo",
                           "Returns image information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageInfo(){};

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostInfo : public RequestManagerInfo
{
public:
    HostInfo():
        RequestManagerInfo("HostInfo",
                           "Returns host information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    ~HostInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupInfo: public RequestManagerInfo
{
public:
    GroupInfo():
        RequestManagerInfo("GroupInfo",
                           "Returns group information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = PoolObjectSQL::GROUP;
    };

    ~GroupInfo(){};

    /* -------------------------------------------------------------------- */

    void to_xml(RequestAttributes& att, PoolObjectSQL * object, string& str)
    {
        static_cast<Group*>(object)->to_xml_extended(str);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserInfo: public RequestManagerInfo
{
public:
    UserInfo():
        RequestManagerInfo("UserInfo",
                           "Returns user information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    ~UserInfo(){};

    /* -------------------------------------------------------------------- */

    void to_xml(RequestAttributes& att, PoolObjectSQL * object, string& str)
    {
        static_cast<User*>(object)->to_xml_extended(str);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreInfo: public RequestManagerInfo
{
public:
    DatastoreInfo():
        RequestManagerInfo("DatastoreInfo",
                           "Returns datastore information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterInfo: public RequestManagerInfo
{
public:
    ClusterInfo():
        RequestManagerInfo("ClusterInfo",
                           "Returns cluster information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentInfo : public RequestManagerInfo
{
public:
    DocumentInfo():
        RequestManagerInfo("DocumentInfo",
                           "Returns generic document information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneInfo: public RequestManagerInfo
{
public:
    ZoneInfo():
        RequestManagerInfo("ZoneInfo",
                           "Returns zone information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
    };

    ~ZoneInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupInfo : public RequestManagerInfo
{
public:
    SecurityGroupInfo():
        RequestManagerInfo("SecurityGroupInfo",
                           "Returns security group information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcInfo: public RequestManagerInfo
{
public:
    VdcInfo():
        RequestManagerInfo("VdcInfo",
                           "Returns VDC information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
    };

    ~VdcInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterInfo : public RequestManagerInfo
{
public:
    VirtualRouterInfo():
        RequestManagerInfo("VirtualRouterInfo",
                           "Returns virtual router information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceInfo : public RequestManagerInfo
{
public:
    MarketPlaceInfo():
        RequestManagerInfo("MarketPlaceInfo",
                           "Returns marketplace information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceInfo(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppInfo : public RequestManagerInfo
{
public:
    MarketPlaceAppInfo():
        RequestManagerInfo("MarketPlaceAppInfo",
                           "Returns marketplace app information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppInfo(){};
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
