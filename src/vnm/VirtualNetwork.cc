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


#include "VirtualNetwork.h"
#include "Nebula.h"
#include "RangedLeases.h"
#include "FixedLeases.h"

/* ************************************************************************** */
/* Virtual Network :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualNetwork::VirtualNetwork(unsigned int  mp, int ds):                 
                PoolObjectSQL(-1),
                name(""),
                uid(-1),
                bridge(""),
                type(UNINITIALIZED),
                leases(0),
                mac_prefix(mp),
                default_size(ds)
{
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualNetwork::~VirtualNetwork()
{    
    if (leases != 0)
    {
        delete leases;
    }      
}

/* ************************************************************************** */
/* Virtual Network :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualNetwork::table               = "network_pool";

const char * VirtualNetwork::db_names            = "(oid,uid,name,type,bridge)";

const char * VirtualNetwork::db_bootstrap        = "CREATE TABLE network_pool ("
     "oid INTEGER,uid INTEGER, name TEXT PRIMARY KEY,type INTEGER, bridge TEXT)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::unmarshall(int num, char **names, char ** values)
{
    if     ((values[OID]    == 0)  ||
            (values[UID]    == 0)  ||
            (values[NAME]   == 0)  ||
            (values[TYPE]   == 0)  ||
            (values[BRIDGE] == 0)  ||                 
            (num            != LIMIT ))
    {
        return -1;
    }

    oid    = atoi(values[OID]);
    uid    = atoi(values[UID]);
    
    name   = values[NAME];
    
    type   = (NetworkType)atoi(values[TYPE]);
    
    bridge = values[BRIDGE];
    
    // Virtual Network template ID is the Network ID    
    vn_template.id = oid;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" int vn_select_cb (
        void *                  _vn,
        int                     num,
        char **                 values,
        char **                 names)
{
    VirtualNetwork *    vn;

    vn = static_cast<VirtualNetwork *>(_vn);

    if (vn == 0)
    {
        return -1;
    }

    return vn->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */

int VirtualNetwork::select(SqliteDB * db)
{
    ostringstream   oss;
    ostringstream   ose;
    
    int             rc;
    int             boid;

    string          network_address;
        
    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss,vn_select_cb,(void *) this);

    if ((rc != 0) || (oid != boid ))
    {
        goto error_id;
    }
    
    //Get the template
    rc = vn_template.select(db);

    if (rc != 0)
    {
        goto error_template;
    }

    //Get the leases
    if (type == RANGED)
    {
    	string 	nclass = "";
    	int		size = 0;
    	
        // retrieve specific information from template
        get_template_attribute("NETWORK_ADDRESS",network_address);
        
        if (network_address.empty())
        {
        	goto error_addr;
        }
                
        get_template_attribute("NETWORK_SIZE",nclass);
             
        if ( nclass == "B" )
        {
        	size = 65534;	    
        }
        else if ( nclass == "C" )
        {
        	size = 254;
        }
        else if (!nclass.empty()) //Assume its a number
        {
        	istringstream iss(nclass);            
        	iss >> size;
        }
        
        if (size == 0)
        {
        	size = default_size;
        }
        
        leases = new RangedLeases::RangedLeases(db,
                                                oid,
                                                size,
                                                mac_prefix,
                                                network_address);
    }
    else if(type == FIXED)
    {
    	leases = new  FixedLeases(db,
                                  oid,
                                  mac_prefix);                                                                           
    }
    else
    {
    	goto error_type;
    }
    
    if (leases == 0)
    {
        goto error_leases;
    }
    
    return leases->select(db);

error_id:
    ose << "Error getting Virtual Network nid: " << oid;
	goto error_common;

error_template:
    ose << "Can not get template for Virtual Network nid: " << oid;
	goto error_common;
    
error_leases:
    ose << "Error getting Virtual Network leases nid: " << oid;
	goto error_common;

error_type:
	ose << "Wrong type of Virtual Network: " << type;
    goto error_common;
	
error_addr:
	ose << "Network address is not defined nid: " << oid;
	
error_common:
	Nebula::log("VNM", Log::ERROR, ose);   
	return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::insert(SqliteDB * db)
{
    ostringstream   ose;
    int             rc;
    
    if ( vn_template.id == -1 )
    {
        vn_template.id = oid;
    }

    // Insert the template first
    rc = vn_template.update(db);

    if ( rc != 0 )
    {
    	goto error_template;
    }

    // Insert the Virtual Network
    rc = update(db);

    if ( rc != 0 )
    {
    	goto error_update;
    }
         
     //Get the leases
     if (type == VirtualNetwork::RANGED)
     {
    	 string nclass = "";
    	 string naddr  = "";
    	 int    size   = 0;
    	 
         // retrieve specific information from template
         get_template_attribute("NETWORK_ADDRESS",naddr);

         if (naddr.empty())
         {
         	goto error_addr;
         }
         
         get_template_attribute("NETWORK_SIZE",nclass);
             
         if ( nclass == "B" )
         {
        	 size = 65534;   
         }
         else if ( nclass == "C" )
         {
             size = 254;
         }
         else if (!nclass.empty())//Assume its a number
         {
        	 istringstream iss(nclass);
        	 
        	 iss >> size;
         }
        
         if (size == 0)
         {
        	 size = default_size;
         }
         
         leases = new RangedLeases::RangedLeases(db,
                                                 oid,
                                                 size,
                                                 mac_prefix,
                                                 naddr);
     }
     else if(type == VirtualNetwork::FIXED)
     {
    	 vector<const Attribute *>   vector_leases;
         
    	 get_template_attribute("LEASES",vector_leases);  

         leases = new FixedLeases::FixedLeases(db,
                                               oid,
                                               mac_prefix,
                                               vector_leases);
     }
     else
     {
    	 goto error_type;
     }
     
     if (leases == 0)
     { 
    	 goto error_null_leases;
     }
          
     return 0;

error_template:
	ose << "Can not insert in DB template for Virtual Network id " << oid; 
    goto error_common;

error_update:
	ose << "Can not update Virtual Network id " << oid; 
	vn_template.drop(db);
	goto error_common;

error_type:
	ose << "Wrong type of Virtual Network: " << type;
    goto error_leases;

error_addr:
	ose << "Network address is not defined nid: " << oid;
    goto error_leases;

error_null_leases:
    ose << "Error getting Virtual Network leases nid: " << oid;

error_leases:
 	vn_template.drop(db);  
    vn_drop(db);

error_common:
	Nebula::log("VNM", Log::ERROR, ose);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::update(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("<<
        oid << "," <<
        uid << "," <<
        "'" << name << "',"  <<
        type << "," <<
        "'" << bridge << "')";
        
    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::vn_drop(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;

    oss << "DELETE FROM " << table << " WHERE OID=" << oid;
        
    rc = db->exec(oss);

    return rc;    
}


/* ************************************************************************** */
/* Virtual Network :: Misc                                                    */
/* ************************************************************************** */

ostream& operator<<(ostream& os, VirtualNetwork& vn)
{
    os << "NID               : " << vn.oid << endl;
    os << "UID               : " << vn.uid << endl;
    os << "Network Name      : " << vn.name << endl;
    os << "Type              : ";
    if ( vn.type==VirtualNetwork::RANGED )
    {
        os << "Ranged" << endl;
    }
    else
    {
       os << "Fixed" << endl;
    }
    
    os << "Bridge            : " << vn.bridge << endl << endl;

    os << "....: Template :...."  << vn.vn_template << endl << endl;
    
    os << "....: Leases :...."   << endl << *(vn.leases) << endl;
    
    return os;
};
