/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "AddressRange.h"
#include "Attribute.h"
#include "VirtualNetworkPool.h"

#include <arpa/inet.h>

using namespace std;

int AddressRange::init_address_range(VectorAttribute * attr, string& error_msg)
{
    string value;

    /* ---------------------- Address Range type ---------------------------- */

    value = attr->vector_value("TYPE");

    if (value == "ETHER")
    {
        type = ETHER;
    }
    else if (value == "IP4")
    {
        type = IP4;
    }
    else if (value == "IP6")
    {
        type = IP6;
    }
    else if (value == "IP4_6")
    {
        type = IP4_6;
    }
    else
    {
        error_msg = "Unknown address range TYPE.";
        return -1;
    }

    /* ---------------------- Size and Attributes --------------------------- */

    this->attr = attr;

    if ( attr->vector_value("SIZE", size) == -1 || size <= 0 )
    {
        error_msg = "Wrong SIZE for address range";
        return -1;
    }

    /* -------------------- MAC & IPv4 start addresses ---------------------- */

    bool do_mac = false;

    value = attr->vector_value("MAC_START");

    if (value.empty())
    {
        do_mac       = true;
        mac_start[1] = VirtualNetworkPool::mac_prefix();
    }
    else
    {
        if (mac_to_i(value, mac_start) == -1)
        {
            error_msg = "Wrong format for MAC_START attribute";
            return -1;
        };
    }

    switch(type)
    {
        case ETHER:
        case IP6:
            if (do_mac)
            {
                srand(time(0));

                mac_start[0] = rand() && 0x0000FFFF;
                mac_start[0]+= (rand()<<16) && 0xFFFF0000;
            }
            break;

        case IP4:
        case IP4_6:
            value = attr->vector_value("IP_START");

            if (value.empty() || ip_to_i(value, ip_start) == -1)
            {
                error_msg = "Wrong or empty IP_START attribute";
                return -1;
            }

            if (do_mac)
            {
                mac_start[0] = ip_start;
            }
            break;
    }

    /* -------------------------- IP6 prefixes ------------------------------ */

    value = attr->vector_value("GLOBAL_PREFIX");

    if (value.empty())
    {
        global6[1]=global6[0]=0;
    }
    else if (prefix6_to_i(value, global6) != 0 )
    {
        error_msg = "Wrong format for IP6 global address prefix";
        return -1;
    }

    value = attr->vector_value("ULA_PREFIX");

    if (value.empty())
    {
        ula6[1]=ula6[0]=0;
    }
    else if (prefix6_to_i(value, ula6) != 0 )
    {
        error_msg = "Wrong format for IP6 unique local address prefix";
        return -1;
    }

    /* -------------------------- Internal  ------------------------------ */

    unsigned int tmp_id;

    if (attr->vector_value("AR_ID", tmp_id) == 0)
    {
        id = tmp_id;
    }
    else //id initialized in constructor missing from address range vector
    {
        attr->replace("AR_ID", id);
    }

    next = 0;

    if (attr_to_allocated() == -1)
    {
        error_msg = "Wrong format for ALLOCATED array";
        return -1;
    }

    return 0;
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRange::mac_to_i(string mac, unsigned int i_mac[])
{
    istringstream iss;

    size_t pos   = 0;
    int    count = 0;

    unsigned int tmp;

    while ( (pos = mac.find(':')) !=  string::npos )
    {
        mac.replace(pos,1," ");
        count++;
    }

    if (count != 5)
    {
        return -1;
    }

    iss.str(mac);

    i_mac[1] = 0;
    i_mac[0] = 0;

    iss >> hex >> i_mac[1] >> ws >> hex >> tmp >> ws;
    i_mac[1] <<= 8;
    i_mac[1] += tmp;

    for (int i=0;i<4;i++)
    {
        iss >> hex >> tmp >> ws;

        i_mac[0] <<= 8;
        i_mac[0] += tmp;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::ip_to_i(const string& _ip, unsigned int& i_ip)
{
    istringstream iss;
    size_t        pos=0;
    int           count = 0;
    unsigned int  tmp;

    string ip = _ip;

    while ( (pos = ip.find('.')) !=  string::npos )
    {
        ip.replace(pos,1," ");
        count++;
    }

    if (count != 3)
    {
        return -1;
    }

    iss.str(ip);

    i_ip = 0;

    for (int i=0;i<4;i++)
    {
        iss >> dec >> tmp >> ws;

        if ( tmp > 255 )
        {
            return -1;
        }

        i_ip <<= 8;
        i_ip += tmp;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::prefix6_to_i(const string& prefix, unsigned int ip[])
{
    struct in6_addr s6;

    if (prefix.empty())
    {
        ip[1] = ip[0] = 0;
        return 0;
    }

    int rc = inet_pton(AF_INET6, prefix.c_str(), &s6);

    if ( rc != 1 )
    {
        return -1;
    }

    ip[1] = ntohl(s6.s6_addr32[0]);
    ip[0] = ntohl(s6.s6_addr32[1]);

    return 0;
}

/* ************************************************************************** */
/* ************************************************************************** */

void AddressRange::set_mac(unsigned int addr_index, VectorAttribute * nic)
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int i=5;i>=0;i--)
    {
        if ( i < 4 )
        {
            temp_byte = mac_start[0] + addr_index;
            temp_byte >>= i*8;
        }
        else
        {
            temp_byte = mac_start[1];
            temp_byte >>= (i%4)*8;
        }

        temp_byte &= 255;

        oss.width(2);
        oss.fill('0');
        oss << hex << temp_byte;

        if(i!=0)
        {
            oss << ":";
        }
    }

     nic->replace("MAC", oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::set_ip(unsigned int addr_index, VectorAttribute * nic)
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int index=0;index<4;index++)
    {
        temp_byte =   ip_start + addr_index;
        temp_byte >>= (24-index*8);
        temp_byte &=  255;

        oss << temp_byte;

        if(index!=3)
        {
            oss << ".";
        }
    }

    nic->replace("IP", oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::set_ip6(unsigned int addr_index, VectorAttribute * nic)
{
    unsigned int eui64[2];
    unsigned int mlow = mac_start[0] + addr_index;

    struct in6_addr ip6;
    char dst[INET6_ADDRSTRLEN];

    eui64[1] = ((mac_start[1]+512)<<16) + ((mlow&0xFF000000)>>16) + 0x000000FF;
    eui64[0] = 4261412864 + (mlow & 0x00FFFFFF);

    ip6.s6_addr32[2] = htonl(eui64[1]);
    ip6.s6_addr32[3] = htonl(eui64[0]);

    /* Link Local */
    ip6.s6_addr32[0] = htonl(0xfe800000);
    ip6.s6_addr32[1] = 0;

    if ( inet_ntop(AF_INET6, &ip6, dst, INET6_ADDRSTRLEN) != 0 )
    {
        nic->replace("IP6_LINK", dst);
    }

    if (ula6[1] != 0 || ula6[0] != 0 ) /* Unique Local Address*/
    {
        ip6.s6_addr32[0] = htonl(ula6[1]);
        ip6.s6_addr32[1] = htonl(ula6[0]);

        if ( inet_ntop(AF_INET6, &ip6, dst, INET6_ADDRSTRLEN) != 0 )
        {
            nic->replace("IP6_ULA", dst);
        }
    }

    if (global6[1] != 0 || global6[0] != 0 ) /* Glocal Unicast*/
    {
        ip6.s6_addr32[0] = htonl(global6[1]);
        ip6.s6_addr32[1] = htonl(global6[0]);

        if ( inet_ntop(AF_INET6, &ip6, dst, INET6_ADDRSTRLEN) != 0 )
        {
            nic->replace("IP6_GLOBAL", dst);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::set_vnet(VectorAttribute *nic, const vector<string> &inherit)
{
    nic->replace("AR_ID", id);

    string bridge = attr->vector_value("BRIDGE");
    string vlan   = attr->vector_value("VLAN");
    string vlanid = attr->vector_value("VLAN_ID");
    string phydev = attr->vector_value("PHYDEV");

    if (!bridge.empty())
    {
        nic->replace("BRIDGE", bridge);
    }

    if (!vlan.empty())
    {
        nic->replace("VLAN", bridge);
    }

    if (!phydev.empty())
    {
        nic->replace("PHYDEV", phydev);
    }

    if (!vlanid.empty())
    {
        nic->replace("VLAN_ID", vlanid);
    }

    vector<string>::const_iterator it;

    for (it = inherit.begin(); it != inherit.end(); it++)
    {
        string inherit_val = attr->vector_value((*it).c_str());

        if (!inherit_val.empty())
        {
            nic->replace((*it).c_str(), inherit_val);
        }
    }
}

/* ************************************************************************** */
/* ************************************************************************** */

void AddressRange::allocated_to_attr()
{
    if (allocated.empty())
    {
        attr->remove("ALLOCATED");
        return;
    }

    set<unsigned int>::const_iterator it;

    ostringstream oss;

    for (it = allocated.begin(); it != allocated.end(); it++)
    {
        oss << " " << (*it);
    }

    attr->replace("ALLOCATED", oss.str());
}

/* -------------------------------------------------------------------------- */

int AddressRange::attr_to_allocated()
{
    string allocated_s = attr->vector_value("ALLOCATED");

    if (allocated_s.empty())
    {
        allocated.clear();
        return 0;
    }

    istringstream iss(allocated_s);
    unsigned int  addr_index;

    while (!iss.eof())
    {
        iss >> ws >> addr_index;

        if (!iss.fail())
        {
            allocated.insert(addr_index);
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

void AddressRange::allocate_addr(unsigned int addr_index)
{
    allocated.insert(addr_index);

    allocated_to_attr();
}

/* -------------------------------------------------------------------------- */

void AddressRange::free_addr(unsigned int addr_index)
{
    allocated.erase(addr_index);

    allocated_to_attr();
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRange::allocate_addr(VectorAttribute * nic,
    const vector<string> &inherit)
{
    int rc = -1;

    for ( unsigned int i=0; i<size; i++, next = (next+1)%size )
    {
        if ( allocated.count(next) == 0 )
        {
            set_mac(next, nic);

            if (type && 0x00000002 )
            {
                set_ip(next, nic);
            }

            if (type && 0x00000004)
            {
                set_ip6(next, nic);
            }

            set_vnet(nic, inherit);

            allocate_addr(next);
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_by_mac(const string& mac, VectorAttribute * nic,
    const vector<string> &inherit)
{
    unsigned int mac_i[2];

    if (mac_to_i(mac, mac_i) == -1)
    {
        return -1;
    }

    if ((mac_i[1] != mac_start[1]) || (mac_i[0] < mac_start[0]))
    {
        return -1;
    }

    unsigned int index = mac_i[0] - mac_start[0];

    if ((allocated.count(index) != 0) || (index >= size))
    {
        return -1;
    }

    set_mac(index, nic);

    if (type && 0x00000002 )
    {
        set_ip(index, nic);
    }

    if (type && 0x00000004)
    {
        set_ip6(index, nic);
    }

    set_vnet(nic, inherit);

    allocate_addr(next);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_by_ip(const string& ip, VectorAttribute * nic,
        const vector<string> &inherit)
{
    unsigned int ip_i;

    if (ip_to_i(ip, ip_i) == -1)
    {
        return -1;
    }

    if (ip_i < ip_start)
    {
        return -1;
    }

    unsigned int index = ip_i - ip_start;

    if (allocated.count(index) != 0 || index >= size )
    {
        return -1;
    }

    set_mac(index, nic);

    if (type && 0x00000002 )
    {
        set_ip(index, nic);
    }

    if (type && 0x00000004)
    {
        set_ip6(index, nic);
    }

    set_vnet(nic, inherit);

    allocate_addr(next);

    return 0;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::free_addr(const string& mac)
{
    unsigned int mac_i[2];

    mac_to_i(mac, mac_i);

    unsigned int index = mac_i[0] - mac_start[0];

    if ((mac_i[0] >= mac_start[0]) && (index < size))
    {
        free_addr(index);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
