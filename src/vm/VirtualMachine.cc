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
#include <limits.h>
#include <string.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>  
#include <unistd.h> 

#include <iostream>
#include <sstream>

#include "VirtualMachine.h"
#include "VirtualNetworkPool.h"
#include "Nebula.h"



/* ************************************************************************** */
/* Virtual Machine :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualMachine::VirtualMachine(int id):
        PoolObjectSQL(id),
        uid(-1),
        last_poll(0),
        vm_template(),
        state(INIT),
        lcm_state(LCM_INIT),
        stime(time(0)),
        etime(0),
        deploy_id(""),
        memory(0),
        cpu(0),
        net_tx(0),
        net_rx(0),
        history(0),
        previous_history(0),
        _log(0)
{
}

VirtualMachine::~VirtualMachine()
{
    if ( history != 0 )
    {
        delete history;
    }

    if ( _log != 0 )
    {
        delete _log;
    }
}

/* ************************************************************************** */
/* Virtual Machine :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualMachine::table = "vm_pool";

const char * VirtualMachine::db_names = "(oid,uid,last_poll,template_id,state"
                                        ",lcm_state,stime,etime,deploy_id"
                                        ",memory,cpu,net_tx,net_rx)";

const char * VirtualMachine::db_bootstrap = "CREATE TABLE vm_pool ("
        "oid INTEGER PRIMARY KEY,uid INTEGER,"
        "last_poll INTEGER, template_id INTEGER,state INTEGER,lcm_state INTEGER,"
        "stime INTEGER,etime INTEGER,deploy_id TEXT,memory INTEGER,cpu INTEGER,"
        "net_tx INTEGER,net_rx INTEGER)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::unmarshall(int num, char **names, char ** values)
{
    if ((values[OID] == 0) ||
            (values[UID] == 0) ||
            (values[LAST_POLL] == 0) ||
            (values[TEMPLATE_ID] == 0) ||
            (values[STATE] == 0) ||
            (values[LCM_STATE] == 0) ||
            (values[STIME] == 0) ||
            (values[ETIME] == 0) ||
            (values[MEMORY] == 0) ||
            (values[CPU] == 0) ||
            (values[NET_TX] == 0) ||
            (values[NET_RX] == 0) ||
            (num != LIMIT ))
    {
        return -1;
    }

    oid = atoi(values[OID]);
    uid = atoi(values[UID]);

    last_poll = static_cast<time_t>(atoi(values[LAST_POLL]));

    state     = static_cast<VmState>(atoi(values[STATE]));
    lcm_state = static_cast<LcmState>(atoi(values[LCM_STATE]));

    stime = static_cast<time_t>(atoi(values[STIME]));
    etime = static_cast<time_t>(atoi(values[ETIME]));

    if ( values[DEPLOY_ID] != 0 )
    {
        deploy_id = values[DEPLOY_ID];
    }

    memory = atoi(values[MEMORY]);
    cpu    = atoi(values[CPU]);
    net_tx = atoi(values[NET_TX]);
    net_rx = atoi(values[NET_RX]);

    vm_template.id = atoi(values[TEMPLATE_ID]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" int vm_select_cb (
        void *                  _vm,
        int                     num,
        char **                 values,
        char **                 names)
{
    VirtualMachine *    vm;

    vm = static_cast<VirtualMachine *>(_vm);

    if (vm == 0)
    {
        return -1;
    }

    return vm->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */

int VirtualMachine::select(SqliteDB * db)
{
    ostringstream   oss;
    ostringstream   ose;
    
    int             rc;
    int             boid;
    
    string          filename;
    const char *    nl;
    
    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss,vm_select_cb,(void *) this);


    if ((rc != 0) || (oid != boid ))
    {
        goto error_id;
    }

    //Get the template
    rc = vm_template.select(db);

    if (rc != 0)
    {
        goto error_template;
    }

    //Get the History Records

    history = new History(oid);

    rc = history->select(db);

    if (rc != 0)
    {
        goto error_history;
    }

    if ( history->seq == -1 )
    {
        delete history;

        history = 0;
    }
    else if (history->seq > 0)
    {
    	previous_history = new History(oid,history->seq - 1);
    	
    	rc = previous_history->select(db);
    	
    	if ( rc != 0)
    	{
    		goto error_previous_history;	
    	}
    }

    //Create Log support fo this VM
    
    nl = getenv("ONE_LOCATION");

    if (nl == 0)
    {
        goto error_env;  //no logging support for this VM
    }
        
    oss.str("");
    oss << nl << "/var/" << oid;
    
    mkdir(oss.str().c_str(), 0777);
    chmod(oss.str().c_str(), 0777);
       
    try 
    {
        oss << "/vm.log";
        
        filename = oss.str();

    	_log = new Log(filename,Log::DEBUG);
	}
    catch(exception &e)
    {        
    	_log = 0;
    	
    	goto error_log;
	}

    return 0;

error_log:
error_env:
    return 0;

error_id:
    ose << "Error getting VM id: " << oid;
    log("VMM", Log::ERROR, ose);
    return -1;

error_template:
    ose << "Can not get template for VM id: " << oid;
    log("ONE", Log::ERROR, ose);
    return -1;

error_history:
    ose << "Can not get history for VM id: " << oid;
    log("ONE", Log::ERROR, ose);
    return -1;
    
error_previous_history:
	ose << "Can not get previous history record (seq:" << history->seq 
	    << ") for VM id: " << oid;
    log("ONE", Log::ERROR, ose);
    return -1;    
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::insert(SqliteDB * db)
{                              
    int                  rc;
    string               name;
                               
    //Set a name if the VM has not got one
    
    get_template_attribute("NAME",name);
    
    if ( name.empty() == true )
    {
    	SingleAttribute * 	name_attr;
    	ostringstream		default_name;
    	
    	default_name << "one-" << oid;
    	name = default_name.str();
    	
    	name_attr = new SingleAttribute("NAME",name);
    	
    	vm_template.set(name_attr);
    }  
    
    rc = get_leases();
    
    if ( rc != 0 )
    {
    	goto error_leases;
    }

    // Insert the template first, so we get a valid template ID
    rc = vm_template.insert(db);

    if ( rc != 0 )
    {
    	goto error_template;
    }

    //Insert the VM
    rc = update(db);

    if ( rc != 0 )
    {
    	goto error_update;
    }

    return 0;

error_update:
	Nebula::log("ONE",Log::ERROR, "Can not update VM in the database");
	vm_template.drop(db);
	return -1;

error_template:
	Nebula::log("ONE",Log::ERROR, "Can not insert template in the database");
	release_leases();
	return -1;

error_leases:
	Nebula::log("ONE",Log::ERROR, "Could not get network lease for VM");
	release_leases();
	return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::update(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("<<
        oid << "," <<
        uid << "," <<
        last_poll << "," <<
        vm_template.id << "," <<
        state << "," <<
        lcm_state << "," <<
        stime << "," <<
        etime << "," <<
        "'" << deploy_id << "'," <<
        memory << "," <<
        cpu << "," <<
        net_tx << "," <<
        net_rx << ")";

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::add_history(
	int         				hid,
    string&     				hostname,
    string&     				vm_dir,
    string&     				vmm_mad,
    string&     			 	tm_mad)
{
    ostringstream os;
    int           seq;

    if (history == 0)
    {
        seq = 0;
    }
    else
    {
        seq = history->seq + 1;
                
        if (previous_history != 0)
        {
        	delete previous_history;
        }

        previous_history = history;
    }

    history = new History(oid,seq,hid,hostname,vm_dir,vmm_mad,tm_mad);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
	
void VirtualMachine::cp_history()
{
	History * htmp;
	
	if (history == 0)
	{
		return;
	}
		
	htmp = new History(oid,
			history->seq + 1,
			history->hid,
			history->hostname,
			history->vm_dir,
			history->vmm_mad_name,
			history->tm_mad_name);
	
	if ( previous_history != 0 )
	{
		delete previous_history;
	}
	
	previous_history = history;

	history = htmp; 
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
	
void VirtualMachine::cp_previous_history()
{
	History * htmp;

	if ( previous_history == 0 || history == 0)
	{
		return;
	}
	
	htmp = new History(oid,
			history->seq + 1,
			previous_history->hid,
			previous_history->hostname,
			previous_history->vm_dir,
			previous_history->vmm_mad_name,
			previous_history->tm_mad_name);
	
	delete previous_history;
	
	previous_history = history;
	
	history = htmp;	
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::get_requirements (int& cpu, int& memory, int& disk)
{
    string          scpu;
    istringstream   iss;
    float           fcpu;
    
    get_template_attribute("MEMORY",memory);
    get_template_attribute("CPU",scpu);

    if ((memory == 0) || (scpu==""))
    {
        cpu    = 0;
        memory = 0;
        disk   = 0;
        
        return;
    }

    iss.str(scpu);
    iss >> fcpu;

    cpu    = (int) (fcpu * 100);//now in 100%
    memory = memory * 1024;     //now in bytes
    disk   = 0;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::get_leases()
{
    int                        num_nics, rc;
    vector<Attribute  * >      nics;
    VirtualNetworkPool       * vnpool; 
    VirtualNetwork           * vn;
    VectorAttribute          * nic;
    map<string,string>         new_nic;
    
    string                     ip;
    string                     mac;
    string                     bridge;
    string                     network;

    ostringstream              vnid;

    // Set the networking attributes.
    
    Nebula& nd = Nebula::instance();
    vnpool     = nd.get_vnpool();
    
    num_nics   = vm_template.get("NIC",nics);
    
    for(int i=0; i<num_nics; i++,vnid.str(""))
    {        
   	 	nic = dynamic_cast<VectorAttribute * >(nics[i]);

        if ( nic == 0 )
        {
            continue;
        }
    
        network = nic->vector_value("NETWORK");
    
        if ( network.empty() )
        {
            continue;
        }
    
        vn = vnpool->get(network,true);
        
        if ( vn == 0 )
        {
            continue;
        }
        
        ip = nic->vector_value("IP");
        
        if (ip.empty())
        {
        	rc = vn->get_lease(oid, ip, mac, bridge);
        }
        else
        {
        	rc = vn->set_lease(oid, ip, mac, bridge);
        }
        
        vn->unlock();    
        
        if ( rc != 0 )
        {
            return -1;
        }

        vnid << vn->get_oid();

        new_nic.insert(make_pair("NETWORK",network));
        new_nic.insert(make_pair("MAC"    ,mac));
        new_nic.insert(make_pair("BRIDGE" ,bridge));
        new_nic.insert(make_pair("VNID"   ,vnid.str()));
        new_nic.insert(make_pair("IP"     ,ip));
        
        nic->replace(new_nic);
        
        new_nic.erase(new_nic.begin(),new_nic.end());
    }
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachine::release_leases()
{
    Nebula& nd = Nebula::instance();
    
    VirtualNetworkPool * vnpool = nd.get_vnpool();

    string                        vnid;
    string                        ip;
    int                           num_nics;

    vector<Attribute const  * >   nics;
    VirtualNetwork          *     vn;    

    num_nics   = get_template_attribute("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        VectorAttribute const *  nic = dynamic_cast<VectorAttribute const * >(nics[i]);

        if ( nic == 0 )
        {
            continue;
        }

        vnid = nic->vector_value("VNID");

        if ( vnid.empty() )
        {
            continue;
        }
        
        ip   = nic->vector_value("IP");

        if ( ip.empty() )
        {
            continue;
        }
        
        vn = vnpool->get(atoi(vnid.c_str()),true);
        
        if ( vn == 0 )
        {
            continue;
        }

        vn->release_lease(ip);   
        vn->unlock();      
    }
}

/* ************************************************************************** */
/* Virtual Machine :: Misc                                                    */
/* ************************************************************************** */

ostream& operator<<(ostream& os, VirtualMachine& vm)
{
    os << "VID               : " << vm.oid << endl;
    os << "UID               : " << vm.uid << endl;
    os << "STATE             : " << vm.state << endl;
    os << "LCM STATE         : " << vm.lcm_state << endl;
    os << "DEPLOY ID         : " << vm.deploy_id << endl;
    os << "MEMORY            : " << vm.memory << endl; 
    os << "CPU               : " << vm.cpu << endl;
    os << "LAST POLL         : " << vm.last_poll << endl;  
    os << "START TIME        : " << vm.stime << endl;  
    os << "STOP TIME         : " << vm.etime << endl;  
    os << "NET TX            : " << vm.net_tx << endl;  
    os << "NET RX            : " << vm.net_rx << endl;

    os << "Template" << endl << vm.vm_template << endl;
    
    return os;
};
