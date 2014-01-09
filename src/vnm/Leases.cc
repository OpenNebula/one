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

#include "Leases.h"
#include "NebulaLog.h"

#include <arpa/inet.h>

/* ************************************************************************** */
/* ************************************************************************** */
/* Lease class                                                                */
/* ************************************************************************** */
/* ************************************************************************** */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::Lease::ip_to_number(const string& _ip, unsigned int& i_ip)
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

void Leases::Lease::ip_to_string(const unsigned int i_ip, string& ip)
{
    unsigned int    temp_byte;
    ostringstream	oss;

    // Convert the IP from unsigned int to string

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

    ip = oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Leases::Lease::ip6_to_string(const unsigned int eui64[],
                                  const unsigned int prefix[],
                                  string& ip6s)
{
    struct in6_addr ip6;
    char            dst[INET6_ADDRSTRLEN];

    ip6.s6_addr32[2] = htonl(eui64[1]);
    ip6.s6_addr32[3] = htonl(eui64[0]);

    // global or site unicast address
    if (prefix[1] != 0 || prefix[0] != 0 )
    {
        ip6.s6_addr32[0] = htonl(prefix[1]);
        ip6.s6_addr32[1] = htonl(prefix[0]);
    }
    else // link local address
    {

        ip6.s6_addr32[0] = htonl(0xfe800000);
        ip6.s6_addr32[1] = 0;
    }

    if ( inet_ntop(AF_INET6, &ip6, dst, INET6_ADDRSTRLEN) != 0 )
    {
        ip6s = dst;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::Lease::mac_to_number(const string& _mac, unsigned int i_mac[])
{
    istringstream iss;
    size_t        pos=0;
    int           count = 0;
    unsigned int  tmp;

    string mac = _mac;

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

int Leases::Lease::prefix6_to_number(const string& prefix, unsigned int ip[])
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

void Leases::Lease::mac_to_eui64(const unsigned int  i_mac[], unsigned int eui64[])
{
    eui64[1] = ((i_mac[1]+512)<<16) + ((i_mac[0] & 0xFF000000)>>16) + 0x000000FF;
    eui64[0] = 4261412864 + (i_mac[0] & 0x00FFFFFF);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Leases::Lease::mac_to_string(const unsigned int i_mac[], string& mac)
{
    ostringstream	oss;
    unsigned int	temp_byte;

    oss.str("");

    for (int i=5;i>=0;i--)
    {
        if ( i < 4 )
        {
            temp_byte =   i_mac[0];
            temp_byte >>= i*8;
        }
        else
        {
            temp_byte  = i_mac[1];
            temp_byte  >>= (i%4)*8;
        }

        temp_byte  &= 255;

        oss.width(2);
        oss.fill('0');
        oss << hex << temp_byte;

        if(i!=0)
        {
            oss << ":";
        }
    }

    mac = oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Leases::Lease::to_xml(string& str,
                              const unsigned int global[],
                              const unsigned int site[]) const
{
    string ip_s;
    string ipl_s, ips_s, ipg_s;
    string mac_s;

    unsigned int tmp_prefix[2] = {0, 0};

    ostringstream os;

    mac_to_string(mac, mac_s);

    ip_to_string(ip, ip_s);

    ip6_to_string(eui64, tmp_prefix, ipl_s);

    os <<
        "<LEASE>" <<
            "<MAC>" << mac_s << "</MAC>" <<
            "<IP>"  << ip_s  << "</IP>"  <<
            "<IP6_LINK>" << ipl_s << "</IP6_LINK>";

    if (site[1] != 0 || site[0] != 0 )
    {
        ip6_to_string(eui64, site, ips_s);
        os << "<IP6_SITE>" << ips_s << "</IP6_SITE>";
    }

    if (global[1] != 0 || global[0] != 0 )
    {
        ip6_to_string(eui64, global, ipg_s);
        os << "<IP6_GLOBAL>" << ipg_s << "</IP6_GLOBAL>";
    }

    os << "<USED>"<< used  << "</USED>"<<
          "<VID>" << vid   << "</VID>" <<
        "</LEASE>";

    str = os.str();

    return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Leases::Lease::to_xml_db(string& str) const
{
    ostringstream os;

    os <<
        "<LEASE>" <<
            "<IP>"         << ip     << "</IP>"  <<
            "<MAC_PREFIX>" << mac[1] << "</MAC_PREFIX>" <<
            "<MAC_SUFFIX>" << mac[0] << "</MAC_SUFFIX>" <<
            "<USED>"       << used   << "</USED>"<<
            "<VID>"        << vid    << "</VID>" <<
        "</LEASE>";

    str = os.str();

    return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::Lease::from_xml(const string &xml_str)
{
    int rc = 0;
    int int_used;

    // Initialize the internal XML object
    update_from_str(xml_str);

    rc += xpath(ip, "/LEASE/IP", 0);

    rc += xpath(mac[1], "/LEASE/MAC_PREFIX", 0);
    rc += xpath(mac[0], "/LEASE/MAC_SUFFIX", 0);

    rc += xpath(int_used, "/LEASE/USED", 0);
    rc += xpath(vid, "/LEASE/VID", 0);

    used = static_cast<bool>(int_used);

    if (rc != 0)
    {
        return -1;
    }

    mac_to_eui64(mac, eui64);

    return 0;
}

/* ************************************************************************** */
/* ************************************************************************** */
/* Leases class                                                               */
/* ************************************************************************** */
/* ************************************************************************** */

const char * Leases::table        = "leases";

const char * Leases::db_names     = "oid, ip, body";

const char * Leases::db_bootstrap = "CREATE TABLE IF NOT EXISTS leases ("
                "oid INTEGER, ip BIGINT, body MEDIUMTEXT, PRIMARY KEY(oid,ip))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::select_cb(void *nil, int num, char **values, char **names)
{
    Lease *         lease;
    int             rc;

    if ( (!values[0]) || (num != 1) )
    {
        return -1;
    }

    lease = new Lease();
    rc = lease->from_xml(values[0]);

    if (rc != 0)
    {
        return -1;
    }

    leases.insert(make_pair(lease->ip, lease));

    if(lease->used)
    {
        n_used++;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int Leases::select(SqlDB * db)
{
    ostringstream   oss;
    int             rc;

    // Reset the used leases counter
    n_used = 0;

    set_callback(static_cast<Callbackable::Callback>(&Leases::select_cb));

    oss << "SELECT body FROM " << table << " WHERE oid = " << oid;

    rc = db->exec(oss,this);

    unset_callback();

    if (rc != 0)
    {
        goto error_id;
    }

    return 0;

error_id:
    oss.str("");
    oss << "Error getting leases for network nid: " << oid;

    NebulaLog::log("VNM", Log::ERROR, oss);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::drop(SqlDB * db)
{
    ostringstream   oss;

    // Drop all the leases
    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    return db->exec(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::insert(SqlDB * db, string& error_str)
{
    error_str = "Should not access to Leases.insert().";
	NebulaLog::log("VNM", Log::ERROR, error_str);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::update(SqlDB * db)
{
	NebulaLog::log("VNM", Log::ERROR, "Should not access to Leases.update()");
    return -1;
}

/* ************************************************************************** */
/* Leases :: Interface Methods                                                */
/* ************************************************************************** */

bool Leases::check(const string& ip)
{
    unsigned int _ip;

    Leases::Lease::ip_to_number(ip,_ip);

    return check(_ip);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Leases::check(unsigned int ip)
{
    map<unsigned int,Lease *>::iterator it;

    it=leases.find(ip);

    if (it!=leases.end())
    {
        return it->second->used;
    }
    else
    {
        return false;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Leases::is_owner(const string& ip, int vid)
{
    unsigned int _ip;
    map<unsigned int,Lease *>::iterator it;

    Leases::Lease::ip_to_number(ip,_ip);

    it = leases.find(_ip);

    if (it!=leases.end())
    {
        return (it->second->vid == vid);
    }
    else
    {
        return false;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::hold_leases(vector<const Attribute*>&   vector_leases,
                        string&                     error_msg)
{
    const VectorAttribute * single_attr_lease = 0;

    int     rc;
    string  ip;
    string  mac;

    unsigned int tmp[2];

    if ( vector_leases.size() > 0 )
    {
        single_attr_lease =
                dynamic_cast<const VectorAttribute *>(vector_leases[0]);
    }

    if ( single_attr_lease == 0 )
    {
        error_msg = "Empty lease description.";
        return -1;
    }

    ip = single_attr_lease->vector_value("IP");

    if ( check(ip) )
    {
        error_msg = "Lease is in use.";
        return -1;
    }

    rc = set(-1, ip, mac, tmp);

    if ( rc != 0 )
    {
        error_msg = "Lease is not part of the NET.";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::free_leases(vector<const Attribute*>&   vector_leases,
                        string&                     error_msg)
{
    const VectorAttribute * single_attr_lease = 0;
    map<unsigned int,Lease *>::iterator it;

    unsigned int    i_ip;
    string          st_ip;
    string          mac;

    if ( vector_leases.size() > 0 )
    {
        single_attr_lease =
                dynamic_cast<const VectorAttribute *>(vector_leases[0]);
    }

    if ( single_attr_lease == 0 )
    {
        error_msg = "Empty lease description.";
        return -1;
    }

    st_ip  = single_attr_lease->vector_value("IP");

    if ( Leases::Lease::ip_to_number(st_ip,i_ip) != 0 )
    {
        error_msg = "Wrong Lease format.";
        return -1;
    }

    it = leases.find(i_ip);

    if ( it == leases.end() || !it->second->used || it->second->vid != -1 )
    {
        error_msg = "Lease is not on hold.";
        return -1;
    }

    release(st_ip);

    return 0;
}

/* ************************************************************************** */
/* Leases :: Misc                                                             */
/* ************************************************************************** */

string& Leases::to_xml(string& xml) const
{
    map<unsigned int, Leases::Lease *>::const_iterator  it;
    ostringstream os;
    string        lease_xml;

    for(it=leases.begin();it!=leases.end();it++)
    {
        os << it->second->to_xml(lease_xml, global, site);
    }

    xml = os.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, Leases& _leases)
{
    string xml;

    os << _leases.to_xml(xml);

    return os;
};

