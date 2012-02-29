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
#include "NebulaLog.h"

#include "Nebula.h"
#include "PoolObjectSQL.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerAllocate::allocate_authorization(Template * tmpl,
                                                    RequestAttributes& att)
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

bool VirtualMachineAllocate::allocate_authorization(Template * tmpl,
                                                    RequestAttributes& att)
{
    if ( att.uid == 0 )
    {
        return true;
    }

    AuthRequest ar(att.uid, att.gid);
    string      t64;

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    ar.add_create_auth(auth_object, tmpl->to_xml(t64));

    VirtualMachine::set_auth_request(att.uid, ar, ttmpl);

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

void RequestManagerAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{
    Template * tmpl = 0;

    string error_str;
    int    rc, id;

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

    if ( allocate_authorization(tmpl, att) == false )
    {
        delete tmpl;
        return;
    }

    rc = pool_allocate(params, tmpl, id, error_str, att);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, allocate_error(error_str), att);
        return;
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

    return vmpool->allocate(att.uid, att.gid, att.uname, att.gname, ttmpl, &id,
            error_str, false);
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                          Template * tmpl,
                                          int& id, 
                                          string& error_str,
                                          RequestAttributes& att)
{
    VirtualNetworkPool * vpool = static_cast<VirtualNetworkPool *>(pool);
    VirtualNetworkTemplate * vtmpl=static_cast<VirtualNetworkTemplate *>(tmpl);

    return vpool->allocate(att.uid, att.gid, att.uname, att.gname, vtmpl, &id,
            error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{

    string error_str;
    string ds_name;
    string ds_data;
    int    rc, id;

    PoolObjectAuth ds_perms;

    string str_tmpl = xmlrpc_c::value_string(params.getString(1));
    int    ds_id    = xmlrpc_c::value_int(params.getInt(2));

    Nebula&  nd  = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImagePool * ipool      = static_cast<ImagePool *>(pool);

    ImageTemplate * tmpl = new ImageTemplate;
    Datastore *     ds;

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

    ds_name = ds->get_name();

    ds->to_xml(ds_data);

    ds->unlock();

    // ------------- Set authorization request for non-oneadmin's --------------

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.gid);
        string      tmpl_str = "";

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
    }

    rc = ipool->allocate(att.uid, 
                         att.gid, 
                         att.uname, 
                         att.gname, 
                         tmpl, 
                         ds_id, 
                         ds_name, 
                         ds_data, 
                         &id,
                         error_str);
    if ( rc < 0 )
    {
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

void HostAllocate::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    string error_str;
    string cluster_name;
    string ds_data;
    int    rc, id;

    PoolObjectAuth cluster_perms;

    string host    = xmlrpc_c::value_string(paramList.getString(1));
    string im_mad  = xmlrpc_c::value_string(paramList.getString(2));
    string vmm_mad = xmlrpc_c::value_string(paramList.getString(3));
    string vnm_mad = xmlrpc_c::value_string(paramList.getString(4));
    int cluster_id = xmlrpc_c::value_int(paramList.getInt(5));

    Nebula&  nd  = Nebula::instance();

    Cluster *       cluster = 0;
    ClusterPool *   clpool = nd.get_clpool();
    HostPool *      hpool  = static_cast<HostPool *>(pool);

    // ------------------------- Check Cluster exists ------------------------

    get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att,
            cluster_perms, cluster_name);

    // ------------- Set authorization request for non-oneadmin's -------------

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.gid);
        string      tmpl_str = "";

        ar.add_create_auth(auth_object, tmpl_str);      // CREATE HOST

        ar.add_auth(AuthRequest::ADMIN, cluster_perms); // ADMIN CLUSTER

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                    authorization_error(ar.message, att),
                    att);

            return;
        }
    }

    // ------------- Allocate Host --------------------------------------------

    rc =  hpool->allocate(&id, host, im_mad, vmm_mad, vnm_mad,
                           cluster_id, cluster_name, error_str);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, allocate_error(error_str), att);
        return;
    }

    // ------------- Add Host to Cluster --------------------------------------

    cluster = clpool->get(cluster_id, true);

    if ( cluster == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::CLUSTER), cluster_id), att);
        return;
    }

    rc = cluster->add_host(id, error_str);

    if ( rc < 0 )
    {
        string drop_err;
        Host * host = 0;

        cluster->unlock();

        host = hpool->get(id, true);

        if ( host != 0 )
        {
            hpool->drop(host, drop_err);
            host->unlock();
        }

        failure_response(INTERNAL, allocate_error(error_str), att);
        return;
    }

    clpool->update(cluster);

    cluster->unlock();

    success_response(id, att);
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
        xmlrpc_c::paramList const& paramList,
        Template * tmpl,
        int& id,
        string& error_str,
        RequestAttributes& att)
{
    DatastorePool * dspool = static_cast<DatastorePool *>(pool);

    DatastoreTemplate * ds_tmpl = static_cast<DatastoreTemplate *>(tmpl);

    // TODO: include another int parameter for the cluster?
    int     cluster_id   = ClusterPool::DEFAULT_CLUSTER_ID;
    string  cluster_name = ClusterPool::DEFAULT_CLUSTER_NAME;

    // TODO: Add to auth request CLUSTER MANAGE or ADMIN

    return dspool->allocate(ds_tmpl, &id, cluster_id, cluster_name, error_str);
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
