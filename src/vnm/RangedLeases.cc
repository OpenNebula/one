/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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


#include "RangedLeases.h"
#include "Nebula.h"

#include <cmath>

/* ************************************************************************** */
/* Ranged Leases class                                                        */
/* ************************************************************************** */

RangedLeases::RangedLeases(
    SqlDB *        db,
    int           _oid,
    unsigned int  _mac_prefix,
    unsigned int  _ip_start,
    unsigned int  _ip_end):
        Leases(db,_oid,0,_mac_prefix),
        ip_start(_ip_start),ip_end(_ip_end),current(0)
{
    size = ip_end - ip_start + 1;
}

/* ************************************************************************** */
/* Ranged Leases :: Methods                                                   */
/* ************************************************************************** */
int RangedLeases::process_template(VirtualNetwork* vn,
            unsigned int& ip_start, unsigned int& ip_end, string& error_str)
{
    ostringstream   oss;

    string st_size  = "";
    string st_addr  = "";
    string st_mask  = "";

    string st_ip_start  = "";
    string st_ip_end    = "";

    unsigned int host_bits;
    unsigned int network_bits;

    unsigned int net_addr;
    unsigned int net_mask;
    size_t       pos;

    ip_start = 0;
    ip_end   = 0;

    // retrieve specific information from template
    vn->erase_template_attribute("IP_START", st_ip_start);
    vn->erase_template_attribute("IP_END",   st_ip_end);

    if ( !st_ip_start.empty() )
    {
        if ( Leases::Lease::ip_to_number(st_ip_start, ip_start) != 0 )
        {
            goto error_ip_start;
        }
    }

    if ( !st_ip_end.empty() )
    {
        if ( Leases::Lease::ip_to_number(st_ip_end, ip_end) != 0 )
        {
            goto error_ip_end;
        }
    }

    vn->erase_template_attribute("NETWORK_ADDRESS", st_addr);

    if (st_addr.empty())
    {
        if ( ip_start != 0 && ip_end != 0 )
        {
            if ( ip_end < ip_start )
            {
                goto error_greater;
            }

            return 0;
        }
        else
        {
            goto error_addr;
        }
    }

    // Check if the IP has a network prefix
    pos = st_addr.find("/");

    if ( pos != string::npos )
    {
        string st_network_bits;

        st_network_bits = st_addr.substr(pos+1);
        st_addr         = st_addr.substr(0,pos);

        istringstream iss(st_network_bits);
        iss >> network_bits;

        if ( network_bits > 32 )
        {
            goto error_prefix;
        }

        host_bits = 32 - network_bits;
    }
    else
    {
        vn->erase_template_attribute("NETWORK_MASK", st_mask);

        if ( !st_mask.empty() )
        {
            // st_mask is in decimal format, e.g. 255.255.0.0
            // The number of trailing 0s is needed

            if ( Leases::Lease::ip_to_number(st_mask, net_mask) != 0 )
            {
                goto error_netmask;
            }

            host_bits = 0;

            while ( host_bits < 32 &&
                    ((net_mask >> host_bits) & 1) != 1 )
            {
                host_bits++;
            }
        }
        else
        {
            vn->erase_template_attribute("NETWORK_SIZE",st_size);

            if ( st_size == "C" || st_size == "c" )
            {
                host_bits = 8;
            }
            else if ( st_size == "B" || st_size == "b" )
            {
                host_bits = 16;
            }
            else if ( st_size == "A" || st_size == "a" )
            {
                host_bits = 24;
            }
            else
            {
                unsigned int size;
                 
                if (!st_size.empty())//Assume it's a number
                {
                    istringstream iss(st_size);

                    iss >> size;
                }
                else
                {
                    size = VirtualNetworkPool::default_size();
                }

                host_bits = (int) ceil(log(size+2)/log(2));
            }
        }
    }

    vn->remove_template_attribute("NETWORK_SIZE");

    // Set the network mask
    net_mask = 0xFFFFFFFF << host_bits;
    Lease::ip_to_string(net_mask, st_mask);
    
    vn->replace_template_attribute("NETWORK_MASK", st_mask);

    if ( Leases::Lease::ip_to_number(st_addr,net_addr) != 0 )
    {
        goto error_net_addr;
    }

    if (net_addr != (net_mask & net_addr) )
    {
        goto error_not_base_addr;
    }

    // Set IP start/end
    if ( ip_start == 0 )
    {
        ip_start = net_addr + 1;
    }

    if ( ip_end == 0 )
    {
        ip_end   = net_addr +  (1 << host_bits) - 2;
    }

    // Check range restrictions
    if ( (ip_start & net_mask) != net_addr )
    {
        goto error_range_ip_start;
    }

    if ( (ip_end & net_mask) != net_addr )
    {
        goto error_range_ip_end;
    }

    if ( ip_end < ip_start )
    {
        goto error_greater;
    }

    return 0;


error_ip_start:
    oss << "IP_START " << st_ip_start << " is not a valid IP.";
    goto error_common;

error_ip_end:
    oss << "IP_END " << st_ip_end << " is not a valid IP.";
    goto error_common;

error_not_base_addr:
    oss << "NETWORK_ADDRESS " << st_addr
        << " is not a base address for the network mask " << st_mask << ".";
    goto error_common;

error_net_addr:
    oss << "NETWORK_ADDRESS " << st_addr << " is not a valid IP.";
    goto error_common;

error_netmask:
    oss << "NETWORK_MASK " << st_mask << " is not a valid network mask.";
    goto error_common;

error_prefix:
    oss << "A CIDR prefix of " << network_bits << " bits is not valid.";
    goto error_common;

error_addr:
    oss << "No NETWORK_ADDRESS in template for Virtual Network.";
    goto error_common;

error_range_ip_start:
    oss << "IP_START " << st_ip_start << " is not part of the network "
        << st_addr << "/" << 32-host_bits << ".";
    goto error_common;

error_range_ip_end:
    oss << "IP_END " << st_ip_end << " is not part of the network "
        << st_addr << "/" << 32-host_bits << ".";
    goto error_common;

error_greater:
    Leases::Lease::ip_to_string(ip_start, st_ip_start);
    Leases::Lease::ip_to_string(ip_end,   st_ip_end);

    oss << "IP_START " << st_ip_start << " cannot be greater than the IP_END "
        << st_ip_end << ".";
    goto error_common;


error_common:
    error_str = oss.str();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RangedLeases::get(int vid, string&  ip, string&  mac)
{
    unsigned int num_ip;
    int          rc = -1;

    for ( unsigned int i=0; i<size; i++, current = (current+1)%size )
    {
        num_ip = ip_start + current;

        if (check(num_ip) == false)
        {
            unsigned int num_mac[2];

            num_mac[Lease::PREFIX] = mac_prefix;
            num_mac[Lease::SUFFIX] = num_ip;

            rc = add(num_ip,num_mac,vid);

            if (rc==0)
            {
                Leases::Lease::ip_to_string(num_ip,ip);
                Leases::Lease::mac_to_string(num_mac,mac);

                break;
            }
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RangedLeases::set(int vid, const string&  ip, string&  mac)
{
    unsigned int num_ip;
    unsigned int num_mac[2];
    int          rc;

    rc = Leases::Lease::ip_to_number(ip,num_ip);

    if (rc != 0)
    {
        return -1;
    }

    if ( num_ip < ip_start || ip_end < num_ip )
    {
        return -1;
    }

    if (check(num_ip) == true)
    {
        return -1;
    }

    num_mac[Lease::PREFIX] = mac_prefix;
    num_mac[Lease::SUFFIX] = num_ip;

    rc = add(num_ip,num_mac,vid);

    if (rc != 0)
    {
        return -1;
    }

    Leases::Lease::mac_to_string(num_mac,mac);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RangedLeases::add(
    unsigned int    ip,
    unsigned int    mac[],
    int             vid,
    bool            used)
{
    ostringstream    oss;

    Lease *         lease;
    string          xml_body;
    char *          sql_xml;

    int rc;

    lease = new Lease(ip,mac,vid,used);

    sql_xml = db->escape_str(lease->to_xml_db(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    oss << "INSERT INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid     << ","
        <<          ip      << ","
        << "'" <<   sql_xml << "')";

    db->free_str(sql_xml);

    rc = db->exec(oss);

    if ( rc != 0 )
    {
        goto error_db;
    }

    leases.insert( make_pair(ip,lease) );

    n_used++;

    return rc;


error_body:
    oss.str("");
    oss << "Error inserting lease, marshall error";
    goto error_common;

error_db:
    oss.str("");
    oss << "Error inserting lease in database.";

error_common:
    NebulaLog::log("VNM", Log::ERROR, oss);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int  RangedLeases::del(const string& ip)
{
    unsigned int    _ip;
    ostringstream   oss;
    int             rc;
    map<unsigned int, Lease *>::iterator  it_ip;

    // Remove lease from leases map

    if ( Lease::ip_to_number(ip,_ip) )
    {
        return 0;
    }

    it_ip = leases.find(_ip);

    if (it_ip == leases.end())
    {
        return 0; //Not in the map, not leased
    }

    // Erase it from DB

    oss << "DELETE FROM " << table << " WHERE oid='" << oid
    << "' AND ip='" << _ip << "'";

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        n_used--;

        delete it_ip->second;

        leases.erase(it_ip);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
