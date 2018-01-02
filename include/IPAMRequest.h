/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef IPAM_REQUEST_H_
#define IPAM_REQUEST_H_

#include "SyncRequest.h"
#include "NebulaUtil.h"

/**
 *  The IPAMRequest class represents a request for the IPAM driver. The request
 *  is in the form
 *  request to the AuthManager. The result of the request will be stored
 *  in the result and message attributes of this class.
 */
class IPAMRequest : public SyncRequest
{
public:
    /* ---------------------------------------------------------------------- */
    /* IPAM Request constructors                                              */
    /* ---------------------------------------------------------------------- */
    IPAMRequest(const std::string& _ar_xml) :
        ar_xml(_ar_xml), address_xml("<ADDRESS><MAC/><IP/><IP6_GLOBAL/>"
                "<IP6_ULA/><IP6/><SIZE/></ADDRESS>"){};

    IPAMRequest(const std::string& _ar_xml, const std::string& _address_xml) :
        ar_xml(_ar_xml), address_xml(_address_xml){};

    virtual ~IPAMRequest(){};

    /* ---------------------------------------------------------------------- */
    /* Driver message formatting and processing                               */
    /* ---------------------------------------------------------------------- */
    /**
     *  Builds an base64 encoded XML string with the request for the driver:
     *    <IPAM_DRIVER_ACTION_DATA>
     *      <AR>
     *        <TYPE>
     *        <IP>
     *        <MAC>
     *        <SIZE>
     *        ...
     *      </AR>
     *      <ADDRESS>
     *        <MAC>
     *        <IP>
     *        <IP6>
     *        <IP6_ULA>
     *        <IP6_GLOBAL>
     *        <SIZE>
     *      </ADDRESS>
     *    </IPAM_DRIVER_ACTION_DATA>
     *
     *  <AR> Element with the network description for this request:
     *    - Maybe incomplete for REQUEST_ADDRESS_RANGE
     *  <ADDRESS> Lease request
     *    - Will not be present for REQUEST_ADDRESS_RANGE
     */
    std::string& to_xml64(std::string& action_data) const
    {
        std::ostringstream oss;
        std::string * aux_str;

        oss << "<IPAM_DRIVER_ACTION_DATA>"
            << ar_xml
            << address_xml
            << "</IPAM_DRIVER_ACTION_DATA>";

        aux_str     = one_util::base64_encode(oss.str());
        action_data = *aux_str;

        free(aux_str);

        return action_data;
    }

    /**
     *  Response from drivers is a base64 template with the AR definition
     *  (only for REQUEST_ADDRESS_RANGE) and ADDRESS for GET/ALLOCATE/FREE
     *  requests.
     *
     *  AR = [
     *    TYPE = ...,
     *    IP   = ...,
     *    ...
     *  ]
     *
     *  ADDRESS = [
     *    MAC =
     *    IP  =
     *    ...
     *  ]
     *
     *  NOTE: XML syntax should be also valid
     *
     *  The following functions are helpers to get the response IP and AR
     *    @param error description if any
     *    @return 0 on success
     */
    int get_ar(VectorAttribute * vattr, std::string& error) const
    {
        Template response;

        if ( parse_response(response, error) != 0 )
        {
            return -1;
        }

        VectorAttribute * new_ar = response.get("AR");

        if ( new_ar == 0 )
        {
            error = "AR not found in IPAM driver response";
        }

        vattr->replace(new_ar->value());

        return 0;
    }

    int get_ip(std::string& ip, std::string& error) const
    {
        Template response;

        if ( parse_response(response, error) != 0 )
        {
            return -1;
        }

        VectorAttribute * addr = response.get("ADDRESS");

        if ( addr == 0 )
        {
            error = "ADDRESS not found in IPAM driver response";
        }

        ip = addr->vector_value("IP");

        return 0;
    }

private:
    /**
     *  XML representation for this request <AR>...</AR>
     */
    string ar_xml;

    /**
     * Address request representation
     */
    string address_xml;

    /**
     *  Parse a response from an IPAM driver OpenNebula template or XML
     *  base64 encoded message.
     *    @param response Template with the parsed response
     *    @param error description if any
     *    @return 0 on success
     *
     */
    int parse_response(Template& response, std::string& error) const
    {
        std::string * msg = one_util::base64_decode(message);

        if ( msg == 0 )
        {
            error = "Error decoding base64 IPAM driver response";
            return -1;
        }

        int rc = response.parse_str_or_xml(*msg, error);

        free(msg);

        return rc;
    }
};

#endif
