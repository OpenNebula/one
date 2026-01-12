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

#ifndef REQUEST_H_
#define REQUEST_H_

#include "AuthRequest.h"
#include "Quotas.h"
#include "UserPool.h"
#include "PoolObjectSQL.h"
#include "RequestAttributes.h"
#include "HookAPI.h"

/**
 *  The Request Class represents the basic abstraction for the OpenNebula
 *  XML-RPC API. This interface must be implemented by any XML-RPC API call
 */
class Request
{
public:
    /**
     *  Error codes for the OpenNebula API
     */
    enum ErrorCode
    {
        SUCCESS        = 0x00000,
        AUTHENTICATION = 0x00100,
        AUTHORIZATION  = 0x00200,
        NO_EXISTS      = 0x00400,
        ACTION         = 0x00800,
        RPC_API        = 0x01000,
        INTERNAL       = 0x02000,
        ALLOCATE       = 0x04000,
        LOCKED         = 0x08000,
        REPLICATION    = 0x10000
    };

    /* ---------------------------------------------------------------------- */
    /* Class Constructors                                                     */
    /* ---------------------------------------------------------------------- */
    Request(const std::string& mn):
        _method_name(mn),
        _log_method_call(true),
        _leader_only(true),
        _zone_disabled(false)
    {}

    virtual ~Request() = default;

    /**
     *  A descriptive error message is constructed using att.resp_obj, att.resp_id
     *  and/or att.resp_msg and the ErrorCode
     *
     *  @param ec error code for this call
     *  @param ra the specific request attributes
     */
    static std::string failure_message(ErrorCode ec,
                                       RequestAttributes& att,
                                       const std::string& method_name,
                                       PoolObjectSQL::ObjectType auth_object = PoolObjectSQL::NONE);

    /* ---------------------------------------------------------------------- */
    /* Request Attributes                                                     */
    /* ---------------------------------------------------------------------- */

    const std::string& method_name() const
    {
        return _method_name;
    }

    void method_name(const std::string& mn)
    {
        _method_name = mn;
    }

    PoolObjectSQL::ObjectType auth_object() const
    {
        return _auth_object;
    }

    void auth_object(PoolObjectSQL::ObjectType ao)
    {
        _auth_object = ao;
    }

    void auth_op(AuthRequest::Operation ao)
    {
        _auth_op = ao;
    }

    void hidden_params(const std::set<int>& hp)
    {
        _hidden_params = hp;

        _hidden_params.insert(0); // always hide the first parameter
    }

    void leader_only(bool lo)
    {
        _leader_only = lo;
    }

    void log_method_call(bool lm)
    {
        _log_method_call = lm;
    }

    void zone_disabled(bool zd)
    {
        _zone_disabled = zd;
    }

protected:
    /* ---------------------------------------------------------------------- */
    /* Global configuration attributes for API calls                          */
    /* ---------------------------------------------------------------------- */

    /* ---------------------------------------------------------------------- */
    /* Request Attributes: shared among request of the same method            */
    /* ---------------------------------------------------------------------- */
    std::string _method_name;

    // Configuration for authentication level of the API call
    PoolObjectSQL::ObjectType _auth_object = PoolObjectSQL::ObjectType::NONE;

    AuthRequest::Operation _auth_op = AuthRequest::NONE;

    // Logging configuration fot the API call
    std::set<int> _hidden_params = { 0 }; // hide first parameter by default
    bool          _log_method_call;

    // Method can be only execute by leaders or solo servers
    bool _leader_only;

    // Method can be executed in disabled state
    bool _zone_disabled;

    /* ---------------------------------------------------------------------- */

    template <typename T>
    void response(ErrorCode ec, const T& out, RequestAttributes& att)
    {
        if (ec == SUCCESS)
        {
            success_response(out, att);
        }
        else
        {
            failure_response(ec, att);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Exit code functions for RPCs                                           */
    /*  Prepares request exit code. After calling these functions the excute  */
    /*  method should return                                                  */
    /* ---------------------------------------------------------------------- */
    void failure_response(ErrorCode ec, RequestAttributes& att);

    void failure_response(ErrorCode ec,
                          const std::string& val,
                          RequestAttributes& att)
    {
        if (HookAPI::supported_call(_method_name))
        {
            make_xml_response(ec, val, att);
        }

        att.success = false;

        make_response(ec, val, att);
    }

    /**
     *  @param val to be returned to the client
     *  @param att the specific request attributes
     */
    template <typename T>
    void success_response(const T& val, RequestAttributes& att)
    {
        if (HookAPI::supported_call(_method_name))
        {
            make_xml_response(SUCCESS, val, att);
        }

        att.success = true;

        make_response(SUCCESS, val, att);
    }

    /* Generate the protocol specific response message*/
    virtual void make_response(ErrorCode ec,
                               const std::string& value,
                               RequestAttributes& att)
    {}

    virtual void make_response(ErrorCode ec,
                               int value,
                               RequestAttributes& att)
    {}

    virtual void make_response(ErrorCode ec,
                               uint64_t value,
                               RequestAttributes& att)
    {}

    /* ---------------------------------------------------------------------- */
    template <typename T>
    void make_parameter(std::ostringstream& oss, int pos, const T& val)
    {
        oss << "<PARAMETER>"
            << "<POSITION>" << pos << "</POSITION>"
            << "<TYPE>OUT</TYPE>"
            << "<VALUE>" << val << "</VALUE>"
            << "</PARAMETER>";
    }

    /* Compose xml output, used for hooks */
    template <typename T>
    void make_xml_response(ErrorCode ec,
                           const T& value,
                           RequestAttributes& att)
    {
        std::ostringstream oss;

        if ( ec == SUCCESS )
        {
            make_parameter(oss, 1, "true");
        }
        else
        {
            make_parameter(oss, 1, "false");
        }

        if constexpr (std::is_same_v<T, bool>)
        {
            make_parameter(oss, 2, value? "true": "false");
        }
        else
        {
            make_parameter(oss, 2, value);
        }

        make_parameter(oss, 3, ec);

        if ( ec != SUCCESS )
        {
            make_parameter(oss, 4, att.resp_id);
        }

        att.retval_xml = oss.str();
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif //REQUEST_H_

