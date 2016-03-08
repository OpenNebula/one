/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerAllocate::allocate_authorization(
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    if ( att.uid == 0 )
    {
        return true;
    }

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
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    if ( att.uid == 0 )
    {
        return true;
    }

    AuthRequest ar(att.uid, att.group_ids);
    string      t64;
    string      aname;

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    // ------------ Check template for restricted attributes -------------------

    if ( att.uid != 0 && att.gid != GroupPool::ONEADMIN_ID )
    {
        if (ttmpl->check(aname))
        {
            att.resp_msg = "VM Template includes a restricted attribute "+aname;
            failure_response(AUTHORIZATION, att);

            return false;
        }
    }

    // ------------------ Authorize VM create operation ------------------------

    ar.add_create_auth(att.uid, att.gid, auth_object, tmpl->to_xml(t64));

    VirtualMachine::set_auth_request(att.uid, ar, ttmpl);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return false;
    }

    // -------------------------- Check Quotas  ----------------------------

    VirtualMachineTemplate aux_tmpl(*ttmpl);

    VirtualMachine::disk_extended_info(att.uid, &aux_tmpl);

    if ( quota_authorization(&aux_tmpl, Quotas::VIRTUALMACHINE, att) == false )
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{
    Template * tmpl = 0;

    int    rc, id;

    Cluster *       cluster      = 0;
    int             cluster_id   = ClusterPool::NONE_CLUSTER_ID;
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
            delete tmpl;

            return;
        }
    }

    cluster_id = get_cluster_id(params);

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att,
                cluster_perms, cluster_name, true);

        if ( rc != 0 )
        {
            delete tmpl;
            return;
        }
    }
    else
    {
        cluster_perms.oid = ClusterPool::NONE_CLUSTER_ID;
    }

    if ( allocate_authorization(tmpl, att, &cluster_perms) == false )
    {
        delete tmpl;
        return;
    }

    rc = pool_allocate(params, tmpl, id, att, cluster_id, cluster_name);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        Datastore::DatastoreType ds_type = get_ds_type(id);

        cluster = clpool->get(cluster_id, true);

        if ( cluster == 0 )
        {
            att.resp_obj = PoolObjectSQL::CLUSTER;
            att.resp_id  = cluster_id;
            failure_response(NO_EXISTS, att);
            return;
        }

        rc = add_to_cluster(cluster, id, ds_type, att.resp_msg);

        if ( rc < 0 )
        {
            string drop_err;
            PoolObjectSQL * obj = 0;

            cluster->unlock();

            obj = pool->get(id, true);

            if ( obj != 0 )
            {
                pool->drop(obj, drop_err);
                obj->unlock();
            }

            failure_response(INTERNAL, att);
            return;
        }

        clpool->update(cluster);

        cluster->unlock();
    }

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    bool on_hold = false;

    if ( paramList.size() > 2 )
    {
        on_hold = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    VirtualMachineTemplate * ttmpl= static_cast<VirtualMachineTemplate *>(tmpl);
    VirtualMachinePool * vmpool   = static_cast<VirtualMachinePool *>(pool);

    Template tmpl_back(*tmpl);

    int rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            ttmpl, &id, att.resp_msg, on_hold);

    if ( rc < 0 )
    {
        quota_rollback(&tmpl_back, Quotas::VIRTUALMACHINE, att);
    }

    return rc;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    VirtualNetworkPool * vpool = static_cast<VirtualNetworkPool *>(pool);
    VirtualNetworkTemplate * vtmpl=static_cast<VirtualNetworkTemplate *>(tmpl);

    return vpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,-1,
            vtmpl, &id, cluster_id, cluster_name, att.resp_msg);
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

    bool   ds_persistent_only;

    Datastore::DatastoreType ds_type;

    int    rc, id;

    PoolObjectAuth ds_perms;

    string str_tmpl = xmlrpc_c::value_string(params.getString(1));
    int    ds_id    = xmlrpc_c::value_int(params.getInt(2));

    Nebula&  nd  = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImagePool *     ipool  = static_cast<ImagePool *>(pool);
    ImageManager *  imagem = nd.get_imagem();

    MarketPlacePool *     marketpool = nd.get_marketpool();
    MarketPlaceAppPool *  apppool    = nd.get_apppool();

    ImageTemplate * tmpl;
    Template        img_usage;

    Datastore *     ds;
    Image::DiskType ds_disk_type;

    MarketPlaceApp *  app;
    MarketPlace *     market;
    int               app_id;
    int               market_id;

    long long       avail;

    bool ds_check;
    bool persistent_attr;

    string extra_data = "";

    // ------------------------- Parse image template --------------------------

    tmpl = new ImageTemplate;

    rc = tmpl->parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);

        delete tmpl;
        return;
    }

    // ------------------------- Check Datastore exists ------------------------

    if ((ds = dspool->get(ds_id,true)) == 0 )
    {
        att.resp_id  = ds_id;
        att.resp_obj = PoolObjectSQL::DATASTORE;
        failure_response(NO_EXISTS, att);

        delete tmpl;
        return;
    }

    ds_type = ds->get_type();

    if ( ds_type == Datastore::SYSTEM_DS )
    {
        ds->unlock();

        att.resp_msg = "New images cannot be allocated in a system datastore.";
        failure_response(ALLOCATE, att);

        delete tmpl;
        return;
    }

    ds->get_permissions(ds_perms);

    ds_name            = ds->get_name();
    ds_disk_type       = ds->get_disk_type();
    ds_check           = ds->get_avail_mb(avail);
    ds_persistent_only = ds->is_persistent_only();

    ds->to_xml(ds_data);

    ds->unlock();

    // --------------- Get the SIZE for the Image, (DS driver) -----------------

    if ( tmpl->get("FROM_APP", app_id ) )
    {
        // This image comes from a MarketPlaceApp. Get the Market info and
        // the size.
        app = apppool->get(app_id, true);

        if ( app == 0 )
        {
            att.resp_msg = "Cannot determine image SIZE.";
            failure_response(INTERNAL, att);

            delete tmpl;
            return;
        }

        app->to_template(tmpl);

        size_mb   = app->get_size();
        market_id = app->get_market_id();

        app->unlock();

        market = marketpool->get(market_id, true);

        if ( market == 0 )
        {
            att.resp_msg = "Could not get the appliance's market.";
            failure_response(INTERNAL, att);

            delete tmpl;
            return;
        }

        market->to_xml(extra_data);

        market->unlock();

        oss << size_mb;
        size_str = oss.str();
    }
    else
    {
        rc = imagem->stat_image(tmpl, ds_data, size_str);

        if ( rc == -1 )
        {
            att.resp_msg = "Cannot parse image SIZE: " + size_str;
            failure_response(INTERNAL, att);

            delete tmpl;
            return;
        }

        iss.str(size_str);
        iss >> size_mb;

        if ( iss.fail() )
        {
            att.resp_msg = "Cannot parse image SIZE: " + size_str;
            failure_response(INTERNAL, att);

            delete tmpl;
            return;
        }
    }

    if (ds_check && (size_mb > avail))
    {
        att.resp_msg = "Not enough space in datastore";
        failure_response(ACTION, att);

        delete tmpl;
        return;
    }

    tmpl->erase("SIZE");
    tmpl->add("SIZE", size_str);

    // ------------- Set authorization request for non-oneadmin's --------------

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size_str);

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);
        string  tmpl_str;
        string  aname;

        // ------------ Check template for restricted attributes  --------------

        if ( att.uid != UserPool::ONEADMIN_ID && att.gid != GroupPool::ONEADMIN_ID )
        {
            if (tmpl->check(aname))
            {
                att.resp_msg = "Template includes a restricted attribute "+aname;
                failure_response(AUTHORIZATION, att);

                delete tmpl;
                return;
            }
        }

        // ------------------ Check permissions and ACLs  ----------------------
        tmpl->to_xml(tmpl_str);

        ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str); // CREATE IMAGE

        ar.add_auth(AuthRequest::USE, ds_perms); // USE DATASTORE

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);

            delete tmpl;
            return;
        }

        // -------------------------- Check Quotas  ----------------------------

        if ( quota_authorization(&img_usage, Quotas::DATASTORE, att) == false )
        {
            delete tmpl;
            return;
        }
    }

    // ------------------------- Check persistent only -------------------------

    tmpl->get("PERSISTENT", persistent_attr);

    if ( ds_persistent_only && persistent_attr == false )
    {
        att.resp_msg = "This Datastore only accepts persistent images.";
        failure_response(ALLOCATE, att);

        delete tmpl;
        return;
    }

    // ------------------------- Allocate --------------------------------------

    rc = ipool->allocate(att.uid,
                         att.gid,
                         att.uname,
                         att.gname,
                         att.umask,
                         tmpl,
                         ds_id,
                         ds_name,
                         ds_disk_type,
                         ds_data,
                         ds_type,
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

    ds = dspool->get(ds_id, true);

    if ( ds != 0 )  // TODO: error otherwise or leave image in ERROR?
    {
        ds->add_image(id);

        dspool->update(ds);

        ds->unlock();
    }

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TemplateAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    VMTemplatePool * tpool = static_cast<VMTemplatePool *>(pool);

    VirtualMachineTemplate * ttmpl=static_cast<VirtualMachineTemplate *>(tmpl);

    return tpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        ttmpl, &id, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool TemplateAllocate::allocate_authorization(
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    if ( att.uid == UserPool::ONEADMIN_ID || att.gid == GroupPool::ONEADMIN_ID )
    {
        return true;
    }

    AuthRequest ar(att.uid, att.group_ids);
    string      t64;
    string      aname;

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    // ------------ Check template for restricted attributes -------------------
    if (ttmpl->check(aname))
    {
        att.resp_msg = "VM Template includes a restricted attribute " + aname;

        failure_response(AUTHORIZATION, att);
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    string host    = xmlrpc_c::value_string(paramList.getString(1));
    string im_mad  = xmlrpc_c::value_string(paramList.getString(2));
    string vmm_mad = xmlrpc_c::value_string(paramList.getString(3));
    string vnm_mad = xmlrpc_c::value_string(paramList.getString(4));

    HostPool * hpool = static_cast<HostPool *>(pool);

    return hpool->allocate(&id, host, im_mad, vmm_mad, vnm_mad,
                           cluster_id, cluster_name, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    string uname  = xmlrpc_c::value_string(paramList.getString(1));
    string passwd = xmlrpc_c::value_string(paramList.getString(2));
    string driver = xmlrpc_c::value_string(paramList.getString(3));

    UserPool * upool = static_cast<UserPool *>(pool);

    int      ugid   = att.gid;
    string   ugname = att.gname;

    if ( att.gid == GroupPool::ONEADMIN_ID )
    {
        ugid   = GroupPool::USERS_ID;
        ugname = GroupPool::USERS_NAME;
    }

    if (driver.empty())
    {
        driver = UserPool::CORE_AUTH;
    }

    return upool->allocate(&id,ugid,uname,ugname,passwd,driver,true,att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    int rc;

    string gname = xmlrpc_c::value_string(paramList.getString(1));

    GroupPool * gpool = static_cast<GroupPool *>(pool);

    rc = gpool->allocate(gname, &id, att.resp_msg);

    if (rc == -1)
    {
        return rc;
    }

    Vdc* vdc = vdcpool->get(VdcPool::DEFAULT_ID, true);

    if (vdc != 0)
    {
        rc = vdc->add_group(id, att.resp_msg);

        vdcpool->update(vdc);

        vdc->unlock();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastoreAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    DatastorePool * dspool      = static_cast<DatastorePool *>(pool);
    DatastoreTemplate * ds_tmpl = static_cast<DatastoreTemplate *>(tmpl);

    return dspool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            ds_tmpl, &id, cluster_id, cluster_name, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    string name = xmlrpc_c::value_string(paramList.getString(1));

    ClusterPool * clpool = static_cast<ClusterPool *>(pool);

    return clpool->allocate(name, &id, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DocumentAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    int type = xmlrpc_c::value_int(paramList.getInt(2));

    DocumentPool * docpool = static_cast<DocumentPool *>(pool);

    return docpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            type, tmpl, &id, att.resp_msg);
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

int ZoneAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    string name = xmlrpc_c::value_string(paramList.getString(1));

    ZonePool * zonepool = static_cast<ZonePool *>(pool);

    return zonepool->allocate(tmpl, &id, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroupAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    SecurityGroupPool * sgpool = static_cast<SecurityGroupPool *>(pool);

    return sgpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        tmpl, &id, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    string name = xmlrpc_c::value_string(paramList.getString(1));

    VdcPool * vdcpool = static_cast<VdcPool *>(pool);

    return vdcpool->allocate(tmpl, &id, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouterAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    VirtualRouterPool * vrpool = static_cast<VirtualRouterPool *>(pool);

    return vrpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        tmpl, &id, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualRouterAllocate::allocate_authorization(
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    if ( att.uid == 0 )
    {
        return true;
    }

    AuthRequest ar(att.uid, att.group_ids);
    string      tmpl_str;

    // ------------------ Authorize create operation ------------------------

    ar.add_create_auth(att.uid, att.gid, auth_object, tmpl->to_xml(tmpl_str));

    VirtualRouter::set_auth_request(att.uid, ar, tmpl);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return false;
    }

    // -------------------------- Check Quotas  ----------------------------

    if (quota_authorization(tmpl, Quotas::VIRTUALROUTER, att, att.resp_msg) == false)
    {
        return AUTHORIZATION;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    MarketPlacePool *     mppool = static_cast<MarketPlacePool *>(pool);
    MarketPlaceTemplate * ttmpl  = static_cast<MarketPlaceTemplate *>(tmpl);

    return mppool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
        ttmpl, &id, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    MarketPlaceManager*    marketm = Nebula::instance().get_marketm();

    MarketPlaceAppPool*     appool = static_cast<MarketPlaceAppPool *>(pool);
    MarketPlaceAppTemplate* ttmpl  = static_cast<MarketPlaceAppTemplate *>(tmpl);

    int         mp_id = xmlrpc_c::value_int(paramList.getInt(2));
    std::string mp_data;

    // ---------------------------------------------------------------------- //
    // Get Marketplace information for this app                               //
    // ---------------------------------------------------------------------- //
    MarketPlace * mp = mppool->get(mp_id, true);

    if ( mp == 0 )
    {
        att.resp_msg = "Cannot find associated MARKETPLACE";
        return -1;
    }

    std::string mp_name = mp->get_name();

    if ( !mp->is_action_supported(MarketPlaceApp::CREATE) )
    {
        att.resp_msg = "Create disabled for market: " + mp_name;
        mp->unlock();

        return -1;
    }

    if ( mp->get_zone_id() != Nebula::instance().get_zone_id() )
    {
        att.resp_msg = "Marketplace is not in this OpenNebula zone";
        mp->unlock();

        return -1;
    }

    mp->to_xml(mp_data);

    mp->unlock();

    // ---------------------------------------------------------------------- //
    // Allocate MarketPlaceApp request is forwarded to master for slaves      //
    // ---------------------------------------------------------------------- //
    int rc = appool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                ttmpl, mp_id, mp_name, &id, att.resp_msg);

    if (rc < 0)
    {
        return rc;
    }

    mp = mppool->get(mp_id, true);

    if ( mp == 0 )
    {
        att.resp_msg = "Marketplace no longer exists";

        MarketPlaceApp * app = appool->get(id, true);

        if ( app != 0 )
        {
            string aux_str;

            appool->drop(app, aux_str);

            app->unlock();
        }

        return -1;
    }

    mp->add_marketapp(id);

    mppool->update(mp);

    mp->unlock();

    // ---------------------------------------------------------------------- //
    // Send request operation to market driver                                //
    // ---------------------------------------------------------------------- //
    if (marketm->import_app(id, mp_data, att.resp_msg) == -1)
    {
        return -1;
    }

    return 0;
}

