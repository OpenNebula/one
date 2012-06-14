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

#include "RequestManagerUser.h"

using namespace std;

void RequestManagerUser::
    request_execute(xmlrpc_c::paramList const& paramList,
                    RequestAttributes& att)
{
    int    id  = xmlrpc_c::value_int(paramList.getInt(1));
    User * user;
    string error_str;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    user = static_cast<User *>(pool->get(id,false));

    if ( user == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    if ( user_action(id,paramList,error_str) < 0 )
    {
        failure_response(ACTION, request_error(error_str,""), att);
        return;
    }
 
    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserChangePassword::user_action(int     user_id, 
                                    xmlrpc_c::paramList const& paramList,
                                    string& error_str)
{

    string new_pass = xmlrpc_c::value_string(paramList.getString(2));
    User * user;

    user = static_cast<User *>(pool->get(user_id,true));

    if ( user == 0 )
    {
        return -1;
    }

    if (user->get_auth_driver() == UserPool::CORE_AUTH)
    {
        new_pass = SSLTools::sha1_digest(new_pass);
    }

    int rc = user->set_password(new_pass, error_str);

    if ( rc == 0 )
    {
        pool->update(user);
    }

    user->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserChangeAuth::user_action(int     user_id,
                                xmlrpc_c::paramList const& paramList,
                                string& error_str)
{
    string new_auth = xmlrpc_c::value_string(paramList.getString(2));
    string new_pass = xmlrpc_c::value_string(paramList.getString(3));

    int    rc = 0;

    User * user;

    user = static_cast<User *>(pool->get(user_id,true));

    if ( user == 0 )
    {
        return -1;
    }

    if ( !new_pass.empty() )
    {
        if ( new_auth == UserPool::CORE_AUTH)
        {
            new_pass = SSLTools::sha1_digest(new_pass);
        }

        // The password may be invalid, try to change it first
        rc = user->set_password(new_pass, error_str);
    }

    if ( rc == 0 )
    {
        rc = user->set_auth_driver(new_auth, error_str);
    }

    if ( rc == 0 )
    {
        pool->update(user);
    }

    user->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserSetQuota::user_action(int     user_id, 
                              xmlrpc_c::paramList const& paramList,
                              string& error_str)
{

    string   quota_str = xmlrpc_c::value_string(paramList.getString(2));
    Template quota_tmpl;

    int    rc;
    User * user;

    if ( user_id == UserPool::ONEADMIN_ID )
    {
        error_str = "Cannot set quotas for oneadmin user";
        return -1;
    }

    rc = quota_tmpl.parse_str_or_xml(quota_str, error_str);

    if ( rc != 0 )
    {
        return -1;
    }

    user = static_cast<User *>(pool->get(user_id,true));

    if ( user == 0 )
    {
        return -1;
    }

    rc = user->quota.set(&quota_tmpl, error_str);

    pool->update(user);

    user->unlock();

    return rc;
}
