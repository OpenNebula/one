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

#include "RequestManagerVdc.h"

using namespace std;

void VdcEditGroup::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int vdc_id      = xmlrpc_c::value_int(paramList.getInt(1));
    int group_id    = xmlrpc_c::value_int(paramList.getInt(2));

    PoolObjectAuth vdc_perms;
    PoolObjectAuth group_perms;

    string vdc_name;
    string group_name;

    int rc;

    // -------------------------------------------------------------------------
    // Authorize the action
    // -------------------------------------------------------------------------

    rc = get_info(pool, vdc_id, PoolObjectSQL::VDC,
                  att, vdc_perms, vdc_name, true);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(gpool, group_id, PoolObjectSQL::GROUP, att, group_perms,
                  group_name, false);

    if ( rc == -1 && check_obj_exist )
    {
        att.resp_obj = PoolObjectSQL::GROUP;
        att.resp_id  = group_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::ADMIN, vdc_perms);         // ADMIN VDC
    ar.add_auth(AuthRequest::ADMIN, group_perms);       // ADMIN GROUP

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);
        return;
    }

    auto vdc = pool->get<Vdc>(vdc_id);

    if ( vdc == nullptr )
    {
        att.resp_id = vdc_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = edit_group(vdc.get(), group_id, att.resp_msg);

    if (rc == 0)
    {
        pool->update(vdc.get());
    }

    if (rc != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    success_response(vdc_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcAddGroup::edit_group(
        Vdc* vdc, int group_id, string& error_msg)
{
    return vdc->add_group(group_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcDelGroup::edit_group(
        Vdc* vdc, int group_id, string& error_msg)
{
    return vdc->del_group(group_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VdcEditResource::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int vdc_id   = xmlrpc_c::value_int(paramList.getInt(1));
    int zone_id  = xmlrpc_c::value_int(paramList.getInt(2));
    int res_id   = xmlrpc_c::value_int(paramList.getInt(3));

    PoolObjectAuth vdc_perms;
    PoolObjectAuth zone_perms;
    PoolObjectAuth res_perms;

    string vdc_name;
    string zone_name;
    string res_name;

    int rc;
    bool zone_exists = false;
    bool res_exists = false;

    // -------------------------------------------------------------------------
    // Authorize the action
    // -------------------------------------------------------------------------

    rc = get_info(pool, vdc_id, PoolObjectSQL::VDC, att, vdc_perms, vdc_name, true);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(zonepool, zone_id, PoolObjectSQL::ZONE, att, zone_perms,
                  zone_name, false);

    zone_exists = (rc == 0);

    if ( rc == -1 && check_obj_exist )
    {
        att.resp_obj = PoolObjectSQL::ZONE;
        att.resp_id  = zone_id;
        failure_response(NO_EXISTS, att);
        return;
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
            failure_response(NO_EXISTS, att);
            return;
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
        failure_response(AUTHORIZATION, att);
        return;
    }

    auto vdc = pool->get<Vdc>(vdc_id);

    if ( vdc == nullptr )
    {
        att.resp_id = vdc_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = edit_resource(vdc.get(), zone_id, res_id, att.resp_msg);

    if (rc == 0)
    {
        pool->update(vdc.get());
    }

    if (rc != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    success_response(vdc_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcAddCluster::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->add_cluster(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcDelCluster::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->del_cluster(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcAddHost::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->add_host(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcDelHost::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->del_host(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcAddDatastore::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->add_datastore(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcDelDatastore::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->del_datastore(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcAddVNet::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->add_vnet(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcDelVNet::edit_resource(
        Vdc* vdc, int zone_id, int res_id, string& error_msg)
{
    return vdc->del_vnet(zone_id, res_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
