/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
