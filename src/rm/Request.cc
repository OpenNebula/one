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

#include "Request.h"
#include "Nebula.h"

#include "PoolObjectAuth.h"


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::execute(
        xmlrpc_c::paramList const& _paramList,
        xmlrpc_c::value *   const  _retval)
{
    RequestAttributes att;

    att.retval  = _retval;
    att.session = xmlrpc_c::value_string (_paramList.getString(0));

    Nebula& nd = Nebula::instance();
    UserPool* upool = nd.get_upool();

    NebulaLog::log("ReM",Log::DEBUG, method_name + " method invoked");

    if ( upool->authenticate(att.session,
                             att.uid,
                             att.gid,
                             att.uname,
                             att.gname) == false )
    {
        failure_response(AUTHENTICATION, authenticate_error(), att);
    }
    else
    {
        request_execute(_paramList, att);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::basic_authorization(int oid,
                                  AuthRequest::Operation op,
                                  RequestAttributes& att)
{
    PoolObjectSQL * object;
    PoolObjectAuth  perms;

    if ( oid >= 0 )
    {
        object = pool->get(oid,true);

        if ( object == 0 )
        {
            failure_response(NO_EXISTS,
                             get_error(object_name(auth_object),oid),
                             att);
            return false;
        }

        if ( att.uid == 0 )
        {
            object->unlock();
            return true;
        }

        object->get_permissions(perms);

        object->unlock();
    }
    else
    {
        if ( att.uid == 0 )
        {
            return true;
        }

        perms.obj_type = auth_object;
    }

    AuthRequest ar(att.uid, att.gid);

    ar.add_auth(op, perms);

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

bool Request::user_quota_authorization (Template * tmpl, 
                                        PoolObjectSQL::ObjectType object,
                                        RequestAttributes& att,
                                        string& error_str)
{
    Nebula& nd        = Nebula::instance();
    UserPool *  upool = nd.get_upool();
    User *      user;

    bool   rc = false;

    user = upool->get(att.uid, true);

    if ( user == 0 )
    {
        error_str = "User not found";
        return false;
    }

    switch (object)
    {
        case PoolObjectSQL::IMAGE:
            rc = user->quota.ds_check(tmpl, error_str);
            break;

        case PoolObjectSQL::VM:
        case PoolObjectSQL::TEMPLATE:
            rc = user->quota.vm_check(tmpl, error_str);
            break;

        default:
            break;
    }

    if (rc == true)
    {
        upool->update(user);
    }

    user->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */

bool Request::group_quota_authorization (Template * tmpl, 
                                         PoolObjectSQL::ObjectType object,
                                         RequestAttributes& att,
                                         string& error_str)
{
    Nebula&     nd    = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();
    Group *     group;

    bool   rc = false;

    group = gpool->get(att.gid, true);

    if ( group == 0 )
    {
        error_str = "Group not found";
        return false;
    }

    switch (object)
    {
        case PoolObjectSQL::IMAGE:
            rc = group->quota.ds_check(tmpl, error_str);
            break;

        case PoolObjectSQL::VM:
        case PoolObjectSQL::TEMPLATE:
            rc = group->quota.vm_check(tmpl, error_str);
            break;

        default:
            break;
    }

    if (rc == true)
    {
        gpool->update(group);
    }

    group->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */

void Request::user_quota_rollback(Template * tmpl, 
                                  PoolObjectSQL::ObjectType object, 
                                  RequestAttributes& att)
{
    Nebula& nd        = Nebula::instance();
    UserPool * upool  = nd.get_upool();

    User * user;

    user = upool->get(att.uid, true);

    if ( user == 0 )
    {
        return;
    }

    switch (object)
    {
        case PoolObjectSQL::IMAGE:
            user->quota.ds_del(tmpl);
            break;

        case PoolObjectSQL::VM:
        case PoolObjectSQL::TEMPLATE:
            user->quota.vm_del(tmpl);
            break;

        default:
            break;
    }

    upool->update(user);

    user->unlock();
}

/* -------------------------------------------------------------------------- */

void Request::group_quota_rollback(Template * tmpl, 
                                   PoolObjectSQL::ObjectType object, 
                                   RequestAttributes& att)
{
    Nebula& nd        = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();

    Group * group;

    group = gpool->get(att.gid, true);

    if ( group == 0 )
    {
        return;
    }

    switch (object)
    {
        case PoolObjectSQL::IMAGE:
            group->quota.ds_del(tmpl);
            break;

        case PoolObjectSQL::VM:
        case PoolObjectSQL::TEMPLATE:
            group->quota.vm_del(tmpl);
            break;
        default:
            break;
    }

    gpool->update(group);

    group->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::quota_authorization(Template * tmpl, 
                                  PoolObjectSQL::ObjectType object,
                                  RequestAttributes& att)
{
    string error_str;

    if (object != PoolObjectSQL::IMAGE &&
        object != PoolObjectSQL::VM    &&
        object != PoolObjectSQL::TEMPLATE)
    {
        return true;
    }

    // uid/gid == -1 means do not update user/group
    if ( att.uid != UserPool::ONEADMIN_ID && att.uid != -1) 
    {
        if ( user_quota_authorization(tmpl, object, att, error_str) == false )
        {
            failure_response(AUTHORIZATION,
                    authorization_error(error_str, att),
                    att);

            return false;
        }
    }

    if ( att.gid != GroupPool::ONEADMIN_ID && att.gid != -1)
    {
        if ( group_quota_authorization(tmpl, object, att, error_str) == false )
        {
            user_quota_rollback(tmpl, object, att);

            failure_response(AUTHORIZATION,
                             authorization_error(error_str, att),
                             att);

            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::quota_rollback(Template * tmpl, 
                             PoolObjectSQL::ObjectType object, 
                             RequestAttributes& att)
{
     if (object != PoolObjectSQL::IMAGE &&
         object != PoolObjectSQL::VM    &&
         object != PoolObjectSQL::TEMPLATE)
    {
        return;
    }
    
    // uid/gid == -1 means do not update user/group
    if ( att.uid != UserPool::ONEADMIN_ID && att.uid != -1 )
    {
        user_quota_rollback(tmpl, object, att);
    }

    if ( att.gid != GroupPool::ONEADMIN_ID && att.gid != -1 )
    {
        group_quota_rollback(tmpl, object, att);;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::failure_response(ErrorCode ec, const string& str_val,
                               RequestAttributes& att)
{    
    vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(str_val));
    arrayData.push_back(xmlrpc_c::value_int(ec));

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval) = arrayresult;

    NebulaLog::log("ReM",Log::ERROR,str_val);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::success_response(int id, RequestAttributes& att)
{    
    vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(id));
    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));


    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval) = arrayresult;
}

/* -------------------------------------------------------------------------- */

void Request::success_response(const string& val, RequestAttributes& att)
{    
    vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_string(val));
    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval) = arrayresult;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::object_name(PoolObjectSQL::ObjectType ob)
{
    switch (ob)
    {
        case PoolObjectSQL::VM:
            return "virtual machine";
        case PoolObjectSQL::HOST:
            return "host";
        case PoolObjectSQL::NET:
            return "virtual network";
        case PoolObjectSQL::IMAGE:
            return "image";
        case PoolObjectSQL::USER:
            return "user";
        case PoolObjectSQL::TEMPLATE:
            return "virtual machine template";
        case PoolObjectSQL::GROUP:
            return "group";
        case PoolObjectSQL::ACL:
            return "ACL";
        case PoolObjectSQL::DATASTORE:
            return "datastore";
        case PoolObjectSQL::CLUSTER:
            return "cluster";
        default:
            return "-";
      }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::authorization_error (const string &message,
                                     RequestAttributes& att)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " User [" << att.uid << "] ";

    if ( message.empty() )
    {
        oss << "not authorized to perform action on "
            << object_name(auth_object) << ".";
    }
    else
    {
        oss << ": " << message << ".";
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */

string Request::authenticate_error()
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " User couldn't be authenticated," <<
           " aborting call.";

    return oss.str();
}

/* -------------------------------------------------------------------------- */

string Request::get_error (const string &object,
                           int id)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " Error getting " <<
           object;

   if ( id != -1 )
   {
       oss << " [" << id << "].";
   }
   else
   {
      oss << " Pool.";
   }

   return oss.str();
}
/* -------------------------------------------------------------------------- */

string Request::request_error (const string &err_desc, const string &err_detail)
{
    ostringstream oss;

    oss << "[" << method_name << "] " << err_desc;

    if (!err_detail.empty())
    {
        oss << ". " << err_detail;
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::allocate_error(PoolObjectSQL::ObjectType obj, 
                               const string&             error)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " Error allocating a new "
        << object_name(obj) << ".";

    if (!error.empty())
    {
        oss << " " << error;
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::allocate_error (const string& error)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " Error allocating a new "
        << object_name(auth_object) << ".";

    if (!error.empty())
    {
        oss << " " << error;
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Request::get_info(
        PoolSQL *                 pool,
        int                       id,
        PoolObjectSQL::ObjectType type,
        RequestAttributes&        att,
        PoolObjectAuth&           perms,
        string&                   name)
{
    PoolObjectSQL * ob;

    if ((ob = pool->get(id,true)) == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(type), id), att);
        return -1;
    }

    ob->get_permissions(perms);

    name = ob->get_name();

    ob->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
