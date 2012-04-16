/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
                         const string& help)
        :Request(method_name,"A:si",help)
    {
        auth_op = AuthRequest::MANAGE;

        Nebula& nd  = Nebula::instance();
        clpool      = nd.get_clpool();
        aclm        = nd.get_aclm();
    };

    ~RequestManagerDelete(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    bool delete_authorization(int                oid,
                              RequestAttributes& att);
                              
    /* -------------------------------------------------------------------- */

    virtual int drop(int oid, PoolObjectSQL * object, string& error_msg);

    virtual int get_cluster_id(PoolObjectSQL * object)
    {
        return ClusterPool::NONE_CLUSTER_ID;
    };

    virtual int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return -1;
    };

protected:
    ClusterPool *   clpool;
    AclManager *    aclm;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateDelete : public RequestManagerDelete
{
public:
    TemplateDelete():
        RequestManagerDelete("TemplateDelete",
                             "Deletes a virtual machine template")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_tpool();
        auth_object = PoolObjectSQL::TEMPLATE;
    };

    ~TemplateDelete(){};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkDelete: public RequestManagerDelete
{
public:
    VirtualNetworkDelete():
        RequestManagerDelete("VirtualNetworkDelete",
                             "Deletes a virtual network")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vnpool();
        auth_object = PoolObjectSQL::NET;
    };

    ~VirtualNetworkDelete(){};

    /* -------------------------------------------------------------------- */

    int get_cluster_id(PoolObjectSQL * object)
    {
        return static_cast<VirtualNetwork*>(object)->get_cluster_id();
    };

    int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->del_vnet(id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageDelete: public RequestManagerDelete
{
public:
    ImageDelete():
        RequestManagerDelete("ImageDelete", "Deletes an image")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_ipool();
        auth_object = PoolObjectSQL::IMAGE;
    };

    ~ImageDelete(){};


    /* -------------------------------------------------------------------- */

    int drop(int oid, PoolObjectSQL * object, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostDelete : public RequestManagerDelete
{
public:
    HostDelete():
        RequestManagerDelete("HostDelete", "Deletes a host")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();
        auth_object = PoolObjectSQL::HOST;
        auth_op     = AuthRequest::ADMIN;
    };

    ~HostDelete(){};

    /* -------------------------------------------------------------------- */

    int get_cluster_id(PoolObjectSQL * object)
    {
        return static_cast<Host*>(object)->get_cluster_id();
    };

    int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->del_host(id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupDelete: public RequestManagerDelete
{
public:
    GroupDelete():
        RequestManagerDelete("GroupDelete", "Deletes a group")
    {    
        Nebula& nd = Nebula::instance();
        pool       = nd.get_gpool();

        auth_object = PoolObjectSQL::GROUP;
        auth_op     = AuthRequest::ADMIN;
    };

    ~GroupDelete(){};

    /* -------------------------------------------------------------------- */

    int drop(int oid, PoolObjectSQL * object, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserDelete: public RequestManagerDelete
{
public:
    UserDelete():
        RequestManagerDelete("UserDelete", "Deletes a user")
    {    
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_upool();
        gpool       = nd.get_gpool();

        auth_object = PoolObjectSQL::USER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~UserDelete(){};

    /* -------------------------------------------------------------------- */

    GroupPool *  gpool;

    /* -------------------------------------------------------------------- */

    int drop(int oid, PoolObjectSQL * object, string& error_msg);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreDelete: public RequestManagerDelete
{
public:
    DatastoreDelete():
        RequestManagerDelete("DatastoreDelete", "Deletes a datastore")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_dspool();
        auth_object = PoolObjectSQL::DATASTORE;
        auth_op     = AuthRequest::ADMIN;
    };

    ~DatastoreDelete(){};

    /* -------------------------------------------------------------------- */

    int get_cluster_id(PoolObjectSQL * object)
    {
        return static_cast<Datastore*>(object)->get_cluster_id();
    };

    int del_from_cluster(Cluster* cluster, int id, string& error_msg)
    {
        return cluster->del_datastore(id, error_msg);
    };
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelete: public RequestManagerDelete
{
public:
    ClusterDelete():
        RequestManagerDelete("ClusterDelete", "Deletes a cluster")
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_clpool();
        auth_object = PoolObjectSQL::CLUSTER;
        auth_op     = AuthRequest::ADMIN;
    };

    ~ClusterDelete(){};
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
