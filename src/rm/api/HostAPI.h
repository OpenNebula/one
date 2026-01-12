/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef HOST_API_H
#define HOST_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "HostPool.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostAPI : public SharedAPI
{
protected:
    enum Status
    {
        ENABLED  = 0,
        DISABLED = 1,
        OFFLINE  = 2
    };

    HostAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::HOST);
        request.auth_op(AuthRequest::ADMIN);

        hpool = Nebula::instance().get_hpool();
        pool = hpool;
    }

    /* API calls */
    Request::ErrorCode status(int oid,
                              int status,
                              RequestAttributes& att);

    /* Helpers */
    std::set<int> get_cluster_ids(PoolObjectSQL * object) const override
    {
        std::set<int> ids;

        ids.insert( static_cast<Host*>(object)->get_cluster_id() );

        return ids;
    }

    int del_from_cluster(Cluster* cluster, int id, std::string& error_msg) override
    {
        auto clpool = Nebula::instance().get_clpool();

        return clpool->del_from_cluster(PoolObjectSQL::HOST, cluster, id, error_msg);
    }

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    void load_extended_data(PoolObjectSQL *obj) const override
    {
        static_cast<Host*>(obj)->load_monitoring();
    }

    int exist(const std::string& name, int uid) override
    {
        return hpool->exist(name);
    }

    void batch_rename(int oid) override;

    HostPool* hpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HostAllocateAPI : public HostAPI
{
protected:
    HostAllocateAPI(Request &r)
        : HostAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& name,
                                const std::string& im_mad,
                                const std::string& vmm_mad,
                                int cluster_id,
                                int& oid,
                                RequestAttributes& att);

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att,
                                     int cluster_id,
                                     const std::string& cluster_name) override;

    int add_to_cluster(
            Cluster* cluster,
            int id,
            std::string& error_msg) override
    {
        auto clpool = Nebula::instance().get_clpool();

        return clpool->add_to_cluster(PoolObjectSQL::HOST, cluster, id, error_msg);
    }

private:
    std::string _host_name;
    std::string _im_mad;
    std::string _vmm_mad;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HostInfoAPI : public HostAPI
{
protected:
    HostInfoAPI(Request &r)
        : HostAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HostMonitoringAPI : public HostAPI
{
protected:
    HostMonitoringAPI(Request &r)
        : HostAPI(r)
    {
        request.auth_op(AuthRequest::USE);
    }

    Request::ErrorCode monitoring(int oid, std::string& xml, RequestAttributes& att);
};

#endif
