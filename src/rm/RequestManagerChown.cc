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

    // ------------- Update the object ---------------------

    object = pool->get(oid,true);

    if ( object == 0 ) 
    {                                            
        failure_response(NO_EXISTS,get_error(object_name(auth_object),oid),att);
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
