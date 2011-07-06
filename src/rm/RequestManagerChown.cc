/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerChown::request_execute(xmlrpc_c::paramList const& paramList)
{
    int oid  = xmlrpc_c::value_int(paramList.getInt(1));
    int noid = xmlrpc_c::value_int(paramList.getInt(2));
    int ngid = xmlrpc_c::value_int(paramList.getInt(3));

    string nuname;
    string ngname;

    Nebula&     nd    = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();
    UserPool  * upool = nd.get_upool();

    PoolObjectSQL * object;

    if ( basic_authorization(oid) == false )
    {
        return;
    }

    // ------------- Check new user and group id's ---------------------

    if ( noid > -1  )
    {
        User * user;

        if ((user = upool->get(noid,true)) == 0)
        {
            failure_response(NO_EXISTS,
                get_error(object_name(AuthRequest::USER),noid));
            return;
        }
        
        nuname = user->get_name();

        user->unlock();
    }

    if ( ngid > -1  )
    {
        Group * group;
        
        if ((group = gpool->get(ngid,true)) == 0)
        {
            failure_response(NO_EXISTS, 
                get_error(object_name(AuthRequest::GROUP),ngid));
            return;
        }

        ngname = group->get_name();

        group->unlock();
    }

    // ------------- Update the object ---------------------

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        failure_response(NO_EXISTS, get_error(object_name(auth_object),oid)); 
        return;
    }    

    if ( noid != -1 )    
    {
        object->set_user(noid,nuname);
    }

    if ( ngid != -1 )
    {
        object->set_group(ngid,ngname);
    }

    pool->update(object);

    object->unlock();

    success_response(oid);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserChown::request_execute(xmlrpc_c::paramList const& paramList)
{
    int oid  = xmlrpc_c::value_int(paramList.getInt(1));
    int ngid = xmlrpc_c::value_int(paramList.getInt(2));
    int old_gid;

    string  ngname;

    Nebula&     nd    = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();
    UserPool  * upool = static_cast<UserPool *>(pool);

    User *  user;
    Group * group;

    if ( basic_authorization(oid) == false )
    {
        return;
    }

    // ------------- Check new primary group id for user ---------------------

    if ( ngid < 0 )
    {
        failure_response(XML_RPC_API,request_error("Wrong group ID",""));
        return;
    }

    if ( (group = gpool->get(ngid,true)) == 0 )
    {
        failure_response(NO_EXISTS, 
                get_error(object_name(AuthRequest::GROUP),ngid));
        return;
    }

    ngname = group->get_name();

    group->unlock();

    // ------------- Change users primary group ---------------------

    user = upool->get(oid,true);

    if ( user == 0 )                             
    {                                            
        failure_response(NO_EXISTS,
                get_error(object_name(AuthRequest::USER),oid)); 
        return;
    }    

    if ((old_gid = user->get_gid()) == ngid)
    {
        user->unlock();
        success_response(oid);
        return;
    }

    user->set_group(ngid,ngname);
    
    user->add_group(ngid);
    user->del_group(old_gid);

    upool->update(user);
    
    user->unlock();

    // ------------- Updates new group with this new user ---------------------

    group = gpool->get(ngid, true);

    if( group == 0 )
    {
        failure_response(NO_EXISTS, 
                get_error(object_name(AuthRequest::GROUP),ngid));//TODO Rollback
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

    success_response(oid);

    return;
}
