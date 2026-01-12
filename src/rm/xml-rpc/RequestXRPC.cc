/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestXRPC.h"
#include "Nebula.h"
#include "ClientXRPC.h"

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
/* Request Methods                                                            */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestXRPC::execute(
        xmlrpc_c::paramList const& _paramList,
        const xmlrpc_c::callInfo * _callInfoP,
        xmlrpc_c::value *   const  _retval)
{
    RequestLoggerXRPC logger;

    ParamListXRPC pl(&_paramList, _hidden_params);

    RequestAttributesXRPC att(_auth_op, pl, _retval);

    Nebula& nd  = Nebula::instance();

    RaftManager * raftm = nd.get_raftm();
    UserPool* upool     = nd.get_upool();

    HookManager * hm = nd.get_hm();

    bool authenticated = upool->authenticate(att.session,
                                             att.password,
                                             att.uid,
                                             att.gid,
                                             att.uname,
                                             att.gname,
                                             att.group_ids,
                                             att.umask);

    if ( _log_method_call )
    {
        logger.log_method_invoked(att, pl, _method_name);
    }

    if ( authenticated == false )
    {
        Request::failure_response(AUTHENTICATION, att);

        logger.log_result(att, _method_name);

        return;
    }

    if ( (raftm->is_follower() || nd.is_cache()) && _leader_only)
    {
        string leader_endpoint, error;

        if ( nd.is_cache() )
        {
            leader_endpoint = nd.get_master_oned_xmlrpc();
        }
        else if ( raftm->get_leader_endpoint(leader_endpoint, false) != 0 )
        {
            att.resp_msg = "Cannot process request, no leader found";
            Request::failure_response(INTERNAL, att);

            logger.log_result(att, _method_name);

            return;
        }

        int rc;

        if (Client::is_grpc(leader_endpoint))
        {
            rc = -1;
            att.resp_msg = "Forwarding xml-rpc message to gRPC leader is not supported";
        }
        else
        {
            // Forward message to xml-rpc leader
            rc = ClientXRPC::call(leader_endpoint,
                                  _method_name,
                                  _paramList,
                                  rpc_timeout,
                                  _retval,
                                  att.resp_msg);
        }

        if ( rc != 0 )
        {
            Request::failure_response(INTERNAL, att);

            logger.log_result(att, _method_name);

            return;
        }
    }
    else if ( raftm->is_candidate() && _leader_only)
    {
        att.resp_msg = "Cannot process request, oned cluster in election mode";
        Request::failure_response(INTERNAL, att);

        return;
    }
    else if ( raftm->is_reconciling() && _leader_only)
    {
        att.resp_msg = "Cannot process request, oned cluster is replicating log";
        Request::failure_response(INTERNAL, att);

        return;
    }
    else //leader or solo or !leader_only
    {
        if ( !_zone_disabled && nd.get_zone_state() == Zone::DISABLED )
        {
            att.resp_msg = "Cannot process request, zone disabled";
            Request::failure_response(INTERNAL, att);

            logger.log_result(att, _method_name);

            return;
        }

        request_execute(_paramList, att);
    }

    //--------------------------------------------------------------------------
    // Register API hook event & log call
    //--------------------------------------------------------------------------
    std::string event = HookAPI::format_message(_method_name, pl, att);

    if (!nd.is_cache())
    {
        if (!event.empty())
        {
            hm->trigger_send_event(event);
        }
    }

    if ( _log_method_call )
    {
        logger.log_result(att, _method_name);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestXRPC::make_response(ErrorCode ec,
                                const std::string& value,
                                RequestAttributes& _att)
{
    auto& att = static_cast<RequestAttributesXRPC&>(_att);
    std::vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(ec == SUCCESS));
    arrayData.push_back(xmlrpc_c::value_string(value));
    arrayData.push_back(xmlrpc_c::value_int(ec));

    if ( ec != SUCCESS )
    {
        arrayData.push_back(xmlrpc_c::value_int(att.resp_id));
        arrayData.push_back(xmlrpc_c::value_i8(att.replication_idx));
    }

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestXRPC::make_response(ErrorCode ec,
                                int value,
                                RequestAttributes& _att)
{
    auto& att = static_cast<RequestAttributesXRPC&>(_att);
    std::vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(ec == SUCCESS));
    arrayData.push_back(xmlrpc_c::value_int(value));
    arrayData.push_back(xmlrpc_c::value_int(ec));

    if ( ec != SUCCESS )
    {
        arrayData.push_back(xmlrpc_c::value_int(att.resp_id));
        arrayData.push_back(xmlrpc_c::value_i8(att.replication_idx));
    }

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestXRPC::make_response(ErrorCode ec,
                       uint64_t value,
                       RequestAttributes& _att)
{
    auto& att = static_cast<RequestAttributesXRPC&>(_att);
    std::vector<xmlrpc_c::value> arrayData;

    arrayData.push_back(xmlrpc_c::value_boolean(ec == SUCCESS));
    arrayData.push_back(xmlrpc_c::value_i8(value));
    arrayData.push_back(xmlrpc_c::value_int(ec));

    if ( ec != SUCCESS )
    {
        arrayData.push_back(xmlrpc_c::value_int(att.resp_id));
        arrayData.push_back(xmlrpc_c::value_i8(att.replication_idx));
    }

    xmlrpc_c::value_array arrayresult(arrayData);

    *(att.retval)  = arrayresult;
}
