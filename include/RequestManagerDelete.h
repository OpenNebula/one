/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_DELETE_H_
#define REQUEST_MANAGER_DELETE_H_

#include "Request.h"
#include "Nebula.h"
#include "AuthManager.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerDelete: public Request
{
protected:
    RequestManagerDelete(const string& method_name,
                         const string& params,
                         const string& help)
        :Request(method_name, params, help)
    {
        auth_op = AuthRequest::MANAGE;

        Nebula& nd  = Nebula::instance();
        clpool      = nd.get_clpool();
        aclm        = nd.get_aclm();
    };

    RequestManagerDelete(const string& method_name,
                         const string& help)
        :Request(method_name, "A:si", help)
    {
        auth_op = AuthRequest::MANAGE;

        Nebula& nd  = Nebula::instance();
        clpool      = nd.get_clpool();
        aclm        = nd.get_aclm();
    };

    ~RequestManagerDelete(){};


    void request_execute(xmlrpc_c::paramList const& paramList,
        RequestAttributes& att);

    ErrorCode delete_object(int oid, bool recursive,
        RequestAttributes& att, AuthRequest::Operation auth);

    /* -------------------------------------------------------------------- */

    virtual int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);

    virtual set<int> get_cluster_ids(PoolObjectSQL * object)
    {
        set<int> empty;
        return empty;
    };

    virtual int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return -1;
    };

    /* -------------------------------------------------------------------- */

    ClusterPool * clpool;

    AclManager *  aclm;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateDelete : public RequestManagerDelete
{
public:
    TemplateDelete():
        RequestManagerDelete("one.template.delete",
                             "A:sib"
                             "Deletes a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateDelete(){};

    ErrorCode request_execute(int oid, bool recursive, RequestAttributes& att)
    {
        return delete_object(oid, recursive, att, auth_op);
    }

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkTemplateDelete : public RequestManagerDelete
{
public:
    VirtualNetworkTemplateDelete():
        RequestManagerDelete("one.vntemplate.delete",
                             "A:si",
                             "Deletes a virtual network template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vntpool();
        auth_object = PoolObjectSQL::VNTEMPLATE;
    };

    ~VirtualNetworkTemplateDelete(){};

    ErrorCode request_execute(int oid, bool recursive, RequestAttributes& att)
    {
        return delete_object(oid, false, att, auth_op);
    }

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkDelete: public RequestManagerDelete
{
public:
    VirtualNetworkDelete():
        RequestManagerDelete("one.vn.delete",
                             "Deletes a virtual network")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkDelete(){};

protected:

    set<int> get_cluster_ids(PoolObjectSQL * object)
    {
        return static_cast<VirtualNetwork*>(object)->get_cluster_ids();
    };

    int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return clpool->del_from_cluster(PoolObjectSQL::NET, cluster, id, error_msg);
    };

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageDelete: public RequestManagerDelete
{
public:
    ImageDelete():
        RequestManagerDelete("one.image.delete", "Deletes an image")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageDelete(){};

    ErrorCode request_execute(int oid, RequestAttributes& att)
    {
        return delete_object(oid, false, att, auth_op);
    };

    void request_execute(xmlrpc_c::paramList const& paramList,
        RequestAttributes& att);

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostDelete : public RequestManagerDelete
{
public:
    HostDelete():
        RequestManagerDelete("one.host.delete", "Deletes a host")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
        auth_op     = AuthRequest::ADMIN;
    };

    ~HostDelete(){};

protected:

    set<int> get_cluster_ids(PoolObjectSQL * object)
    {
        set<int> ids;

        ids.insert( static_cast<Host*>(object)->get_cluster_id() );

        return ids;
    };

    int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return clpool->del_from_cluster(PoolObjectSQL::HOST, cluster, id, error_msg);
    };

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupDelete: public RequestManagerDelete
{
public:
    GroupDelete():
        RequestManagerDelete("one.group.delete", "Deletes a group")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();

        auth_object = PoolObjectSQL::GROUP;
        auth_op     = AuthRequest::ADMIN;
    };

    ~GroupDelete(){};

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserDelete: public RequestManagerDelete
{
public:
    UserDelete():
        RequestManagerDelete("one.user.delete", "Deletes a user")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        gpool       = nd.get_gpool();

        auth_object = PoolObjectSQL::USER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~UserDelete(){};

protected:

    GroupPool *  gpool;

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreDelete: public RequestManagerDelete
{
public:
    DatastoreDelete():
        RequestManagerDelete("one.datastore.delete", "Deletes a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
        auth_op     = AuthRequest::ADMIN;
    };

    ~DatastoreDelete(){};

    /* -------------------------------------------------------------------- */

    set<int> get_cluster_ids(PoolObjectSQL * object)
    {
        return static_cast<Datastore*>(object)->get_cluster_ids();
    };

    int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return clpool->del_from_cluster(PoolObjectSQL::DATASTORE, cluster, id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelete: public RequestManagerDelete
{
public:
    ClusterDelete():
        RequestManagerDelete("one.cluster.delete", "Deletes a cluster")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~ClusterDelete(){};

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentDelete : public RequestManagerDelete
{
public:
    DocumentDelete():
        RequestManagerDelete("one.document.delete",
                             "Deletes a generic document")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_docpool();
        auth_object = PoolObjectSQL::DOCUMENT;
    };

    ~DocumentDelete(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneDelete: public RequestManagerDelete
{
public:
    ZoneDelete():
        RequestManagerDelete("one.zone.delete", "Deletes a zone")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_zonepool();
        auth_object = PoolObjectSQL::ZONE;
        auth_op     = AuthRequest::ADMIN;
    };

    ~ZoneDelete(){};

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupDelete : public RequestManagerDelete
{
public:
    SecurityGroupDelete():
        RequestManagerDelete("one.secgroup.delete",
                             "Deletes a security group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_secgrouppool();
        auth_object = PoolObjectSQL::SECGROUP;
    };

    ~SecurityGroupDelete(){};

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelete: public RequestManagerDelete
{
public:
    VdcDelete():
        RequestManagerDelete("one.vdc.delete", "Deletes a VDC")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vdcpool();
        auth_object = PoolObjectSQL::VDC;
        auth_op     = AuthRequest::ADMIN;
    };

    ~VdcDelete(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterDelete : public RequestManagerDelete
{
public:
    VirtualRouterDelete():
        RequestManagerDelete("one.vrouter.delete",
                             "Deletes a virtual router")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vrouterpool();
        auth_object = PoolObjectSQL::VROUTER;
    };

    ~VirtualRouterDelete(){};

protected:
    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceDelete : public RequestManagerDelete
{
public:
    MarketPlaceDelete():
        RequestManagerDelete("one.market.delete",
                             "Deletes a marketplace")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_marketpool();
        auth_object = PoolObjectSQL::MARKETPLACE;
    };

    ~MarketPlaceDelete(){};

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppDelete : public RequestManagerDelete
{
public:
    MarketPlaceAppDelete():
        RequestManagerDelete("one.marketapp.delete",
                             "Deletes a marketplace app")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_apppool();
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
    };

    ~MarketPlaceAppDelete(){};

protected:

    int drop(PoolObjectSQL * obj, bool resive, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupDelete : public RequestManagerDelete
{
public:
    VMGroupDelete():
        RequestManagerDelete("one.vmgroup.delete",
                             "Deletes a vm group")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();
        auth_object = PoolObjectSQL::VMGROUP;
    };

    ~VMGroupDelete(){};
};

#endif

