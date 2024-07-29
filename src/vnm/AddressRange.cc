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

#include "AddressRange.h"
#include "Attribute.h"
#include "VirtualNetworkPool.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Nebula.h"

#include <arpa/inet.h>
#include <algorithm>

using namespace std;

/* ************************************************************************** */
/* ************************************************************************** */

string AddressRange::type_to_str(AddressType ob)
{
    switch (ob)
    {
        case ETHER:        return "ETHER"       ;
        case IP4:          return "IP4"         ;
        case IP6:          return "IP6"         ;
        case IP6_STATIC:   return "IP6_STATIC"  ;
        case IP4_6:        return "IP4_6"       ;
        case IP4_6_STATIC: return "IP4_6_STATIC";
        default:           return "";
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
    else if (str_type == "IP4_6_STATIC")
    {
        return IP4_6_STATIC;
    }
    else if (str_type == "IP6_STATIC")
    {
        return IP6_STATIC;
    }
    else
    {
        return NONE;
    }
}

/* ************************************************************************** */
/* ************************************************************************** */

int AddressRange::init_ipv4(string& error_msg)
{
    if (!is_ipv4())
    {
        attr->remove("IP");
        return 0;
    }

    string value = attr->vector_value("IP");

    if (value.empty() || ip_to_i(value, ip) == -1)
    {
        error_msg = "Wrong or empty IP attribute";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int AddressRange::init_ipv6(string& error_msg)
{
    if (!is_ipv6())
    {
        attr->remove("GLOBAL_PREFIX");
        attr->remove("ULA_PREFIX");

        return 0;
    }

    string value = attr->vector_value("GLOBAL_PREFIX");

    if (prefix6_to_i(value, global6) != 0 )
    {
        error_msg = "Wrong format for IP6 global address prefix";
        return -1;
    }

    value = attr->vector_value("ULA_PREFIX");

    if (prefix6_to_i(value, ula6) != 0 )
    {
        error_msg = "Wrong format for IP6 unique local address prefix";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int AddressRange::init_ipv6_static(string& error_msg)
{
    if (!is_ipv6_static())
    {
        attr->remove("IP6");
        return 0;
    }

    string value = attr->vector_value("IP6");

    if (value.empty() || ip6_to_i(value, ip6) == -1)
    {
        error_msg = "Wrong or empty IP6 attribute";
        return -1;
    }

    int pl;

    if ( attr->vector_value("PREFIX_LENGTH", pl) != 0 )
    {
        error_msg = "Wrong or empty PREFIX_LENGTH";
        return -1;
    }

    if ( attr->vector_value("SIZE").empty() )
    {
        unsigned long int s = pl <= 64 ? std::numeric_limits<unsigned long int>::max()
                              : 1UL << (128 - pl);

        // The IP range doesn't have to start from ::0 address. The user may want to skip
        // few addresses. In this case we have to reduce the size, as the last address
        // should be ::ffff:ffff, which should equal to first IP + size
        unsigned long size_mask = pl <= 64 ? s : s -1;

        unsigned long first_ip = ((unsigned long)ip6[1] << 32) + ip6[0];

        first_ip = first_ip & size_mask;

        s = s - first_ip;

        attr->replace("SIZE", s);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int AddressRange::init_mac(string& error_msg)
{
    string value = attr->vector_value("MAC");

    if (value.empty())
    {
        mac[1] = VirtualNetworkPool::mac_prefix();

        if ( is_ipv4() )
        {
            mac[0] = ip;
        }
        else
        {
            mac[0] = one_util::random<uint32_t>() & 0xFFFFFFFF;
        }

        set_mac(0, attr);
    }
    else
    {
        if (mac_to_i(value, mac) == -1)
        {
            error_msg = "Wrong format for MAC attribute";
            return -1;
        };
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::from_attr(VectorAttribute *vattr, string& error_msg)
{
    string value;

    attr = vattr;

    /* ------------------------- AR Type ----------------------------------- */

    value = vattr->vector_value("TYPE");
    type  = str_to_type(value);

    if (type == NONE)
    {
        error_msg = "Unknown or missing address range TYPE.";
        return -1;
    }

    /* ---------------------- L3 & L2 start addresses ---------------------- */

    if ( init_ipv4(error_msg) != 0 )
    {
        return -1;
    }

    if ( init_ipv6(error_msg) != 0 )
    {
        return -1;
    }

    if ( init_ipv6_static(error_msg) != 0 )
    {
        return -1;
    }

    if ( init_mac(error_msg) != 0 )
    {
        return -1;
    }

    /* ------------------------- AR Size ----------------------------------- */

    if ( vattr->vector_value("SIZE", size) != 0 )
    {
        error_msg = "Wrong SIZE for address range";
        return -1;
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

    /* ---------------------- Port Range Allocation ------------------------- */

    if ( vattr->vector_value("PORT_START", port_start) == -1 )
    {
        port_start = 0;
    }

    if ( vattr->vector_value("PORT_SIZE", port_size) == -1 )
    {
        port_size = 0;
    }

    /* ------------------------ AR Internal Data ---------------------------- */

    vattr->replace("AR_ID", id);

    vattr->remove("ALLOCATED");

    vattr->remove("USED_LEASES");

    vattr->remove("LEASES");

    vattr->remove("PARENT_NETWORK_AR_ID");

    vattr->remove("PARENT_NETWORK");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::update_attributes(
        VectorAttribute *  vup,
        bool               keep_restricted,
        std::set<int>&     update_ids,
        std::unique_ptr<VectorAttribute>& update_attr,
        string&            error_msg)
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

    string ipam_mad = attr->vector_value("IPAM_MAD");

    if ( !ipam_mad.empty() )
    {
        vup->replace("IPAM_MAD", ipam_mad);
    }

    vup->replace("MAC", attr->vector_value("MAC"));

    vup->remove("IP");

    if (is_ipv4())
    {
        vup->replace("IP", attr->vector_value("IP"));
    }

    vup->remove("IP6");

    if (is_ipv6_static())
    {
        vup->replace("IP6", attr->vector_value("IP6"));
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

    vup->remove("IP6_END");

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

    if ( is_ipv6_static() )
    {
        int new_pl;

        if (vup->vector_value("PREFIX_LENGTH", new_pl) == -1 )
        {
            vup->replace("PREFIX_LENGTH", attr->vector_value("PREFIX_LENGTH"));
        }
    }
    else
    {
        vup->remove("PREFIX_LENGTH");
    }


    if ( is_ipv6() )
    {
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

        vup->replace("GLOBAL_PREFIX", new_global);

        vup->replace("ULA_PREFIX", new_ula);
    }
    else
    {
        vup->remove("GLOBAL_PREFIX");
        vup->remove("ULA_PREFIX");
    }


    unsigned long int new_size;

    if (vup->vector_value("SIZE").empty())
    {
        new_size = size;
    }
    else if (vup->vector_value("SIZE", new_size) == 0)
    {
        if (is_reservation && new_size != size)
        {
            error_msg = "The SIZE of a reservation cannot be changed.";
            return -1;
        }

        std::map<unsigned int, long long>::iterator it;

        if ( new_size == 0 )
        {
            it = allocated.lower_bound(0);
        }
        else
        {
            it = allocated.upper_bound(new_size - 1);
        }

        if (it != allocated.end())
        {
            error_msg = "New SIZE cannot be applied. There are used leases"
                        " that would fall outside the range.";

            return -1;
        }
    }
    else
    {
        error_msg = "Unable to read the SIZE attribute, it must be number >= 0";
        return -1;
    }

    size = new_size;

    vup->replace("SIZE", size);

    string value = vup->vector_value("SECURITY_GROUPS");

    security_groups.clear();

    if (!value.empty())
    {
        one_util::split_unique(value, ',', security_groups);
    }

    if ( vup->vector_value("PORT_START", port_start) == -1 )
    {
        vup->remove("PORT_START");
        port_start = 0;
    }

    if ( vup->vector_value("PORT_SIZE", port_size) == -1 )
    {
        vup->remove("PORT_SIZE");
        port_size = 0;
    }

    /* ---------- Adds updated values to the VNET_UPDATE attribute ---------- */
    const auto& inherited_attrs = Nebula::instance().get_vnpool()->get_inherited_attrs();

    // Detect new and modified attributes
    for (auto& it : vup->value())
    {
        string oldValue;
        if ( inherited_attrs.count(it.first) > 0
             && (attr->vector_value(it.first, oldValue) < 0
                 || it.second != oldValue))
        {
            update_attr->replace(it.first, oldValue);
        }
    }

    // Detect removed attributes
    for (auto& it : attr->value())
    {
        string newValue;
        if ( (inherited_attrs.count(it.first) > 0)
             && (vup->vector_value(it.first, newValue) < 0) )
        {
            update_attr->replace(it.first, it.second);
        }
    }


    get_ids(update_ids, PoolObjectSQL::VM);

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

    if (is_ipv4())
    {
        rc += ip_to_i(vattr->vector_value("IP"), ip);
    }

    if (is_ipv6_static())
    {
        rc += ip6_to_i(vattr->vector_value("IP6"), ip6);
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

    if ( vattr->vector_value("PORT_START", port_start) == -1 )
    {
        port_start = 0;
    }

    if ( vattr->vector_value("PORT_SIZE", port_size) == -1 )
    {
        port_size = 0;
    }

    if (type == NONE)
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::addr_to_xml(unsigned int index, unsigned int rsize,
                               ostringstream& oss) const
{
    unsigned int new_mac[2];
    string       ip6_s;

    new_mac[0] = mac[0] + index;
    new_mac[1] = mac[1];

    oss << "<ADDRESS>"
        << "<MAC>" << mac_to_s(new_mac) << "</MAC>";

    if ( ip != 0 )
    {
        oss << "<IP>" << ip_to_s(ip + index) << "</IP>";
    }

    if (ula6[1] != 0 || ula6[0] != 0 )
    {
        oss << "<IP6_ULA>" << ip6_to_s(ula6, new_mac, ip6_s) << "</IP6_ULA>";
    }

    if (global6[1] != 0 || global6[0] != 0)
    {
        oss << "<IP6_GLOBAL>" << ip6_to_s(global6, new_mac, ip6_s)
            << "</IP6_GLOBAL>";
    }

    if ( ip6[0] != 0 || ip6[1] != 0 || ip6[2] != 0 || ip6[3] != 0 )
    {
        unsigned int ip_low[4];

        ip_low[3] = ip6[3];
        ip_low[2] = ip6[2];
        ip_low[1] = ip6[1];
        ip_low[0] = ip6[0] + index;

        oss << "<IP6>" << ip6_to_s(ip_low, ip6_s) << "</IP6>";
    }

    oss << "<SIZE>" << rsize << "</SIZE>"
        << "</ADDRESS>";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::to_xml(ostringstream &oss) const
{
    const map<string, string>& ar_attrs = attr->value();

    unsigned int mac_end[2];

    oss << "<AR>";

    for (auto it=ar_attrs.begin(); it != ar_attrs.end(); it++)
    {
        if ( it->first == "ALLOCATED" )
        {
            continue;
        }

        oss << "<" << it->first << ">"
            << one_util::escape_xml(it->second)
            << "</"<< it->first << ">";
    }

    mac_end[1] = mac[1];
    mac_end[0] = (mac[0] + size - 1);

    oss << "<MAC_END>" << one_util::escape_xml(mac_to_s(mac_end))<<"</MAC_END>";

    if (is_ipv4())
    {
        string       aux_st;
        unsigned int ip_i;

        aux_st = attr->vector_value("IP");

        if (ip_to_i(aux_st, ip_i) == 0)
        {
            oss << "<IP_END>" << one_util::escape_xml(ip_to_s(ip_i + size - 1))
                << "</IP_END>";
        }
    }

    if (is_ipv6())
    {
        string ip6_s;

        if (ula6[1] != 0 || ula6[0] != 0 )
        {
            ip6_to_s(ula6, mac, ip6_s);
            oss << "<IP6_ULA>" << one_util::escape_xml(ip6_s) << "</IP6_ULA>";

            ip6_to_s(ula6, mac_end, ip6_s);
            oss << "<IP6_ULA_END>" << one_util::escape_xml(ip6_s)
                << "</IP6_ULA_END>";
        }

        if (global6[1] != 0 || global6[0] != 0 )
        {
            ip6_to_s(global6, mac, ip6_s);
            oss << "<IP6_GLOBAL>" << one_util::escape_xml(ip6_s)
                << "</IP6_GLOBAL>";

            ip6_to_s(global6, mac_end, ip6_s);
            oss << "<IP6_GLOBAL_END>" << one_util::escape_xml(ip6_s)
                << "</IP6_GLOBAL_END>";
        }
    }

    if (is_ipv6_static())
    {
        string ip6_s;
        unsigned int ip_low[4];

        ip_low[3] = ip6[3];
        ip_low[2] = ip6[2];
        ip_low[1] = ip6[1] + ((size - 1) >> 32);
        ip_low[0] = ip6[0] +  size - 1;

        ip6_to_s(ip_low, ip6_s);
        oss << "<IP6_END>" << one_util::escape_xml(ip6_s) << "</IP6_END>";
    }

    oss << "<USED_LEASES>" << get_used_addr() << "</USED_LEASES>";
    oss << "</AR>";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::to_xml(ostringstream &oss, const vector<int>& vms,
                          const vector<int>& vns, const vector<int>& vrs) const
{
    const map<string, string>&          ar_attrs = attr->value();

    int          rc;
    unsigned int mac_end[2];

    bool all_vms = (vms.size() == 1 && vms[0] == -1);
    bool all_vns = (vns.size() == 1 && vns[0] == -1);
    bool all_vrs = (vrs.size() == 1 && vrs[0] == -1);

    oss << "<AR>";

    for (auto it=ar_attrs.begin(); it != ar_attrs.end(); it++)
    {
        if ( it->first == "ALLOCATED" )
        {
            continue;
        }

        oss << "<" << it->first << ">"
            << one_util::escape_xml(it->second)
            << "</"<< it->first << ">";
    }

    mac_end[1] = mac[1];
    mac_end[0] = (mac[0] + size - 1);

    oss << "<MAC_END>" << one_util::escape_xml(mac_to_s(mac_end))<<"</MAC_END>";

    if (is_ipv4())
    {
        unsigned int ip_i;
        string aux_st = attr->vector_value("IP");

        rc = ip_to_i(aux_st, ip_i);

        if (rc == 0)
        {
            oss << "<IP_END>" << one_util::escape_xml(ip_to_s(ip_i + size - 1))
                << "</IP_END>";
        }
    }

    if (is_ipv6())
    {
        string ip6_s;

        if (ula6[1] != 0 || ula6[0] != 0 ) /* Unique Local Address */
        {
            ip6_to_s(ula6, mac, ip6_s);
            oss << "<IP6_ULA>" << one_util::escape_xml(ip6_s) << "</IP6_ULA>";

            ip6_to_s(ula6, mac_end, ip6_s);
            oss << "<IP6_ULA_END>" << one_util::escape_xml(ip6_s)
                << "</IP6_ULA_END>";
        }

        if (global6[1] != 0 || global6[0] != 0 ) /* Glocal Unicast */
        {
            ip6_to_s(global6, mac, ip6_s);
            oss << "<IP6_GLOBAL>" << one_util::escape_xml(ip6_s)
                << "</IP6_GLOBAL>";

            ip6_to_s(global6, mac_end, ip6_s);
            oss << "<IP6_GLOBAL_END>" << one_util::escape_xml(ip6_s)
                << "</IP6_GLOBAL_END>";
        }
    }

    if (is_ipv6_static())
    {
        string ip6_s;
        unsigned int ip_low[4];

        ip_low[3] = ip6[3];
        ip_low[2] = ip6[2];
        ip_low[1] = ip6[1] + ((size - 1) >> 32);
        ip_low[0] = ip6[0] +  size - 1;

        ip6_to_s(ip_low, ip6_s);
        oss << "<IP6_END>" << one_util::escape_xml(ip6_s) << "</IP6_END>";
    }

    oss << "<USED_LEASES>" << get_used_addr() << "</USED_LEASES>";

    if (allocated.empty())
    {
        oss << "<LEASES/>";
    }
    else
    {
        VectorAttribute lease("LEASE");
        bool            is_in;

        oss << "<LEASES>";

        for (auto it = allocated.begin(); it != allocated.end(); it++)
        {
            lease.clear();

            is_in = false;

            if (it->second & PoolObjectSQL::VM)
            {
                int vmid = it->second & 0x00000000FFFFFFFFLL;

                if (all_vms || (find(vms.begin(), vms.end(), vmid) != vms.end()))
                {
                    lease.replace("VM", vmid);
                    is_in = true;
                }
            }
            else if (it->second & PoolObjectSQL::NET)
            {
                int vnid = it->second & 0x00000000FFFFFFFFLL;

                if (all_vns || (find(vns.begin(), vns.end(), vnid) != vns.end()))
                {
                    lease.replace("VNET", vnid);
                    is_in = true;
                }
            }
            else if (it->second & PoolObjectSQL::VROUTER)
            {
                int oid = it->second & 0x00000000FFFFFFFFLL;

                if (all_vrs || (find(vrs.begin(), vrs.end(), oid) != vrs.end()))
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

            set_port_ranges(it->first, &lease);

            if (is_ipv4())
            {
                set_ip(it->first, &lease);
            }

            if (is_ipv6())
            {
                set_ip6(it->first, &lease);
            }

            if (is_ipv6_static())
            {
                set_ip6_static(it->first, &lease);
            }

            lease.to_xml(oss);
        }

        oss << "</LEASES>";
    }

    oss << "</AR>";
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
        mac.replace(pos, 1, " ");
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

    for (int i=0; i<4; i++)
    {
        iss >> hex >> tmp >> ws;

        i_mac[0] <<= 8;
        i_mac[0] += tmp;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string AddressRange::mac_to_s(const unsigned int i_mac[])
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int i=5; i>=0; i--)
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

int AddressRange::ip_to_i(const string& _ip, unsigned int& i_ip)
{
    istringstream iss;
    size_t        pos=0;
    int           count = 0;
    unsigned int  tmp;

    string ip = _ip;

    if ( ip.find_first_not_of("0123456789.") != std::string::npos )
    {
        return -1;
    }

    while ( (pos = ip.find('.')) !=  string::npos )
    {
        ip.replace(pos, 1, " ");
        count++;
    }

    if (count != 3)
    {
        return -1;
    }

    iss.str(ip);
    iss >> skipws;

    i_ip = 0;

    for (int i=0; i<4; i++)
    {
        iss >> dec >> tmp;

        if ( tmp > 255 || iss.fail() )
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

string AddressRange::ip_to_s(unsigned int i_ip)
{
    ostringstream oss;
    unsigned int  temp_byte;

    for (int index=0; index<4; index++)
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

int AddressRange::ip6_to_i(const string& _ip, unsigned int i_ip[])
{
    struct in6_addr s6;

    if (_ip.empty())
    {
        return -1;
    }

    int rc = inet_pton(AF_INET6, _ip.c_str(), &s6);

    if ( rc != 1 )
    {
        return -1;
    }

    i_ip[3] = ntohl(s6.s6_addr32[0]);
    i_ip[2] = ntohl(s6.s6_addr32[1]);
    i_ip[1] = ntohl(s6.s6_addr32[2]);
    i_ip[0] = ntohl(s6.s6_addr32[3]);

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::ip6_to_s(const unsigned int prefix[],
                           const unsigned int mac[], string& ip6_s)
{
    unsigned int eui64[2];
    unsigned int mlow = mac[0];

    struct in6_addr ip6;
    char dst[INET6_ADDRSTRLEN];

    eui64[1] = ((mac[1]^0x0200)<<16) + ((mlow & 0xFF000000)>>16) + 0x000000FF;
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::ip6_to_s(const unsigned int ip6_i[], string& ip6_s)
{
    struct in6_addr ip6;
    char dst[INET6_ADDRSTRLEN];

    ip6.s6_addr32[3] = htonl(ip6_i[0]);
    ip6.s6_addr32[2] = htonl(ip6_i[1]);
    ip6.s6_addr32[1] = htonl(ip6_i[2]);
    ip6.s6_addr32[0] = htonl(ip6_i[3]);

    if ( inet_ntop(AF_INET6, &ip6, dst, INET6_ADDRSTRLEN) != 0 )
    {
        ip6_s = dst;
        return 0;
    }

    return -1;
}

/* ************************************************************************** */
/* ************************************************************************** */

bool AddressRange::is_valid_mac(unsigned int& index, const string& mac_s,
                                bool check_free)
{
    unsigned int mac_i[2];

    if (mac_to_i(mac_s, mac_i) == -1)
    {
        return false;
    }

    if ((mac_i[1] != mac[1]) || (mac_i[0] < mac[0]))
    {
        return false;
    }

    index = mac_i[0] - mac[0];

    if ((check_free && allocated.count(index) != 0) || (index >= size))
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool AddressRange::is_valid_ip(unsigned int& index, const string& ip_s,
                               bool check_free) const
{
    if (!is_ipv4())//Not of type IP4 or IP4_6
    {
        return false;
    }

    unsigned int ip_i;

    if (ip_to_i(ip_s, ip_i) == -1)
    {
        return false;
    }

    if (ip_i < ip)
    {
        return false;
    }

    index = ip_i - ip;

    if ((check_free && allocated.count(index) != 0) || (index >= size))
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool AddressRange::is_valid_ip6(unsigned int& index, const string& ip_s,
                                bool check_free)
{
    if (!is_ipv6_static())//Not of type IP6_STATIC or IP4_6_STATIC
    {
        return false;
    }

    unsigned int ip_i[4];

    if (ip6_to_i(ip_s, ip_i) == -1)
    {
        return false;
    }

    //3 most significant 32bit blocks must be equal
    if ( ip_i[3] != ip6[3] || ip_i[2] != ip6[2] || ip_i[1] != ip6[1]
         || ip_i[0] < ip6[0] )
    {
        return false;
    }

    index = ip_i[0] - ip6[0];

    if ((check_free && allocated.count(index) != 0) || (index >= size))
    {
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::set_port_ranges(unsigned int addr_index,
                                   VectorAttribute * nic) const
{
    if ( port_size == 0 || port_start == 0 )
    {
        return;
    }

    unsigned int p_ini = port_start + (addr_index * port_size) + 1;
    unsigned int p_end = p_ini + port_size - 1;

    ostringstream erange;
    ostringstream irange;

    erange << p_ini << ":" << p_end;
    irange << "1-" << port_size << "/" << p_ini;

    nic->replace("EXTERNAL_PORT_RANGE", erange.str());
    nic->replace("INTERNAL_PORT_RANGE", irange.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

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

void AddressRange::set_ip6_static(unsigned int addr_index,
                                  VectorAttribute * nic) const
{
    unsigned int ip_low[4];
    string       ip6_s;

    ip_low[3] = ip6[3];
    ip_low[2] = ip6[2];
    ip_low[1] = ip6[1];
    ip_low[0] = ip6[0] + addr_index;

    if ( ip6_to_s(ip_low, ip6_s) == 0 )
    {
        nic->replace("IP6", ip6_s);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::set_vnet(VectorAttribute *nic, const set<string> &inherit) const
{
    nic->replace("AR_ID", id);

    string vn_mad = attr->vector_value("VN_MAD");
    string bridge = attr->vector_value("BRIDGE");
    string vlanid = attr->vector_value("VLAN_ID");
    string phydev = attr->vector_value("PHYDEV");

    if (!vn_mad.empty())
    {
        nic->replace("VN_MAD", vn_mad);
    }

    if (!bridge.empty())
    {
        nic->replace("BRIDGE", bridge);
    }

    if (!phydev.empty())
    {
        nic->replace("PHYDEV", phydev);
    }

    if (!vlanid.empty())
    {
        nic->replace("VLAN_ID", vlanid);
    }

    for (const auto& inherited : inherit)
    {
        string current_val = nic->vector_value(inherited);
        string inherit_val = attr->vector_value(inherited);

        if (current_val.empty() && !inherit_val.empty())
        {
            nic->replace(inherited, inherit_val);
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

    ostringstream oss;

    for (auto it = allocated.begin(); it != allocated.end(); it++)
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

        allocated.insert(make_pair(addr_index, object_pack));
    }

    if ( get_used_addr() > size )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

void AddressRange::set_allocated_addr(PoolObjectSQL::ObjectType ot, int obid,
                                      unsigned int addr_index)
{
    long long lobid = obid & 0x00000000FFFFFFFFLL;

    allocated.insert(make_pair(addr_index, ot|lobid));

    allocated_to_attr();
}

/* -------------------------------------------------------------------------- */

int AddressRange::free_allocated_addr(PoolObjectSQL::ObjectType ot, int obid,
                                      unsigned int addr_index)
{
    long long lobid = obid & 0x00000000FFFFFFFFLL;

    auto it = allocated.find(addr_index);

    if (it != allocated.end() && it->second == (ot|lobid))
    {
        allocated.erase(it);
        allocated_to_attr();

        return 0;
    }

    return -1;
}

/* ************************************************************************** */
/* ************************************************************************** */

void AddressRange::allocate_by_index(unsigned int index,
                                     PoolObjectSQL::ObjectType ot,
                                     int                       obid,
                                     VectorAttribute*          nic,
                                     const set<string>&     inherit)
{
    set_mac(index, nic);

    set_port_ranges(index, nic);

    if (is_ipv4())
    {
        set_ip(index, nic);
    }

    if (is_ipv6())
    {
        set_ip6(index, nic);
    }

    if (is_ipv6_static())
    {
        set_ip6_static(index, nic);
    }

    set_vnet(nic, inherit);

    set_allocated_addr(ot, obid, index);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_random_addr(VectorAttribute* nic)
{
    unsigned int rmac[2];

    rmac[1] = VirtualNetworkPool::mac_prefix();
    rmac[0] = one_util::random<uint32_t>() & 0xFFFFFFFF;

    nic->replace("MAC", mac_to_s(rmac));

    nic->remove("IP");

    nic->remove("IP6_LINK");
    nic->remove("IP6_ULA");
    nic->remove("IP6_GLOBAL");

    return 0;
}

/* -------------------------------------------------------------------------- */

int AddressRange::allocate_addr(
        PoolObjectSQL::ObjectType ot,
        int                       obid,
        VectorAttribute*          nic,
        const set<string>&     inherit)
{
    unsigned int index;
    string       error_msg;

    if ( get_used_addr() >= size )
    {
        return -1;
    }

    if ( get_addr(index, 1, error_msg) != 0 )
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    allocate_by_index(index, ot, obid, nic, inherit);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_by_mac(
        const string&             mac_s,
        PoolObjectSQL::ObjectType ot,
        int                       obid,
        VectorAttribute*          nic,
        const set<string>&     inherit)
{
    string error_msg;
    unsigned int index;

    if (!is_valid_mac(index, mac_s, true))
    {
        return -1;
    }

    if (allocate_addr(index, 1, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    allocate_by_index(index, ot, obid, nic, inherit);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_by_ip(
        const string&             ip_s,
        PoolObjectSQL::ObjectType ot,
        int                       obid,
        VectorAttribute*          nic,
        const set<string>&        inherit)
{
    string error_msg;
    unsigned int index;

    if (!is_valid_ip(index, ip_s, true))
    {
        return -1;
    }

    if (allocate_addr(index, 1, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    allocate_by_index(index, ot, obid, nic, inherit);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::allocate_by_ip6(
        const string&             ip6_s,
        PoolObjectSQL::ObjectType ot,
        int                       obid,
        VectorAttribute*          nic,
        const set<string>&        inherit)
{
    string error_msg;
    unsigned int index;

    if (!is_valid_ip6(index, ip6_s, true))
    {
        return -1;
    }

    if (allocate_addr(index, 1, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    allocate_by_index(index, ot, obid, nic, inherit);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::free_addr(PoolObjectSQL::ObjectType ot, int obid,
                            const string& mac_s)
{
    string error_msg;
    unsigned int mac_i[2];

    mac_to_i(mac_s, mac_i);

    unsigned int index = mac_i[0] - mac[0];

    if ( mac[0] > mac_i[0] || index >= size)
    {
        return -1;
    }

    if (free_addr(index, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    return free_allocated_addr(ot, obid, index);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::free_addr_by_ip(PoolObjectSQL::ObjectType ot, int obid,
                                  const string& ip_s)
{
    string error_msg;

    if (!is_ipv4())
    {
        return -1;
    }

    unsigned int ip_i;

    if (ip_to_i(ip_s, ip_i) == -1)
    {
        return -1;
    }

    unsigned int index = ip_i - ip;

    if (ip > ip_i || index >= size)
    {
        return -1;
    }

    if (free_addr(index, error_msg) != 0)
    {
        return -1;
    }

    return free_allocated_addr(ot, obid, index);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::free_addr_by_ip6(PoolObjectSQL::ObjectType ot, int obid,
                                   const string& ip_s)
{
    string error_msg;

    if (!is_ipv6_static())
    {
        return -1;
    }

    unsigned int ip_i[4];

    if (ip6_to_i(ip_s, ip_i) == -1)
    {
        return -1;
    }

    unsigned int index = ip_i[0] - ip6[0];

    if (ip6[0] > ip_i[0] || index >= size || ip6[3] != ip_i[3] || ip6[2] != ip_i[2]
        || ip6[1] != ip_i[1])
    {
        return -1;
    }

    if (free_addr(index, error_msg) != 0)
    {
        return -1;
    }

    return free_allocated_addr(ot, obid, index);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::free_addr_by_owner(PoolObjectSQL::ObjectType ot, int obid)
{
    auto it = allocated.begin();

    long long obj_pack = ot | (obid & 0x00000000FFFFFFFFLL);

    int freed = 0;

    string error_msg;

    while (it != allocated.end())
    {
        if (it->second == obj_pack && free_addr(it->first, error_msg) == 0)
        {
            it = allocated.erase(it);

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

    string error_msg;

    if ((mac[0] <= mac_i[0]) && (index < size))
    {
        auto it = allocated.find(index);

        if (it == allocated.end())
        {
            return freed;
        }

        long long obj_pack = ot | (obid & 0x00000000FFFFFFFFLL);

        for (unsigned int i=0; i<rsize; i++)
        {
            if (it != allocated.end() && it->second == obj_pack &&
                free_addr(it->first, error_msg) == 0)
            {
                it = allocated.erase(it);

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

const char * AddressRange::SG_RULE_ATTRIBUTES[] =
{
    "AR_ID",
    "TYPE",
    "SIZE",
    "MAC",
    "IP",
    "IP6"
};

const int  AddressRange::NUM_SG_RULE_ATTRIBUTES = 6;

void AddressRange::process_security_rule(VectorAttribute * rule)
{
    // Persistent attributes
    for ( int i = 0; i < NUM_SG_RULE_ATTRIBUTES; i++ )
    {
        string st = attr->vector_value(SG_RULE_ATTRIBUTES[i]);

        if ( st != "" )
        {
            rule->replace(SG_RULE_ATTRIBUTES[i], st);
        }
    }

    // Non persistent attributes
    string ip6_s;

    if (ula6[1] != 0 || ula6[0] != 0 )
    {
        ip6_to_s(ula6, mac, ip6_s);
        rule->replace("IP6_ULA", ip6_s);
    }

    if (global6[1] != 0 || global6[0] != 0 )
    {
        ip6_to_s(global6, mac, ip6_s);
        rule->replace("IP6_GLOBAL", ip6_s);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::hold_by_ip6(const string& ip_s)
{
    string error_msg;
    unsigned int index;

    if (!is_valid_ip6(index, ip_s, true))
    {
        return -1;
    }

    if (allocate_addr(index, 1, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    set_allocated_addr(PoolObjectSQL::VM, -1, index);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::hold_by_ip(const string& ip_s)
{
    string error_msg;
    unsigned int index;

    if (!is_valid_ip(index, ip_s, true))
    {
        return -1;
    }

    if (allocate_addr(index, 1, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    set_allocated_addr(PoolObjectSQL::VM, -1, index);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::hold_by_mac(const string& mac_s)
{
    unsigned int index;
    string error_msg;

    if (!is_valid_mac(index, mac_s, true))
    {
        return -1;
    }

    if (allocate_addr(index, 1, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    set_allocated_addr(PoolObjectSQL::VM, -1, index);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr(int vid, unsigned int rsize, AddressRange *rar)
{
    unsigned int first_index;
    string error_msg;

    if (rsize > get_free_addr())
    {
        return -1;
    }

    if ( get_addr(first_index, rsize, error_msg) != 0 )
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    for (unsigned int j=0, i=first_index; j<rsize; j++, i++)
    {
        set_allocated_addr(PoolObjectSQL::NET, vid, i);
    }

    VectorAttribute * new_ar = attr->clone();
    string            errmsg;

    set_mac(first_index, new_ar);

    set_port_ranges(first_index, new_ar);

    if ( is_ipv4() )
    {
        set_ip(first_index, new_ar);
    }

    if ( is_ipv6_static() )
    {
        set_ip6_static(first_index, new_ar);
    }

    new_ar->replace("SIZE", rsize);

    new_ar->remove("IPAM_MAD");

    rar->from_vattr(new_ar, errmsg);

    new_ar->replace("PARENT_NETWORK_AR_ID", id);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr_by_index(int vid, unsigned int rsize,
                                        unsigned int sindex, AddressRange *rar)
{
    string error_msg;

    /* ----------------- Allocate the new AR from sindex -------------------- */

    for (unsigned int j=sindex; j< (sindex+rsize) ; j++)
    {
        if (allocated.count(j) != 0)
        {
            return -1;
        }
    }

    if (allocate_addr(sindex, rsize, error_msg) != 0)
    {
        NebulaLog::log("IPM", Log::ERROR, error_msg);
        return -1;
    }

    for (unsigned int j=sindex; j< (sindex+rsize); j++)
    {
        set_allocated_addr(PoolObjectSQL::NET, vid, j);
    }

    /* ------------------------- Initialize the new AR ---------------------- */

    VectorAttribute * new_ar = attr->clone();
    string            errmsg;

    set_mac(sindex, new_ar);

    set_port_ranges(sindex, new_ar);

    if ( is_ipv4() )
    {
        set_ip(sindex, new_ar);
    }

    if ( is_ipv6_static() )
    {
        set_ip6_static(sindex, new_ar);
    }

    new_ar->replace("SIZE", rsize);

    new_ar->remove("IPAM_MAD");

    rar->from_vattr(new_ar, errmsg);

    new_ar->replace("PARENT_NETWORK_AR_ID", id);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr_by_ip6(int vid, unsigned int rsize,
                                      const string& ip_s, AddressRange *rar)
{
    unsigned int sindex;

    if (!is_valid_ip6(sindex, ip_s, false))
    {
        return -1;
    }

    return reserve_addr_by_index(vid, rsize, sindex, rar);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int AddressRange::reserve_addr_by_ip(int vid, unsigned int rsize,
                                     const string& ip_s, AddressRange *rar)
{
    unsigned int sindex;

    if (!is_valid_ip(sindex, ip_s, false))
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
    unsigned int sindex;

    if (!is_valid_mac(sindex, mac_s, false))
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

    const map<string, string>& ar_attrs = attr->value();

    for (auto it=ar_attrs.begin(); it != ar_attrs.end(); it++)
    {
        if (restricted_attributes.count(it->first) > 0)
        {
            rs_attr = it->first;
            return true;
        }
    }

    return false;
};

void AddressRange::set_restricted_attributes(vector<const SingleAttribute *>& rattrs)
{
    if (restricted_set)
    {
        return;
    }

    restricted_set = true;

    for (unsigned int i = 0 ; i < rattrs.size() ; i++ )
    {
        string attr_s = rattrs[i]->value();

        restricted_attributes.insert(one_util::toupper(attr_s));
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::remove_restricted(VectorAttribute* va)
{
    size_t pos;

    for (const auto& restricted : restricted_attributes)
    {
        pos = restricted.find("AR/");

        if (pos != string::npos)
        {
            va->remove(restricted.substr(pos+3));
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::remove_all_except_restricted(VectorAttribute* va)
{
    map<string, string> vals = va->value();

    ostringstream oss;

    for (auto it = vals.begin(); it != vals.end(); it++)
    {
        oss.str("");
        oss << "AR/" << it->first;

        if (restricted_attributes.count(oss.str()) == 0)
        {
            va->remove(it->first);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AddressRange::decrypt()
{
    string one_key;

    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);

    for ( const auto& ea : VirtualNetworkTemplate::encrypted )
    {
        attr->decrypt(one_key, ea.second);
    }
}

