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
#include "NebulaUtil.h"

#include <arpa/inet.h>

using namespace std;

/* ************************************************************************** */
/* ************************************************************************** */

string AddressRange::type_to_str(AddressType ob)
{
    switch (ob)
    {
        case ETHER: return "ETHER"; break;
        case IP4:   return "IP4"  ; break;
        case IP6:   return "IP6"  ; break;
        case IP4_6: return "IP4_6"; break;
        default:    return "";
    }
};

/* -------------------------------------------------------------------------- */

AddressRange::AddressType AddressRange::str_to_type(string& str_type)
{
    one_util::toupper(str_type);

    if (str_type == "ETHER")
    {
        return ETHER;
    }
    else if (str_type == "IP4")
    {
        return IP4;
    }
    else if (str_type == "IP6")
    {
        return IP6;
    }
    else if (str_type == "IP4_6")
    {
        return IP4_6;
    }
    else
    {
        return NONE;
    }
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRange::from_vattr(VectorAttribute *vattr, string& error_msg)
{
    string value;

    attr = vattr;

    /* ------------------------- AR Type & Size ---------------------------- */

    value = vattr->vector_value("TYPE");
    type  = str_to_type(value);

    if (type == NONE)
    {
        error_msg = "Unknown or missing address range TYPE.";
        return -1;
    }

    if ( vattr->vector_value("SIZE", size) != 0 || size <= 0 )
    {
        error_msg = "Wrong SIZE for address range";
        return -1;
    }

    /* -------------------- MAC & IPv4 start addresses ---------------------- */

    bool do_mac = false;

    value = vattr->vector_value("MAC");

    if (value.empty())
    {
        do_mac = true;
        mac[1] = VirtualNetworkPool::mac_prefix();
    }
    else
    {
        if (mac_to_i(value, mac) == -1)
        {
            error_msg = "Wrong format for MAC attribute";
            return -1;
        };
    }

    switch(type)
    {
        case ETHER:
        case IP6:
            vattr->remove("IP");

            if (do_mac)
            {
                srand(time(0));

                mac[0] = rand() & 0x0000FFFF;
                mac[0]+= (rand()<<16) & 0xFFFF0000;
            }
            break;

        case IP4:
        case IP4_6:
            value = vattr->vector_value("IP");

            if (value.empty() || ip_to_i(value, ip) == -1)
            {
                error_msg = "Wrong or empty IP attribute";
                return -1;
            }

            if (do_mac)
            {
                mac[0] = ip;
            }
            break;

        default:
            return -1;
    }

    /* -------------------------- IP6 prefixes ------------------------------ */

    value = vattr->vector_value("GLOBAL_PREFIX");

    if (prefix6_to_i(value, global6) != 0 )
    {
        error_msg = "Wrong format for IP6 global address prefix";
        return -1;
    }

    value = vattr->vector_value("ULA_PREFIX");

    if (prefix6_to_i(value, ula6) != 0 )
    {
        error_msg = "Wrong format for IP6 unique local address prefix";
        return -1;
    }

    /* ------------------------- VNET Attributes ---------------------------- */

    bool b_vlan;

    if ((vattr->vector_value("VLAN", b_vlan) == 0) && b_vlan)
    {
        vattr->replace("VLAN", "YES");
    }

    /* ------------------------ AR Internal Data ---------------------------- */

    vattr->replace("AR_ID", id);

    if (do_mac) //Need to add MAC to the attribute
    {
        set_mac(0, attr);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::update_attributes(VectorAttribute *vup)
{
    /* --------------- Copy non-update attributes ----------------- */

    vup->replace("TYPE", attr->vector_value("TYPE"));

    vup->replace("MAC", attr->vector_value("MAC"));

    vup->remove("IP");

    if (type & 0x00000002)
    {
        vup->replace("IP", attr->vector_value("IP"));
    }

    /* ----------------- Remove internal attributes ----------------- */

    vup->replace("AR_ID", attr->vector_value("AR_ID"));

    vup->replace("ALLOCATED", attr->vector_value("ALLOCATED"));

    vup->remove("USED_LEASES");

    vup->remove("LEASES");

    /* ----------------- update known attributes ----------------- */

    unsigned int new_size;

    if (vup->vector_value("SIZE", new_size) == 0)
    {
        map<unsigned int, long long> itup;

        if (allocated.upper_bound(new_size-1) == allocated.end())
        {
            size = new_size;
        }
    }

    vup->replace("SIZE", size);

    string value = vup->vector_value("GLOBAL_PREFIX");

    if (prefix6_to_i(value, global6) != 0 )
    {
        vup->replace("GLOBAL_PREFIX", attr->vector_value("GLOBAL_PREFIX"));
    }

    value = vup->vector_value("ULA_PREFIX");

    if (prefix6_to_i(value, ula6) != 0 )
    {
        vup->replace("ULA_PREFIX", attr->vector_value("ULA_PREFIX"));
    }

    /* Replace with the new attributes */

    attr->replace(vup->value());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::from_vattr_db(VectorAttribute *vattr)
{
    string value;
    int    rc = 0;

    this->attr = vattr;

    rc += vattr->vector_value("AR_ID", id);

    value = vattr->vector_value("TYPE");
    type  = str_to_type(value);

    rc += vattr->vector_value("SIZE", size);

    rc += mac_to_i(vattr->vector_value("MAC"), mac);

    if (type & 0x00000002)
    {
        rc += ip_to_i(vattr->vector_value("IP"), ip);
    }

    rc += prefix6_to_i(vattr->vector_value("GLOBAL_PREFIX"), global6);

    rc += prefix6_to_i(vattr->vector_value("ULA_PREFIX"), ula6);

    rc += attr_to_allocated(vattr->vector_value("ALLOCATED"));

    if (type == NONE)
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::to_xml(ostringstream &oss) const
{
    const map<string,string>&          ar_attrs = attr->value();
    map<string,string>::const_iterator it;

    oss << "<AR>";

    for (it=ar_attrs.begin(); it != ar_attrs.end(); it++)
    {
        if ( it->first == "ALLOCATED" )
        {
            continue;
        }

        oss << "<" << it->first << "><![CDATA[" << it->second
                << "]]></"<< it->first << ">";
    }

    oss << "<USED_LEASES>" << used_addr << "</USED_LEASES>";

    if (allocated.empty())
    {
        oss << "<LEASES/>";
    }
    else
    {
        map<unsigned int, long long>::const_iterator it;
        VectorAttribute lease("LEASE");

        oss << "<LEASES>";

        for (it = allocated.begin(); it != allocated.end(); it++)
        {
            lease.clear();

            set_mac(it->first, &lease);

            if (type & 0x00000002 )
            {
                set_ip(it->first, &lease);
            }

            if (type & 0x00000004)
            {
                set_ip6(it->first, &lease);
            }

            if (it->second & PoolObjectSQL::VM)
            {
                int vmid = it->second & 0x00000000FFFFFFFFLL;

                lease.replace("VM", vmid);
            }
            else if (it->second & PoolObjectSQL::NET)
            {
                int vnid = it->second & 0x00000000FFFFFFFFLL;

                lease.replace("VNET", vnid);
            }

            lease.to_xml(oss);
        }

        oss << "</LEASES>";
    }

    oss << "</AR>";
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRange::mac_to_i(string mac, unsigned int i_mac[]) const
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

int AddressRange::ip_to_i(const string& _ip, unsigned int& i_ip) const
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

int AddressRange::prefix6_to_i(const string& prefix, unsigned int ip[]) const
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

void AddressRange::set_mac(unsigned int addr_index, VectorAttribute * nic) const
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int i=5;i>=0;i--)
    {
        if ( i < 4 )
        {
            temp_byte = mac[0] + addr_index;
            temp_byte >>= i*8;
        }
        else
        {
            temp_byte = mac[1];
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

void AddressRange::set_ip(unsigned int addr_index, VectorAttribute * nic) const
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int index=0;index<4;index++)
    {
        temp_byte =   ip + addr_index;
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

void AddressRange::set_ip6(unsigned int addr_index, VectorAttribute * nic) const
{
    unsigned int eui64[2];
    unsigned int mlow = mac[0] + addr_index;

    struct in6_addr ip6;
    char dst[INET6_ADDRSTRLEN];

    eui64[1] = ((mac[1]+512)<<16) + ((mlow & 0xFF000000)>>16) + 0x000000FF;
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

    if (ula6[1] != 0 || ula6[0] != 0 ) /* Unique Local Address */
    {
        ip6.s6_addr32[0] = htonl(ula6[1]);
        ip6.s6_addr32[1] = htonl(ula6[0]);

        if ( inet_ntop(AF_INET6, &ip6, dst, INET6_ADDRSTRLEN) != 0 )
        {
            nic->replace("IP6_ULA", dst);
        }
    }

    if (global6[1] != 0 || global6[0] != 0 ) /* Glocal Unicast */
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

void AddressRange::set_vnet(VectorAttribute *nic, const vector<string> &inherit) const
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
        nic->replace("VLAN", vlan);
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
        return;
    }

    map<unsigned int, long long>::const_iterator it;

    ostringstream oss;

    for (it = allocated.begin(); it != allocated.end(); it++)
    {
        oss << " " << it->first << " " << it->second;
    }

    attr->replace("ALLOCATED", oss.str());
}

/* -------------------------------------------------------------------------- */

int AddressRange::attr_to_allocated(const string& allocated_s)
{
    if (allocated_s.empty())
    {
        allocated.clear();
        return 0;
    }

    istringstream iss(allocated_s);
    unsigned int  addr_index;
    long long     object_pack;

    while (!iss.eof())
    {
        iss >> ws >> addr_index >> ws >> object_pack;

        if (iss.fail())
        {
            return -1;
        }

        allocated.insert(make_pair(addr_index,object_pack));

        used_addr++;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

void AddressRange::allocate_addr(PoolObjectSQL::ObjectType ot, int obid,
    unsigned int addr_index)
{
    long long lobid = obid & 0x00000000FFFFFFFFLL;

    allocated.insert(make_pair(addr_index,ot|lobid));

    used_addr++;

    allocated_to_attr();
}

/* -------------------------------------------------------------------------- */

int AddressRange::free_addr(PoolObjectSQL::ObjectType ot, int obid,
    unsigned int addr_index)
{
    long long lobid = obid & 0x00000000FFFFFFFFLL;

    map<unsigned int, long long>::iterator it;

    it = allocated.find(addr_index);

    if (it != allocated.end() && it->second == (ot|lobid))
    {
        allocated.erase(it);
        allocated_to_attr();

        used_addr--;

        return 0;
    }

    return -1;
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRange::allocate_addr(
    PoolObjectSQL::ObjectType ot,
    int                       obid,
    VectorAttribute*          nic,
    const vector<string>&     inherit)
{
    for ( unsigned int i=0; i<size; i++, next = (next+1)%size )
    {
        if ( allocated.count(next) == 0 )
        {
            set_mac(next, nic);

            if (type & 0x00000002 )
            {
                set_ip(next, nic);
            }

            if (type & 0x00000004)
            {
                set_ip6(next, nic);
            }

            set_vnet(nic, inherit);

            allocate_addr(ot, obid, next);

            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_by_mac(
    const string&             mac_s,
    PoolObjectSQL::ObjectType ot,
    int                       obid,
    VectorAttribute*          nic,
    const vector<string>&     inherit)
{
    unsigned int mac_i[2];

    if (mac_to_i(mac_s, mac_i) == -1)
    {
        return -1;
    }

    if ((mac_i[1] != mac[1]) || (mac_i[0] < mac[0]))
    {
        return -1;
    }

    unsigned int index = mac_i[0] - mac[0];

    if ((allocated.count(index) != 0) || (index >= size))
    {
        return -1;
    }

    set_mac(index, nic);

    if (type & 0x00000002 )
    {
        set_ip(index, nic);
    }

    if (type & 0x00000004)
    {
        set_ip6(index, nic);
    }

    set_vnet(nic, inherit);

    allocate_addr(ot, obid, index);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_by_ip(
    const string&             ip_s,
    PoolObjectSQL::ObjectType ot,
    int                       obid,
    VectorAttribute*          nic,
    const vector<string>&     inherit)
{
    if (!(type & 0x00000002))//Not of type IP4 or IP4_6
    {
        return -1;
    }

    unsigned int ip_i;

    if (ip_to_i(ip_s, ip_i) == -1)
    {
        return -1;
    }

    if (ip_i < ip)
    {
        return -1;
    }

    unsigned int index = ip_i - ip;

    if (allocated.count(index) != 0 || index >= size )
    {
        return -1;
    }

    set_mac(index, nic);

    if (type & 0x00000002 )
    {
        set_ip(index, nic);
    }

    if (type & 0x00000004)
    {
        set_ip6(index, nic);
    }

    set_vnet(nic, inherit);

    allocate_addr(ot, obid, index);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::free_addr(PoolObjectSQL::ObjectType ot, int obid,
    const string& mac_s)
{
    unsigned int mac_i[2];

    mac_to_i(mac_s, mac_i);

    unsigned int index = mac_i[0] - mac[0];

    if ((0 <= index) && (index < size))
    {
        return free_addr(ot, obid, index);
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::free_addr_by_ip(PoolObjectSQL::ObjectType ot, int obid,
    const string& ip_s)
{
    if (!(type & 0x00000002))//Not of type IP4 or IP4_6
    {
        return -1;
    }

    unsigned int ip_i;

    if (ip_to_i(ip_s, ip_i) == -1)
    {
        return -1;
    }

    unsigned int index = ip_i - ip;

    if ((0 <= index ) && (index < size))
    {
        return free_addr(ot, obid, index);
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::hold_by_ip(const string& ip_s)
{
    if (!(type & 0x00000002))//Not of type IP4 or IP4_6
    {
        return -1;
    }

    unsigned int ip_i;

    if (ip_to_i(ip_s, ip_i) == -1)
    {
        return -1;
    }

    if (ip_i < ip)
    {
        return -1;
    }

    unsigned int index = ip_i - ip;

    if (allocated.count(index) != 0 || index >= size )
    {
        return -1;
    }

    allocate_addr(PoolObjectSQL::VM, -1, index);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::hold_by_mac(const string& mac_s)
{
    unsigned int mac_i[2];

    if (mac_to_i(mac_s, mac_i) == -1)
    {
        return -1;
    }

    if ((mac_i[1] != mac[1]) || (mac_i[0] < mac[0]))
    {
        return -1;
    }

    unsigned int index = mac_i[0] - mac[0];

    if ((allocated.count(index) != 0) || (index >= size))
    {
        return -1;
    }

    allocate_addr(PoolObjectSQL::VM, -1, index);

    return 0;
}

/* ************************************************************************** */
/* ************************************************************************** */

bool AddressRange::restricted_set = false;

set<string> AddressRange::restricted_attributes;

bool AddressRange::check(string& rs_attr) const
{
    if (!restricted_set)
    {
        return false;
    }

    const map<string,string>& ar_attrs = attr->value();
    map<string,string>::const_iterator it;

    for (it=ar_attrs.begin(); it != ar_attrs.end(); it++)
    {
        if (restricted_attributes.count(it->first) > 0)
        {
            rs_attr = it->first;
            return true;
        }
    }

    return false;
};

void AddressRange::set_restricted_attributes(
    vector<const Attribute *>& rattrs)
{
    if (restricted_set)
    {
        return;
    }

    restricted_set = true;

    for (unsigned int i = 0 ; i < rattrs.size() ; i++ )
    {
        const SingleAttribute * sattr = static_cast<const SingleAttribute *>(rattrs[i]);
        string attr_s = sattr->value();

        restricted_attributes.insert(one_util::toupper(attr_s));
    }
};
