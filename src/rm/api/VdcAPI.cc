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

#include "VdcAPI.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                 int&                       id,
                                                 RequestAttributes&         att)
{
    int rc = vdcpool->allocate(move(tmpl), &id, att.resp_msg);

    return (rc < 0) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::edit_group(int oid,
                                      int group_id,
                                      bool check_obj_exist,
                                      RequestAttributes& att,
                                      int (Vdc::*action)(int, std::string&))
{
    PoolObjectAuth vdc_perms;
    PoolObjectAuth group_perms;

    string vdc_name;
    string group_name;

    // -------------------------------------------------------------------------
    // Authorize the action
    // -------------------------------------------------------------------------

    int rc = get_info(vdcpool, oid, PoolObjectSQL::VDC, att, vdc_perms, vdc_name, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    rc = get_info(gpool, group_id, PoolObjectSQL::GROUP, att, group_perms, group_name, false);

    if ( rc == -1 && check_obj_exist )
    {
        att.resp_obj = PoolObjectSQL::GROUP;
        att.resp_id  = group_id;

        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::ADMIN, vdc_perms);         // ADMIN VDC
    ar.add_auth(AuthRequest::ADMIN, group_perms);       // ADMIN GROUP

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    auto vdc = vdcpool->get(oid);

    if ( vdc == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ((vdc.get()->*action)(group_id, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    vdcpool->update(vdc.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::add_group(int oid,
                                     int group_id,
                                     RequestAttributes& att)
{
    return edit_group(oid, group_id, true, att, &Vdc::add_group);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::del_group(int oid,
                                     int group_id,
                                     RequestAttributes& att)
{
    return edit_group(oid, group_id, false, att, &Vdc::del_group);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::edit_resource(int oid,
                                         int zone_id,
                                         int res_id,
                                         PoolSQL* respool,
                                         PoolObjectSQL::ObjectType res_obj_type,
                                         bool check_obj_exist,
                                         RequestAttributes& att,
                                         int (Vdc::*action)(int,int,std::string&))
{
    PoolObjectAuth vdc_perms;
    PoolObjectAuth zone_perms;
    PoolObjectAuth res_perms;

    string vdc_name;
    string zone_name;
    string res_name;

    bool zone_exists = false;
    bool res_exists = false;

    // -------------------------------------------------------------------------
    // Authorize the action
    // -------------------------------------------------------------------------

    int rc = get_info(vdcpool, oid, PoolObjectSQL::VDC, att, vdc_perms, vdc_name, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    rc = get_info(zonepool, zone_id, PoolObjectSQL::ZONE, att, zone_perms, zone_name, false);

    zone_exists = (rc == 0);

    if ( rc == -1 && check_obj_exist )
    {
        att.resp_obj = PoolObjectSQL::ZONE;
        att.resp_id  = zone_id;

        return Request::NO_EXISTS;
    }

    // TODO: resource must exist in target zone, this code only checks locally
    if (res_id != Vdc::ALL_RESOURCES && zone_id == local_zone_id)
    {
        rc = get_info(respool, res_id, res_obj_type, att, res_perms, res_name, false);

        res_exists = (rc == 0);

        if ( rc == -1 && check_obj_exist )
        {
            att.resp_obj = res_obj_type;
            att.resp_id  = res_id;

            return Request::NO_EXISTS;
        }
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::ADMIN, vdc_perms);         // ADMIN VDC

    if (zone_exists)
    {
        ar.add_auth(AuthRequest::ADMIN, zone_perms);    // ADMIN ZONE
    }

    if (res_exists)
    {
        ar.add_auth(AuthRequest::ADMIN, res_perms);     // ADMIN RESOURCE
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    auto vdc = vdcpool->get(oid);

    if ( vdc == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ((vdc.get()->*action)(zone_id, res_id, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    vdcpool->update(vdc.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::add_cluster(int oid,
                                       int zone_id,
                                       int res_id,
                                       RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_clpool(),
                         PoolObjectSQL::CLUSTER,
                         true,
                         att,
                         &Vdc::add_cluster);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::del_cluster(int oid,
                                       int zone_id,
                                       int res_id,
                                       RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_clpool(),
                         PoolObjectSQL::CLUSTER,
                         false,
                         att,
                         &Vdc::del_cluster);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::add_host(int oid,
                                    int zone_id,
                                    int res_id,
                                    RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_hpool(),
                         PoolObjectSQL::HOST,
                         true,
                         att,
                         &Vdc::add_host);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::del_host(int oid,
                                    int zone_id,
                                    int res_id,
                                    RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_hpool(),
                         PoolObjectSQL::HOST,
                         false,
                         att,
                         &Vdc::del_host);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::add_datastore(int oid,
                                         int zone_id,
                                         int res_id,
                                         RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_dspool(),
                         PoolObjectSQL::DATASTORE,
                         true,
                         att,
                         &Vdc::add_datastore);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::del_datastore(int oid,
                                         int zone_id,
                                         int res_id,
                                         RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_dspool(),
                         PoolObjectSQL::DATASTORE,
                         false,
                         att,
                         &Vdc::del_datastore);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::add_vnet(int oid,
                                    int zone_id,
                                    int res_id,
                                    RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_vnpool(),
                         PoolObjectSQL::NET,
                         true,
                         att,
                         &Vdc::add_vnet);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAPI::del_vnet(int oid,
                                    int zone_id,
                                    int res_id,
                                    RequestAttributes& att)
{
    return edit_resource(oid,
                         zone_id,
                         res_id,
                         Nebula::instance().get_vnpool(),
                         PoolObjectSQL::NET,
                         false,
                         att,
                         &Vdc::del_vnet);
}
