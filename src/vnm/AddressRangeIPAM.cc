/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
#include "Nebula.h"
#include "IPAMManager.h"
#include "IPAMRequest.h"
#include "Attribute.h"
#include "VirtualNetworkPool.h"
#include "NebulaUtil.h"

#include <arpa/inet.h>
#include <algorithm>

using namespace std;

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRangeIPAM::get_used_addr(unsigned int &_used_addr) const
{
    Nebula& nd = Nebula::instance();
    IPAMManager * ipamm = nd.get_ipamm();
    ostringstream cmd_params;

    string start_addr = ip_to_s(ip);

    cmd_params << ipam_mad << " "
               << type_to_str(type) << " " 
               << ip4_subnet_to_s(ip4_subnet) << " " 
               << start_addr << " "
               << size;

    IPAMRequest ir(cmd_params.str());

    ipamm->trigger(IPAMManager::GET_USED_ADDR, &ir);
    ir.wait();
    
    if (ir.result != true) 
    {
        return -1;
    }

    istringstream iss(ir.message);
    iss >> _used_addr;

    return 0;
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRangeIPAM::get_free_addr(unsigned int &index)
{
    return get_free_addr_range(index, 1);
}

int AddressRangeIPAM::get_free_addr_range(unsigned int &index, unsigned int rsize)
{
    Nebula& nd = Nebula::instance();
    IPAMManager * ipamm = nd.get_ipamm();
    ostringstream cmd_params;

    string start_addr = ip_to_s(ip);

    cmd_params << ipam_mad << " " 
               << type_to_str(type) << " "
               << ip4_subnet_to_s(ip4_subnet) << " " 
               << start_addr << " " 
               << size << " " 
               << rsize;

    IPAMRequest ir(cmd_params.str());

    ipamm->trigger(IPAMManager::GET_FREE_ADDR_RANGE, &ir);
    ir.wait();

    unsigned int _ip;

    if ((ir.result != true) || (ip_to_i(ir.message, _ip) == -1))
    {
        return -1;
    }

    index = _ip - ip;

    // Check that the range given from the IPAMN fit in the OpenNebula addrress range
    if ((index+rsize) > size) {
        return -1;
    }

    // Check that the range given from the IPAM is free in OpenNebula
    for (unsigned int j=index; j<(index+rsize); j++)
    {
        if (allocated.count(j) != 0)
        {
            return -1;
        }
    }

    return 0;
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRangeIPAM::register_addr(unsigned int index)
{
	return register_addr_range(index, 1);
}

int AddressRangeIPAM::register_addr_range(unsigned int index, unsigned int rsize)
{
    Nebula& nd = Nebula::instance();
    IPAMManager * ipamm = nd.get_ipamm();
    ostringstream cmd_params;

    if ((index+rsize) > size)
    {
        return -1;
    }

    for (unsigned int j=index; j<(index+rsize); j++)
    {
        if (allocated.count(j) != 0)
        {
            return -1;
        }
    }

    string start_addr = ip_to_s(ip + index);

    cmd_params << ipam_mad << " "
               << type_to_str(type) << " " 
               << ip4_subnet_to_s(ip4_subnet) << " " 
               << start_addr << " " 
               << rsize;

    IPAMRequest ir(cmd_params.str());

    ipamm->trigger(IPAMManager::REGISTER_ADDR_RANGE, &ir);
    ir.wait();

    if (ir.result != true) 
    {
        return -1;
    }

    return 0;
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRangeIPAM::free_addr(unsigned int index)
{
    Nebula& nd = Nebula::instance();
    IPAMManager * ipamm = nd.get_ipamm();
    ostringstream cmd_params;

    string addr = ip_to_s(ip + index);

    cmd_params << ipam_mad << " "
               << type_to_str(type) << " " 
               << ip4_subnet_to_s(ip4_subnet) << " " 
               << addr;

    IPAMRequest ir(cmd_params.str());

    ipamm->trigger(IPAMManager::FREE_ADDR, &ir);
    ir.wait();

    if (ir.result != true) 
    {
        return -1;
    }

    return 0;
}

