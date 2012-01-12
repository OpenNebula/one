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


#include "FixedLeases.h"
#include "NebulaLog.h"

#include <string.h>

FixedLeases::FixedLeases(
        SqlDB *                     db,
        int                         _oid,
        unsigned int                _mac_prefix,
        vector<const Attribute*>&   vector_leases):
            Leases(db,_oid,0,_mac_prefix),current(leases.begin())
{
    const VectorAttribute *	single_attr_lease;
    string _mac;
    string _ip;
    string error_msg;

    for (unsigned long i=0; i < vector_leases.size() ;i++)
    {
        single_attr_lease = dynamic_cast<const VectorAttribute *>
            (vector_leases[i]);

        if( single_attr_lease )
        {
            _ip  = single_attr_lease->vector_value("IP");
            _mac = single_attr_lease->vector_value("MAC");

            if( add(_ip,_mac,-1,error_msg,false) != 0 )
            {
                NebulaLog::log("VNM", Log::ERROR, error_msg);
            }
        }
    }

    size = leases.size();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::add(const string& ip, const string& mac, int vid,
                     string& error_msg, bool used)
{
    ostringstream    oss;
    unsigned int     _ip;
    unsigned int     _mac [2];

    Lease *         lease;
    string          xml_body;
    char *          sql_xml;

    int rc;

    if ( Leases::Lease::ip_to_number(ip,_ip) )
    {
        goto error_ip;
    }

    if ( leases.count(_ip) > 0 )
    {
        goto error_duplicate;
    }

    if (mac.empty())
    {
        _mac[Lease::PREFIX] = mac_prefix;
        _mac[Lease::SUFFIX] = _ip;
    }
    else if (Leases::Lease::mac_to_number(mac,_mac))
    {
        goto error_mac;
    }

    lease = new Lease(_ip,_mac,vid,used);

    sql_xml = db->escape_str(lease->to_xml_db(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    oss << "INSERT INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid     << ","
        <<          _ip     << ","
        << "'" <<   sql_xml << "')";

    db->free_str(sql_xml);

    rc = db->exec(oss);

    if ( rc != 0 )
    {
        goto error_db;
    }

    leases.insert( make_pair(_ip,lease) );

    if(lease->used)
    {
        n_used++;
    }

    return rc;

error_ip:
    oss.str("");
    oss << "Error inserting lease, malformed IP = " << ip;
    goto error_common;

error_mac:
    oss.str("");
    oss << "Error inserting lease, malformed MAC = " << mac;
    goto error_common;

error_duplicate:
    oss.str("");
    oss << "Error inserting lease, IP " << ip << " already exists";
    goto error_common;

error_body:
    oss.str("");
    oss << "Error inserting lease, marshall error";
    delete lease;
    goto error_common;

error_db:
    oss.str("");
    oss << "Error inserting lease in database.";
    delete lease;

error_common:
    NebulaLog::log("VNM", Log::ERROR, oss);
    error_msg = oss.str();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::remove(const string& ip, string& error_msg)
{
    map<unsigned int,Lease *>::iterator it;

    ostringstream    oss;
    unsigned int     _ip;

    int rc;

    if( Leases::Lease::ip_to_number(ip,_ip) )
    {
        goto error_ip;
    }

    it = leases.find(_ip);

    if (it == leases.end()) //it does not exist in the net
    {
        goto error_notfound;
    }

    if (it->second->used) //it is in use
    {
        goto error_used;
    }

    oss << "DELETE FROM " << table << " WHERE (oid=" << oid
        << " AND ip=" << _ip << ")";

    rc = db->exec(oss);

    if ( rc != 0 )
    {
        goto error_db;
    }

    delete it->second;
    
    leases.erase(it);

    return rc;


error_ip:
    oss.str("");
    oss << "Error deleting lease, malformed IP = " << ip;
    goto error_common;

error_notfound:
    oss.str("");
    oss << "Error deleting lease, IP " << ip << " is not part of NET " << oid;
    goto error_common;

error_used:
    oss.str("");
    oss << "Error deleting lease, IP " << ip << " is currently in use";
    goto error_common;

error_db:
    oss.str("");
    oss << "Error inserting lease in database.";

error_common:
    NebulaLog::log("VNM", Log::ERROR, oss);
    error_msg = oss.str();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::unset(const string& ip)
{
    unsigned int     _ip;

    map<unsigned int, Lease *>::iterator  it_ip;

    if ( Leases::Lease::ip_to_number(ip,_ip) )
    {
        return 0; //Wrong format, not leased
    }

    it_ip = leases.find(_ip);

    if (it_ip == leases.end())
    {
        return 0; //Not in the map, not leased
    }

    // Flip used flag to false
    it_ip->second->used = false;
    it_ip->second->vid  = -1;

    // Update the lease
    return update_lease(it_ip->second);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::get(int vid, string&  ip, string&  mac)
{
    int     rc = -1;

    if (leases.empty())
    {
        return -1;
    }

    for(unsigned int i=0 ;i<size; i++,current++)
    {
        if (current == leases.end())
        {
            current = leases.begin();
        }

        if (current->second->used == false)
        {
            ostringstream oss;

            current->second->used = true;
            current->second->vid  = vid;

            rc = update_lease(current->second);

            current->second->to_string(ip,mac);

            current++;
            break;
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::set(int vid, const string&  ip, string&  mac)
{
    map<unsigned int,Lease *>::iterator it;

    unsigned int    num_ip;
    int             rc;

    rc = Leases::Lease::ip_to_number(ip,num_ip);

    if (rc != 0)
    {
        return -1;
    }

    it=leases.find(num_ip);

    if (it == leases.end()) //it does not exist in the net
    {
        return -1;
    }
    else if (it->second->used) //it is in use
    {
        return -1;
    }

    it->second->used = true;
    it->second->vid  = vid;

    Leases::Lease::mac_to_string(it->second->mac,mac);

    return update_lease(it->second);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::update_lease(Lease * lease)
{
    ostringstream   oss;
    string          xml_body;
    char *          sql_xml;

    sql_xml = db->escape_str(lease->to_xml_db(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        return -1;
    }

    if( lease->used )
    {
        n_used++;
    }
    else
    {
        n_used--;
    }

    oss << "UPDATE " << table << " SET body='" << sql_xml << "'"
        << " WHERE oid=" << oid << " AND ip='" << lease->ip <<"'";

    db->free_str(sql_xml);

    return db->exec(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::add_leases(vector<const Attribute*>&   vector_leases,
                            string&                     error_msg)
{
    const VectorAttribute * single_attr_lease = 0;

    int     rc = -1;
    string  _mac;
    string  _ip;

    if ( vector_leases.size() > 0 )
    {
        single_attr_lease =
                dynamic_cast<const VectorAttribute *>(vector_leases[0]);
    }

    if( single_attr_lease != 0 )
    {
        _ip  = single_attr_lease->vector_value("IP");
        _mac = single_attr_lease->vector_value("MAC");

        rc = add(_ip, _mac, -1, error_msg, false);

        if( rc == 0 )
        {
            size = leases.size();
        }
    }
    else
    {
        error_msg = "Empty lease description.";
    }


    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FixedLeases::remove_leases(vector<const Attribute*>&   vector_leases,
                               string&                     error_msg)
{
    const VectorAttribute * single_attr_lease = 0;
    int     rc = -1;
    string  _ip;

    if ( vector_leases.size() > 0 )
    {
        single_attr_lease =
                dynamic_cast<const VectorAttribute *>(vector_leases[0]);
    }

    if( single_attr_lease != 0 )
    {
        _ip  = single_attr_lease->vector_value("IP");

        rc = remove(_ip, error_msg);

        if( rc == 0 )
        {
            size = leases.size();
        }
    }
    else
    {
        error_msg = "Empty lease description.";
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
