/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
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

#include "Nebula.h"
#include "VirtualNetworkPool.h"
#include <sstream>

VirtualNetworkPool::VirtualNetworkPool(SqliteDB * db, 
	const string& 	prefix,
	int				_default_size):
		PoolSQL(db,VirtualNetwork::table),
		mac_prefix(0),
		default_size(_default_size)
{
    istringstream iss;
    size_t        pos   = 0;
    int           count = 0;
    unsigned int  tmp;

    string mac = prefix;

    while ( (pos = mac.find(':')) !=  string::npos )
    {
    	mac.replace(pos,1," ");
    	count++;
    }

    if (count != 1)
    {
    	Nebula::log("VNM",Log::ERROR,"Wrong MAC prefix format, using default");
    	mac_prefix = 1; //"00:01"
    	
    	return;
    }

    iss.str(mac);

    iss >> hex >> mac_prefix >> ws >> hex >> tmp >> ws;
    mac_prefix <<= 8;
    mac_prefix += tmp;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
    		
int VirtualNetworkPool::allocate (
    int            uid,
    const  string& stemplate,
    int *          oid)
{
    VirtualNetwork *	vn;
    char *				error_msg;
    int                 rc;
    ostringstream 		oss;            

    string              name;
    string              bridge;
    
    string              str_type;
    
    // Build a new Virtual Network object
    vn = new VirtualNetwork(mac_prefix, default_size);
    
    vn->uid	= uid;
    
    rc = vn->vn_template.parse(stemplate,&error_msg);
    
    if ( rc != 0 )
    {
        oss << error_msg;        
        Nebula::log("VNM", Log::ERROR, oss);
        free(error_msg);

        return -1;
    }
   
    // Information about the VN needs to be extracted from the template
    vn->get_template_attribute("TYPE",str_type);
    
    if ( str_type == "RANGED")
    {
        vn->type = VirtualNetwork::RANGED;
    }
    else
    {
        vn->type = VirtualNetwork::FIXED;
    }

    vn->get_template_attribute("NAME",name);
    vn->name = name;
    
    vn->get_template_attribute("BRIDGE",bridge);
    vn->bridge = bridge;
    
    // Insert the VN in the pool so we have a valid OID

    *oid = PoolSQL::allocate(vn);
    
    if ( *oid == -1 )
    {
        return -1;
    }
        
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C"
{
static int select_name_cb(
    void *          _value,
    int             num,
    char **         values,
    char **         names)
{
    int    *        oid;
    
    oid = static_cast<int *>(_value);
    
    if ( oid == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }
    
    *oid = atoi(values[0]);
    
    return 0;    
}    
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualNetwork * VirtualNetworkPool::get(const string& name, bool lock)
{
    ostringstream   oss;
    
    int	oid;    
    int	rc; 

    char * sql_name = sqlite3_mprintf("%q",name.c_str());

    if ( sql_name == 0 )
    {
        return 0;
    }
    
    oss << "SELECT oid FROM " << VirtualNetwork::table << " WHERE name = '" 
        << sql_name << "'";
    
    rc = db->exec(oss, select_name_cb, (void *) (&oid));

    sqlite3_free(sql_name);

    if (rc != 0)
    {
        return 0;
    }

    return get(oid,lock);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


