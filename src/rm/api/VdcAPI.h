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

#ifndef VDC_API_H
#define VDC_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "VdcPool.h"

#include "ClusterPool.h"
#include "DatastorePool.h"
#include "HostPool.h"
#include "VirtualNetworkPool.h"
#include "ZonePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAPI: public SharedAPI
{
protected:
    VdcAPI(Request &r) : SharedAPI(r)
    {
        Nebula& nd = Nebula::instance();
        vdcpool    = nd.get_vdcpool();
        aclm       = nd.get_aclm();
        gpool      = nd.get_gpool();
        zonepool    = nd.get_zonepool();
        pool = vdcpool;

        local_zone_id = nd.get_zone_id();

        request.auth_object(PoolObjectSQL::VDC);
        request.auth_op(AuthRequest::ADMIN);
    };

    virtual ~VdcAPI() = default;

    /* API calls */
    Request::ErrorCode add_group(int oid,
                                 int group_id,
                                 RequestAttributes& att);

    Request::ErrorCode del_group(int oid,
                                 int group_id,
                                 RequestAttributes& att);

    Request::ErrorCode add_cluster(int oid,
                                   int zone_id,
                                   int res_id,
                                   RequestAttributes& att);

    Request::ErrorCode del_cluster(int oid,
                                   int zone_id,
                                   int res_id,
                                   RequestAttributes& att);

    Request::ErrorCode add_host(int oid,
                                int zone_id,
                                int res_id,
                                RequestAttributes& att);

    Request::ErrorCode del_host(int oid,
                                int zone_id,
                                int res_id,
                                RequestAttributes& att);

    Request::ErrorCode add_datastore(int oid,
                                     int zone_id,
                                     int res_id,
                                     RequestAttributes& att);

    Request::ErrorCode del_datastore(int oid,
                                     int zone_id,
                                     int res_id,
                                     RequestAttributes& att);

    Request::ErrorCode add_vnet(int oid,
                                int zone_id,
                                int res_id,
                                RequestAttributes& att);

    Request::ErrorCode del_vnet(int oid,
                                int zone_id,
                                int res_id,
                                RequestAttributes& att);
    /* Helpers */
    Request::ErrorCode edit_group(int oid,
                                  int group_id,
                                  bool check_obj_exist,
                                  RequestAttributes& att,
                                  int (Vdc::*action)(int, std::string&));

    Request::ErrorCode edit_resource(int oid,
                                     int zone_id,
                                     int res_id,
                                     PoolSQL* respool,
                                     PoolObjectSQL::ObjectType res_obj_type,
                                     bool check_obj_exist,
                                     RequestAttributes& att,
                                     int (Vdc::*action)(int,int,std::string&));


    int exist(const std::string& name, int uid) override
    {
        return vdcpool->exist(name);
    }

    int local_zone_id;

    VdcPool * vdcpool;
    AclManager * aclm;
    GroupPool * gpool;
    ZonePool * zonepool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAllocateAPI : public VdcAPI
{
protected:
    VdcAllocateAPI(Request &r) : VdcAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcInfoAPI : public VdcAPI
{
protected:
    VdcInfoAPI(Request &r) : VdcAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcUpdateAPI : public VdcAPI
{
protected:
    VdcUpdateAPI(Request &r) : VdcAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcRenameAPI : public VdcAPI
{
protected:
    VdcRenameAPI(Request &r) : VdcAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }
};

#endif
