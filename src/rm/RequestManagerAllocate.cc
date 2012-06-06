/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

    AuthRequest ar(att.uid, att.gid);

    if ( tmpl != 0 )
    {
        tmpl->to_xml(tmpl_str);
    }

    ar.add_create_auth(auth_object, tmpl_str);

    if ( cluster_perms->oid != ClusterPool::NONE_CLUSTER_ID )
    {
        ar.add_auth(AuthRequest::ADMIN, *cluster_perms); // ADMIN CLUSTER
    }

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION,
                authorization_error(ar.message, att),
                att);

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

    AuthRequest ar(att.uid, att.gid);
    string      t64;
    string      aname;

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    // ------------ Check template for restricted attributes -------------------

    if ( att.uid != 0 && att.gid != GroupPool::ONEADMIN_ID )
    {
        if (ttmpl->check(aname))
        {
            ostringstream oss;

            oss << "VM Template includes a restricted attribute " << aname;

            failure_response(AUTHORIZATION,
                    authorization_error(oss.str(), att),
                    att);

            return false;
        }
    }

    // ------------------ Authorize VM create operation ------------------------

    ar.add_create_auth(auth_object, tmpl->to_xml(t64));

    VirtualMachine::set_auth_request(att.uid, ar, ttmpl);

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION,
                authorization_error(ar.message, att),
                att);

        return false;
    }

    // -------------------------- Check Quotas  ----------------------------

    if ( quota_authorization(tmpl, att) == false )
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool ImageAllocate::allocate_authorization(
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    string      aname;

    ImageTemplate * itmpl = static_cast<ImageTemplate *>(tmpl);

    // Check template for restricted attributes

    if ( att.uid != 0 && att.gid != GroupPool::ONEADMIN_ID )
    {
        if (itmpl->check(aname))
        {
            ostringstream oss;

            oss << "Template includes a restricted attribute " << aname;

            failure_response(AUTHORIZATION,
                    authorization_error(oss.str(), att),
                    att);

            return false;
        }
    }

    return RequestManagerAllocate::allocate_authorization(tmpl, att, cluster_perms);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{
    Template * tmpl = 0;

    string error_str;
    int    rc, id;

    Cluster *       cluster      = 0;
    int             cluster_id   = ClusterPool::NONE_CLUSTER_ID;
    string          cluster_name = ClusterPool::NONE_CLUSTER_NAME;
    PoolObjectAuth  cluster_perms;

    if ( do_template == true )
    {
        string str_tmpl  = xmlrpc_c::value_string(params.getString(1));

        tmpl = get_object_template();

        rc   = tmpl->parse_str_or_xml(str_tmpl, error_str);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, allocate_error(error_str), att);
            delete tmpl;

            return;
        }
    }

    cluster_id = get_cluster_id(params);

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att,
                cluster_perms, cluster_name);

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

    rc = pool_allocate(params, tmpl, id, error_str, att, cluster_id, cluster_name);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, allocate_error(error_str), att);
        return;
    }

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        cluster = clpool->get(cluster_id, true);

        if ( cluster == 0 )
        {
            failure_response(
                    NO_EXISTS,
                    get_error(object_name(PoolObjectSQL::CLUSTER), cluster_id),
                    att);
            return;
        }

        rc = add_to_cluster(cluster, id, error_str);

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

            failure_response(INTERNAL, allocate_error(error_str), att);
            return;
        }

        clpool->update(cluster);

        cluster->unlock();
    }

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                          Template * tmpl,
                                          int& id, 
                                          string& error_str,
                                          RequestAttributes& att)
{
    VirtualMachineTemplate * ttmpl= static_cast<VirtualMachineTemplate *>(tmpl);
    VirtualMachinePool * vmpool   = static_cast<VirtualMachinePool *>(pool);

    Template tmpl_back(*tmpl);

    int rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, ttmpl, &id,
                error_str, false);

    if ( rc < 0 )
    {
        quota_rollback(&tmpl_back, att);
    }

    return rc;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        string&                     error_str,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    VirtualNetworkPool * vpool = static_cast<VirtualNetworkPool *>(pool);
    VirtualNetworkTemplate * vtmpl=static_cast<VirtualNetworkTemplate *>(tmpl);

    return vpool->allocate(att.uid, att.gid, att.uname, att.gname, vtmpl, &id,
            cluster_id, cluster_name, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{
    string error_str;
    string size_str;

    int           size_mb;
    istringstream iss;

    string ds_name;
    string ds_data;

    int    rc, id;

    PoolObjectAuth ds_perms;

    string str_tmpl = xmlrpc_c::value_string(params.getString(1));
    int    ds_id    = xmlrpc_c::value_int(params.getInt(2));

    Nebula&  nd  = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImagePool *     ipool  = static_cast<ImagePool *>(pool);
    ImageManager *  imagem = nd.get_imagem();
    
    ImageTemplate * tmpl = new ImageTemplate;
    Template        img_usage;

    Datastore *     ds;
    Image::DiskType ds_disk_type;

    // ------------------------- Parse image template --------------------------

    rc = tmpl->parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, allocate_error(error_str), att);

        delete tmpl;
        return;
    }

    // ------------------------- Check Datastore exists ------------------------

    if ( ds_id == DatastorePool::SYSTEM_DS_ID )
    {
        ostringstream oss;

        oss << "New images cannot be allocated in the system datastore.";
        failure_response(INTERNAL, allocate_error(oss.str()), att);

        delete tmpl;
        return;
    }

    if ((ds = dspool->get(ds_id,true)) == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::DATASTORE), ds_id),
                att);

        delete tmpl;
        return;
    }

    ds->get_permissions(ds_perms);

    ds_name      = ds->get_name();
    ds_disk_type = ds->get_disk_type();

    ds->to_xml(ds_data);

    ds->unlock();

    // --------------- Get the SIZE for the Image, (DS driver) -----------------

    rc = imagem->stat_image(tmpl, ds_data, size_str);

    if ( rc == -1 )
    {
        failure_response(INTERNAL, 
                         request_error("Cannot determine Image SIZE", size_str), 
                         att);
        delete tmpl;
        return;
    }

    iss.str(size_str);
    iss >> size_mb;

    if ( iss.fail() )
    {
        failure_response(INTERNAL, 
                         request_error("Cannot parse SIZE", size_str), 
                         att);
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
        AuthRequest ar(att.uid, att.gid);
        string  tmpl_str;

        // ------------------ Check permissions and ACLs  ----------------------
        tmpl->to_xml(tmpl_str);

        ar.add_create_auth(auth_object, tmpl_str); // CREATE IMAGE

        ar.add_auth(AuthRequest::USE, ds_perms); // USE DATASTORE

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                    authorization_error(ar.message, att),
                    att);

            delete tmpl;
            return;
        }

        // -------------------------- Check Quotas  ----------------------------

        if ( quota_authorization(&img_usage, att) == false )
        {
            delete tmpl;
            return;   
        }
    }

    rc = ipool->allocate(att.uid, 
                         att.gid, 
                         att.uname, 
                         att.gname, 
                         tmpl, 
                         ds_id, 
                         ds_name,
                         ds_disk_type,
                         ds_data, 
                         &id,
                         error_str);
    if ( rc < 0 )
    {
        quota_rollback(&img_usage, att);

        failure_response(INTERNAL, allocate_error(error_str), att);
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

int TemplateAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                    Template * tmpl,
                                    int& id, 
                                    string& error_str,
                                    RequestAttributes& att)
{
    VMTemplatePool * tpool = static_cast<VMTemplatePool *>(pool);

    VirtualMachineTemplate * ttmpl=static_cast<VirtualMachineTemplate *>(tmpl);

    return tpool->allocate(att.uid, att.gid, att.uname, att.gname, ttmpl, &id,
            error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        string&                     error_str,
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
                           cluster_id, cluster_name, error_str);

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                Template * tmpl,
                                int& id, 
                                string& error_str,
                                RequestAttributes& att)
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

    return upool->allocate(&id,ugid,uname,ugname,passwd,driver,true,error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                 Template * tmpl,
                                 int& id, 
                                 string& error_str,
                                 RequestAttributes& att)
{
    string gname = xmlrpc_c::value_string(paramList.getString(1));

    GroupPool * gpool = static_cast<GroupPool *>(pool);

    return gpool->allocate(gname, &id, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DatastoreAllocate::pool_allocate(
        xmlrpc_c::paramList const&  paramList,
        Template *                  tmpl,
        int&                        id,
        string&                     error_str,
        RequestAttributes&          att,
        int                         cluster_id,
        const string&               cluster_name)
{
    DatastorePool * dspool = static_cast<DatastorePool *>(pool);

    DatastoreTemplate * ds_tmpl = static_cast<DatastoreTemplate *>(tmpl);

    return dspool->allocate(att.uid, att.gid, att.uname, att.gname,
            ds_tmpl, &id, cluster_id, cluster_name, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterAllocate::pool_allocate(xmlrpc_c::paramList const& paramList,
                                    Template * tmpl,
                                    int& id,
                                    string& error_str,
                                    RequestAttributes& att)
{
    string name = xmlrpc_c::value_string(paramList.getString(1));

    ClusterPool * clpool = static_cast<ClusterPool *>(pool);

    return clpool->allocate(name, &id, error_str);
}
