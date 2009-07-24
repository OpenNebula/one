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

#ifndef VIRTUAL_MACHINE_H_
#define VIRTUAL_MACHINE_H_

#include "VirtualMachineTemplate.h"
#include "PoolSQL.h"
#include "History.h"
#include "Log.h"

#include <time.h>
#include <sstream>

using namespace std;

extern "C" int vm_select_cb (void * _vm, int num,char ** values, char ** names);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The Virtual Machine class. It represents a VM...
 */
class VirtualMachine : public PoolObjectSQL
{
public:
    // -------------------------------------------------------------------------
	// VM States
    // -------------------------------------------------------------------------   

    /**
     *  Global Virtual Machine state
     */
    enum VmState
    {
        INIT      = 0,
        PENDING   = 1,
        HOLD      = 2,
        ACTIVE    = 3,
        STOPPED   = 4,
        SUSPENDED = 5,
        DONE      = 6,
        FAILED    = 7
    };

    /**
     *  Virtual Machine state associated to the Life-cycle Manager 
     */
    enum LcmState
    {
        LCM_INIT       = 0,
        PROLOG         = 1,
        BOOT           = 2,
        RUNNING        = 3,
        MIGRATE        = 4,
        SAVE_STOP      = 5,
        SAVE_SUSPEND   = 6,
        SAVE_MIGRATE   = 7,
        PROLOG_MIGRATE = 8,
        PROLOG_RESUME  = 9,
        EPILOG_STOP    = 10,
        EPILOG         = 11,
        SHUTDOWN       = 12,
        CANCEL         = 13
    };

    // -------------------------------------------------------------------------
    // Log & Print
    // -------------------------------------------------------------------------   

    /**
     *  writes a log message in vm.log. The class lock should be locked and
     *  the VM MUST BE obtained through the VirtualMachinePool get() method.  
     */
    void log(
        const char *            module,
        const Log::MessageType  type,
        const ostringstream&    message) const
    {
        if (_log != 0)
        {
            _log->log(module,type,message);
        }
    };
     
    /**
     *  writes a log message in vm.log. The class lock should be locked and
     *  the VM MUST BE obtained through the VirtualMachinePool get() method.  
     */
    void log(
        const char *            module,
        const Log::MessageType  type,
        const char *            message) const 
    {
        if (_log != 0)
        {
            _log->log(module,type,message);
        }
    };
         
    /**
     *  Function to write a Virtual Machine in an output stream
     */
    friend ostream& operator<<(ostream& os, VirtualMachine& vm);

    // ------------------------------------------------------------------------
    // Dynamic Info
    // ------------------------------------------------------------------------    

    /**
     *  Updates VM dynamic information (id).
     *   @param _deploy_id the VMM driver specific id
     */
    void update_info(
        const string& _deploy_id)
    {
        deploy_id = _deploy_id;
    };

    /**
     *  Updates VM dynamic information (usage counters).
     *   @param _memory used by the VM (total)
     *   @param _cpu used by the VM (rate)
     *   @param _net_tx transmitted bytes (total)
     *   @param _net_tx received bytes (total)
     */
    void update_info(
        const int _memory,
        const int _cpu,
        const int _net_tx,
        const int _net_rx)
    {
        if (_memory != -1)
        {
            memory = _memory;
        }

        if (_cpu != -1)
        {
            cpu    = _cpu;
        }

        if (_net_tx != -1)
        {
            net_tx = _net_tx;
        }

        if (_net_rx != -1)
        {
            net_rx = _net_rx;
        }
    };

    /**
     *  Returns the deployment ID
     *    @return the VMM driver specific ID
     */
    const string& get_deploy_id() const
    {
        return deploy_id;
    };

    /**
     *  Sets the VM exit time
     *    @param _et VM exit time (when it arraived DONE/FAILED states)
     */
    void set_exit_time(time_t et)
    {
        etime = et;
    };

    // ------------------------------------------------------------------------
    // History
    // ------------------------------------------------------------------------    
    /**
     *  Adds a new history record an writes it in the database.
     */
    void add_history(
        int         				hid,
        string&     				hostname,
        string&     				vm_dir,
        string&     				vmm_mad,
        string&     			 	tm_mad);

    /**
     *  Duplicates the last history record. Only the host related fields are
     *  affected (i.e. no counter is copied nor initialized).
     *    @param reason explaining the new addition.
     */
    void cp_history();

    /**
     *  Duplicates the previous history record. Only the host related fields are
     *  affected (i.e. no counter is copied nor initialized).
     *    @param reason explaining the new addition.
     */
    void cp_previous_history();

    /**
     *  Checks if the VM has a valid history record. This function
     *  MUST be called before using any history related function.
     *    @return true if the VM has a record
     */ 
    bool hasHistory() const
    {
        return (history!=0);
    };

    /**
     *  Checks if the VM has a valid previous history record. This function
     *  MUST be called before using any previous_history related function.
     *    @return true if the VM has a previous record
     */ 
    bool hasPreviousHistory() const
    {
        return (previous_history!=0);
    };
    /**
     *  Returns the VMM driver name for the current host. The hasHistory()
     *  function MUST be called before this one.
     *    @return the VMM mad name
     */ 
    const string & get_vmm_mad() const
    {
        return history->vmm_mad_name;
    };

    /**
     *  Returns the TM driver name for the current host. The hasHistory()
     *  function MUST be called before this one.
     *    @return the TM mad name
     */ 
    const string & get_tm_mad() const
    {
        return history->tm_mad_name;
    };

    /**
     *  Returns the transfer filename. The transfer file is in the form: 
     *  		$ONE_LOCATION/var/$VM_ID/transfer.$SEQ
     *  or, in case that OpenNebula is installed in root
     *  		/var/lib/one/$VM_ID/transfer.$SEQ 
     *  The hasHistory() function MUST be called before this one.
     *    @return the transfer filename
     */ 
    const string & get_transfer_file() const
    {
        return history->transfer_file;
    };

    /**
     *  Returns the deployment filename. The deployment file is in the form:
     *  		$ONE_LOCATION/var/$VM_ID/deployment.$SEQ
     *  or, in case that OpenNebula is installed in root
     *  		/var/lib/one/$VM_ID/deployment.$SEQ
     *  The hasHistory() function MUST be called before this one.
     *    @return the deployment filename
     */ 
    const string & get_deployment_file() const
    {
        return history->deployment_file;
    };
    
    /**
     *  Returns the remote deployment filename. The file is in the form:
     *  		$VM_DIR/$VM_ID/images/deployment.$SEQ 
     *  The hasHistory() function MUST be called before this one.
     *    @return the deployment filename
     */ 
    const string & get_remote_deployment_file() const
    {
        return history->rdeployment_file;
    };    
        
    /**
     *  Returns the checkpoint filename for the current host. The checkpoint file 
     *  is in the form: 
     *  		$VM_DIR/$VM_ID/images/checkpoint  
     *  The hasHistory() function MUST be called before this one.
     *    @return the checkpoint filename
     */ 
    const string & get_checkpoint_file() const
    {
        return history->checkpoint_file;
    };
    
    /**
     *  Returns the remote VM directory. The VM remote dir is in the form: 
     *  		$VM_DIR/$VM_ID/
     *  or, in case that OpenNebula is installed in root
     *  		/var/lib/one/$VM_ID/
     *  The hasHistory() function MUST be called before this one.
     *    @return the remote directory
     */ 
    const string & get_remote_dir() const
    {
        return history->vm_rhome;
    };
    
    /**
     *  Returns the local VM directory. The VM local dir is in the form: 
     *  		$ONE_LOCATION/var/$VM_ID/  
     *  The hasHistory() function MUST be called before this one.
     *    @return the remote directory
     */ 
    const string & get_local_dir() const
    {
        return history->vm_lhome;
    };    

    /**
     *  Returns the hostname for the current host. The hasHistory()
     *  function MUST be called before this one.
     *    @return the hostname
     */ 
    const string & get_hostname() const
    {
        return history->hostname;
    };
    
    /**
     *  Returns the hostname for the previous host. The hasPreviousHistory()
     *  function MUST be called before this one.
     *    @return the hostname
     */ 
    const string & get_previous_hostname() const
    {
        return previous_history->hostname;
    };
    
    /**
     *  Returns the reason that originated the VM migration in the previous host
     *    @return the migration reason to leave this host
     */
    const History::MigrationReason get_previous_reason() const
    {
        return previous_history->reason;
    };    
    
    /**
     *  Get host id where the VM is or is going to execute. The hasHistory()
     *  function MUST be called before this one.
     */
    int get_hid()
    {
        return history->hid;
    }

    /**
     *  Get host id where the VM was executing. The hasPreviousHistory()
     *  function MUST be called before this one.
     */
    int get_previous_hid()
    {
        return previous_history->hid;
    }
    
    /**
     *  Sets start time of a VM.
     *    @param _stime time when the VM started
     */
    void set_stime(time_t _stime)
    {
        history->stime=_stime;
    };

    /**
     *  Sets end time of a VM.
     *    @param _etime time when the VM finished
     */
    void set_etime(time_t _etime)
    {
        history->etime=_etime;
    };

    /**
     *  Sets end time of a VM in the previous Host.
     *    @param _etime time when the VM finished
     */
    void set_previous_etime(time_t _etime)
    {
        previous_history->etime=_etime;
    };
    
    /**
     *  Sets start time of VM prolog.
     *    @param _stime time when the prolog started
     */
    void set_prolog_stime(time_t _stime)
    {
        history->prolog_stime=_stime;
    };

    /**
     *  Sets end time of VM prolog.
     *    @param _etime time when the prolog finished
     */
    void set_prolog_etime(time_t _etime)
    {
        history->prolog_etime=_etime;
    };

    /**
     *  Sets start time of VM running state.
     *    @param _stime time when the running state started
     */
    void set_running_stime(time_t _stime)
    {
        history->running_stime=_stime;
    };

    /**
     *  Sets end time of VM running state.
     *    @param _etime time when the running state finished
     */
    void set_running_etime(time_t _etime)
    {
        history->running_etime=_etime;
    };

    /**
     *  Sets end time of VM running state in the previous host.
     *    @param _etime time when the running state finished
     */
    void set_previous_running_etime(time_t _etime)
    {
        previous_history->running_etime=_etime;
    };
    
    /**
     *  Sets start time of VM epilog.
     *    @param _stime time when the epilog started
     */
    void set_epilog_stime(time_t _stime)
    {
        history->epilog_stime=_stime;
    };

    /**
     *  Sets end time of VM epilog.
     *    @param _etime time when the epilog finished
     */
    void set_epilog_etime(time_t _etime)
    {
        history->epilog_etime=_etime;
    };

    /**
     *  Sets the reason that originated the VM migration
     *    @param _reason migration reason to leave this host
     */
    void set_reason(History::MigrationReason _reason)
    {
        history->reason=_reason;
    };
    
    /**
     *  Sets the reason that originated the VM migration in the previous host
     *    @param _reason migration reason to leave this host
     */
    void set_previous_reason(History::MigrationReason _reason)
    {
        previous_history->reason=_reason;
    };    

    // ------------------------------------------------------------------------
    // Template
    // ------------------------------------------------------------------------    

    /**
     *  Gets the values of a template attribute
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    int get_template_attribute(
        string& name, 
        vector<const Attribute*>& values) const
    {
        return vm_template.get(name,values);
    };

    /**
     *  Gets the values of a template attribute
     *    @param name of the attribute
     *    @param values of the attribute
     *    @return the number of values
     */
    int get_template_attribute(
        const char *name,
        vector<const Attribute*>& values) const
    {
        string str=name;
        return vm_template.get(str,values);
    };

    /**
     *  Gets a string based VM attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined or
     *    not a single attribute  
     */
    void get_template_attribute(
        const char *    name, 
        string&         value) const
    {
        string str=name;
        vm_template.get(str,value);           
    }        
    
    /**
     *  Gets an int based VM attribute (single)
     *    @param name of the attribute
     *    @param value of the attribute (an int), will be 0 if not defined or
     *    not a single attribute   
     */
    void get_template_attribute(
        const char *    name, 
        int&            value) const
    {
        string str=name;
        vm_template.get(str,value);        
    }
    
    // ------------------------------------------------------------------------
    // States
    // ------------------------------------------------------------------------    

    /**
     *  Returns the VM state (Dispatch Manager)
     *    @return the VM state
     */
    VmState get_state() const
    {
        return state;
    };

    /**
     *  Returns the VM state (life-cycle Manager)
     *    @return the VM state
     */
    LcmState get_lcm_state() const
    {
        return lcm_state;
    };

    /**
     *  Sets VM state
     *    @param s state
     */
    void set_state(VmState s)
    {
        state = s;
    };

    /**
     *  Sets VM LCM state
     *    @param s state
     */
    void set_state(LcmState s)
    {
        lcm_state = s;
    };
    
    /**
     *  Gets the user id of the owner of this VM
     *    @return the VM uid
     */
    int get_uid() const
    {
        return uid;
    };
    

    // ------------------------------------------------------------------------
    // Timers
    // ------------------------------------------------------------------------    
    /**
     *  Gets time from last information polling.
     *    @return time of last poll (epoch) or 0 if never polled
     */
    time_t get_last_poll() const
    {
        return last_poll;
    };
    
    /**
     *  Sets time of last information polling.
     *    @param poll time in epoch, normally time(0)
     */
    void set_last_poll(time_t poll)
    {
        last_poll = poll;
    };
    
    /**
     *  Get the VM physical requirements for the host.
     *    @param cpu
     *    @param memory
     *    @param disk 
     */
    void get_requirements (int& cpu, int& memory, int& disk);
    
    // ------------------------------------------------------------------------
    // Leases
    // ------------------------------------------------------------------------
    /**
     *  Get all network leases for this Virtual Machine
     *  @return 0 if success
     */
    int get_leases();
            
    /**
     *  Releases all network leases taken by this Virtual Machine
     */
    void release_leases();
        
private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualMachinePool;

    friend int vm_select_cb (
        void *  _vm,
        int     num,
        char ** values,
        char ** names);

    // *************************************************************************
    // Virtual Machine Attributes
    // *************************************************************************
    
    // -------------------------------------------------------------------------
    // Identification variables
    // -------------------------------------------------------------------------
    
    /**
     *  User (owner) id
     */
    int         uid;

    // -------------------------------------------------------------------------
    // VM Scheduling & Managing Information
    // ------------------------------------------------------------------------- 
    /**
     *  Last time (in epoch) that the VM was polled to get its status
     */
    time_t      last_poll;
    
    // -------------------------------------------------------------------------
    // Virtual Machine Description
    // -------------------------------------------------------------------------
    /**
     *  The Virtual Machine template, holds the VM attributes.
     */
    VirtualMachineTemplate  vm_template;

    // Dynamic state of the Virtual Machine

    /**
     *  The state of the virtual machine.
     */
    VmState     state;

    /**
     *  The state of the virtual machine (in the Life-cycle Manager).
     */
    LcmState    lcm_state;

    /**
     *  Start time, the VM enter the nebula system (in epoch)
     */
    time_t      stime;

    /**
     *  Exit time, the VM leave the nebula system (in epoch)
     */
    time_t      etime;

    /**
     *  Deployment specific identification string, as returned by the VM driver
     */
    string      deploy_id;

    /**
     *  Memory in Megabytes used by the VM
     */
    int         memory;

    /**
     *  CPU usage (percent)
     */
    int         cpu;

    /**
     *  Network usage, transmitted Kilobytes
     */
    int         net_tx;

    /**
     *  Network usage, received Kilobytes
     */
    int         net_rx;

    /**
     *  History record, for the current host
     */
    History *   history;

    /**
     *  History record, for the previous host
     */
    History *   previous_history;
    
    // -------------------------------------------------------------------------
    // Logging
    // -------------------------------------------------------------------------

    /**
     *  Log class for the virtual machine, it writes log messages in
     *  		$ONE_LOCATION/var/$VID/vm.log
     *  or, in case that OpenNebula is installed in root
     *  		/var/log/one/$VM_ID.log
     */
    Log *       _log;
    
    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Bootstraps the database table(s) associated to the VirtualMachine
     */
    static void bootstrap(SqliteDB * db)
    {
        db->exec(VirtualMachine::db_bootstrap);

        db->exec(VirtualMachineTemplate::db_bootstrap);

        db->exec(History::db_bootstrap);
    };
    
    /**
     *  Function to unmarshall a VM object, an associated classes.
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int unmarshall(int num, char **names, char ** values);
    
    /**
     *  Updates the VM history record
     *    @param db pointer to the db
     *    @return 0 on success 
     */
    int update_history(SqliteDB * db)
    {
        if ( history != 0 )
        {
            return history->insert(db);
        }
        else
            return -1;
    };

    /**
     *  Updates the previous history record
     *    @param db pointer to the db
     *    @return 0 on success 
     */
    int update_previous_history(SqliteDB * db)
    {
        if ( previous_history != 0 )
        {
            return previous_history->insert(db);
        }
        else
            return -1;
    };
    
    /**
     *  Updates the template of a VM, adding a new attribute (replacing it if 
     *  already defined), the vm's mutex SHOULD be locked
     *    @param vm pointer to the virtual machine object
     *    @param name of the new attribute
     *    @param value of the new attribute
     *    @return 0 on success
     */
    int update_template_attribute(
    	SqliteDB * 			db,
        string&			 	name,
        string&			 	value)
    {
    	return vm_template.replace_attribute(db,name,value);
    }    
    
protected:
	
    //**************************************************************************
    // Constructor
    //**************************************************************************
    
    VirtualMachine(int id=-1);

    virtual ~VirtualMachine();
    
    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

	enum ColNames
    {
        OID             = 0,
        UID             = 1,
        LAST_POLL       = 2,
        TEMPLATE_ID     = 3,
        STATE           = 4,
        LCM_STATE       = 5,
        STIME           = 6,
        ETIME           = 7,
        DEPLOY_ID       = 8,
        MEMORY          = 9,
        CPU             = 10,
        NET_TX          = 11,
        NET_RX          = 12,
        LIMIT           = 13
    };

    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;
    
    /**
     *  Reads the Virtual Machine (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqliteDB * db);

    /**
     *  Writes the Virtual Machine and its associated template in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int insert(SqliteDB * db);

    /**
     *  Writes/updates the Virtual Machine data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int update(SqliteDB * db);
    
    /**
     * Deletes a VM from the database and all its associated information:
     *   - History records
     *   - VM template
     *   @param db pointer to the db
     *   @return 0 on success
     */
    virtual int drop(SqliteDB * db)
    { 
    	int rc;
    	
    	rc = vm_template.drop(db);
    	
    	if ( history != 0 )
    	{
    		rc += history->drop(db);
    	}
    	
    	return rc;
    }
};

#endif /*VIRTUAL_MACHINE_H_*/
