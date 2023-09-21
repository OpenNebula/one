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

#include "RequestManagerAllocate.h"

#include "Nebula.h"
#include "PoolObjectSQL.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "VirtualMachineDisk.h"
#include "HookPool.h"
#include "FedReplicaManager.h"
#include "ImageManager.h"
#include "MarketPlaceManager.h"
#include "ScheduledActionPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerAllocate::allocate_authorization(
        xmlrpc_c::paramList const&  paramList,
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    string tmpl_str = "";

    AuthRequest ar(att.uid, att.group_ids);

    if ( tmpl != 0 )
    {
        tmpl->to_xml(tmpl_str);
    }

    ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str);

    if ( cluster_perms->oid != ClusterPool::NONE_CLUSTER_ID )
    {
        ar.add_auth(AuthRequest::ADMIN, *cluster_perms); // ADMIN CLUSTER
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineAllocate::allocate_authorization(
        xmlrpc_c::paramList const&  paramList,
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    AuthRequest ar(att.uid, att.group_ids);
    string      t64;
    string      aname;

    std::string memory, cpu;

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    // ------------ Check template for restricted attributes -------------------

    if (!att.is_admin())
    {
        if (ttmpl->check_restricted(aname))
        {
            att.resp_msg = "VM Template includes a restricted attribute "+aname;
            failure_response(AUTHORIZATION, att);

            return false;
        }
    }

    // ------------------ Authorize VM create operation ------------------------

    ar.add_create_auth(att.uid, att.gid, auth_object, tmpl->to_xml(t64));

    VirtualMachine::set_auth_request(att.uid, ar, ttmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return false;
    }

    // ---------------------- Check Quotas & Topology --------------------------

    if (VirtualMachine::parse_topology(ttmpl, att.resp_msg) != 0)
    {
        failure_response(ALLOCATE, att);
        return false;
    }

    VirtualMachineTemplate aux_tmpl(*ttmpl);

    VirtualMachineDisks::extended_info(att.uid, &aux_tmpl);

    aux_tmpl.get("MEMORY", memory);
    aux_tmpl.get("CPU", cpu);

    aux_tmpl.add("RUNNING_MEMORY", memory);
    aux_tmpl.add("RUNNING_CPU", cpu);
    aux_tmpl.add("RUNNING_VMS", 1);
    aux_tmpl.add("VMS", 1);

    if ( quota_authorization(&aux_tmpl, Quotas::VIRTUALMACHINE, att) == false )
    {
        return false;
    }

    vector<unique_ptr<Template>> ds_quotas;
    vector<unique_ptr<Template>> applied;

    bool ds_quota_auth = true;

    VirtualMachineDisks::image_ds_quotas(&aux_tmpl, ds_quotas);

    for (auto& quota : ds_quotas)
    {
        if ( quota_authorization(quota.get(), Quotas::DATASTORE, att) == false )
        {
            ds_quota_auth = false;
        }
        else
        {
            applied.push_back(move(quota));
        }
    }

    if ( ds_quota_auth == false )
    {
        quota_rollback(&aux_tmpl, Quotas::VIRTUALMACHINE, att);

        for (auto& quota : applied)
        {
            quota_rollback(quota.get(), Quotas::DATASTORE, att);
        }
    }

    return ds_quota_auth;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{
    unique_ptr<Template> tmpl;

    int    rc, id;

    string          cluster_name = ClusterPool::NONE_CLUSTER_NAME;
    PoolObjectAuth  cluster_perms;

    if ( do_template == true )
    {
        string str_tmpl  = xmlrpc_c::value_string(params.getString(1));

        tmpl = get_object_template();

        rc   = tmpl->parse_str_or_xml(str_tmpl, att.resp_msg);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, att);

            return;
        }
    }

    int cluster_id = get_cluster_id(params);

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att,
                cluster_perms, cluster_name, true);

        if ( rc != 0 )
        {
            return;
        }
    }
    else
    {
        cluster_perms.oid = ClusterPool::NONE_CLUSTER_ID;
    }

    if ( allocate_authorization(params, tmpl.get(), att, &cluster_perms) == false )
    {
        return;
    }

    ErrorCode ec = pool_allocate(params, move(tmpl), id, att, cluster_id, cluster_name);

    if ( ec != SUCCESS )
    {
        failure_response(ec, att);
        return;
    }

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        if (auto cluster = clpool->get(cluster_id))
        {
            rc = add_to_cluster(cluster.get(), id, att.resp_msg);
        }
        else
        {
            att.resp_obj = PoolObjectSQL::CLUSTER;
            att.resp_id  = cluster_id;
            failure_response(NO_EXISTS, att);
            return;
        }

        if ( rc < 0 )
        {
            string drop_err;

            if ( auto obj = pool->get<PoolObjectSQL>(id) )
            {
                pool->drop(obj.get(), drop_err);
            }

            failure_response(INTERNAL, att);
            return;
        }
    }

    //Take object body for hooks.
    if (auto obj = pool->get<PoolObjectSQL>(id))
    {
        obj->to_xml(att.extra_xml);
    }

    att.resp_id = id;
    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    auto sapool = Nebula::instance().get_sapool();
    auto vmpool = static_cast<VirtualMachinePool *>(pool);

    std::vector<int> sa_ids;

    bool on_hold  = false;
    bool sa_error = false;

    time_t stime  = time(0);

    if ( paramList.size() > 2 )
    {
        on_hold = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    /* ---------------------------------------------------------------------- */
    /* Save SCHED_ACTION attributes for allocation                            */
    /* ---------------------------------------------------------------------- */
    std::vector<unique_ptr<VectorAttribute>> sas;

    tmpl->remove("SCHED_ACTION", sas);

    /* ---------------------------------------------------------------------- */
    /* Allocate VirtualMachine object                                         */
    /* ---------------------------------------------------------------------- */
    Template tmpl_back(*tmpl);

    auto tmpl_ptr = static_cast<VirtualMachineTemplate*>(tmpl.release());

    unique_ptr<VirtualMachineTemplate> ttmpl(tmpl_ptr);

    int rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            move(ttmpl), &id, att.resp_msg, on_hold);

    if ( rc < 0 )
    {
        goto error_drop_vm;
    }

    /* ---------------------------------------------------------------------- */
    /* Create ScheduleAction and associate to the VM                          */
    /* ---------------------------------------------------------------------- */
    for (const auto& sa : sas)
    {
        int sa_id = sapool->allocate(PoolObjectSQL::VM, id, stime, sa.get(), att.resp_msg);

        if (sa_id < 0)
        {
            sa_error = true;
            break;
        }

        sa_ids.push_back(sa_id);
    }

    /* ---------------------------------------------------------------------- */
    /* Error creating a SCHED_ACTION rollback created objects                 */
    /* ---------------------------------------------------------------------- */
    if (sa_error)
    {
        sapool->drop_sched_actions(sa_ids);

        goto error_drop_vm;
    }

    /* ---------------------------------------------------------------------- */
    /* Associate SCHED_ACTIONS to the VM                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto vm = vmpool->get(id) )
    {
        for (const auto id: sa_ids)
        {
            vm->sched_actions().add(id);
        }

        vmpool->update(vm.get());
    }
    else
    {
        att.resp_msg = "VM deleted while setting up SCHED_ACTION";

        sapool->drop_sched_actions(sa_ids);

        return Request::INTERNAL;
    }

    return Request::SUCCESS;

error_drop_vm:
    vector<unique_ptr<Template>> ds_quotas;
    std::string memory, cpu;

    tmpl_back.get("MEMORY", memory);
    tmpl_back.get("CPU", cpu);

    tmpl_back.add("RUNNING_MEMORY", memory);
    tmpl_back.add("RUNNING_CPU", cpu);
    tmpl_back.add("RUNNING_VMS", 1);
    tmpl_back.add("VMS", 1);

    quota_rollback(&tmpl_back, Quotas::VIRTUALMACHINE, att);

    VirtualMachineDisks::extended_info(att.uid, &tmpl_back);

    VirtualMachineDisks::image_ds_quotas(&tmpl_back, ds_quotas);

    for (auto& quota : ds_quotas)
    {
        quota_rollback(quota.get(), Quotas::DATASTORE, att);
    }

    return Request::INTERNAL;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    VirtualNetworkPool * vpool = static_cast<VirtualNetworkPool *>(pool);
    unique_ptr<VirtualNetworkTemplate> vtmpl(
        static_cast<VirtualNetworkTemplate*>(tmpl.release()));

    set<int> cluster_ids;

    if (cluster_id != ClusterPool::NONE_CLUSTER_ID)
    {
        cluster_ids.insert(cluster_id);
    }

    int rc = vpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,-1,
            move(vtmpl), &id, cluster_ids, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{
    string size_str;

    long long     size_mb;
    istringstream iss;
    ostringstream oss;

    string ds_name;
    string ds_data;
    string ds_mad;
    string tm_mad;
    string ds_driver;

    bool ds_persistent_only;
    bool check_capacity =  true;

    Datastore::DatastoreType ds_type;

    int    rc, id;

    PoolObjectAuth ds_perms;

    string str_tmpl = xmlrpc_c::value_string(params.getString(1));
    int    ds_id    = xmlrpc_c::value_int(params.getInt(2));

    if ( params.size() > 3 && att.is_admin() )
    {
        check_capacity = xmlrpc_c::value_boolean(params.getBoolean(3));
    }

    Nebula&  nd  = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImagePool *     ipool  = static_cast<ImagePool *>(pool);
    ImageManager *  imagem = nd.get_imagem();

    MarketPlacePool *     marketpool = nd.get_marketpool();
    MarketPlaceAppPool *  apppool    = nd.get_apppool();

    Template img_usage;

    Image::DiskType ds_disk_type;

    int app_id;
    int market_id;

    long long avail;

    bool ds_check;
    bool persistent_attr;

    string extra_data = "";

    // ------------------------- Parse image template --------------------------

    auto tmpl = make_unique<ImageTemplate>();

    rc = tmpl->parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);

        return;
    }

    // ------------------------- Check Datastore exists ------------------------
    if ( auto ds = dspool->get_ro(ds_id) )
    {

        ds_type = ds->get_type();

        if ( ds_type == Datastore::SYSTEM_DS || ds_type == Datastore::BACKUP_DS)
        {
            att.resp_msg = "New images can only be allocated in a files or image datastore.";
            failure_response(ALLOCATE, att);

            return;
        }

        ds->get_permissions(ds_perms);

        ds_name  = ds->get_name();
        ds_check = ds->get_avail_mb(avail) && check_capacity;
        ds_mad   = ds->get_ds_mad();
        tm_mad   = ds->get_tm_mad();

        ds_disk_type       = ds->get_disk_type();
        ds_persistent_only = ds->is_persistent_only();

        ds->get_template_attribute("DRIVER", ds_driver);

        ds->decrypt();

        ds->to_xml(ds_data);
    }
    else
    {
        att.resp_id  = ds_id;
        att.resp_obj = PoolObjectSQL::DATASTORE;
        failure_response(NO_EXISTS, att);

        return;
    }


    // --------------- Get the SIZE for the Image, (DS driver) -----------------

    if ( tmpl->get("FROM_APP", app_id) )
    {
        // This image comes from a MarketPlaceApp. Get the Market info and
        // the size.
        if ( auto app = apppool->get_ro(app_id) )
        {
            app->to_template(tmpl.get());

            size_mb   = app->get_size();
            market_id = app->get_market_id();
        }
        else
        {
            att.resp_msg = "Cannot determine image SIZE.";
            failure_response(INTERNAL, att);

            return;
        }

        if ( auto market = marketpool->get_ro(market_id) )
        {
            market->to_xml(extra_data);

            oss << size_mb;
            size_str = oss.str();

            //Do not use DRIVER from APP but from Datastore
            if (!ds_driver.empty() )
            {
                tmpl->erase("DRIVER");
            }
        }
        else
        {
            att.resp_msg = "Could not get the appliance's market.";
            failure_response(INTERNAL, att);

            return;
        }
    }
    else
    {
        if ( tmpl->get("FROM_BACKUP_DS", app_id) )
        {
            string bck_ds_data;

            if ( auto ds = dspool->get_ro(app_id) )
            {
                ds->decrypt();

                ds->to_xml(bck_ds_data);
            }
            else
            {
                att.resp_msg = "Could not get associated backup datastore.";
                failure_response(INTERNAL, att);

                return;
            }

            rc = imagem->stat_image(tmpl.get(), bck_ds_data, size_str);
        }
        else
        {
            rc = imagem->stat_image(tmpl.get(), ds_data, size_str);
        }

        if ( rc == -1 )
        {
            att.resp_msg = "Cannot parse image SIZE: " + size_str;
            failure_response(INTERNAL, att);

            return;
        }

        iss.str(size_str);
        iss >> size_mb;

        if ( iss.fail() )
        {
            att.resp_msg = "Cannot parse image SIZE: " + size_str;
            failure_response(INTERNAL, att);

            return;
        }
    }

    if (ds_check && (size_mb > avail))
    {
        att.resp_msg = "Not enough space in datastore";
        failure_response(ACTION, att);

        return;
    }

    tmpl->erase("SIZE");
    tmpl->add("SIZE", size_str);

    // ------------- Set authorization request for non-oneadmin's --------------

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size_str);

    AuthRequest ar(att.uid, att.group_ids);
    string  tmpl_str;
    string  aname;

    // ------------ Check template for restricted attributes  --------------

    if (!att.is_admin())
    {
        if (tmpl->check_restricted(aname))
        {
            att.resp_msg = "Template includes a restricted attribute "+aname;
            failure_response(AUTHORIZATION, att);

            return;
        }
    }

    // ------------------ Check permissions and ACLs  ----------------------
    tmpl->to_xml(tmpl_str);

    ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str);

    ar.add_auth(AuthRequest::USE, ds_perms); // USE DATASTORE

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // -------------------------- Check Quotas  ----------------------------

    if ( quota_authorization(&img_usage, Quotas::DATASTORE, att) == false )
    {
        return;
    }

    // ------------------------- Check persistent only -------------------------

    persistent_attr = Image::test_set_persistent(tmpl.get(), att.uid, att.gid, true);

    if ( ds_persistent_only && persistent_attr == false )
    {
        att.resp_msg = "This Datastore only accepts persistent images.";
        failure_response(ALLOCATE, att);

        return;
    }

    // ------------------------- Allocate --------------------------------------

    rc = ipool->allocate(att.uid,
                         att.gid,
                         att.uname,
                         att.gname,
                         att.umask,
                         move(tmpl),
                         ds_id,
                         ds_name,
                         ds_disk_type,
                         ds_data,
                         ds_type,
                         ds_mad,
                         tm_mad,
                         extra_data,
                         -1,
                         &id,
                         att.resp_msg);
    if ( rc < 0 )
    {
        quota_rollback(&img_usage, Quotas::DATASTORE, att);

        failure_response(ALLOCATE, att);
        return;
    }

    if ( auto ds = dspool->get(ds_id) )  // TODO: error otherwise or leave image in ERROR?
    {
        ds->add_image(id);

        dspool->update(ds.get());
    }

    // Take image body for Hooks
    if (auto img = ipool->get(id))
    {
        img->to_xml(att.extra_xml);
    }

    att.resp_id = id;
    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode TemplateAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    VMTemplatePool * tpool = static_cast<VMTemplatePool *>(pool);

    unique_ptr<VirtualMachineTemplate> ttmpl(
        static_cast<VirtualMachineTemplate *>(tmpl.release()));

    int rc = tpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        move(ttmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool TemplateAllocate::allocate_authorization(
        xmlrpc_c::paramList const&  paramList,
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    AuthRequest ar(att.uid, att.group_ids);
    string      aname;

    if (!RequestManagerAllocate::allocate_authorization(paramList, tmpl, att, cluster_perms))
    {
        return false;
    }

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    // ------------ Check template for restricted attributes -------------------
    if (!att.is_admin())
    {
        if (ttmpl->check_restricted(aname))
        {
            att.resp_msg = "VM Template includes a restricted attribute "+aname;

            failure_response(AUTHORIZATION, att);
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


Request::ErrorCode VirtualNetworkTemplateAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    VNTemplatePool * vnpool = static_cast<VNTemplatePool *>(pool);

    unique_ptr<VirtualNetworkTemplate> ttmpl(
        static_cast<VirtualNetworkTemplate *>(tmpl.release()));

    int rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        move(ttmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualNetworkTemplateAllocate::allocate_authorization(
		xmlrpc_c::paramList const&  paramList,
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    AuthRequest ar(att.uid, att.group_ids);
    string      aname;

    if (!RequestManagerAllocate::allocate_authorization(paramList, tmpl, att, cluster_perms))
    {
        return false;
    }

    VirtualNetworkTemplate * ttmpl = static_cast<VirtualNetworkTemplate *>(tmpl);

    // ------------ Check template for restricted attributes -------------------
    if (!att.is_admin())
    {
        if (ttmpl->check_restricted(aname))
        {
            att.resp_msg = "VM Template includes a restricted attribute "+aname;

            failure_response(AUTHORIZATION, att);
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode HostAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    string host    = xmlrpc_c::value_string(paramList.getString(1));
    string im_mad  = xmlrpc_c::value_string(paramList.getString(2));
    string vmm_mad = xmlrpc_c::value_string(paramList.getString(3));

    HostPool * hpool = static_cast<HostPool *>(pool);

    int rc = hpool->allocate(&id, host, im_mad, vmm_mad, cluster_id, cluster_name,
            att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool UserAllocate::allocate_authorization(
		xmlrpc_c::paramList const&  paramList,
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    vector<xmlrpc_c::value> param_arr;

    if ( paramList.size() > 4 )
    {
        param_arr = xmlrpc_c::value_array(
                paramList.getArray(4)).vectorValueValue();
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_create_auth(att.uid, att.gid, auth_object, "");

    for (auto it = param_arr.begin(); it != param_arr.end(); it++)
    {
        int tmp_gid = xmlrpc_c::value_int(*it);

        auto group = gpool->get_ro(tmp_gid);

        if (group == nullptr)
        {
            att.resp_id  = tmp_gid;
            att.resp_obj = PoolObjectSQL::GROUP;

			failure_response(NO_EXISTS, att);
            return false;
        }

        // Users can be created in request group if USE CREATE is granted for it
        // Other groups needs MANAGE permission.
        if (att.gid != tmp_gid)
        {
            PoolObjectAuth perms;

            group->get_permissions(perms);

            ar.add_auth(AuthRequest::MANAGE, perms); // MANAGE GROUP
        }
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    string uname  = xmlrpc_c::value_string(paramList.getString(1));
    string passwd = xmlrpc_c::value_string(paramList.getString(2));
    string driver = xmlrpc_c::value_string(paramList.getString(3));

    set<int> gids;
    set<int> agids;

    int gid = -1;

    vector<xmlrpc_c::value> param_arr;

    if ( paramList.size() > 4 )
    {
        param_arr = xmlrpc_c::value_array(
                paramList.getArray(4)).vectorValueValue();
    }

    AuthRequest ar(att.uid, att.group_ids);

    for (auto it = param_arr.begin(); it != param_arr.end(); it++)
    {
        int tmp_gid = xmlrpc_c::value_int(*it);

        gids.insert(tmp_gid);

        if ( gid == -1 ) //First gid is the primary group
        {
            gid = tmp_gid;
        }
    }

    if (gids.empty())
    {
        if ( att.gid == GroupPool::ONEADMIN_ID )
        {
            gid = GroupPool::USERS_ID;
            gids.insert(GroupPool::USERS_ID);
        }
        else
        {
            gid = att.gid;
            gids.insert(att.gid);
        }
    }

    if (driver.empty())
    {
        driver = UserPool::CORE_AUTH;
    }

    int rc = static_cast<UserPool *>(pool)->allocate(&id, uname, gid, passwd,
            driver, true, gids, agids, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    int rc;

    string gname = xmlrpc_c::value_string(paramList.getString(1));

    GroupPool * gpool = static_cast<GroupPool *>(pool);

    rc = gpool->allocate(gname, &id, att.resp_msg);

    if (rc == -1)
    {
        return Request::INTERNAL;
    }

    if (auto vdc = vdcpool->get(VdcPool::DEFAULT_ID))
    {
        rc = vdc->add_group(id, att.resp_msg);

        vdcpool->update(vdc.get());
    }

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode DatastoreAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    DatastorePool * dspool      = static_cast<DatastorePool *>(pool);
    unique_ptr<DatastoreTemplate> ds_tmpl(
        static_cast<DatastoreTemplate *>(tmpl.release()));

    set<int> cluster_ids;

    if (cluster_id != ClusterPool::NONE_CLUSTER_ID)
    {
        cluster_ids.insert(cluster_id);
    }

    int rc = dspool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            move(ds_tmpl), &id, cluster_ids, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    string name = xmlrpc_c::value_string(paramList.getString(1));

    ClusterPool * clpool = static_cast<ClusterPool *>(pool);

    int rc = clpool->allocate(name, &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode DocumentAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    int type = xmlrpc_c::value_int(paramList.getInt(2));

    DocumentPool * docpool = static_cast<DocumentPool *>(pool);

    int rc = docpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            type, move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneAllocate::request_execute(xmlrpc_c::paramList const& params,
                                   RequestAttributes& att)
{
    if(!Nebula::instance().is_federation_master())
    {
        att.resp_msg = "New zones can only be created at federation master";
        failure_response(ALLOCATE, att);
        return;
    }

    RequestManagerAllocate::request_execute(params, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ZoneAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    ZonePool * zonepool = static_cast<ZonePool *>(pool);

    int rc = zonepool->allocate(move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    Nebula::instance().get_frm()->add_zone(id);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SecurityGroupAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    SecurityGroupPool * sgpool = static_cast<SecurityGroupPool *>(pool);

    int rc = sgpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VdcAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    VdcPool * vdcpool = static_cast<VdcPool *>(pool);

    int rc = vdcpool->allocate(move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualRouterAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    VirtualRouterPool * vrpool = static_cast<VirtualRouterPool *>(pool);

    int rc = vrpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualRouterAllocate::allocate_authorization(
		xmlrpc_c::paramList const&  paramList,
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    AuthRequest ar(att.uid, att.group_ids);
    string      tmpl_str;

    // ------------------ Authorize create operation ------------------------

    ar.add_create_auth(att.uid, att.gid, auth_object, tmpl->to_xml(tmpl_str));

    VirtualRouter::set_auth_request(att.uid, ar, tmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return false;
    }

    // -------------------------- Check Quotas  ----------------------------

    if (quota_authorization(tmpl, Quotas::VIRTUALROUTER, att, att.resp_msg) == false)
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode MarketPlaceAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    MarketPlacePool *     mppool = static_cast<MarketPlacePool *>(pool);
    unique_ptr<MarketPlaceTemplate> ttmpl(
        static_cast<MarketPlaceTemplate*>(tmpl.release()));

    int rc = mppool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        move(ttmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode MarketPlaceAppAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    MarketPlaceManager*    marketm = Nebula::instance().get_marketm();

    MarketPlaceAppPool*     appool = static_cast<MarketPlaceAppPool *>(pool);
    unique_ptr<MarketPlaceAppTemplate> ttmpl(
        static_cast<MarketPlaceAppTemplate *>(tmpl.release()));

    int         mp_id = xmlrpc_c::value_int(paramList.getInt(2));
    std::string mp_data;
    std::string mp_name;

    // ---------------------------------------------------------------------- //
    // Get Marketplace information for this app                               //
    // ---------------------------------------------------------------------- //
    if ( auto mp = mppool->get_ro(mp_id) )
    {
        mp_name = mp->get_name();

        if ( !mp->is_action_supported(MarketPlaceApp::CREATE) )
        {
            att.resp_msg = "Create disabled for market: " + mp_name;

            return Request::ACTION;
        }

        if ( mp->get_zone_id() != Nebula::instance().get_zone_id() )
        {
            att.resp_msg = "Marketplace is not in this OpenNebula zone";

            return Request::ACTION;
        }

        mp->to_xml(mp_data);
    }
    else
    {
        att.resp_msg = "Cannot find associated MARKETPLACE";
        return Request::INTERNAL;
    }

    // ---------------------------------------------------------------------- //
    // Allocate MarketPlaceApp request is forwarded to master for slaves      //
    // ---------------------------------------------------------------------- //
    int rc = appool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                move(ttmpl), mp_id, mp_name, &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    if ( auto mp = mppool->get(mp_id) )
    {
        mp->add_marketapp(id);

        mppool->update(mp.get());
    }
    else
    {
        att.resp_msg = "Marketplace no longer exists";

        if ( auto app = appool->get(id) )
        {
            string aux_str;

            appool->drop(app.get(), aux_str);
        }

        return Request::INTERNAL;
    }

    // ---------------------------------------------------------------------- //
    // Send request operation to market driver                                //
    // ---------------------------------------------------------------------- //
    if (marketm->import_app(id, mp_data, att.resp_msg) == -1)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMGroupAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    VMGroupPool * vmgpool = static_cast<VMGroupPool *>(pool);

    int rc = vmgpool->allocate(att.uid, att.gid, att.uname, att.gname,
                               att.umask, move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode HookAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    std::string hk_type;

    HookPool * hkpool = static_cast<HookPool *>(pool);

    tmpl->get("TYPE", hk_type);

    if (Hook::str_to_hook_type(hk_type) == Hook::UNDEFINED)
    {
        ostringstream oss;

        oss << "Invalid Hook type: " << hk_type;
        att.resp_msg = oss.str();

        return Request::INTERNAL;
    }

    id = hkpool->allocate(move(tmpl), att.resp_msg);

    if (id < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode BackupJobAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    /* ---------------------------------------------------------------------- */
    /* Get SCHED_ACTION attributes                                            */
    /* ---------------------------------------------------------------------- */
    std::vector<unique_ptr<VectorAttribute>> sas;

    tmpl->remove("SCHED_ACTION", sas);

    int priority;
    if (tmpl->get("PRIORITY", priority))
    {
        if (priority < BackupJob::MIN_PRIO || priority > BackupJob::MAX_PRIO)
        {
            att.resp_msg = "Wrong priority value";
            return Request::INTERNAL;
        }

        if (!att.is_admin() && priority > 50)
        {
            return Request::AUTHORIZATION;
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Create BackupJob object                                                */
    /* ---------------------------------------------------------------------- */
    BackupJobPool * bjpool = static_cast<BackupJobPool *>(pool);

    int rc = bjpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                     move(tmpl), &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    if (sas.empty())
    {
        return Request::SUCCESS;
    }

    /* ---------------------------------------------------------------------- */
    /* Create ScheduleAction and associate to the BackupJob                   */
    /* ---------------------------------------------------------------------- */
    auto sapool = Nebula::instance().get_sapool();

    std::vector<int> sa_ids;

    bool sa_error = false;

    for (auto& sa : sas)
    {
        sa->remove("ARGS");  // ARGS not used for Backup Job Scheduled Action

        int sa_id = sapool->allocate(PoolObjectSQL::BACKUPJOB, id, 0, sa.get(),
                att.resp_msg);

        if (sa_id < 0)
        {
            sa_error = true;
            break;
        }
        else
        {
            sa_ids.push_back(sa_id);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Error creating a SCHED_ACTION rollback created objects                 */
    /* ---------------------------------------------------------------------- */
    if (sa_error)
    {
        sapool->drop_sched_actions(sa_ids);

        if ( auto bj = bjpool->get(id) )
        {
            string error;

            bjpool->drop(bj.get(), error);
        }

        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /* Associate SCHED_ACTIONS to the BackupJob                               */
    /* ---------------------------------------------------------------------- */
    if ( auto bj = bjpool->get(id) )
    {
        for (const auto id: sa_ids)
        {
            bj->sched_actions().add(id);
        }

        bjpool->update(bj.get());
    }
    else
    {
        // BackupJob no longer exits, delete SchedActions
        sapool->drop_sched_actions(sa_ids);

        att.resp_msg = "BACKUPJOB deleted while setting up SCHED_ACTION";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
