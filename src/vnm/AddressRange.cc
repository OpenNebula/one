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

#include "AddressRange.h"
#include "Attribute.h"
#include "VirtualNetworkPool.h"
#include "NebulaUtil.h"

#include <arpa/inet.h>
#include <algorithm>

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

    /* ------------------------- Security Groups ---------------------------- */

    value = vattr->vector_value("SECURITY_GROUPS");

    if (value.empty())
    {
        security_groups.clear();
    }
    else
    {
        one_util::split_unique(value, ',', security_groups);
    }

    /* ------------------------ AR Internal Data ---------------------------- */

    vattr->replace("AR_ID", id);

    vattr->remove("ALLOCATED");

    vattr->remove("USED_LEASES");

    vattr->remove("LEASES");

    vattr->remove("PARENT_NETWORK_AR_ID");

    vattr->remove("PARENT_NETWORK");

    if (do_mac) //Need to add MAC to the attribute
    {
        set_mac(0, attr);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::update_attributes(
        VectorAttribute *   vup,
        bool                keep_restricted,
        string&             error_msg)
{
    /* --------------- Do not allow to modify a reservation ------- */

    int pid;
    bool is_reservation = (get_attribute("PARENT_NETWORK_AR_ID", pid) == 0);

    if (keep_restricted && restricted_set)
    {
        remove_restricted(vup);
    }

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

    vup->remove("PARENT_NETWORK_AR_ID");

    if (is_reservation)
    {
        vup->replace("PARENT_NETWORK_AR_ID",
                attr->vector_value("PARENT_NETWORK_AR_ID"));
    }

    /* ------ Remove non-persistent attributes, generated in to_xml() ------ */

    vup->remove("MAC_END");

    vup->remove("IP_END");

    vup->remove("IP6_ULA");

    vup->remove("IP6_ULA_END");

    vup->remove("IP6_GLOBAL");

    vup->remove("IP6_GLOBAL_END");

    /* ----------------- restricted attributes ----------------- */

    if (keep_restricted && restricted_set)
    {
        VectorAttribute va_aux(*attr);
        remove_all_except_restricted(&va_aux);

        vup->merge(&va_aux, true);
    }

    /* ----------------- update known attributes ----------------- */

    unsigned int new_size;

    if (vup->vector_value("SIZE", new_size) == 0)
    {
        if (is_reservation && new_size != size)
        {
            error_msg = "The SIZE of a reservation cannot be changed.";
            return -1;
        }

        if (allocated.upper_bound(new_size-1) != allocated.end())
        {
            error_msg = "New SIZE cannot be applied. There are used leases"
                    " that would fall outside the range.";

            return -1;
        }

        next = 0;
    }
    else
    {
        new_size = size;
    }

    string new_global = vup->vector_value("GLOBAL_PREFIX");

    if (prefix6_to_i(new_global, global6) != 0 )
    {
        error_msg = "Wrong format for IP6 global address prefix";
        return -1;
    }

    string new_ula = vup->vector_value("ULA_PREFIX");

    if (prefix6_to_i(new_ula, ula6) != 0 )
    {
        error_msg = "Wrong format for IP6 unique local address prefix";
        return -1;
    }

    size = new_size;

    vup->replace("SIZE", size);

    vup->replace("GLOBAL_PREFIX", new_global);
    vup->replace("ULA_PREFIX", new_ula);

    string value = vup->vector_value("SECURITY_GROUPS");

    security_groups.clear();

    if (!value.empty())
    {
        one_util::split_unique(value, ',', security_groups);
    }

    /* Replace with the new attributes */

    attr->replace(vup->value());

    return 0;
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

    value = vattr->vector_value("SECURITY_GROUPS");

    security_groups.clear();

    if (!value.empty())
    {
        one_util::split_unique(value, ',', security_groups);
    }

    if (type == NONE)
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::to_xml(ostringstream &oss, const vector<int>& vms,
        const vector<int>& vns, const vector<int>& vrs) const
{
    const map<string,string>&          ar_attrs = attr->value();
    map<string,string>::const_iterator it;

    int          rc;
    unsigned int mac_end[2];
    string       aux_st;

    bool all_vms = (vms.size() == 1 && vms[0] == -1);
    bool all_vns = (vns.size() == 1 && vns[0] == -1);
    bool all_vrs = (vrs.size() == 1 && vrs[0] == -1);

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

    mac_end[1] = mac[1];
    mac_end[0] = (mac[0] + size - 1);

    oss << "<MAC_END><![CDATA[" << mac_to_s(mac_end) << "]]></MAC_END>";

    aux_st = attr->vector_value("IP");

    if (aux_st != "")
    {
        unsigned int ip_i;

        rc = ip_to_i(aux_st, ip_i);

        if (rc == 0)
        {
            oss << "<IP_END><![CDATA[" << ip_to_s(ip_i + size - 1) << "]]></IP_END>";
        }
    }

    if (type & 0x00000004)
    {
        string ip6_s;

        if (ula6[1] != 0 || ula6[0] != 0 ) /* Unique Local Address */
        {
            ip6_to_s(ula6, mac, ip6_s);
            oss << "<IP6_ULA><![CDATA[" << ip6_s << "]]></IP6_ULA>";

            ip6_to_s(ula6, mac_end, ip6_s);
            oss << "<IP6_ULA_END><![CDATA[" << ip6_s << "]]></IP6_ULA_END>";
        }

        if (global6[1] != 0 || global6[0] != 0 ) /* Glocal Unicast */
        {
            ip6_to_s(global6, mac, ip6_s);
            oss << "<IP6_GLOBAL><![CDATA[" << ip6_s << "]]></IP6_GLOBAL>";

            ip6_to_s(global6, mac_end, ip6_s);
            oss << "<IP6_GLOBAL_END><![CDATA[" << ip6_s << "]]></IP6_GLOBAL_END>";
        }
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
        bool            is_in;

        oss << "<LEASES>";

        for (it = allocated.begin(); it != allocated.end(); it++)
        {
            lease.clear();

            is_in = false;

            if (it->second & PoolObjectSQL::VM)
            {
                int vmid = it->second & 0x00000000FFFFFFFFLL;

                if (all_vms || (find(vms.begin(),vms.end(),vmid) != vms.end()))
                {
                    lease.replace("VM", vmid);
                    is_in = true;
                }
            }
            else if (it->second & PoolObjectSQL::NET)
            {
                int vnid = it->second & 0x00000000FFFFFFFFLL;

                if (all_vns || (find(vns.begin(),vns.end(),vnid) != vns.end()))
                {
                    lease.replace("VNET", vnid);
                    is_in = true;
                }
            }
            else if (it->second & PoolObjectSQL::VROUTER)
            {
                int oid = it->second & 0x00000000FFFFFFFFLL;

                if (all_vrs || (find(vrs.begin(),vrs.end(),oid) != vrs.end()))
                {
                    lease.replace("VROUTER", oid);
                    is_in = true;
                }
            }

            if (!is_in)
            {
                continue;
            }

            set_mac(it->first, &lease);

            if (type & 0x00000002 )
            {
                set_ip(it->first, &lease);
            }

            if (type & 0x00000004)
            {
                set_ip6(it->first, &lease);
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

string AddressRange::mac_to_s(const unsigned int i_mac[]) const
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int i=5;i>=0;i--)
    {
        if ( i < 4 )
        {
            temp_byte = i_mac[0];
            temp_byte >>= i*8;
        }
        else
        {
            temp_byte = i_mac[1];
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

    return oss.str();
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

string AddressRange::ip_to_s(unsigned int i_ip) const
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int index=0;index<4;index++)
    {
        temp_byte =   i_ip;
        temp_byte >>= (24-index*8);
        temp_byte &=  255;

        oss << temp_byte;

        if(index!=3)
        {
            oss << ".";
        }
    }

    return oss.str();
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::ip6_to_s(const unsigned int prefix[], const unsigned int mac[], string& ip6_s) const
{
    unsigned int eui64[2];
    unsigned int mlow = mac[0];

    struct in6_addr ip6;
    char dst[INET6_ADDRSTRLEN];

    eui64[1] = ((mac[1]+512)<<16) + ((mlow & 0xFF000000)>>16) + 0x000000FF;
    eui64[0] = 4261412864 + (mlow & 0x00FFFFFF);

    ip6.s6_addr32[2] = htonl(eui64[1]);
    ip6.s6_addr32[3] = htonl(eui64[0]);

    ip6.s6_addr32[0] = htonl(prefix[1]);
    ip6.s6_addr32[1] = htonl(prefix[0]);

    if ( inet_ntop(AF_INET6, &ip6, dst, INET6_ADDRSTRLEN) != 0 )
    {
        ip6_s = dst;
        return 0;
    }

    return -1;
}

/* ************************************************************************** */
/* ************************************************************************** */

void AddressRange::set_mac(unsigned int addr_index, VectorAttribute * nic) const
{
    unsigned int new_mac[2];

    new_mac[0] = mac[0] + addr_index;
    new_mac[1] = mac[1];

    nic->replace("MAC", mac_to_s(new_mac));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::set_ip(unsigned int addr_index, VectorAttribute * nic) const
{
    nic->replace("IP", ip_to_s(ip + addr_index));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::set_ip6(unsigned int addr_index, VectorAttribute * nic) const
{
    unsigned int new_mac[2];
    string       ip6_s;

    new_mac[0] = mac[0] + addr_index;
    new_mac[1] = mac[1];

    /* Link Local */
    unsigned int local_prefix[2] = {0, 0xfe800000};

    if (ip6_to_s(local_prefix, new_mac, ip6_s) == 0)
    {
        nic->replace("IP6_LINK", ip6_s);
    }

    if (ula6[1] != 0 || ula6[0] != 0 ) /* Unique Local Address */
    {
        if (ip6_to_s(ula6, new_mac, ip6_s) == 0)
        {
            nic->replace("IP6_ULA", ip6_s);
        }
    }

    if (global6[1] != 0 || global6[0] != 0 ) /* Global Unicast */
    {
        if (ip6_to_s(global6, new_mac, ip6_s) == 0)
        {
            nic->replace("IP6_GLOBAL", ip6_s);
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
        attr->replace("ALLOCATED", "");
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

    if ( index < 0)
    {
        return -1;
    }

    return free_addr(ot, obid, index);
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

int AddressRange::free_addr_by_owner(PoolObjectSQL::ObjectType ot, int obid)
{
    map<unsigned int, long long>::iterator it = allocated.begin();

    long long obj_pack = ot | (obid & 0x00000000FFFFFFFFLL);

    int freed = 0;

    while (it != allocated.end())
    {
        if (it->second == obj_pack)
        {
            map<unsigned int, long long>::iterator prev_it = it++;

            allocated.erase(prev_it);

            used_addr--;

            freed++;
        }
        else
        {
            it++;
        }
    }

    allocated_to_attr();

    return freed;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::free_addr_by_range(PoolObjectSQL::ObjectType ot, int obid,
    const string& mac_s, unsigned int rsize)
{
    int freed = 0;

    unsigned int mac_i[2];

    mac_to_i(mac_s, mac_i);

    unsigned int index = mac_i[0] - mac[0];

    if ((0 <= index) && (index < size))
    {
        map<unsigned int, long long>::iterator it = allocated.find(index);

        if (it == allocated.end())
        {
            return freed;
        }

        long long obj_pack = ot | (obid & 0x00000000FFFFFFFFLL);

        for (unsigned int i=0; i<rsize; i++)
        {
            if (it != allocated.end() && it->second == obj_pack)
            {
                map<unsigned int, long long>::iterator prev_it = it++;

                allocated.erase(prev_it);

                used_addr--;

                freed++;
            }
            else
            {
                it++;
            }
        }

        allocated_to_attr();
    }

    return freed;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * AddressRange::SG_RULE_ATTRIBUTES[] = {
    "AR_ID",
    "TYPE",
    "SIZE",
    "MAC",
    "IP"};

const int  AddressRange::NUM_SG_RULE_ATTRIBUTES = 5;

void AddressRange::process_security_rule(VectorAttribute * rule)
{
    for ( int i = 0; i < NUM_SG_RULE_ATTRIBUTES; i++ )
    {
        string st = attr->vector_value(SG_RULE_ATTRIBUTES[i]);

        if ( st != "" )
        {
            rule->replace(SG_RULE_ATTRIBUTES[i], st);
        }
    }
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr(int vid, unsigned int rsize, AddressRange *rar)
{
    unsigned int first_index;

    if (rsize > (size - used_addr))
    {
        return -1; //reservation dosen't fit
    }

    // --------------- Look for a continuos range of addresses -----------------

    bool valid = true;

    for (unsigned int i=0; i<size; i++)
    {
        if ( allocated.count(i) != 0 )
        {
            continue;
        }

        valid = true;

        for (unsigned int j=0; j<rsize; j++, i++)
        {
            if ( allocated.count(i) != 0 )
            {
                valid = false;
                break;
            }
        }

        if (valid == true)
        {
            i -= rsize;
            first_index = i;

            for (unsigned int j=0; j<rsize; j++, i++)
            {
                allocate_addr(PoolObjectSQL::NET, vid, i);
            }

            break;
        }
    }

    if (valid == false)
    {
        return -1; //This address range has not a continuos range big enough
    }

    VectorAttribute * new_ar = attr->clone();
    string            errmsg;

    set_mac(first_index, new_ar);

    if (type & 0x00000002 )
    {
        set_ip(first_index, new_ar);
    }

    new_ar->replace("SIZE",rsize);

    rar->from_vattr(new_ar, errmsg);

    new_ar->replace("PARENT_NETWORK_AR_ID",id);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr_by_index(int vid, unsigned int rsize,
    unsigned int sindex, AddressRange *rar)
{
    /* ----------------- Allocate the new AR from sindex -------------------- */

    for (unsigned int j=sindex; j< (sindex+rsize) ; j++)
    {
        if (allocated.count(j) != 0)
        {
            return -1;
        }
    }

    for (unsigned int j=sindex; j< (sindex+rsize); j++)
    {
        allocate_addr(PoolObjectSQL::NET, vid, j);
    }

    /* ------------------------- Initialize the new AR ---------------------- */

    VectorAttribute * new_ar = attr->clone();
    string            errmsg;

    set_mac(sindex, new_ar);

    if (type & 0x00000002 )
    {
        set_ip(sindex, new_ar);
    }

    new_ar->replace("SIZE",rsize);

    rar->from_vattr(new_ar, errmsg);

    new_ar->replace("PARENT_NETWORK_AR_ID",id);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr_by_ip(int vid, unsigned int rsize,
    const string& ip_s, AddressRange *rar)
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

    unsigned int sindex = ip_i - ip;

    if (sindex >= size )
    {
        return -1;
    }

    return reserve_addr_by_index(vid, rsize, sindex, rar);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr_by_mac(int vid, unsigned int rsize,
    const string& mac_s, AddressRange *rar)
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

    unsigned int sindex = mac_i[0] - mac[0];

    if (sindex >= size)
    {
        return -1;
    }

    return reserve_addr_by_index(vid, rsize, sindex, rar);
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::remove_restricted(VectorAttribute* va)
{
    set<string>::const_iterator it;
    size_t pos;

    for (it=restricted_attributes.begin(); it!=restricted_attributes.end(); it++)
    {
        pos = it->find("AR/");

        if (pos != string::npos)
        {
            va->remove( it->substr(pos+3) );
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::remove_all_except_restricted(VectorAttribute* va)
{
    map<string,string>::iterator it;
    map<string,string> vals = va->value();

    ostringstream oss;

    for(it = vals.begin(); it != vals.end(); it++)
    {
        oss.str("");
        oss << "AR/" << it->first;

        if (restricted_attributes.count(oss.str()) == 0)
        {
            va->remove(it->first);
        }
    }
}
