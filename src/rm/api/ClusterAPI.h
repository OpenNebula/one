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

#ifndef CLUSTER_API_H
#define CLUSTER_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAPI : public SharedAPI
{
protected:
    ClusterAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::CLUSTER);
        request.auth_op(AuthRequest::ADMIN);

        clpool = Nebula::instance().get_clpool();
        pool = clpool;
    }

    /* API calls */
    Request::ErrorCode AddHost(int oid,
                               int host_id,
                               RequestAttributes& att);

    Request::ErrorCode DelHost(int oid,
                               int host_id,
                               RequestAttributes& att);

    Request::ErrorCode AddDatastore(int oid,
                                    int ds_id,
                                    RequestAttributes& att);

    Request::ErrorCode DelDatastore(int oid,
                                    int ds_id,
                                    RequestAttributes& att);

    Request::ErrorCode AddVNet(int oid,
                               int vnet_id,
                               RequestAttributes& att);

    Request::ErrorCode DelVNet(int oid,
                               int vnet_id,
                               RequestAttributes& att);

    Request::ErrorCode Optimize(int oid,
                                RequestAttributes& att);

    Request::ErrorCode PlanExecute(int oid,
                                   RequestAttributes& att);

    Request::ErrorCode PlanDelete(int oid,
                                  RequestAttributes& att);

    /* Helpers */
    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    Request::ErrorCode action_generic(
            int                         cluster_id,
            int                         object_id,
            RequestAttributes&          att,
            PoolSQL *                   pool,
            PoolObjectSQL::ObjectType   type,
            bool                        add);

    ClusterPool* clpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ClusterAllocateAPI : public ClusterAPI
{
protected:
    ClusterAllocateAPI(Request &r)
        : ClusterAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& name,
                                int& oid,
                                RequestAttributes& att);

    Request::ErrorCode pool_allocate(std::unique_ptr<Template>   tmpl,
                                     int&                        id,
                                     RequestAttributes&          att) override;

    std::string _name;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ClusterInfoAPI : public ClusterAPI
{
protected:
    ClusterInfoAPI(Request &r)
        : ClusterAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
    }

    void load_extended_data(PoolObjectSQL *obj) const override
    {
        static_cast<Cluster*>(obj)->load_plan();
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ClusterUpdateAPI : public ClusterAPI
{
protected:
    ClusterUpdateAPI(Request &r)
        : ClusterAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }

    int extra_updates(PoolObjectSQL * obj) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ClusterRenameAPI : public ClusterAPI
{
protected:
    ClusterRenameAPI(Request &r)
        : ClusterAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }

    int exist(const std::string& name, int uid) override
    {
        return clpool->exist(name);
    }

    void batch_rename(int oid) override;
};

#endif
