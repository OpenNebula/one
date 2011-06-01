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

#include "Request.h"
#include "Nebula.h"


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::execute(
        xmlrpc_c::paramList const& _paramList,
        xmlrpc_c::value *   const  _retval)
{
    retval  = _retval;
    session = xmlrpc_c::value_string (_paramList.getString(0));

    Nebula& nd = Nebula::instance();
    UserPool* upool = nd.get_upool();

    NebulaLog::log("ReM",Log::DEBUG, method_name + " method invoked");

    if ( upool->authenticate(session, uid, gid) == false )
    {
        failure_response(AUTHENTICATION, authenticate_error());
    }
    else
    {
        request_execute(_paramList);    
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::basic_authorization(int oid)
{
    PoolObjectSQL * object;

    bool pub;
    int  ouid;

    if ( uid == 0 )
    {
        return true;
    }

    if ( oid == -1 )
    {
        ouid = 0;
        pub  = false;
    }
    else
    {
        object = pool->get(oid,true);

        if ( object == 0 )
        {
            failure_response(NO_EXISTS, get_error(object_name(auth_object),oid)); 
            return false;
        }

        ouid = object->get_uid();
        pub  = object->isPublic();

        object->unlock();
    }

   AuthRequest ar(uid);

   ar.add_auth(auth_object, oid, auth_op, ouid, pub);

   if (UserPool::authorize(ar) == -1)
   {
        failure_response(AUTHORIZATION, //TODO
                 authorization_error("INFO",object_name(auth_object),oid,-1));

        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::failure_response(ErrorCode ec, const string& str_val)
{    
    vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(str_val));
    arrayData.push_back(xmlrpc_c::value_int(ec));

    xmlrpc_c::value_array arrayresult(arrayData);

    *retval = arrayresult;

    NebulaLog::log("ReM",Log::ERROR,str_val);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::success_response(int id)
{    
    vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(id));
    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));


    xmlrpc_c::value_array arrayresult(arrayData);

    *retval = arrayresult;
}

/* -------------------------------------------------------------------------- */

void Request::success_response(const string& val)
{    
    vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_string(val));
    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));

    xmlrpc_c::value_array arrayresult(arrayData);

    *retval = arrayresult;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::object_name(AuthRequest::Object ob)
{
    switch (ob)
    {
        case AuthRequest::VM:
            return "virtual machine";
        case AuthRequest::HOST:
            return "host";
        case AuthRequest::NET:
            return "virtual network";
        case AuthRequest::IMAGE:
            return "image";
        case AuthRequest::USER:
            return "user";
        case AuthRequest::CLUSTER:
            return "cluster";
        case AuthRequest::TEMPLATE:
            return "virtual machine template";
        case AuthRequest::GROUP:
            return "group";
        default:
            return "-";
      }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::authorization_error (const string &action,
                                     const string &object,
                                     int   uid,
                                     int   id)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " User [" << uid << "] not authorized"
        << " to perform " << action << " on " << object;


    if ( id != -1 )
    {
        oss << " [" << id << "].";
    }
    else
    {
        oss << " Pool";
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

string Request::action_error (const string &action,
                              const string &object,
                              int id,
                              int rc)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " Error trying to " << action << " "
        << object;

    switch(id)
    {
        case -2:
            break;
        case -1:
            oss << "Pool.";
            break;
        default:
            oss << " [" << id << "].";
            break;
    }

    if ( rc != 0 )
    {
        oss << " Returned error code [" << rc << "].";
    }

    return oss.str();
}
