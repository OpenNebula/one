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

#include "RequestManagerChown.h"
#include "PoolObjectSQL.h"

#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * RequestManagerChown::get_and_quota(
    int                       oid,
    int                       new_uid,
    int                       new_gid,
    RequestAttributes&        att)
{
    Template * tmpl;

    int old_uid;
    int old_gid;

    PoolObjectSQL * object;

    object = pool->get(oid,true);

    if ( object == 0 ) 
    {
        failure_response(NO_EXISTS,
                         get_error(object_name(auth_object), oid),
                         att);         
        return 0;
    }

    if ( auth_object == PoolObjectSQL::VM )
    {
        tmpl = (static_cast<VirtualMachine*>(object))->clone_template();
    }
    else
    {
        Image * img = static_cast<Image *>(object);
        tmpl        = new Template;

        tmpl->add("DATASTORE", img->get_ds_id());
        tmpl->add("SIZE", img->get_size());
    }

    if ( new_uid == -1 )
    {
        old_uid = -1;
    }
    else
    {
        old_uid = object->get_uid();    
    }

    if ( new_gid == -1 )
    {
        old_gid = -1;
    }
    else
    {
        old_gid = object->get_gid();
    }

    object->unlock();
    
    RequestAttributes att_new(new_uid, new_gid, att);
    RequestAttributes att_old(old_uid, old_gid, att);

    if ( quota_authorization(tmpl, att_new) == false )
    {
        delete tmpl;
        return 0;
    }

    quota_rollback(tmpl, att_old);

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        quota_rollback(tmpl, att_new);    

        quota_authorization(tmpl, att_old);    

        failure_response(NO_EXISTS,
                         get_error(object_name(auth_object), oid),
                         att);   
    }

    delete tmpl;

    return object;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerChown::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributes& att)
{
    int oid  = xmlrpc_c::value_int(paramList.getInt(1));
    int noid = xmlrpc_c::value_int(paramList.getInt(2));
    int ngid = xmlrpc_c::value_int(paramList.getInt(3));

    int rc;
   
    string oname;
    string nuname;
    string ngname;

    PoolObjectAuth  operms;
    PoolObjectAuth  nuperms;
    PoolObjectAuth  ngperms;

    PoolObjectSQL * object;

    string  obj_name;
    int     old_uid;

    // ------------- Check new user and group id's ---------------------

    if ( noid > -1  )
    {
        rc = get_info(upool, noid, PoolObjectSQL::USER, att, nuperms, nuname);

        if ( rc == -1 )
        {
            return;
        }
    }
    
    if ( ngid > -1  )
    {
        rc = get_info(gpool, ngid, PoolObjectSQL::GROUP, att, ngperms, ngname);
        
        if ( rc == -1 )
        {
            return;
        }
    }

    // ------------- Set authorization request for non-oneadmin's --------------

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.gid);

        rc = get_info(pool, oid, auth_object, att, operms, oname);

        if ( rc == -1 )
        {
            return;
        }

        ar.add_auth(auth_op, operms); // MANAGE OBJECT

        if ( noid > -1  )
        {
            ar.add_auth(AuthRequest::MANAGE, nuperms); // MANAGE USER
        }

        if ( ngid > -1  )
        {
            ar.add_auth(AuthRequest::USE, ngperms); // USE GROUP
        }

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                             authorization_error(ar.message, att),
                             att);

            return;
        }
    }

    // --------------- Update the object and check quotas ----------------------

    if ( auth_object == PoolObjectSQL::VM || 
         auth_object == PoolObjectSQL::IMAGE )
    {
        object = get_and_quota(oid, noid, ngid, att);
    }
    else
    {
        object = pool->get(oid,true);

        if ( object == 0 )
        {
            failure_response(NO_EXISTS,
                             get_error(object_name(auth_object), oid),
                             att);
        }
    }

    if ( object == 0 )
    {
        return;
    }

    if ( noid != -1 )    
    {
        obj_name = object->get_name();
        old_uid  = object->get_uid();

        object->set_user(noid,nuname);
    }

    if ( ngid != -1 )
    {
        object->set_group(ngid,ngname);
    }

    pool->update(object);

    object->unlock();

    if ( noid != -1 )    
    {
        pool->update_cache_index(obj_name, old_uid, obj_name, noid);
    }

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserChown::request_execute(xmlrpc_c::paramList const& paramList,
                                RequestAttributes& att)
{
    int oid  = xmlrpc_c::value_int(paramList.getInt(1));
    int ngid = xmlrpc_c::value_int(paramList.getInt(2));
    int old_gid;

    int rc;

    string ngname;
    string uname;

    User *  user;
    Group * group;

    PoolObjectAuth uperms;
    PoolObjectAuth ngperms;

    if ( ngid < 0 )
    {
        failure_response(XML_RPC_API,request_error("Wrong group ID",""), att);
        return;
    }

    rc = get_info(upool, oid, PoolObjectSQL::USER, att, uperms, uname);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(gpool, ngid, PoolObjectSQL::GROUP, att, ngperms, ngname);

    if ( rc == -1 )
    {
        return;
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.gid);

        ar.add_auth(auth_op, uperms);           // MANAGE USER
        ar.add_auth(AuthRequest::USE, ngperms); // USE    GROUP

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                             authorization_error(ar.message, att),
                             att);

            return;
        }
    }

    // ------------- Change users primary group ---------------------

    user = upool->get(oid,true);

    if ( user == 0 )                             
    {                                            
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::USER),oid),
                att);
        return;
    }    

    if ((old_gid = user->get_gid()) == ngid)
    {
        user->unlock();
        success_response(oid, att);
        return;
    }

    user->set_group(ngid,ngname);

    upool->update(user);
    
    user->unlock();

    // ------------- Updates new group with this new user ---------------------

    group = gpool->get(ngid, true);

    if( group == 0 )
    {
        failure_response(NO_EXISTS, 
                get_error(object_name(PoolObjectSQL::GROUP),ngid),
                att);//TODO Rollback
        return;
    }

    group->add_user(oid);

    gpool->update(group);

    group->unlock();

    // ------------- Updates old group removing the user ---------------------

    group = gpool->get(old_gid, true);

    if( group != 0 )
    {
        group->del_user(oid);

        gpool->update(group);

        group->unlock();
    }

    success_response(oid, att);

    return;
}
