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

#include "RequestManagerUser.h"

using namespace std;

void RequestManagerUser::
    request_execute(xmlrpc_c::paramList const& paramList)
{
    int    id  = xmlrpc_c::value_int(paramList.getInt(1));
    User * user;
    string error_str;

    if ( basic_authorization(id) == false )
    {
        return;
    }

    user = static_cast<User *>(pool->get(id,true));

    if ( user == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(auth_object),id));
        return;
    }

    if ( user_action(user,paramList,error_str) < 0 )
    {
        failure_response(INTERNAL, request_error(error_str,""));
    }
 
    success_response(id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserChangePassword::user_action(User * user, 
                                    xmlrpc_c::paramList const& paramList,
                                    string& error_str)
{

    string new_pass = xmlrpc_c::value_string(paramList.getString(2));

    user->set_password(new_pass);

    pool->update(user);

    user->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserAddGroup::user_action(User * user, 
                              xmlrpc_c::paramList const& paramList,
                              string& error_str)
{
 
    int user_id  = xmlrpc_c::value_int(paramList.getInt(1));
    int group_id = xmlrpc_c::value_int(paramList.getInt(2));
    int rc;
    
    rc = user->add_group(group_id);

    if ( rc != 0 )
    {
        user->unlock();

        error_str = "Can not add group to user";
        return rc;
    }

    pool->update(user);

    user->unlock();

    Nebula&     nd    = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();
    Group *     group = gpool->get(gid, true);

    if( group == 0 )
    {
        User * user = static_cast<User *>(pool->get(user_id,true));

        if ( user != 0 )
        {
            user->del_group(group_id);

            pool->update(user);

            user->unlock();
        }

        error_str = "Group does not exists";
        return -1;
    }

    group->add_user(user_id);

    gpool->update(group);

    group->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserDelGroup::user_action(User * user, 
                              xmlrpc_c::paramList const& paramList,
                              string& error_str)
{
 
    int user_id  = xmlrpc_c::value_int(paramList.getInt(1));
    int group_id = xmlrpc_c::value_int(paramList.getInt(2));
    int rc;
    
    rc = user->del_group(group_id);

    if ( rc != 0 )
    {
        user->unlock();

        error_str = "Can not remove group from user";
        return rc;
    }

    pool->update(user);

    user->unlock();

    Nebula&     nd    = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();
    Group *     group = gpool->get(gid, true);

    if( group == 0 )
    {
        //Group does not exists, should never occur
        error_str = "Can not remove user from group";
        return -1;
    }

    group->del_user(user_id);

    gpool->update(group);

    group->unlock();

    return 0;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

