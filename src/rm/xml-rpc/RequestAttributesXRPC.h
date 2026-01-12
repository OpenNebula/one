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

#ifndef REQUEST_ATTRIBUTES_XRPC_H_
#define REQUEST_ATTRIBUTES_XRPC_H_

#include <xmlrpc-c/base.hpp>

#include "RequestAttributes.h"

class ParamListXRPC: public ParamList
{
public:

    ParamListXRPC(const xmlrpc_c::paramList * pL, const std::set<int>& hidden):
        ParamList(hidden),
        _paramList(pL)
    {};

    unsigned int size() const override
    {
        return _paramList->size();
    };

private:
    const xmlrpc_c::paramList * _paramList;

    std::string api_value(int index) const override
    {
        std::ostringstream oss;
        xmlrpc_c::value::type_t type((*_paramList)[index].type());

        if( type == xmlrpc_c::value::TYPE_INT)
        {
            oss << _paramList->getInt(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_I8 )
        {
            oss << _paramList->getI8(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_BOOLEAN )
        {
            oss << _paramList->getBoolean(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_STRING )
        {
            oss << _paramList->getString(index);
            return oss.str();
        }
        else if( type == xmlrpc_c::value::TYPE_DOUBLE )
        {
            oss << _paramList->getDouble(index);
            return oss.str();
        }

        return oss.str();
    };
};

/**
 * Request attributes for and XML-RPC Call
 */
class RequestAttributesXRPC: public RequestAttributes
{
public:
    RequestAttributesXRPC(AuthRequest::Operation api_auth_op,
                          const ParamListXRPC& pl,
                          xmlrpc_c::value * _retval):
        RequestAttributes(api_auth_op, pl),
        retval(_retval)
    {};

    RequestAttributesXRPC(const RequestAttributesXRPC& ra) = default;

    /* ---------------------------------------------------------------------- */

    xmlrpc_c::value * retval; /**< Return value from libxmlrpc-c */
};

#endif //REQUEST_ATTRIBUTES_XRPC_H_
