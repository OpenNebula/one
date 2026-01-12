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

#include "ClientXRPC.h"
#include "NebulaLog.h"

#include <fstream>
#include <pwd.h>
#include <stdlib.h>
#include <stdexcept>
#include <set>
#include <sstream>

#include <unistd.h>
#include <sys/types.h>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ClientXRPC::ClientXRPC(const string& secret,
                       const string& endpoint,
                       size_t message_size,
                       unsigned int tout)
{
    string error;
    char * xmlrpc_env;

    if (!secret.empty())
    {
        one_auth = secret;
    }
    else if (read_oneauth(one_auth, error) != 0 )
    {
        NebulaLog::log("XMLRPC", Log::ERROR, error);
        throw runtime_error(error);
    }

    if(!endpoint.empty())
    {
        one_endpoint = endpoint;
    }
    else if ( (xmlrpc_env = getenv("ONE_XMLRPC"))!= 0 )
    {
        one_endpoint = xmlrpc_env;
    }
    else
    {
        one_endpoint = "http://localhost:2633/RPC2";
    }

    xmlrpc_limit_set(XMLRPC_XML_SIZE_LIMIT_ID, message_size);

    timeout = tout * 1000;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::market_allocate(const string& xml, string& error_str)
{
    xmlrpc_c::value result;
    ostringstream oss("Cannot allocate market at federation master: ", ios::ate);

    try
    {
        call("one.market.allocatedb", "s", &result, xml.c_str());
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( !xmlrpc_c::value_boolean(values[0]) )
    {
        string error_xml = xmlrpc_c::value_string(values[1]);

        oss << error_xml;
        error_str = oss.str();

        return -1;
    }

    return xmlrpc_c::value_int(values[1]);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::market_update(int oid, const string& xml)
{
    xmlrpc_c::value result;
    ostringstream oss("Cannot update market in federation master db: ", ios::ate);

    try
    {
        call("one.market.updatedb", "is", &result, oid, xml.c_str());
    }
    catch (exception const& e)
    {
        oss << e.what();
        NebulaLog::log("MKP", Log::ERROR, oss);

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( !xmlrpc_c::value_boolean(values[0]) )
    {
        string error = xmlrpc_c::value_string(values[1]);

        oss << error;
        NebulaLog::log("MKP", Log::ERROR, oss);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::market_app_allocate(const string& xml, string& error)
{
    xmlrpc_c::value result;
    ostringstream oss("Cannot allocate marketapp at federation master: ", ios::ate);

    try
    {
        call("one.marketapp.allocatedb", "s", &result, xml.c_str());
    }
    catch (exception const& e)
    {
        oss << e.what();
        error = oss.str();

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( !xmlrpc_c::value_boolean(values[0]) )
    {
        string error_xml = xmlrpc_c::value_string(values[1]);

        oss << error_xml;
        error = oss.str();

        return -1;
    }

    return xmlrpc_c::value_int(values[1]);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::market_app_drop(int oid, string& error_msg)
{
    xmlrpc_c::value result;
    ostringstream oss("Cannot drop marketapp at federation master: ", ios::ate);

    try
    {
        call("one.marketapp.dropdb", "i", &result, oid);
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_msg = oss.str();

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( !xmlrpc_c::value_boolean(values[0]) )
    {
        string error = xmlrpc_c::value_string(values[1]);

        oss << error;

        error_msg = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::market_app_update(int oid, const string& xml)
{
    xmlrpc_c::value result;
    ostringstream oss("Cannot update marketapp at federation master: ", ios::ate);

    try
    {
        call("one.marketapp.updatedb",
             "is",
             &result,
             oid,
             xml.c_str());
    }
    catch (exception const& e)
    {
        oss << e.what();
        NebulaLog::log("MKP", Log::ERROR, oss);

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( !xmlrpc_c::value_boolean(values[0]) )
    {
        string error = xmlrpc_c::value_string(values[1]);

        oss << error;
        NebulaLog::log("MKP", Log::ERROR, oss);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::user_allocate(const string& uname,
                              const string& passwd,
                              const string& driver,
                              const set<int>& gids,
                              string& error_str)
{
    xmlrpc_c::value result;
    ostringstream oss("Cannot allocate user at federation master: ", ios::ate);

    try
    {
        call("one.user.allocate", "sssI", &result,
             uname.c_str(), passwd.c_str(), driver.c_str(), &gids);
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( xmlrpc_c::value_boolean(values[0]) )
    {
        string error_xml = xmlrpc_c::value_string(values[1]);

        oss << error_xml;
        error_str = oss.str();

        return -1;
    }

    return xmlrpc_c::value_int(values[1]);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::user_chgrp(int user_id, int group_id, string& error_str)
{
    xmlrpc_c::value result;
    ostringstream oss("Cannot change user group at federation master: ", ios::ate);

    try
    {
        call("one.user.chgrp", "ii", &result, user_id, group_id);
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( !xmlrpc_c::value_boolean(values[0]) )
    {
        string error_xml = xmlrpc_c::value_string(values[1]);

        oss << error_xml;
        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::master_update_zone(int oid, const string& xml, string& error_str)
{
    xmlrpc_c::value result;
    std::ostringstream oss("Cannot update zone at federation master: ", std::ios::ate);

    try
    {
        call("one.zone.updatedb", "is", &result, oid, xml.c_str());
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( !xmlrpc_c::value_boolean(values[0]) )
    {
        string e = xmlrpc_c::value_string(values[1]);
        oss << e;

        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::fed_replicate(const std::string& endpoint,
                              const std::string& secret,
                              uint64_t index,
                              uint64_t prev_index,
                              const std::string& sql,
                              time_t timeout_ms,
                              bool& success,
                              uint64_t& last,
                              std::string& error_msg)
{
    static const std::string replica_method = "one.zone.fedreplicate";

    // -------------------------------------------------------------------------
    // Get parameters to call append entries on follower
    // -------------------------------------------------------------------------
    xmlrpc_c::value result;
    xmlrpc_c::paramList replica_params;

    replica_params.add(xmlrpc_c::value_string(secret));
    replica_params.add(xmlrpc_c::value_i8(index));
    replica_params.add(xmlrpc_c::value_i8(prev_index));
    replica_params.add(xmlrpc_c::value_string(sql));

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    int rc = call(endpoint, replica_method, replica_params,
                  timeout_ms, &result, error_msg);

    if (rc != 0)
    {
        return rc;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();
    success = xmlrpc_c::value_boolean(values[0]);

    if ( success ) //values[2] = error code (string)
    {
        last = xmlrpc_c::value_i8(values[1]);
    }
    else
    {
        error_msg = xmlrpc_c::value_string(values[1]);
        last  = xmlrpc_c::value_i8(values[4]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::replicate(const std::string& endpoint,
                          const std::string& secret,
                          const replicate_params& params,
                          const std::string& sql,
                          time_t timeout_ms,
                          bool& success,
                          uint32_t& follower_term,
                          std::string& error_msg)
{
    static const std::string replica_method = "one.zone.replicate";

    // -------------------------------------------------------------------------
    // Get parameters to call append entries on follower
    // -------------------------------------------------------------------------
    xmlrpc_c::value result;
    xmlrpc_c::paramList replica_params;

    replica_params.add(xmlrpc_c::value_string(secret));
    replica_params.add(xmlrpc_c::value_int(params.leader_id));
    replica_params.add(xmlrpc_c::value_i8(params.leader_commit));
    replica_params.add(xmlrpc_c::value_int(params.leader_term));
    replica_params.add(xmlrpc_c::value_i8(params.index));
    replica_params.add(xmlrpc_c::value_int(params.term));
    replica_params.add(xmlrpc_c::value_i8(params.prev_index));
    replica_params.add(xmlrpc_c::value_int(params.prev_term));
    replica_params.add(xmlrpc_c::value_i8(params.fed_index));
    replica_params.add(xmlrpc_c::value_string(sql));

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    int rc = call(endpoint, replica_method, replica_params,
                  timeout_ms, &result, error_msg);

    if (rc != 0 )
    {
        return rc;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();
    success = xmlrpc_c::value_boolean(values[0]);

    if ( success ) //values[2] = error code (string)
    {
        follower_term = xmlrpc_c::value_int(values[1]);
    }
    else
    {
        error_msg = xmlrpc_c::value_string(values[1]);
        follower_term = xmlrpc_c::value_int(values[3]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::vote_request(const std::string& endpoint,
                             const std::string& secret,
                             uint32_t term,
                             int candidate_id,
                             uint32_t log_index,
                             uint32_t log_term,
                             time_t timeout_ms,
                             bool& success,
                             uint32_t& follower_term,
                             std::string& error_msg)
{
    static const std::string method = "one.zone.voterequest";

    // -------------------------------------------------------------------------
    // Get parameters to call append entries on follower
    // -------------------------------------------------------------------------
    xmlrpc_c::value result;
    xmlrpc_c::paramList replica_params;

    replica_params.add(xmlrpc_c::value_string(secret));
    replica_params.add(xmlrpc_c::value_int(term));
    replica_params.add(xmlrpc_c::value_int(candidate_id));
    replica_params.add(xmlrpc_c::value_i8(log_index));
    replica_params.add(xmlrpc_c::value_int(log_term));

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    int rc = ClientXRPC::call(endpoint, method, replica_params,
                              timeout_ms, &result, error_msg);

    if ( rc != 0 )
    {
        return rc;
    }

    const auto values = xmlrpc_c::value_array(result).vectorValueValue();
    success           = xmlrpc_c::value_boolean(values[0]);

    if ( success ) //values[2] = error code (string)
    {
        follower_term = xmlrpc_c::value_int(values[1]);
    }
    else
    {
        error_msg = xmlrpc_c::value_string(values[1]);
        follower_term = xmlrpc_c::value_int(values[3]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClientXRPC::call(const string &method,
                      const string &format,
                      xmlrpc_c::value * const result,
                      ...)
{
    va_list args;
    va_start(args, result);

    string  sval;
    int     ival;
    bool    bval;

    set<int> * vval;

    const char* pval;
    vector<xmlrpc_c::value> x_vval;

    xmlrpc_c::paramList plist;

    plist.add(xmlrpc_c::value_string(one_auth));

    for (auto ch : format)
    {
        switch(ch)
        {
            case 's':
                pval = static_cast<const char*>(va_arg(args, char *));
                sval = pval;

                plist.add(xmlrpc_c::value_string(sval));
                break;

            case 'i':
                ival = va_arg(args, int);

                plist.add(xmlrpc_c::value_int(ival));
                break;

            case 'b':
                bval = va_arg(args, int);

                plist.add(xmlrpc_c::value_boolean(bval));
                break;

            case 'I':
                vval = static_cast<set<int> *>(va_arg(args, set<int> *));

                for (auto it = vval->begin(); it != vval->end(); ++it)
                {
                    x_vval.push_back(xmlrpc_c::value_int(*it));
                }

                plist.add(xmlrpc_c::value_array(x_vval));
                break;

            default:
                break;
        }
    }

    va_end(args);

    call(method, plist, result);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClientXRPC::call(const string& method,
                      const xmlrpc_c::paramList& plist,
                      xmlrpc_c::value * const result)
{
    xmlrpc_c::clientXmlTransport_curl ctrans(
            xmlrpc_c::clientXmlTransport_curl::constrOpt().timeout(timeout));

    xmlrpc_c::carriageParm_curl0 cparam(one_endpoint);

    xmlrpc_c::client_xml client(&ctrans);
    xmlrpc_c::rpcPtr     rpc(method, plist);

    rpc->start(&client, &cparam);

    client.finishAsync(xmlrpc_c::timeout());

    if (rpc->isSuccessful())
    {
        *result = rpc->getResult();
    }
    else
    {
        xmlrpc_c::fault failure = rpc->getFault();

        girerr::error(failure.getDescription());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientXRPC::call(const string& endpoint,
                     const string& method,
                     const xmlrpc_c::paramList& plist,
                     unsigned int _timeout,
                     xmlrpc_c::value * const result,
                     string& error)
{
// Transport timeouts are not reliably implemented, interrupt flag and async
// client performs better.
//    xmlrpc_c::clientXmlTransport_curl transport(
//        xmlrpc_c::clientXmlTransport_curl::constrOpt().timeout(_timeout));
    xmlrpc_c::clientXmlTransport_curl transport;

    xmlrpc_c::carriageParm_curl0  carriage(endpoint);

    xmlrpc_c::client_xml client(&transport);
    xmlrpc_c::rpcPtr     rpc_client(method, plist);

    int xml_rc   = 0;
    int int_flag = 0;

    try
    {
        rpc_client->start(&client, &carriage);

        client.setInterrupt(&int_flag);

        if ( _timeout == 0 )
        {
            client.finishAsync(xmlrpc_c::timeout());
        }
        else
        {
            client.finishAsync(_timeout);
        }

        if ( rpc_client->isFinished() )
        {
            if ( rpc_client->isSuccessful() )
            {
                *result = rpc_client->getResult();
            }
            else //RPC failed
            {
                xmlrpc_c::fault failure = rpc_client->getFault();

                error  = failure.getDescription();
                xml_rc = -1;
            }
        }
        else //rpc not finished. Interrupt it
        {
            int_flag = 1;

            error  = "RPC call timed out and aborted";
            xml_rc = -1;

            client.finishAsync(xmlrpc_c::timeout());
        }
    }
    catch (exception const& e)
    {
        error  = e.what();
        xml_rc = -1;
    }

    return xml_rc;
}
