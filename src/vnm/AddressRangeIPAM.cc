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

#include "AddressRangeIPAM.h"
#include "IPAMRequest.h"
#include "IPAMManager.h"

#include "Nebula.h"
#include "NebulaUtil.h"

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRangeIPAM::from_vattr(VectorAttribute * attr, std::string& error_msg)
{
    IPAMManager * ipamm = Nebula::instance().get_ipamm();

    IPAMRequest ir(attr);

    ipamm->trigger_register_address_range(ir);

    ir.wait();

    if (ir.result != true)
    {
        error_msg = ir.message;
        return -1;
    }

    if (ir.get_ar(attr, error_msg) != 0)
    {
        return -1;
    }

    return AddressRange::from_attr(attr, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangeIPAM::allocate_addr(unsigned int index, unsigned int rsize,
                                    std::string& error_msg)
{
    IPAMManager *      ipamm = Nebula::instance().get_ipamm();
    std::ostringstream oss;

    std::string address_xml;

    to_xml(oss);

    oss.str("");

    addr_to_xml(index, rsize, oss);

    address_xml = oss.str();

    IPAMRequest ir(this, address_xml);

    ipamm->trigger_allocate_address(ir);

    ir.wait();

    if (ir.result != true)
    {
        error_msg = ir.message;
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangeIPAM::get_addr(unsigned int& index, unsigned int rsize,
                               std::string& error_msg)
{
    IPAMManager *      ipamm = Nebula::instance().get_ipamm();
    std::ostringstream oss;

    std::string address_xml;

    to_xml(oss);

    oss.str("");

    oss << "<ADDRESS><SIZE>" << rsize << "</SIZE></ADDRESS>";

    address_xml = oss.str();

    IPAMRequest ir(this, address_xml);

    ipamm->trigger_get_address(ir);

    ir.wait();

    if (ir.result != true)
    {
        error_msg = ir.message;
        return -1;
    }

    std::string ip;

    if ( ir.get_ip(ip, error_msg) != 0 )
    {
        return -1;
    }

    if ( !is_valid_ip(index, ip, false) )
    {
        error_msg = "Address returned by IPAM is not valid: " + ip;
        return -1;
    }

    unsigned int ar_size = get_size();

    for (unsigned int j=0, i=index; j<rsize; j++, i++)
    {
        if ( allocated.count(i) != 0 || i >= ar_size )
        {
            error_msg = "Address returned by IPAM are not within AR or in use";
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRangeIPAM::free_addr(unsigned int index, std::string& error_msg)
{
    IPAMManager *      ipamm = Nebula::instance().get_ipamm();
    std::ostringstream oss;

    std::string address_xml;

    to_xml(oss);

    oss.str("");

    addr_to_xml(index, 1, oss);

    address_xml = oss.str();

    IPAMRequest ir(this, address_xml);

    ipamm->trigger_free_address(ir);

    ir.wait();

    if (ir.result != true)
    {
        error_msg = ir.message;
        return -1;
    }

    return 0;
}

