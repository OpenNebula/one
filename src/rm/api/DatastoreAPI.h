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

#ifndef DATASTORE_API_H
#define DATASTORE_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "DatastorePool.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreAPI : public SharedAPI
{
protected:
    DatastoreAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::DATASTORE);
        request.auth_op(AuthRequest::MANAGE);

        dspool = Nebula::instance().get_dspool();
        pool = dspool;
    }

    /* API calls */
    Request::ErrorCode enable(int oid,
                              bool enable_flag,
                              RequestAttributes& att);

    /* Helpers */
    std::set<int> get_cluster_ids(PoolObjectSQL * object) const override
    {
        return static_cast<Datastore*>(object)->get_cluster_ids();
    }

    int del_from_cluster(Cluster* cluster, int id, std::string& error_msg) override
    {
        auto clpool = Nebula::instance().get_clpool();

        return clpool->del_from_cluster(PoolObjectSQL::DATASTORE, cluster, id, error_msg);
    }

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    int exist(const std::string& name, int uid) override
    {
        return dspool->exist(name);
    }

    void batch_rename(int oid) override;

    Request::ErrorCode check_name_unique(int oid, int noid, RequestAttributes& att) override
    {
        return Request::SUCCESS;
    }

    DatastorePool* dspool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class DatastoreAllocateAPI : public DatastoreAPI
{
protected:
    DatastoreAllocateAPI(Request &r)
        : DatastoreAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& str_tmpl,
                                int cluster_id,
                                int& oid,
                                RequestAttributes& att) override;

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<DatastoreTemplate>();
    }

    Request::ErrorCode pool_allocate(
            std::unique_ptr<Template> tmpl,
            int& id,
            RequestAttributes& att,
            int cluster_id,
            const std::string& cluster_name) override;

    int add_to_cluster(
            Cluster* cluster,
            int oid,
            std::string& error_msg) override
    {
        auto clpool = Nebula::instance().get_clpool();

        return clpool->add_to_cluster(PoolObjectSQL::DATASTORE, cluster, oid, error_msg);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class DatastoreInfoAPI : public DatastoreAPI
{
protected:
    DatastoreInfoAPI(Request &r)
        : DatastoreAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
