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

#include "IPAMRequest.h"
#include "VirtualNetworkTemplate.h"
#include "Nebula.h"

#include "AddressRange.h"

using namespace std;

IPAMRequest::IPAMRequest(VectorAttribute * _ar_vattr, const std::string& _axml)
{
    std::ostringstream oss;

    string one_key;

    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);

    for ( const auto& ea : VirtualNetworkTemplate::encrypted )
    {
        _ar_vattr->decrypt(one_key, ea.second);
    }

    _ar_vattr->to_xml(oss);

    ar_xml      = oss.str();
    address_xml = _axml;
}


IPAMRequest::IPAMRequest(AddressRange * _ar, const std::string& _address_xml)
{
    std::ostringstream oss;

    _ar->decrypt();

    _ar->to_xml(oss);

    ar_xml      = oss.str();
    address_xml = _address_xml;
}
