/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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
    SqliteDB      * db,
    int           _oid,
    unsigned long _size,
    unsigned int  _mac_prefix,
    const string& _network_address):
        Leases(db,_oid,_size),mac_prefix(_mac_prefix),current(0)
{
    unsigned int net_addr;
    
    Leases::Lease::ip_to_number(_network_address,net_addr);
    
    //size is the number of hosts in the network
    size = _size + 2;
    
    network_address =  0xFFFFFFFF << (int) ceil(log(size)/log(2));

    network_address &= net_addr;
}

/* ************************************************************************** */
/* Ranged Leases :: Methods                                                   */
/* ************************************************************************** */

int RangedLeases::get(int vid, string&  ip, string&  mac)
{
	unsigned int num_ip;
	int			 rc = -1;
	
	for (unsigned int i=0; i<size; i++, current++)
	{
		num_ip = network_address + (current%(size-2)) + 1;
		
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

int RangedLeases::add(
    unsigned int 	ip,
    unsigned int 	mac[],
    int 			vid,
    bool 			used)
{
    ostringstream   oss;
    int				rc;
    
    //Insert the lease in the database
    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("<<
    	oid << "," <<
    	ip << "," <<
    	mac[Lease::PREFIX] << "," <<
    	mac[Lease::SUFFIX] << "," <<
    	vid << "," <<
    	used << ")";

    rc = db->exec(oss);
    
    if ( rc == 0 )
    {
        leases.insert(make_pair(ip,new Lease(ip,mac,vid,used)));
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int  RangedLeases::del(const string& ip)
{
    unsigned int    _ip;
    ostringstream   oss;
    int				rc;
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
        delete it_ip->second;

        leases.erase(it_ip);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
