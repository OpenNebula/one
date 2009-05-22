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


#include "vm_var_syntax.h"

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
    Nebula& 		nd = Nebula::instance();

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

    //Create support directory fo this VM

    oss.str("");
    oss << nd.get_var_location() << oid;

    mkdir(oss.str().c_str(), 0777);
    chmod(oss.str().c_str(), 0777);

    //Create Log support fo this VM

    try
    {
    	_log = new Log(nd.get_vm_log_filename(oid),Log::DEBUG);
	}
    catch(exception &e)
    {
    	ose << "Error creating log: " << e.what();
    	Nebula::log("ONE",Log::ERROR, ose);

    	_log = 0;
	}

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
    int    rc;
    string name;

    SingleAttribute *   attr;
    string              value;
    ostringstream       oss;

    // ------------------------------------------------------------------------
    // Set a name if the VM has not got one and VM_ID
    // ------------------------------------------------------------------------

    get_template_attribute("NAME",name);

    if ( name.empty() == true )
    {
        oss << "one-" << oid;
        value = oss.str();

        attr = new SingleAttribute("NAME",value);

        vm_template.set(attr);
    }

    oss.str("");

    oss << oid;
    value = oss.str();

    attr = new SingleAttribute("VMID",value);

    vm_template.set(attr);

    // ------------------------------------------------------------------------
    // Get network leases
    // ------------------------------------------------------------------------

    rc = get_network_leases();

    if ( rc != 0 )
    {
    	goto error_leases;
    }

    // ------------------------------------------------------------------------
    // Insert the template first, so we get a valid template ID. Then the VM
    // ------------------------------------------------------------------------

    rc = vm_template.insert(db);

    if ( rc != 0 )
    {
        goto error_template;
    }

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
	release_network_leases();
	return -1;

error_leases:
	Nebula::log("ONE",Log::ERROR, "Could not get network lease for VM");
	release_network_leases();
	return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::update(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;

    char * sql_deploy_id = sqlite3_mprintf("%q",deploy_id.c_str());

    if ( sql_deploy_id == 0 )
    {
        return -1;
    }
    
    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("<<
        oid << "," <<
        uid << "," <<
        last_poll << "," <<
        vm_template.id << "," <<
        state << "," <<
        lcm_state << "," <<
        stime << "," <<
        etime << "," <<
        "'" << sql_deploy_id << "'," <<
        memory << "," <<
        cpu << "," <<
        net_tx << "," <<
        net_rx << ")";

    sqlite3_free(sql_deploy_id);

    rc = db->exec(oss);

    return rc;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" int vm_dump_cb (
        void *                  _oss,
        int                     num,
        char **                 values,
        char **                 names)
{
    ostringstream * oss;
    ostringstream dbg;
    
    oss = static_cast<ostringstream *>(_oss);

    if (oss == 0)
    {
        return -1;
    }

    if ((!values[VirtualMachine::OID]) ||
        (!values[VirtualMachine::UID]) ||
        (!values[VirtualMachine::LAST_POLL]) ||
        (!values[VirtualMachine::TEMPLATE_ID]) ||
        (!values[VirtualMachine::STATE]) ||
        (!values[VirtualMachine::LCM_STATE]) ||
        (!values[VirtualMachine::STIME]) ||
        (!values[VirtualMachine::ETIME]) ||
        (!values[VirtualMachine::MEMORY]) ||
        (!values[VirtualMachine::CPU]) ||
        (!values[VirtualMachine::NET_TX]) ||
        (!values[VirtualMachine::NET_RX]) ||
        (num != VirtualMachine::LIMIT+1 ))
    {
        return -1;
    }

    *oss << "<VM>"
         << "<OID>" << atoi(values[VirtualMachine::OID]) << "</OID>"
         << "<UID>" << atoi(values[VirtualMachine::UID]) << "</UID>"
         << "<LAST_POLL>" 
			<< static_cast<time_t>(atoi(values[VirtualMachine::LAST_POLL]))
            << "</LAST_PLOL>"
         << "<STATE>" << atoi(values[VirtualMachine::STATE]) << "</STATE>"
         << "<LCM_STATE>" 
			<< atoi(values[VirtualMachine::LCM_STATE]) 
			<< "</LCM_STATE>"
         << "<STIME>" 
			<< static_cast<time_t>(atoi(values[VirtualMachine::STIME])) 
			<< "</STIME>"
         << "<ETIME>" 
			<< static_cast<time_t>(atoi(values[VirtualMachine::ETIME])) 
			<< "</ETIME>"
         << "<MEMORY>" << atoi(values[VirtualMachine::MEMORY]) << "</MEMORY>"
         << "<CPU>"    << atoi(values[VirtualMachine::CPU])    << "</CPU>"
         << "<NET_TX>" << atoi(values[VirtualMachine::NET_TX]) << "</NET_TX>"
         << "<NET_RX>" << atoi(values[VirtualMachine::NET_RX]) << "</NET_RX>";

	if ( values[VirtualMachine::DEPLOY_ID] != 0 )
    {
   		*oss << "<DEPLOY_ID>" << values[VirtualMachine::DEPLOY_ID] 
			 << "</DEPLOY_ID>";
    }

    if (values[VirtualMachine::LIMIT] != 0)
    {
    	*oss << "<HOSTNAME>" << values[VirtualMachine::LIMIT] << "</HOSTNAME>";
    }
    
    *oss<< "</VM>";

    return 0;
};

int VirtualMachine::dump(SqliteDB * db, ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    cmd << "SELECT " << VirtualMachine::table << ".*, "
        << History::table << ".host_name FROM " << VirtualMachine::table
        << " LEFT OUTER JOIN (SELECT vid, host_name, MAX(seq) FROM "
        << History::table << " GROUP BY vid) AS " << History::table
        << " ON " << VirtualMachine::table << ".oid = "
        << History::table << ".vid";

    if ( !where.empty() )
    {
        cmd << " WHERE" << where;
    }
    
    rc = db->exec(cmd,vm_dump_cb,(void *) &oss);

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

int VirtualMachine::get_network_leases()
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
            return -1;
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

void VirtualMachine::release_network_leases()
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
        VectorAttribute const *  nic = 
            dynamic_cast<VectorAttribute const * >(nics[i]);

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::generate_context(string &files)
{
    ofstream file;

    vector<const Attribute*> attrs;
    const VectorAttribute *  context;

    map<string, string>::const_iterator it;

    files = "";

    if ( history == 0 )
        return -1;

    if ( get_template_attribute("CONTEXT",attrs) != 1 )
    {
        log("VM", Log::INFO, "Virtual Machine has no context");
        return 0;
    }

    file.open(history->context_file.c_str(),ios::out);

    if (file.fail() == true)
    {
        ostringstream oss;

        oss << "Could not open context file: " << history->context_file;
        log("VM", Log::ERROR, oss);
        return -1;
    }

    context = dynamic_cast<const VectorAttribute *>(attrs[0]);

    if (context == 0)
    {
        file.close();
        return -1;
    }

    files = context->vector_value("FILES");

    const map<string, string> values = context->value();

    file << "# Context variables generated by OpenNebula\n";

    for (it=values.begin(); it != values.end(); it++ )
    {
        file << it->first <<"=\""<< it->second << "\"" << endl;
    }

    file.close();

    return 1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_template_attribute(const string& attribute,
                                             string&       parsed)
{
    int rc;
    char * err = 0;
    
    rc = parse_attribute(this,-1,attribute,parsed,&err);
    
    if ( rc != 0 && err != 0 )
    {
        ostringstream oss;
        
        oss << "Error parsing: " << attribute << ". " << err;
        log("VM",Log::ERROR,oss);
    }
    
    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

pthread_mutex_t VirtualMachine::lex_mutex = PTHREAD_MUTEX_INITIALIZER;

extern "C"
{    
    typedef struct yy_buffer_state * YY_BUFFER_STATE;

    int vm_var_parse (VirtualMachine * vm,
                      int              vm_id,                  
                      ostringstream *  parsed,
                      char **          errmsg);
 
    int vm_var_lex_destroy();

    YY_BUFFER_STATE vm_var__scan_string(const char * str);

    void vm_var__delete_buffer(YY_BUFFER_STATE);    
}

/* -------------------------------------------------------------------------- */

int VirtualMachine::parse_attribute(VirtualMachine * vm,
                                    int              vm_id,
                                    const string&    attribute,
                                    string&          parsed,
                                    char **          error_msg)
{
    YY_BUFFER_STATE  str_buffer = 0;
    const char *     str;
    int              rc;
    ostringstream    oss_parsed("DEBUG");

    *error_msg = 0;

    pthread_mutex_lock(&lex_mutex);

    str        = attribute.c_str();
    str_buffer = vm_var__scan_string(str);

    if (str_buffer == 0)
    {
        goto error_yy;
    }

    rc = vm_var_parse(vm,vm_id,&oss_parsed,error_msg);

    vm_var__delete_buffer(str_buffer);

    vm_var_lex_destroy();

    pthread_mutex_unlock(&lex_mutex);

    parsed = oss_parsed.str();

    return rc;

error_yy:
    *error_msg=strdup("Error setting scan buffer");
    pthread_mutex_unlock(&lex_mutex);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, const VirtualMachine& vm)
{
	string vm_str;
	
	os << vm.to_str(vm_str);
	
    return os;
};

/* -------------------------------------------------------------------------- */

string& VirtualMachine::to_xml(string& xml) const
{
	string template_xml;
	ostringstream	oss;
	
	oss << "<VM>"
	    << "<OID>"       << oid       << "</OID>"
	    << "<UID>"       << uid       << "</UID>"
	    << "<LAST_POLL>" << last_poll << "</LAST_POLL>"
	    << "<STATE>"     << state     << "</STATE>"
	    << "<LCM_STATE>" << lcm_state << "</LCM_STATE>"
	    << "<STIME>"     << stime     << "</STIME>"
	    << "<ETIME>"     << etime     << "</ETIME>"
	    << "<MEMORY>"    << memory    << "</MEMORY>"
	    << "<CPU>"       << cpu       << "</CPU>"
	    << "<NET_TX>"    << net_tx    << "</NET_TX>"
	    << "<NET_RX>"    << net_rx    << "</NET_RX>";

	if ( !deploy_id.empty() != 0 )
	{
		oss << "<DEPLOY_ID>" << deploy_id << "</DEPLOY_ID>";
	}
	
	oss << vm_template.to_xml(template_xml);
	oss << "</VM>";
	
	xml = oss.str();
	
	return xml;
}

/* -------------------------------------------------------------------------- */

string& VirtualMachine::to_str(string& str) const
{
	string template_xml;
	ostringstream	oss;
	
	oss<< "VID               : " << oid << endl
       << "UID               : " << uid << endl
       << "STATE             : " << state << endl
       << "LCM STATE         : " << lcm_state << endl
       << "DEPLOY ID         : " << deploy_id << endl
       << "MEMORY            : " << memory << endl
       << "CPU               : " << cpu << endl
       << "LAST POLL         : " << last_poll << endl
       << "START TIME        : " << stime << endl
       << "STOP TIME         : " << etime << endl
       << "NET TX            : " << net_tx << endl
       << "NET RX            : " << net_rx << endl
       << "Template" << endl << vm_template << endl;
    	
	str = oss.str();
	
	return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
