/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerResourceLocked.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerRename : public RequestManagerResourceLocked
{
protected:
    RequestManagerRename(const string& method_name,
                         const string& help,
                         const string& params = "A:sis")
        :RequestManagerResourceLocked(method_name,params,help, 1)
    {
        pthread_mutex_init(&mutex, 0);

        auth_op = AuthRequest::MANAGE;
    };

    virtual ~RequestManagerRename(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                        RequestAttributes& att);

    /**
     *  Gets and object by name and owner. Default implementation returns no
     *  object
     */
    virtual PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return 0;
    }

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
        pair<set<int>::iterator,bool> rc;

        pthread_mutex_lock(&mutex);

        rc = rename_ids.insert(oid);

        pthread_mutex_unlock(&mutex);

        return rc.second == true;
    }

    /**
     *  Clear the rename.
     */
    void clear_rename(int oid)
    {
        pthread_mutex_lock(&mutex);

        rename_ids.erase(oid);

        pthread_mutex_unlock(&mutex);
    }

private:
    /**
     *  Mutex to control concurrent access to the ongoing rename operations
     */
    pthread_mutex_t mutex;

    /**
     *  Set of IDs being renamed;
     */
    set<int> rename_ids;

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

        auth_op     = nd.get_vm_auth_op(History::RENAME_ACTION);
    };

    ~VirtualMachineRename(){};
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
        RequestManagerRename("one.vn.rename","Renames a virtual network")
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
        RequestManagerRename("one.image.rename", "Renames an image")
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
        RequestManagerRename("one.document.rename", "Renames a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentRename(){};
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

    ~ClusterRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<ClusterPool*>(pool)->get(name, lock);
    };

    void batch_rename(int oid);
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

    ~DatastoreRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<DatastorePool*>(pool)->get(name, lock);
    };

    void batch_rename(int oid);
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

    ~HostRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<HostPool*>(pool)->get(name, lock);
    };

    void batch_rename(int oid);
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

    ~ZoneRename(){};
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

    ~SecurityGroupRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<SecurityGroupPool*>(pool)->get(name, uid, lock);
    };
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

    ~VdcRename(){};
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

    ~VirtualRouterRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<VirtualRouterPool*>(pool)->get(name, uid, lock);
    };
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

    ~MarketPlaceRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<MarketPlacePool*>(pool)->get(name, lock);
    };

    void batch_rename(int oid);
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

    ~MarketPlaceAppRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<MarketPlaceAppPool*>(pool)->get(name, uid, lock);
    };
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

    ~VMGroupRename(){};

    PoolObjectSQL * get(const string& name, int uid, bool lock)
    {
        return static_cast<VMGroupPool*>(pool)->get(name, uid, lock);
    };
};

#endif
