/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
        ar_xml(_ar_xml), address_xml("<ADDRESS></MAC></IP></IP6_GLOBAL>"
                "</IP6_ULA></SIZE></ADDRESS>"){};

    IPAMRequest(const std::string& _ar_xml, const std::string& _address_xml) :
        ar_xml(_ar_xml), address_xml(_address_xml){};

    virtual ~IPAMRequest(){};

    /* ---------------------------------------------------------------------- */
    /* Driver message formatting and processing                               */
    /* ---------------------------------------------------------------------- */
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

private:
    /**
     *  XML representation for this request <AR>...</AR>
     */
    string ar_xml;

    /**
     * Address request representation
     */
    string address_xml;
};

#endif
