/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "Client.h"

#include "PoolObjectAuth.h"
#include "HookAPI.h"
#include "HookManager.h"
#include "RaftManager.h"
#include "ZonePool.h"

#include <xmlrpc-c/abyss.h>

#include <sys/socket.h>
#include <netdb.h>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* RequestLog Methods                                                         */
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
        case PoolObjectSQL::VROUTER:
            return "virtual router";
        case PoolObjectSQL::MARKETPLACE:
            return "marketplace";
        case PoolObjectSQL::MARKETPLACEAPP:
            return "marketplaceapp";
        case PoolObjectSQL::VMGROUP:
            return "vm group";
        case PoolObjectSQL::VNTEMPLATE:
            return "virtual network template";
        case PoolObjectSQL::HOOK:
            return "hook";
        case PoolObjectSQL::BACKUPJOB:
            return "backup job";
        case PoolObjectSQL::SCHEDULEDACTION:
            return "scheduled action";
        default:
            return "-";
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void get_client_ip(const xmlrpc_c::callInfo * call_info, char * const
                          ip, char * const port)
{
    struct abyss_unix_chaninfo * unix_ci;

    const xmlrpc_c::callInfo_serverAbyss * abyss_ci =
            static_cast<const xmlrpc_c::callInfo_serverAbyss *>(call_info);

    SessionGetChannelInfo(abyss_ci->abyssSessionP, (void **) &unix_ci);

    // -------------------------------------------------------------------------
    // NOTE: This only works for IPv4 as abyss_unix_chaninfo is not IPv6 ready
    // it should use sockaddr_storage for peerAddr, and set peerAddrLen properly
    // This could be bypassed with getpeername if library exposes access to
    // channel implementation, i.e. socket fd
    // -------------------------------------------------------------------------

    int rc = getnameinfo(&(unix_ci->peerAddr), unix_ci->peerAddrLen, ip,
                         NI_MAXHOST, port, NI_MAXSERV, NI_NUMERICHOST|NI_NUMERICSERV);

    if ( rc != 0 )
    {
        ip[0] = '-';
        ip[1] = '\0';

        port[0] = '-';
        port[1] = '\0';
    }
}

void Request::log_method_invoked(const RequestAttributes& att,
                                 const xmlrpc_c::paramList&  paramList, const string& format_str,
                                 const std::string& method_name, const std::set<int>& hidden_params,
                                 const xmlrpc_c::callInfo * call_info)
{
    std::ostringstream oss;
    std::ostringstream oss_limit;

    int limit = DEFAULT_LOG_LIMIT;
    char mod;

    char ip[NI_MAXHOST];
    char port[NI_MAXSERV];

    ip[0]   = '\0';
    port[0] = '\0';

    for (unsigned int j = 0 ; j < format_str.length() - 1; j++ )
    {
        if (format_str[j] != '%')
        {
            oss << format_str[j];
        }
        else
        {
            if (j+1 < format_str.length())
            {
                mod = format_str[j+1];
            }
            else
            {
                break;
            }

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
                    while ((j+2)<format_str.length() && isdigit(format_str[j+2]))
                    {
                        oss_limit << format_str[j+2];
                        j = j+1;
                    }

                    if ( !oss_limit.str().empty() )
                    {
                        limit = stoi(oss_limit.str());
                    }

                    for (unsigned int i=1; i<paramList.size(); i++)
                    {
                        if ( hidden_params.count(i) == 1 )
                        {
                            oss << ", ****";
                        }
                        else
                        {
                            log_xmlrpc_value(paramList[i], oss, limit);
                        }
                    }
                    break;

                case 'A':
                    if ( ip[0] == '\0' )
                    {
                        get_client_ip(call_info, ip, port);
                    }

                    oss << ip;
                    break;

                case 'P':
                    if ( port[0] == '\0' )
                    {
                        get_client_ip(call_info, ip, port);
                    }

                    oss << port;
                    break;

                default:
                    oss << format_str[j] << format_str[j+1];
                    break;
            }

            j = j+1;
        }
    }

    NebulaLog::log("ReM", Log::DEBUG, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::log_result(const RequestAttributes& att, const string& method_name)
{
    std::ostringstream oss;

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
            log_xmlrpc_value(vvalue[i], oss, DEFAULT_LOG_LIMIT);
        }

        NebulaLog::log("ReM", Log::DEBUG, oss);
    }
    else
    {
        oss << "FAILURE "
            << static_cast<string>(xmlrpc_c::value_string(vvalue[1]));

        NebulaLog::log("ReM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::log_xmlrpc_value(const xmlrpc_c::value& v, std::ostringstream& oss, const int limit)
{
    size_t st_limit = limit;
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
                    static_cast<string>(xmlrpc_c::value_string(v)).length();

            if ( st_newline < st_limit )
            {
                st_limit = st_newline;
            }

            oss << ", \"" <<
                static_cast<string>(xmlrpc_c::value_string(v)).substr(0, st_limit);

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
        case xmlrpc_c::value::TYPE_I8:
            oss << ", " << static_cast<uint64_t>(xmlrpc_c::value_i8(v));
            break;
        default:
            oss  << ", unknown param type";
            break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Request Methods                                                            */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::format_str;

const long long Request::xmlrpc_timeout = 10000;

/* -------------------------------------------------------------------------- */

void Request::execute(
        xmlrpc_c::paramList const& _paramList,
        const xmlrpc_c::callInfo * _callInfoP,
        xmlrpc_c::value *   const  _retval)
{
    RequestAttributes att(auth_op);

    att.retval  = _retval;
    att.session = xmlrpc_c::value_string(_paramList.getString(0));

    att.req_id  = (reinterpret_cast<uintptr_t>(this) * one_util::random<int>()) % 10000;

    Nebula& nd  = Nebula::instance();

    RaftManager * raftm = nd.get_raftm();
    UserPool* upool     = nd.get_upool();

    HookManager * hm = nd.get_hm();

    bool authenticated = upool->authenticate(att.session, att.password,
                                             att.uid, att.gid, att.uname, att.gname, att.group_ids, att.umask);

    att.set_auth_op(vm_action);

    if ( log_method_call )
    {
        log_method_invoked(att, _paramList, format_str, method_name,
                           hidden_params, _callInfoP);
    }

    if ( authenticated == false )
    {
        failure_response(AUTHENTICATION, att);

        log_result(att, method_name);

        return;
    }

    if ( (raftm->is_follower() || nd.is_cache()) && leader_only)
    {
        string leader_endpoint, error;

        if ( nd.is_cache() )
        {
            leader_endpoint = nd.get_master_oned();
        }
        else if ( raftm->get_leader_endpoint(leader_endpoint) != 0 )
        {
            att.resp_msg = "Cannot process request, no leader found";
            failure_response(INTERNAL, att);

            log_result(att, method_name);

            return;
        }

        int rc = Client::call(leader_endpoint, method_name, _paramList,
                              xmlrpc_timeout, _retval, att.resp_msg);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, att);

            log_result(att, method_name);

            return;
        }
    }
    else if ( raftm->is_candidate() && leader_only)
    {
        att.resp_msg = "Cannot process request, oned cluster in election mode";
        failure_response(INTERNAL, att);
    }
    else if ( raftm->is_reconciling() && leader_only)
    {
        att.resp_msg = "Cannot process request, oned cluster is replicating log";
        failure_response(INTERNAL, att);
    }
    else //leader or solo or !leader_only
    {
        if ( !zone_disabled && nd.get_zone_state() == Zone::DISABLED )
        {
            att.resp_msg = "Cannot process request, zone disabled";
            failure_response(INTERNAL, att);

            log_result(att, method_name);

            return;
        }

        request_execute(_paramList, att);
    }

    //--------------------------------------------------------------------------
    // Register API hook event & log call
    //--------------------------------------------------------------------------
    ParamList pl(&_paramList, hidden_params);

    std::string event = HookAPI::format_message(method_name, pl, att);

    if (!nd.is_cache())
    {
        if (!event.empty())
        {
            hm->trigger_send_event(event);
        }
    }

    if ( log_method_call )
    {
        log_result(att, method_name);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::basic_authorization(int oid, RequestAttributes& att)
{
    ErrorCode ec = basic_authorization(pool, oid, auth_object, att);

    if (ec == SUCCESS)
    {
        return true;
    }
    else
    {
        failure_response(ec, att);
        return false;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode Request::basic_authorization(
        PoolSQL*                pool,
        int                     oid,
        PoolObjectSQL::ObjectType auth_object,
        RequestAttributes&      att)
{
    PoolObjectAuth  perms;

    if ( oid >= 0 )
    {
        auto object = pool->get_ro<PoolObjectSQL>(oid);

        if ( object == nullptr )
        {
            att.resp_id = oid;

            return NO_EXISTS;
        }

        object->get_permissions(perms);
    }
    else
    {
        perms.obj_type = auth_object;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return AUTHORIZATION;
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::user_quota_authorization (Template * tmpl,
                                        Quotas::QuotaType  qtype,
                                        const RequestAttributes& att,
                                        string& error_str)
{
    Nebula& nd        = Nebula::instance();
    UserPool *  upool = nd.get_upool();

    bool   rc = false;

    auto user = upool->get(att.uid);

    if ( user == nullptr )
    {
        error_str = "User not found";
        return false;
    }

    DefaultQuotas default_user_quotas = nd.get_default_user_quota();

    rc = user->quota.quota_check(qtype, tmpl, default_user_quotas, error_str);

    if (rc == true)
    {
        upool->update_quotas(user.get());
    }
    else
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::USER) << " [" << att.uid << "] "
            << error_str;

        error_str = oss.str();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */

bool Request::group_quota_authorization (Template * tmpl,
                                         Quotas::QuotaType  qtype,
                                         const RequestAttributes& att,
                                         string& error_str)
{
    Nebula&     nd    = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();

    bool   rc = false;

    auto group = gpool->get(att.gid);

    if ( group == nullptr )
    {
        error_str = "Group not found";
        return false;
    }

    DefaultQuotas default_group_quotas = nd.get_default_group_quota();

    rc = group->quota.quota_check(qtype, tmpl, default_group_quotas, error_str);

    if (rc == true)
    {
        gpool->update_quotas(group.get());
    }
    else
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::GROUP) << " [" << att.gid << "] "
            << error_str;

        error_str = oss.str();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */

void Request::user_quota_rollback(Template *         tmpl,
                                  Quotas::QuotaType  qtype,
                                  const RequestAttributes& att)
{
    Nebula& nd        = Nebula::instance();
    UserPool * upool  = nd.get_upool();

    if ( auto user = upool->get(att.uid) )
    {
        user->quota.quota_del(qtype, tmpl);

        upool->update_quotas(user.get());
    }
}

/* -------------------------------------------------------------------------- */

void Request::group_quota_rollback(Template *         tmpl,
                                   Quotas::QuotaType  qtype,
                                   const RequestAttributes& att)
{
    Nebula& nd        = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();

    if ( auto group = gpool->get(att.gid) )
    {
        group->quota.quota_del(qtype, tmpl);

        gpool->update_quotas(group.get());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::quota_authorization(Template *         tmpl,
                                  Quotas::QuotaType  qtype,
                                  RequestAttributes& att)
{
    bool auth = quota_authorization(tmpl, qtype, att, att.resp_msg);

    if ( auth == false )
    {
        failure_response(AUTHORIZATION, att);
    }

    return auth;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Request::quota_authorization(
        Template *          tmpl,
        Quotas::QuotaType   qtype,
        const RequestAttributes&  att,
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
                             const RequestAttributes& att)
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

template <typename T>
static void make_parameter(std::ostringstream& oss, int pos, const T& val)
{
    oss << "<PARAMETER>"
        << "<POSITION>" << pos << "</POSITION>"
        << "<TYPE>OUT</TYPE>"
        << "<VALUE>" << val << "</VALUE>"
        << "</PARAMETER>";
}

void Request::failure_response(ErrorCode ec, const string& str_val,
                               RequestAttributes& att) const
{
    vector<xmlrpc_c::value> arrayData;
    ostringstream oss;

    arrayData.push_back(xmlrpc_c::value_boolean(false));
    make_parameter(oss, 1, "false");

    arrayData.push_back(xmlrpc_c::value_string(str_val));
    make_parameter(oss, 2, one_util::escape_xml(str_val));

    arrayData.push_back(xmlrpc_c::value_int(ec));
    make_parameter(oss, 3, ec);

    arrayData.push_back(xmlrpc_c::value_int(att.resp_id));
    make_parameter(oss, 4, att.resp_id);

    arrayData.push_back(xmlrpc_c::value_i8(att.replication_idx));

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
    att.success    = false;
    att.retval_xml = oss.str();
}

/* -------------------------------------------------------------------------- */

string Request::failure_message(ErrorCode ec, RequestAttributes& att)
{
    return failure_message(ec, att, method_name, auth_object);
}

/* -------------------------------------------------------------------------- */

string Request::failure_message(ErrorCode ec, RequestAttributes& att,
                                const std::string& method_name, PoolObjectSQL::ObjectType auth_object)
{
    std::ostringstream oss;
    std::string        obname;

    if ( att.resp_obj == PoolObjectSQL::NONE )
    {
        obname = object_name(auth_object);
    }
    else
    {
        obname = object_name(att.resp_obj);
    }

    oss << "[" << method_name << "] ";

    switch(ec)
    {
        case SUCCESS:
            return "";

        case AUTHORIZATION:
            oss << "User [" << att.uid << "] ";

            if (att.resp_msg.empty())
            {
                oss << "not authorized to perform action on " << obname << ".";
            }
            else
            {
                oss << ": " << att.resp_msg << ".";
            }
            break;

        case AUTHENTICATION:
            oss << "User couldn't be authenticated, aborting call.";
            break;

        case ACTION:
        case XML_RPC_API:
        case INTERNAL:
            oss << att.resp_msg;
            break;

        case NO_EXISTS:
            oss << "Error getting " << obname;

            if ( att.resp_id != -1 )
            {
                oss << " [" << att.resp_id << "].";
            }
            else
            {
                oss << " Pool.";
            }
            break;

        case ALLOCATE:
            oss << "Error allocating a new " << obname << ".";

            if (!att.resp_msg.empty())
            {
                oss << " " << att.resp_msg;
            }
            break;
        case LOCKED:
            oss << "The resource " << obname << " is locked.";

            if ( att.resp_id != -1 )
            {
                oss << " [" << att.resp_id << "].";
            }
            break;
        case REPLICATION:
            oss << "Error replicating log entry " << att.replication_idx;

            if (att.resp_msg.empty())
            {
                oss << ".";
            }
            else
            {
                oss << ": " << att.resp_msg << ".";
            }
            break;
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::failure_response(ErrorCode ec, RequestAttributes& att)
{
    failure_response(ec, failure_message(ec, att), att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::success_response(int id, RequestAttributes& att)
{
    vector<xmlrpc_c::value> arrayData;
    ostringstream oss;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    make_parameter(oss, 1, "true");

    arrayData.push_back(xmlrpc_c::value_int(id));
    make_parameter(oss, 2, id);

    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));
    make_parameter(oss, 3, SUCCESS);

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
    att.success    = true;
    att.retval_xml = oss.str();
}

/* -------------------------------------------------------------------------- */

void Request::success_response(const string& val, RequestAttributes& att)
{
    vector<xmlrpc_c::value> arrayData;
    ostringstream oss;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    make_parameter(oss, 1, "true");

    arrayData.push_back(static_cast<xmlrpc_c::value_string>(val));
    make_parameter(oss, 2, val);

    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));
    make_parameter(oss, 3, SUCCESS);

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
    att.success    = true;
    att.retval_xml = oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::success_response(bool val, RequestAttributes& att)
{
    vector<xmlrpc_c::value> arrayData;
    ostringstream oss;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    make_parameter(oss, 1, "true");

    arrayData.push_back(xmlrpc_c::value_boolean(val));
    make_parameter(oss, 2, val? "true": "false");

    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));
    make_parameter(oss, 3, SUCCESS);

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
    att.success    = true;
    att.retval_xml = oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::success_response(uint64_t val, RequestAttributes& att)
{
    vector<xmlrpc_c::value> arrayData;
    ostringstream oss;

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    make_parameter(oss, 1, "true");

    arrayData.push_back(xmlrpc_c::value_i8(val));
    make_parameter(oss, 2, val);

    arrayData.push_back(xmlrpc_c::value_int(SUCCESS));
    make_parameter(oss, 3, SUCCESS);

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
    att.success    = true;
    att.retval_xml = oss.str();
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
    auto ob = pool->get_ro<PoolObjectSQL>(id);

    if (ob == nullptr)
    {
        if (throw_error)
        {
            att.resp_obj = type;
            att.resp_id  = id;
            failure_response(NO_EXISTS, att);
        }

        return -1;
    }

    ob->get_permissions(perms);

    name = ob->get_name();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode Request::as_uid_gid(Template * tmpl, RequestAttributes& att)
{
    string gname;
    string uname;

    PoolObjectAuth uperms;
    PoolObjectAuth gperms;

    int uid = att.uid, as_uid = -1, as_gid = -1;

    set<int> gids = att.group_ids;

    int rc;

    UserPool * upool  = Nebula::instance().get_upool();
    GroupPool * gpool = Nebula::instance().get_gpool();

    if ( tmpl->get("AS_UID", as_uid) )
    {
        tmpl->erase("AS_UID");

        rc = get_info(upool, as_uid, PoolObjectSQL::USER, att, uperms, uname,
                      true);

        if ( rc == -1 )
        {
            return NO_EXISTS;
        }
    }
    else
    {
        as_uid = -1;
    }

    if ( tmpl->get("AS_GID", as_gid) )
    {
        tmpl->erase("AS_GID");

        rc = get_info(gpool, as_gid, PoolObjectSQL::GROUP, att, gperms, gname,
                      true);

        if ( rc == -1 )
        {
            return NO_EXISTS;
        }
    }
    else
    {
        as_gid = -1;
    }

    if ( as_gid == -1 && as_uid == -1)
    {
        return SUCCESS;
    }

    if ( uid != 0 )
    {
        AuthRequest ar(uid, gids);

        if (as_uid > 0)
        {
            ar.add_auth(AuthRequest::MANAGE, uperms); // MANAGE USER
        }
        if (as_gid > 0)
        {
            ar.add_auth(AuthRequest::MANAGE, gperms); // MANAGE GROUP
        }

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            return AUTHORIZATION;
        }
    }

    if ( as_uid > 0 )
    {
        att.uid = as_uid;
        att.uname = uname;
    }

    if ( as_gid > 0 )
    {
        att.gid = as_gid;
        att.gname = gname;
        att.group_ids.clear();
        att.group_ids.insert(as_gid);
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestAttributes::set_auth_op(VMActions::Action action)
{
    if (action == VMActions::NONE_ACTION)
    {
        return;
    }

    AuthRequest::Operation result = AuthRequest::NONE;

    auto& nd  = Nebula::instance();

    if (auto user = nd.get_upool()->get_ro(uid))
    {
        result = user->get_vm_auth_op(action);
    }

    if (result != AuthRequest::NONE)
    {
        auth_op = result;
        return;
    }

    if (auto group = nd.get_gpool()->get_ro(gid))
    {
        result = group->get_vm_auth_op(action);
    }

    if (result != AuthRequest::NONE)
    {
        auth_op = result;
        return;
    }

    result = nd.get_vm_auth_op(action);

    if (result != AuthRequest::NONE)
    {
        auth_op = result;
    }
}

