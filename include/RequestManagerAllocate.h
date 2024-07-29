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

#ifndef REQUEST_MANAGER_ALLOCATE_H_
#define REQUEST_MANAGER_ALLOCATE_H_

#include "Request.h"
#include "Nebula.h"

#include "VirtualNetworkTemplate.h"
#include "ImageTemplate.h"
#include "VirtualMachineTemplate.h"
#include "DatastoreTemplate.h"
#include "MarketPlaceTemplate.h"

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

class RequestManagerAllocate: public Request
{
protected:
    RequestManagerAllocate(const std::string& method_name,
                           const std::string& help,
                           const std::string& xml_args,
                           bool          _do_template)
        :Request(method_name, xml_args, help), do_template(_do_template)
    {
        auth_op = AuthRequest::CREATE;

        Nebula& nd  = Nebula::instance();
        clpool      = nd.get_clpool();
    };

    ~RequestManagerAllocate() {};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    virtual bool allocate_authorization(xmlrpc_c::paramList const& _paramList,
                                        Template *obj_template, RequestAttributes&  att,
                                        PoolObjectAuth *cluster_perms);

    /* -------------------------------------------------------------------- */

    virtual std::unique_ptr<Template> get_object_template() const { return 0; };

    virtual Request::ErrorCode pool_allocate(
            xmlrpc_c::paramList const& _paramList,
            std::unique_ptr<Template> tmpl,
            int& id,
            RequestAttributes& att)
    {
        return Request::INTERNAL;
    };

    virtual Request::ErrorCode pool_allocate(
            xmlrpc_c::paramList const& _paramList,
            std::unique_ptr<Template> tmpl,
            int& id,
            RequestAttributes& att,
            int cluster_id,
            const std::string& cluster_name)
    {
        return pool_allocate(_paramList, move(tmpl), id, att);
    };

    virtual int get_cluster_id(xmlrpc_c::paramList const& paramList) const
    {
        return ClusterPool::NONE_CLUSTER_ID;
    };

    virtual int add_to_cluster(
            Cluster* cluster,
            int id,
            std::string& error_msg)
    {
        return -1;
    };

    virtual Datastore::DatastoreType get_ds_type(int oid) const
    {
        return Datastore::FILE_DS;
    };

protected:
    ClusterPool * clpool;

    int get_cluster_id(xmlrpc_c::paramList const& paramList, int cluster_pos) const
    {
        int cid = xmlrpc_c::value_int(paramList.getInt(cluster_pos));

        if (cid == -1)
        {
            cid = ClusterPool::DEFAULT_CLUSTER_ID;
        }

        return cid;
    };
private:

    bool do_template;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAllocate: public RequestManagerAllocate
{
public:
    VirtualMachineAllocate():
        RequestManagerAllocate("one.vm.allocate",
                               "Allocates a new virtual machine",
                               "A:ssb",
                               true)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachineAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualMachineTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;

    bool allocate_authorization(xmlrpc_c::paramList const&  paramList,
                                Template *obj_template, RequestAttributes&  att,
                                PoolObjectAuth *cluster_perms) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAllocate: public RequestManagerAllocate
{
public:
    VirtualNetworkAllocate():
        RequestManagerAllocate("one.vn.allocate",
                               "Allocates a new virtual network",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualNetworkTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const& _paramList,
                                     std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att,
                                     int cluster_id,
                                     const std::string& cluster_name) override;

    int get_cluster_id(xmlrpc_c::paramList const& paramList) const override
    {
        return RequestManagerAllocate::get_cluster_id(paramList, 2);
    };

    int add_to_cluster(
            Cluster* cluster,
            int id,
            std::string& error_msg) override
    {
        return clpool->add_to_cluster(PoolObjectSQL::NET, cluster, id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageAllocate: public RequestManagerAllocate
{
public:
    ImageAllocate():
        RequestManagerAllocate("one.image.allocate",
                               "Allocates a new image",
                               "A:ssib",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageAllocate() {};

    /* --------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateAllocate : public RequestManagerAllocate
{
public:
    TemplateAllocate():
        RequestManagerAllocate("one.template.allocate",
                               "Allocates a new virtual machine template",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualMachineTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;

    bool allocate_authorization(xmlrpc_c::paramList const&  paramList,
                                Template *obj_template, RequestAttributes&  att,
                                PoolObjectAuth *cluster_perms) override;
};

class VirtualNetworkTemplateAllocate : public RequestManagerAllocate
{
public:
    VirtualNetworkTemplateAllocate():
        RequestManagerAllocate("one.vntemplate.allocate",
                               "Allocates a new virtual network template",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    ~VirtualNetworkTemplateAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualMachineTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;

    bool allocate_authorization(xmlrpc_c::paramList const&  paramList,
                                Template *obj_template, RequestAttributes&  att,
                                PoolObjectAuth *cluster_perms) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostAllocate : public RequestManagerAllocate
{
public:
    HostAllocate():
        RequestManagerAllocate("one.host.allocate",
                               "Allocates a new host",
                               "A:ssssi",
                               false)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
    };

    ~HostAllocate() {};

    /* --------------------------------------------------------------------- */

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const& _paramList,
                                     std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att,
                                     int cluster_id,
                                     const std::string& cluster_name) override;

    int get_cluster_id(xmlrpc_c::paramList const& paramList) const override
    {
        return RequestManagerAllocate::get_cluster_id(paramList, 4);
    };

    int add_to_cluster(
            Cluster* cluster,
            int id,
            std::string& error_msg) override
    {
        return clpool->add_to_cluster(PoolObjectSQL::HOST, cluster, id, error_msg);;
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAllocate: public RequestManagerAllocate
{
public:
    UserAllocate():
        RequestManagerAllocate("one.user.allocate",
                               "Returns user information",
                               "A:ssssA",
                               false)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        gpool       = nd.get_gpool();
        auth_object = PoolObjectSQL::USER;

        hidden_params.insert(2); // password argument
    };

    ~UserAllocate() {};

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;

    bool allocate_authorization(xmlrpc_c::paramList const&  paramList,
                                Template *obj_template, RequestAttributes&  att,
                                PoolObjectAuth *cluster_perms) override;
private:
    GroupPool * gpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAllocate: public RequestManagerAllocate
{
public:
    GroupAllocate():
        RequestManagerAllocate("one.group.allocate",
                               "Allocates a new group",
                               "A:ss",
                               false)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();
        auth_object = PoolObjectSQL::GROUP;

        vdcpool     = nd.get_vdcpool();
    };

    ~GroupAllocate() {};

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;

private:
    VdcPool * vdcpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreAllocate: public RequestManagerAllocate
{
public:
    DatastoreAllocate():
        RequestManagerAllocate("one.datastore.allocate",
                               "Allocates a new Datastore",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
    };

    ~DatastoreAllocate() {};

    /* -------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<DatastoreTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const& _paramList,
                                     std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att,
                                     int cluster_id,
                                     const std::string& cluster_name) override;

    int get_cluster_id(xmlrpc_c::paramList const& paramList) const override
    {
        return RequestManagerAllocate::get_cluster_id(paramList, 2);
    };

    int add_to_cluster(
            Cluster* cluster,
            int id,
            std::string& error_msg) override
    {
        return clpool->add_to_cluster(PoolObjectSQL::DATASTORE, cluster, id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAllocate: public RequestManagerAllocate
{
public:
    ClusterAllocate():
        RequestManagerAllocate("one.cluster.allocate",
                               "Allocates a new cluster",
                               "A:ss",
                               false)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
    };

    ~ClusterAllocate() {};

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentAllocate : public RequestManagerAllocate
{
public:
    DocumentAllocate():
        RequestManagerAllocate("one.document.allocate",
                               "Allocates a new generic document",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<DocumentTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAllocate: public RequestManagerAllocate
{
public:
    ZoneAllocate():
        RequestManagerAllocate("one.zone.allocate",
                               "Allocates a new zone",
                               "A:ss",
                               true)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
    };

    ~ZoneAllocate() {};

    /* --------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupAllocate : public RequestManagerAllocate
{
public:
    SecurityGroupAllocate():
        RequestManagerAllocate("one.secgroup.allocate",
                               "Allocates a new security group",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAllocate : public RequestManagerAllocate
{
public:
    VdcAllocate():
        RequestManagerAllocate("one.vdc.allocate",
                               "Allocates a new VDC",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
    };

    ~VdcAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterAllocate : public RequestManagerAllocate
{
public:
    VirtualRouterAllocate():
        RequestManagerAllocate("one.vrouter.allocate",
                               "Allocates a new virtual router",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;

    bool allocate_authorization(xmlrpc_c::paramList const&  paramList,
                                Template *obj_template, RequestAttributes&  att,
                                PoolObjectAuth *cluster_perms) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAllocate : public RequestManagerAllocate
{
public:
    MarketPlaceAllocate():
        RequestManagerAllocate("one.market.allocate",
                               "Allocates a new marketplace",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<MarketPlaceTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const& _paramList,
                                     std::unique_ptr<Template>  tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppAllocate : public RequestManagerAllocate
{
public:
    MarketPlaceAppAllocate():
        RequestManagerAllocate("one.marketapp.allocate",
                               "Allocates a new marketplace app",
                               "A:ssi",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        mppool      = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<MarketPlaceAppTemplate>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const& _paramList,
                                     std::unique_ptr<Template>  tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;
private:
    MarketPlacePool * mppool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupAllocate : public RequestManagerAllocate
{
public:
    VMGroupAllocate():
        RequestManagerAllocate("one.vmgroup.allocate",
                               "Allocates a new vm group",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };

    ~VMGroupAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const&  paramList,
                                     std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookAllocate : public RequestManagerAllocate
{
public:
    HookAllocate():
        RequestManagerAllocate("one.hook.allocate",
                               "Allocates a new hook",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hkpool();
        auth_object = PoolObjectSQL::HOOK;
    };

    ~HookAllocate() {};

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    };

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const& _paramList,
                                     std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;


};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class BackupJobAllocate : public RequestManagerAllocate
{
public:
    BackupJobAllocate():
        RequestManagerAllocate("one.backupjob.allocate",
                               "Allocates a new Backup Job",
                               "A:ss",
                               true)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_bjpool();
        auth_object = PoolObjectSQL::BACKUPJOB;
    }

    /* --------------------------------------------------------------------- */

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    }

    Request::ErrorCode pool_allocate(xmlrpc_c::paramList const& _paramList,
                                     std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;


};

#endif
