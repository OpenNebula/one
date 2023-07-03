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

#ifndef REQUEST_MANAGER_RENAME_H_
#define REQUEST_MANAGER_RENAME_H_

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

class RequestManagerRename : public Request
{
protected:
    RequestManagerRename(const std::string& method_name,
                         const std::string& help,
                         const std::string& params = "A:sis")
        :Request(method_name,params,help)
    {
        auth_op = AuthRequest::MANAGE;
    }

    ~RequestManagerRename() = default;

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                        RequestAttributes& att) override;

    /**
     *  Gets and object by name and owner. Default implementation returns no
     *  object
     */
    virtual int exist(const std::string& name, int uid) = 0;

    /**
     *  Batch rename of related objects. Default implementation does nothing
     */
    virtual void batch_rename(int oid){};

    /**
     *  Test if a rename is being perform on a given object. If not it set it.
     *    @return true if the rename can be performed (no ongoing rename)
     */
    bool test_and_set_rename(int oid)
    {
        std::lock_guard<std::mutex> lock(_mutex);

        auto rc = rename_ids.insert(oid);

        return rc.second == true;
    }

    /**
     *  Clear the rename.
     */
    void clear_rename(int oid)
    {
        std::lock_guard<std::mutex> lock(_mutex);

        rename_ids.erase(oid);
    }

    /**
     *  Method por updating custom values not included in PoolSQL::update
     *  mainly used for updating search information in the VMs.
     *    @param object to be updated
     *    @return 0 on success
     */
    virtual int extra_updates(PoolObjectSQL * obj)
    {
        return 0;
    }

private:
    /**
     *  Mutex to control concurrent access to the ongoing rename operations
     */
    std::mutex _mutex;

    /**
     *  Set of IDs being renamed;
     */
    std::set<int> rename_ids;

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineRename : public RequestManagerRename
{
public:
    VirtualMachineRename():
        RequestManagerRename("one.vm.rename","Renames a virtual machine")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
        vm_action   = VMActions::RENAME_ACTION;
    }

    ~VirtualMachineRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return -1;
    }

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
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateRename : public RequestManagerRename
{
public:
    TemplateRename():
        RequestManagerRename("one.template.rename",
                             "Renames a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkTemplateRename : public RequestManagerRename
{
public:
    VirtualNetworkTemplateRename():
        RequestManagerRename("one.vntemplate.rename",
                             "Renames a virtual network template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    ~VirtualNetworkTemplateRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */


class VirtualNetworkRename: public RequestManagerRename
{
public:
    VirtualNetworkRename():
        RequestManagerRename("one.vn.rename","Renames a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageRename: public RequestManagerRename
{
public:
    ImageRename():
        RequestManagerRename("one.image.rename", "Renames an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentRename : public RequestManagerRename
{
public:
    DocumentRename():
        RequestManagerRename("one.document.rename", "Renames a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return -1;
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterRename: public RequestManagerRename
{
public:
    ClusterRename():
        RequestManagerRename("one.cluster.rename", "Renames a cluster")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name);
    }

    void batch_rename(int oid) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreRename: public RequestManagerRename
{
public:
    DatastoreRename():
        RequestManagerRename("one.datastore.rename", "Renames a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name);
    }

    void batch_rename(int oid) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostRename: public RequestManagerRename
{
public:
    HostRename():
        RequestManagerRename("one.host.rename", "Renames a host")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;

        auth_op = AuthRequest::ADMIN;
    };
    ~HostRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name);
    }

    void batch_rename(int oid) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneRename : public RequestManagerRename
{
public:
    ZoneRename():
        RequestManagerRename("one.zone.rename", "Renames a zone")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
    };

    ~ZoneRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupRename: public RequestManagerRename
{
public:
    SecurityGroupRename():
        RequestManagerRename("one.secgroup.rename", "Renames a security group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcRename : public RequestManagerRename
{
public:
    VdcRename():
        RequestManagerRename("one.vdc.rename", "Renames a VDC")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
    };

    ~VdcRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterRename: public RequestManagerRename
{
public:
    VirtualRouterRename():
        RequestManagerRename("one.vrouter.rename", "Renames a virtual router")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return -1;
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceRename: public RequestManagerRename
{
public:
    MarketPlaceRename():
        RequestManagerRename("one.market.rename", "Renames a marketplace")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name);
    }

    void batch_rename(int oid) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppRename: public RequestManagerRename
{
public:
    MarketPlaceAppRename():
        RequestManagerRename("one.marketapp.rename", "Renames a marketplace app")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupRename: public RequestManagerRename
{
public:
    VMGroupRename():
        RequestManagerRename("one.vmgroup.rename", "Renames a vm group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };

    ~VMGroupRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookRename: public RequestManagerRename
{
public:
    HookRename():
        RequestManagerRename("one.hook.rename", "Renames a hook")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hkpool();
        auth_object = PoolObjectSQL::HOOK;
    };

    ~HookRename() = default;

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobRename: public RequestManagerRename
{
public:
    BackupJobRename():
        RequestManagerRename("one.backupjob.rename", "Renames a Backup Job")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_bjpool();
        auth_object = PoolObjectSQL::BACKUPJOB;
    }

    int exist(const std::string& name, int uid) override
    {
        return pool->exist(name, uid);
    }
};

#endif
