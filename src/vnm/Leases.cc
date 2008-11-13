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


#include "Leases.h"
#include "Nebula.h"

/* ************************************************************************** */
/* ************************************************************************** */
/* Lease class                                                                */
/* ************************************************************************** */
/* ************************************************************************** */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Leases::Lease::to_string(string &_ip,
                              string &_mac)
{
    mac_to_string(mac, _mac);

    ip_to_string(ip, _ip);
}

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

    i_mac[PREFIX] = 0;
    i_mac[SUFFIX] = 0;

    iss >> hex >> i_mac[PREFIX] >> ws >> hex >> tmp >> ws;
    i_mac[PREFIX] <<= 8;
    i_mac[PREFIX] += tmp;

    for (int i=0;i<4;i++)
    {
        iss >> hex >> tmp >> ws;

        i_mac[SUFFIX] <<= 8;
        i_mac[SUFFIX] += tmp;
    }

    return 0;
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
            temp_byte =   i_mac[SUFFIX];
            temp_byte >>= i*8;
        }
        else
        {
            temp_byte  = i_mac[PREFIX];
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


ostream& operator<<(ostream& os, Leases::Lease& _lease)
{
	string ip;
	string mac;
	
    _lease.to_string(ip,mac);
    
    ip = "IP = " + ip;
    mac = "MAC = " + mac;
    
    os.width(20);
    os << left << ip;
    
    os.width(24);
    os << left << mac;
    
    os << left << " USED = " << _lease.used;  
    os << left << " VID = "  << _lease.vid;
    
    return os;
}

/* ************************************************************************** */
/* ************************************************************************** */
/* Leases class                                                               */
/* ************************************************************************** */
/* ************************************************************************** */

const char * Leases::table        = "leases";

const char * Leases::db_names     = "(oid,ip,mac_prefix,mac_suffix,vid,used)";

const char * Leases::db_bootstrap = "CREATE TABLE leases ("
				"oid INTEGER,ip INTEGER, mac_prefix INTEGER,mac_suffix INTEGER,"
                "vid INTEGER, used INTEGER, PRIMARY KEY(oid,ip))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::unmarshall(int num, char **names, char ** values)
{
    if (    (values[OID] == 0)        ||
            (values[IP]  == 0)        ||
            (values[MAC_PREFIX] == 0) ||
            (values[MAC_SUFFIX] == 0) ||
            (values[VID] == 0)        ||
            (values[USED]== 0)        ||
            (num != LIMIT ))
    {
        return -1;
    }

    unsigned int mac[2];
    unsigned int ip;
    int          vid;
    bool         used;
    
    istringstream iss;
    
    iss.str(values[IP]);
    iss >> ip;
    
    iss.clear();
    iss.str(values[MAC_PREFIX]);
    iss >> mac[Lease::PREFIX];
    
    iss.clear();
    iss.str(values[MAC_SUFFIX]);
    iss >> mac[Lease::SUFFIX];
    
    iss.clear();
    iss.str(values[VID]);
    iss >> vid;
    
    iss.clear();
    iss.str(values[USED]);
    iss >> used;

    leases.insert(make_pair(ip,new Lease(ip,mac,vid,used)));
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" int leases_select_cb (
        void *                  _leases,
        int                     num,
        char **                 values,
        char **                 names)
{
    Leases * leases;

    leases = static_cast<Leases *>(_leases);

    if (leases == 0)
    {
        return -1;
    }

    return leases->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::select(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;

    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    rc = db->exec(oss,leases_select_cb,(void *) this);

    if (rc != 0)
    {
        goto error_id;
    }

    return 0;

error_id:
	oss.str("");
    oss << "Error getting leases for network nid: " << oid;
    
    Nebula::log("VNM", Log::ERROR, oss);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Leases::drop(SqliteDB * db)
{
    ostringstream   oss;
    
    // Drop all the leases 
    oss << "DELETE FROM " << table << " WHERE oid=" << oid;

    return db->exec(oss);
}

int Leases::insert(SqliteDB * db)
{
	Nebula::log("VNM", Log::ERROR, "Should not access to Leases.insert()");
    return -1;
}

int Leases::update(SqliteDB * db)
{
	Nebula::log("VNM", Log::ERROR, "Should not access to Leases.update()");
    return -1;
}

/* ************************************************************************** */
/* Leases :: Interface Methods                                                */
/* ************************************************************************** */

bool Leases::check(const string& ip)
{
    map<unsigned int,Lease *>::iterator it;

    unsigned int _ip;

    Leases::Lease::ip_to_number(ip,_ip);


    it=leases.find(_ip);

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

/* ************************************************************************** */
/* Leases :: Misc                                                             */
/* ************************************************************************** */

ostream& operator<<(ostream& os, Leases& _leases)
{
    map<unsigned int, Leases::Lease *>::iterator  it;
    
    os << "NID   : " << _leases.oid << endl;
    os << "SIZE  : " << _leases.size << endl;

    os << "Leases:" << endl;

    // Iterate all the leases
    for(it=_leases.leases.begin();it!=_leases.leases.end();it++)
    {
        os << *(it->second) << endl;
    }

    return os;
};

