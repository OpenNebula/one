/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

class RequestManagerUpdateTemplate: public Request
{
protected:
    RequestManagerUpdateTemplate(const std::string& method_name,
                                 const std::string& help)
        :Request(method_name, "A:sis", help)
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerUpdateTemplate(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    virtual int replace_template(PoolObjectSQL * object,
                                 const std::string & tmpl,
                                 const RequestAttributes &att,
                                 std::string &error_str);

    virtual int append_template(PoolObjectSQL * object,
                                const std::string & tmpl,
                                const RequestAttributes &att,
                                std::string &error_str);

    /**
     *  Method for updating custom values not included in PoolSQL::update
     *  mainly used for updating search information in the VMs.
     *    @param obj to be updated
     *    @return 0 on success
     */
    virtual int extra_updates(PoolObjectSQL * obj)
    {
        return 0;
    }

    /**
     *  Method for extra checks on specific objects
     *    @param obj to check conditions form update
     *    @param error return reason of error
     *    @return 0 on success
     */
    virtual int extra_preconditions_check(PoolObjectSQL * obj, std::string& error)
    {
        return 0;
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    TemplateUpdateTemplate():
        RequestManagerUpdateTemplate("one.template.update",
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

class VirtualNetworkTemplateUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    VirtualNetworkTemplateUpdateTemplate():
        RequestManagerUpdateTemplate("one.vntemplate.update",
                                     "Updates a virtual network template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    ~VirtualNetworkTemplateUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    VirtualMachineUpdateTemplate():
        RequestManagerUpdateTemplate("one.vm.update",
                                     "Updates a virtual machine user template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
        vm_action   = VMActions::UPDATE_ACTION;
    }

    ~VirtualMachineUpdateTemplate() = default;

protected:
    int extra_updates(PoolObjectSQL * obj) override
    {
        VirtualMachine * vm;

        VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);

        if (obj == 0)
        {
            return -1;
        }

        vm = static_cast<VirtualMachine *>(obj);

        return vmpool->update_search(vm);
    }

    int extra_preconditions_check(PoolObjectSQL * obj, std::string& error) override
    {
        auto vm = static_cast<VirtualMachine *>(obj);

        // Check if the action is supported for imported VMs
        if (vm->is_imported() &&
            !vm->is_imported_action_supported(VMActions::UPDATE_ACTION))
        {
            error = "Action \"update\" is not supported for imported VMs";

            return -1;
        }

        return 0;
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageUpdateTemplate: public RequestManagerUpdateTemplate
{
public:
    ImageUpdateTemplate():
        RequestManagerUpdateTemplate("one.image.update",
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
        RequestManagerUpdateTemplate("one.host.update",
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
        RequestManagerUpdateTemplate("one.vn.update",
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
        RequestManagerUpdateTemplate("one.user.update",
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
        RequestManagerUpdateTemplate("one.datastore.update",
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
        RequestManagerUpdateTemplate("one.document.update",
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
        RequestManagerUpdateTemplate("one.cluster.update",
                                     "Updates a cluster template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterUpdateTemplate(){};

protected:
    int extra_updates(PoolObjectSQL * obj) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    ZoneUpdateTemplate():
        RequestManagerUpdateTemplate("one.zone.update",
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
        RequestManagerUpdateTemplate("one.group.update",
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
        RequestManagerUpdateTemplate("one.secgroup.update",
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
        RequestManagerUpdateTemplate("one.vdc.update",
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
        RequestManagerUpdateTemplate("one.vrouter.update",
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
        RequestManagerUpdateTemplate("one.market.update",
                                     "Updates a marketplace template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceUpdateTemplate(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    MarketPlaceAppUpdateTemplate():
        RequestManagerUpdateTemplate("one.marketapp.update",
                                     "Updates a marketplace app template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppUpdateTemplate(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    VMGroupUpdateTemplate():
        RequestManagerUpdateTemplate("one.vmgroup.update",
                                     "Updates a vm group template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };

    ~VMGroupUpdateTemplate(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    HookUpdateTemplate():
        RequestManagerUpdateTemplate("one.hook.update",
                                     "Updates a hook template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hkpool();
        auth_object = PoolObjectSQL::HOOK;
    };

    ~HookUpdateTemplate(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobUpdateTemplate : public RequestManagerUpdateTemplate
{
public:
    BackupJobUpdateTemplate():
        RequestManagerUpdateTemplate("one.backupjob.update",
                                     "Updates a Backup Job template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_bjpool();
        auth_object = PoolObjectSQL::BACKUPJOB;
    }
};

#endif
