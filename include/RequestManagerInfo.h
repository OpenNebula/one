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

#ifndef REQUEST_MANAGER_INFO_H_
#define REQUEST_MANAGER_INFO_H_

#include "Request.h"
#include "Nebula.h"
#include "BackupJobPool.h"
#include "ClusterPool.h"
#include "DatastorePool.h"
#include "DocumentPool.h"
#include "HookPool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "SecurityGroupPool.h"
#include "VdcPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "VirtualRouterPool.h"
#include "VMGroupPool.h"
#include "VMTemplatePool.h"
#include "VNTemplatePool.h"
#include "ZonePool.h"


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerInfo: public Request
{
protected:
    RequestManagerInfo(const std::string& method_name,
                       const std::string& help)
        :Request(method_name, "A:si", help)
    {
        auth_op = AuthRequest::USE_NO_LCK;

        leader_only = false;
        zone_disabled = true;
    };

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    /* -------------------------------------------------------------------- */

    virtual void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                        std::string& str)
    {
        object->to_xml(str);
    };

    virtual void load_monitoring(PoolObjectSQL *obj) const
    {
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineInfo : public RequestManagerInfo
{
public:
    VirtualMachineInfo():
        RequestManagerInfo("one.vm.info",
                           "Returns virtual machine instance information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    /* -------------------------------------------------------------------- */

protected:
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
    {
        static_cast<VirtualMachine *>(object)->to_xml_extended(str);
    };

    void load_monitoring(PoolObjectSQL *obj) const override
    {
        static_cast<VirtualMachine*>(obj)->load_monitoring();
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateInfo : public RequestManagerInfo
{
public:
    TemplateInfo():
        RequestManagerInfo("one.template.info",
                           "Returns virtual machine template information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    /* -------------------------------------------------------------------- */

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkInfo: public RequestManagerInfo
{
public:
    VirtualNetworkInfo():
        RequestManagerInfo("one.vn.info",
                           "Returns virtual network information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    /* -------------------------------------------------------------------- */

protected:
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkTemplateInfo: public RequestManagerInfo
{
public:
    VirtualNetworkTemplateInfo():
        RequestManagerInfo("one.vntemplate.info",
                           "Returns virtual network template information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    /* -------------------------------------------------------------------- */

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageInfo: public RequestManagerInfo
{
public:
    ImageInfo():
        RequestManagerInfo("one.image.info",
                           "Returns image information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostInfo : public RequestManagerInfo
{
public:
    HostInfo():
        RequestManagerInfo("one.host.info",
                           "Returns host information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

protected:
    void load_monitoring(PoolObjectSQL *obj) const override
    {
        static_cast<Host*>(obj)->load_monitoring();
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupInfo: public RequestManagerInfo
{
public:
    GroupInfo():
        RequestManagerInfo("one.group.info",
                           "Returns group information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = PoolObjectSQL::GROUP;
    };

    /* -------------------------------------------------------------------- */

protected:
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
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
        RequestManagerInfo("one.user.info",
                           "Returns user information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        auth_object = PoolObjectSQL::USER;
    };

    /* -------------------------------------------------------------------- */

protected:
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
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
        RequestManagerInfo("one.datastore.info",
                           "Returns datastore information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterInfo: public RequestManagerInfo
{
public:
    ClusterInfo():
        RequestManagerInfo("one.cluster.info",
                           "Returns cluster information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentInfo : public RequestManagerInfo
{
public:
    DocumentInfo():
        RequestManagerInfo("one.document.info",
                           "Returns generic document information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneInfo: public RequestManagerInfo
{
public:
    ZoneInfo():
        RequestManagerInfo("one.zone.info",
                           "Returns zone information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupInfo : public RequestManagerInfo
{
public:
    SecurityGroupInfo():
        RequestManagerInfo("one.secgroup.info",
                           "Returns security group information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcInfo: public RequestManagerInfo
{
public:
    VdcInfo():
        RequestManagerInfo("one.vdc.info",
                           "Returns VDC information")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterInfo : public RequestManagerInfo
{
public:
    VirtualRouterInfo():
        RequestManagerInfo("one.vrouter.info",
                           "Returns virtual router information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceInfo : public RequestManagerInfo
{
public:
    MarketPlaceInfo():
        RequestManagerInfo("one.market.info",
                           "Returns marketplace information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppInfo : public RequestManagerInfo
{
public:
    MarketPlaceAppInfo():
        RequestManagerInfo("one.marketapp.info",
                           "Returns marketplace app information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupInfo : public RequestManagerInfo
{
public:
    VMGroupInfo():
        RequestManagerInfo("one.vmgroup.info",
                           "Returns vm group information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookInfo : public RequestManagerInfo
{
public:
    HookInfo():
        RequestManagerInfo("one.hook.info",
                           "Returns hook information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hkpool();
        auth_object = PoolObjectSQL::HOOK;
    };

    ~HookInfo() {};

protected:
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
    {
        (static_cast<Hook *>(object))->to_xml_extended(str);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobInfo : public RequestManagerInfo
{
public:
    BackupJobInfo():
        RequestManagerInfo("one.backupjob.info",
                           "Returns Backup Job information")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_bjpool();
        auth_object = PoolObjectSQL::BACKUPJOB;
    }

protected:
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
    {
        static_cast<BackupJob *>(object)->to_xml_extended(str, true);
    };
};

#endif
