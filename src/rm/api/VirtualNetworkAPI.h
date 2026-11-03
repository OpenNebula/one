/* -------------------------------------------------------------------------- */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUALNETWORK_API_H
#define VIRTUALNETWORK_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "VirtualNetworkPool.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAPI : public SharedAPI
{
protected:
    VirtualNetworkAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::NET);
        request.auth_op(AuthRequest::MANAGE);

        vnpool = Nebula::instance().get_vnpool();
        pool = vnpool;
    }

    /* API calls */
    Request::ErrorCode add_ar(int oid,
                              const std::string& str_tmpl,
                              RequestAttributes& att);

    Request::ErrorCode rm_ar(int oid,
                             int ar_id,
                             bool force,
                             RequestAttributes& att);

    Request::ErrorCode update(int oid,
                              const std::string& tmpl,
                              int update_type,
                              RequestAttributes& att) override;

    Request::ErrorCode update_ar(int oid,
                                 const std::string& str_tmpl,
                                 RequestAttributes& att);

    Request::ErrorCode mirror_create(int oid,
                                     const std::string& str_tmpl,
                                     int& mirror_id,
                                     RequestAttributes& att);

    Request::ErrorCode mirror_update(int oid,
                                     int mirror_id,
                                     const std::string& str_tmpl,
                                     int update_type,
                                     RequestAttributes& att);

    Request::ErrorCode mirror_update_ports(int oid,
                                           int mirror_id,
                                           const std::string& ports,
                                           bool add,
                                           RequestAttributes& att);

    Request::ErrorCode mirror_delete(int oid,
                                     int mirror_id,
                                     RequestAttributes& att);

    Request::ErrorCode reserve(int oid,
                               const std::string& str_tmpl,
                               int& rid,
                               RequestAttributes& att);

    Request::ErrorCode free_ar(int oid,
                               int ar_id,
                               RequestAttributes& att);

    Request::ErrorCode hold(int oid,
                            const std::string& str_tmpl,
                            RequestAttributes& att);

    Request::ErrorCode release(int oid,
                               const std::string& str_tmpl,
                               RequestAttributes& att);

    Request::ErrorCode recover(int oid,
                               int operation,
                               RequestAttributes& att);

    /* Helpers */
    std::set<int> get_cluster_ids(PoolObjectSQL * object) const override
    {
        return static_cast<VirtualNetwork*>(object)->get_cluster_ids();
    }

    int del_from_cluster(Cluster* cluster, int id, std::string& error_msg) override
    {
        auto clpool = Nebula::instance().get_clpool();

        return clpool->del_from_cluster(PoolObjectSQL::NET, cluster, id, error_msg);
    }

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    void to_xml(RequestAttributes& att,
                PoolObjectSQL * object,
                std::string& str) override;

    /* Authorize VirtualNetwork request, parse template, check state
     * @param oid Virtual Network ID
     * @param str_tmpl Template as a string
     * @param tmpl Returns parsed Template
     * @param vn Returns pointer to VirtualNetwork object
     * @return ErrorCode
    */
    Request::ErrorCode authorize(int oid,
                                 const std::string& str_tmpl,
                                 VirtualNetworkTemplate& tmpl,
                                 std::unique_ptr<VirtualNetwork>& vn,
                                 RequestAttributes& att);

    VirtualNetworkPool* vnpool;

private:
    Request::ErrorCode rm_ar_helper(int oid,
                                    int ar_id,
                                    bool force,
                                    RequestAttributes& att);

    Request::ErrorCode authorize_mirror(int oid,
                                        const std::string& ports,
                                        RequestAttributes& att) const;

};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualNetworkAllocateAPI : public VirtualNetworkAPI
{
protected:
    VirtualNetworkAllocateAPI(Request &r)
        : VirtualNetworkAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& str_tmpl,
                                int cluster_id,
                                int& oid,
                                RequestAttributes& att) override;

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualNetworkTemplate>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att,
                                     int cluster_id,
                                     const std::string& cluster_name) override;

    Request::ErrorCode allocate_authorization(Template *obj_template,
                                              RequestAttributes&  att,
                                              PoolObjectAuth *cluster_perms) override;

    int add_to_cluster(
            Cluster* cluster,
            int id,
            std::string& error_msg) override
    {
        auto clpool = Nebula::instance().get_clpool();

        return clpool->add_to_cluster(PoolObjectSQL::NET, cluster, id, error_msg);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualNetworkInfoAPI : public VirtualNetworkAPI
{
protected:
    VirtualNetworkInfoAPI(Request &r)
        : VirtualNetworkAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
