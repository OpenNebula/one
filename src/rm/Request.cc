/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

string Request::format_str;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::execute(
        xmlrpc_c::paramList const& _paramList,
        xmlrpc_c::value *   const  _retval)
{
    RequestAttributes att;

    att.retval  = _retval;
    att.session = xmlrpc_c::value_string (_paramList.getString(0));

    att.req_id = (reinterpret_cast<uintptr_t>(this) * rand()) % 10000;

    Nebula& nd = Nebula::instance();
    UserPool* upool = nd.get_upool();

    bool authenticated = upool->authenticate(att.session,
                                             att.password,
                                             att.uid,
                                             att.gid,
                                             att.uname,
                                             att.gname,
                                             att.group_ids,
                                             att.umask);

    log_method_invoked(att, _paramList);

    if ( authenticated == false )
    {
        failure_response(AUTHENTICATION, authenticate_error(), att);
    }
    else
    {
        request_execute(_paramList, att);
    }

    log_result(att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::log_method_invoked(
        const RequestAttributes&    att,
        const xmlrpc_c::paramList&  paramList)
{
    ostringstream oss;

    for (unsigned int j = 0 ;j < format_str.length() - 1; j++ )
    {
        if (format_str[j] != '%')
        {
            oss << format_str[j];
        }
        else
        {
            char mod = format_str[j+1];

            switch(mod)
            {
                case '%':
                    oss << "%";
                break;

                case 'i':
                    oss << att.req_id;
                break;

                case 'u':
                    oss << att.uid;
                break;

                case 'U':
                    oss << att.uname;
                break;

                case 'g':
                    oss << att.gid;
                break;

                case 'G':
                    oss << att.gname;
                break;

                case 'p':
                    oss << att.password;
                break;

                case 'a':
                    oss << att.session;
                break;

                case 'm':
                    oss << method_name;
                break;

                case 'l':
                    for (unsigned int i=1; i<paramList.size(); i++)
                    {
                        if ( hidden_params.count(i) == 1 )
                        {
                            oss << ", ****";
                        }
                        else
                        {
                            log_xmlrpc_value(paramList[i], oss);
                        }
                    }
                break;

                default:
                    oss << format_str[j] << format_str[j+1];
                break;
            }

            j = j+1;
        }
    }

    NebulaLog::log("ReM",Log::DEBUG, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::log_result(
        const RequestAttributes&    att)
{
    ostringstream oss;

    oss << "Req:" << att.req_id << " UID:";

    if ( att.uid != -1 )
    {
        oss << att.uid;
    }
    else
    {
        oss << "-";
    }

    oss << " " << method_name << " result ";

    xmlrpc_c::value_array array1(*att.retval);
    vector<xmlrpc_c::value> const vvalue(array1.vectorValueValue());

    if ( static_cast<bool>(xmlrpc_c::value_boolean(vvalue[0])) )
    {
        oss << "SUCCESS";

        for (unsigned int i=1; i<vvalue.size()-1; i++)
        {
            log_xmlrpc_value(vvalue[i], oss);
        }

        NebulaLog::log("ReM",Log::DEBUG, oss);
    }
    else
    {
        oss << "FAILURE "
            << static_cast<string>(xmlrpc_c::value_string(vvalue[1]));

        NebulaLog::log("ReM",Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::log_xmlrpc_value(
        const xmlrpc_c::value&  v,
        ostringstream&          oss)
{
    size_t st_limit = 20;
    size_t st_newline;

    switch (v.type())
    {
        case xmlrpc_c::value::TYPE_INT:
            oss << ", " << static_cast<int>(xmlrpc_c::value_int(v));
            break;
        case xmlrpc_c::value::TYPE_BOOLEAN:
            oss << ", ";

            if ( static_cast<bool>(xmlrpc_c::value_boolean(v)) )
            {
                oss << "true";
            }
            else
            {
                oss << "false";
            }

            break;
        case xmlrpc_c::value::TYPE_STRING:
            st_newline =
                    static_cast<string>(xmlrpc_c::value_string(v)).find("\n");

            if ( st_newline < st_limit )
            {
                st_limit = st_newline;
            }

            oss << ", \"" <<
                static_cast<string>(xmlrpc_c::value_string(v)).substr(0,st_limit);

            if ( static_cast<string>(xmlrpc_c::value_string(v)).size() > st_limit )
            {
                oss << "...";
            }

            oss << "\"";
            break;
        case xmlrpc_c::value::TYPE_DOUBLE:
            oss << ", "
                << static_cast<double>(xmlrpc_c::value_double(v));
            break;
        default:
            oss  << ", unknown param type";
            break;
    }
}

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

    AuthRequest ar(att.uid, att.group_ids);

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
                                        Quotas::QuotaType  qtype,
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

    DefaultQuotas default_user_quotas = nd.get_default_user_quota();

    rc = user->quota.quota_check(qtype, tmpl, default_user_quotas, error_str);

    if (rc == true)
    {
        upool->update_quotas(user);
    }
    else
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::USER) << " [" << att.uid << "] "
            << error_str;

        error_str = oss.str();
    }

    user->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */

bool Request::group_quota_authorization (Template * tmpl,
                                         Quotas::QuotaType  qtype,
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

    DefaultQuotas default_group_quotas = nd.get_default_group_quota();

    rc = group->quota.quota_check(qtype, tmpl, default_group_quotas, error_str);

    if (rc == true)
    {
        gpool->update_quotas(group);
    }
    else
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::GROUP) << " [" << att.gid << "] "
            << error_str;

        error_str = oss.str();
    }

    group->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */

void Request::user_quota_rollback(Template *         tmpl,
                                  Quotas::QuotaType  qtype,
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

    user->quota.quota_del(qtype, tmpl);

    upool->update_quotas(user);

    user->unlock();
}

/* -------------------------------------------------------------------------- */

void Request::group_quota_rollback(Template *         tmpl,
                                   Quotas::QuotaType  qtype,
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

    group->quota.quota_del(qtype, tmpl);

    gpool->update_quotas(group);

    group->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::quota_authorization(Template *         tmpl,
                                  Quotas::QuotaType  qtype,
                                  RequestAttributes& att)
{
    string error_str;

    bool auth = quota_authorization(tmpl, qtype, att, error_str);

    if ( auth == false )
    {
        failure_response(AUTHORIZATION,
                         request_error(error_str, ""),
                         att);
    }

    return auth;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::quota_authorization(
        Template *          tmpl,
        Quotas::QuotaType   qtype,
        RequestAttributes&  att,
        string&             error_str)
{
    // uid/gid == -1 means do not update user/group

    bool do_user_quota = att.uid != UserPool::ONEADMIN_ID && att.uid != -1;
    bool do_group_quota = att.gid != GroupPool::ONEADMIN_ID && att.gid != -1;

    if ( do_user_quota )
    {
        if ( user_quota_authorization(tmpl, qtype, att, error_str) == false )
        {
            return false;
        }
    }

    if ( do_group_quota )
    {
        if ( group_quota_authorization(tmpl, qtype, att, error_str) == false )
        {
            if ( do_user_quota )
            {
                user_quota_rollback(tmpl, qtype, att);
            }

            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::quota_rollback(Template *         tmpl,
                             Quotas::QuotaType  qtype,
                             RequestAttributes& att)
{
    // uid/gid == -1 means do not update user/group

    if ( att.uid != UserPool::ONEADMIN_ID && att.uid != -1 )
    {
        user_quota_rollback(tmpl, qtype, att);
    }

    if ( att.gid != GroupPool::ONEADMIN_ID && att.gid != -1 )
    {
        group_quota_rollback(tmpl, qtype, att);
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
        case PoolObjectSQL::DOCUMENT:
            return "document";
        case PoolObjectSQL::ZONE:
            return "zone";
        case PoolObjectSQL::SECGROUP:
            return "security group";
        case PoolObjectSQL::VDC:
            return "VDC";
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
        string&                   name,
        bool                      throw_error)
{
    PoolObjectSQL * ob;

    if ((ob = pool->get(id,true)) == 0 )
    {
        if (throw_error)
        {
            failure_response(NO_EXISTS, get_error(object_name(type), id), att);
        }

        return -1;
    }

    ob->get_permissions(perms);

    name = ob->get_name();

    ob->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
