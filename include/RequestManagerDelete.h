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

#ifndef REQUEST_MANAGER_DELETE_H_
#define REQUEST_MANAGER_DELETE_H_

#include "Request.h"
#include "ClusterPool.h"
#include "Datastore.h"
#include "Host.h"
#include "VirtualNetwork.h"

class AclManager;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerDelete: public Request
{
protected:
    RequestManagerDelete(const std::string& method_name,
                         const std::string& params,
                         const std::string& help);

    RequestManagerDelete(const std::string& method_name,
                         const std::string& help);

    ~RequestManagerDelete() = default;


    void request_execute(xmlrpc_c::paramList const& paramList,
        RequestAttributes& att) override;

    ErrorCode delete_object(int oid, bool recursive, RequestAttributes& att);

    /* -------------------------------------------------------------------- */

    virtual int drop(std::unique_ptr<PoolObjectSQL> obj,
                     bool recursive,
                     RequestAttributes& att);

    virtual std::set<int> get_cluster_ids(PoolObjectSQL * object) const
    {
        std::set<int> empty;
        return empty;
    };

    virtual int del_from_cluster(Cluster* cluster, int id, std::string& error_msg)
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
    TemplateDelete();

    ~TemplateDelete() = default;

    ErrorCode request_execute(int oid, bool recursive, RequestAttributes& att)
    {
        return delete_object(oid, recursive, att);
    }

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkTemplateDelete : public RequestManagerDelete
{
public:
    VirtualNetworkTemplateDelete();

    ~VirtualNetworkTemplateDelete() = default;

    ErrorCode request_execute(int oid, bool recursive, RequestAttributes& att)
    {
        return delete_object(oid, false, att);
    }

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkDelete: public RequestManagerDelete
{
public:
    VirtualNetworkDelete();

    ~VirtualNetworkDelete() = default;

protected:

    std::set<int> get_cluster_ids(PoolObjectSQL * object) const override
    {
        return static_cast<VirtualNetwork*>(object)->get_cluster_ids();
    };

    int del_from_cluster(Cluster* cluster, int id, std::string& error_msg) override
    {
        return clpool->del_from_cluster(PoolObjectSQL::NET, cluster, id, error_msg);
    };

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ImageDelete: public RequestManagerDelete
{
public:
    ImageDelete();

    ~ImageDelete() = default;

    ErrorCode request_execute(int oid, RequestAttributes& att)
    {
        return delete_object(oid, false, att);
    };

    void request_execute(xmlrpc_c::paramList const& paramList,
        RequestAttributes& att) override;

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostDelete : public RequestManagerDelete
{
public:
    HostDelete();

    ~HostDelete() = default;

protected:

    std::set<int> get_cluster_ids(PoolObjectSQL * object) const override
    {
        std::set<int> ids;

        ids.insert( static_cast<Host*>(object)->get_cluster_id() );

        return ids;
    };

    int del_from_cluster(Cluster* cluster, int id, std::string& error_msg) override
    {
        return clpool->del_from_cluster(PoolObjectSQL::HOST, cluster, id, error_msg);
    };

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupDelete: public RequestManagerDelete
{
public:
    GroupDelete();

    ~GroupDelete() = default;

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserDelete: public RequestManagerDelete
{
public:
    UserDelete();

    ~UserDelete() = default;

protected:

    GroupPool *  gpool;

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreDelete: public RequestManagerDelete
{
public:
    DatastoreDelete();

    ~DatastoreDelete() = default;

    /* -------------------------------------------------------------------- */

    std::set<int> get_cluster_ids(PoolObjectSQL * object) const override
    {
        return static_cast<Datastore*>(object)->get_cluster_ids();
    };

    int del_from_cluster(Cluster* cluster, int id, std::string& error_msg) override
    {
        return clpool->del_from_cluster(PoolObjectSQL::DATASTORE, cluster, id, error_msg);
    };

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterDelete: public RequestManagerDelete
{
public:
    ClusterDelete();

    ~ClusterDelete() = default;

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentDelete : public RequestManagerDelete
{
public:
    DocumentDelete();

    ~DocumentDelete() = default;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneDelete: public RequestManagerDelete
{
public:
    ZoneDelete();

    ~ZoneDelete() = default;

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupDelete : public RequestManagerDelete
{
public:
    SecurityGroupDelete();

    ~SecurityGroupDelete() = default;

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelete: public RequestManagerDelete
{
public:
    VdcDelete();

    ~VdcDelete() = default;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterDelete : public RequestManagerDelete
{
public:
    VirtualRouterDelete();

    ~VirtualRouterDelete() = default;

protected:
    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceDelete : public RequestManagerDelete
{
public:
    MarketPlaceDelete();

    ~MarketPlaceDelete() = default;

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppDelete : public RequestManagerDelete
{
public:
    MarketPlaceAppDelete();

    ~MarketPlaceAppDelete() = default;

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupDelete : public RequestManagerDelete
{
public:
    VMGroupDelete();

    ~VMGroupDelete() = default;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookDelete : public RequestManagerDelete
{
public:
    HookDelete();

    ~HookDelete() = default;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class BackupJobDelete : public RequestManagerDelete
{
public:
    BackupJobDelete();

protected:

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;
};

#endif

