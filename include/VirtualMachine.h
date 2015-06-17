/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include "Image.h"
#include "Log.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Quotas.h"

#include <time.h>
#include <set>
#include <sstream>

using namespace std;

class AuthRequest;
class Snapshots;

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
        INIT       = 0,
        PENDING    = 1,
        HOLD       = 2,
        ACTIVE     = 3,
        STOPPED    = 4,
        SUSPENDED  = 5,
        DONE       = 6,
        //FAILED   = 7,
        POWEROFF   = 8,
        UNDEPLOYED = 9
    };

    static int vm_state_from_str(string& st, VmState& state)
    {
        one_util::toupper(st);

        if ( st == "INIT" ) { state = INIT; }
        else if ( st == "PENDING" ) { state = PENDING; }
        else if ( st == "HOLD" ) { state = HOLD; }
        else if ( st == "ACTIVE" ) { state = ACTIVE; }
        else if ( st == "STOPPED" ) { state = STOPPED; }
        else if ( st == "SUSPENDED" ) { state = SUSPENDED; }
        else if ( st == "DONE" ) { state = DONE; }
        else if ( st == "POWEROFF" ) { state = POWEROFF; }
        else if ( st == "UNDEPLOYED" ) { state = UNDEPLOYED; }
        else {return -1;}

        return 0;
    }

    static string& vm_state_to_str(string& st, VmState state)
    {
        switch (state)
        {
            case INIT      : st = "INIT"; break;
            case PENDING   : st = "PENDING"; break;
            case HOLD      : st = "HOLD"; break;
            case ACTIVE    : st = "ACTIVE"; break;
            case STOPPED   : st = "STOPPED"; break;
            case SUSPENDED : st = "SUSPENDED"; break;
            case DONE      : st = "DONE"; break;
            case POWEROFF  : st = "POWEROFF"; break;
            case UNDEPLOYED: st = "UNDEPLOYED"; break;
        }

        return st;
    }

    /**
     *  Virtual Machine state associated to the Life-cycle Manager
     */
    enum LcmState
    {
        LCM_INIT            = 0,
        PROLOG              = 1,
        BOOT                = 2,
        RUNNING             = 3,
        MIGRATE             = 4,
        SAVE_STOP           = 5,
        SAVE_SUSPEND        = 6,
        SAVE_MIGRATE        = 7,
        PROLOG_MIGRATE      = 8,
        PROLOG_RESUME       = 9,
        EPILOG_STOP         = 10,
        EPILOG              = 11,
        SHUTDOWN            = 12,
        //CANCEL            = 13,
        //FAILURE           = 14,
        CLEANUP_RESUBMIT    = 15,
        UNKNOWN             = 16,
        HOTPLUG             = 17,
        SHUTDOWN_POWEROFF   = 18,
        BOOT_UNKNOWN        = 19,
        BOOT_POWEROFF       = 20,
        BOOT_SUSPENDED      = 21,
        BOOT_STOPPED        = 22,
        CLEANUP_DELETE      = 23,
        HOTPLUG_SNAPSHOT    = 24,
        HOTPLUG_NIC         = 25,
        HOTPLUG_SAVEAS           = 26,
        HOTPLUG_SAVEAS_POWEROFF  = 27,
        HOTPLUG_SAVEAS_SUSPENDED = 28,
        SHUTDOWN_UNDEPLOY   = 29,
        EPILOG_UNDEPLOY     = 30,
        PROLOG_UNDEPLOY     = 31,
        BOOT_UNDEPLOY       = 32,
        HOTPLUG_PROLOG_POWEROFF = 33,
        HOTPLUG_EPILOG_POWEROFF = 34,
        BOOT_MIGRATE            = 35,
        BOOT_FAILURE            = 36,
        BOOT_MIGRATE_FAILURE    = 37,
        PROLOG_MIGRATE_FAILURE  = 38,
        PROLOG_FAILURE          = 39,
        EPILOG_FAILURE          = 40,
        EPILOG_STOP_FAILURE     = 41,
        EPILOG_UNDEPLOY_FAILURE = 42,
        PROLOG_MIGRATE_POWEROFF = 43,
        PROLOG_MIGRATE_POWEROFF_FAILURE = 44,
        PROLOG_MIGRATE_SUSPEND          = 45,
        PROLOG_MIGRATE_SUSPEND_FAILURE  = 46,
        BOOT_UNDEPLOY_FAILURE   = 47,
        BOOT_STOPPED_FAILURE    = 48,
        PROLOG_RESUME_FAILURE   = 49,
        PROLOG_UNDEPLOY_FAILURE = 50,
        DISK_SNAPSHOT_POWEROFF  = 51,
        DISK_SNAPSHOT_REVERT_POWEROFF = 52,
        DISK_SNAPSHOT_DELETE_POWEROFF = 53
    };

    static int lcm_state_from_str(string& st, LcmState& state)
    {
        one_util::toupper(st);

        if ( st == "LCM_INIT" ){ state = LCM_INIT; }
        else if ( st == "PROLOG") { state = PROLOG; }
        else if ( st == "BOOT") { state = BOOT; }
        else if ( st == "RUNNING") { state = RUNNING; }
        else if ( st == "MIGRATE") { state = MIGRATE; }
        else if ( st == "SAVE_STOP") { state = SAVE_STOP; }
        else if ( st == "SAVE_SUSPEND") { state = SAVE_SUSPEND; }
        else if ( st == "SAVE_MIGRATE") { state = SAVE_MIGRATE; }
        else if ( st == "PROLOG_MIGRATE") { state = PROLOG_MIGRATE; }
        else if ( st == "PROLOG_RESUME") { state = PROLOG_RESUME; }
        else if ( st == "EPILOG_STOP") { state = EPILOG_STOP; }
        else if ( st == "EPILOG") { state = EPILOG; }
        else if ( st == "SHUTDOWN") { state = SHUTDOWN; }
        else if ( st == "CLEANUP_RESUBMIT") { state = CLEANUP_RESUBMIT; }
        else if ( st == "UNKNOWN") { state = UNKNOWN; }
        else if ( st == "HOTPLUG") { state = HOTPLUG; }
        else if ( st == "SHUTDOWN_POWEROFF") { state = SHUTDOWN_POWEROFF; }
        else if ( st == "BOOT_UNKNOWN") { state = BOOT_UNKNOWN; }
        else if ( st == "BOOT_POWEROFF") { state = BOOT_POWEROFF; }
        else if ( st == "BOOT_SUSPENDED") { state = BOOT_SUSPENDED; }
        else if ( st == "BOOT_STOPPED") { state = BOOT_STOPPED; }
        else if ( st == "CLEANUP_DELETE") { state = CLEANUP_DELETE; }
        else if ( st == "HOTPLUG_SNAPSHOT") { state = HOTPLUG_SNAPSHOT; }
        else if ( st == "HOTPLUG_NIC") { state = HOTPLUG_NIC; }
        else if ( st == "HOTPLUG_SAVEAS") { state = HOTPLUG_SAVEAS; }
        else if ( st == "HOTPLUG_SAVEAS_POWEROFF") { state = HOTPLUG_SAVEAS_POWEROFF; }
        else if ( st == "HOTPLUG_SAVEAS_SUSPENDED") { state = HOTPLUG_SAVEAS_SUSPENDED; }
        else if ( st == "SHUTDOWN_UNDEPLOY") { state = SHUTDOWN_UNDEPLOY; }
        else if ( st == "EPILOG_UNDEPLOY") { state = EPILOG_UNDEPLOY; }
        else if ( st == "PROLOG_UNDEPLOY") { state = PROLOG_UNDEPLOY; }
        else if ( st == "BOOT_UNDEPLOY") { state = BOOT_UNDEPLOY; }
        else if ( st == "HOTPLUG_PROLOG_POWEROFF") { state = HOTPLUG_PROLOG_POWEROFF; }
        else if ( st == "HOTPLUG_EPILOG_POWEROFF") { state = HOTPLUG_EPILOG_POWEROFF; }
        else if ( st == "BOOT_MIGRATE") { state = BOOT_MIGRATE; }
        else if ( st == "BOOT_FAILURE") { state = BOOT_FAILURE; }
        else if ( st == "BOOT_MIGRATE_FAILURE") { state = BOOT_MIGRATE_FAILURE; }
        else if ( st == "PROLOG_MIGRATE_FAILURE") { state = PROLOG_MIGRATE_FAILURE; }
        else if ( st == "PROLOG_FAILURE") { state = PROLOG_FAILURE; }
        else if ( st == "EPILOG_FAILURE") { state = EPILOG_FAILURE; }
        else if ( st == "EPILOG_STOP_FAILURE") { state = EPILOG_STOP_FAILURE; }
        else if ( st == "EPILOG_UNDEPLOY_FAILURE") { state = EPILOG_UNDEPLOY_FAILURE; }
        else if ( st == "PROLOG_MIGRATE_POWEROFF") { state = PROLOG_MIGRATE_POWEROFF;}
        else if ( st == "PROLOG_MIGRATE_POWEROFF_FAILURE") { state = PROLOG_MIGRATE_POWEROFF_FAILURE;}
        else if ( st == "PROLOG_MIGRATE_SUSPEND") { state = PROLOG_MIGRATE_SUSPEND;}
        else if ( st == "PROLOG_MIGRATE_SUSPEND_FAILURE") { state = PROLOG_MIGRATE_SUSPEND_FAILURE;}
        else if ( st == "BOOT_STOPPED_FAILURE") { state = BOOT_STOPPED_FAILURE; }
        else if ( st == "BOOT_UNDEPLOY_FAILURE") { state = BOOT_UNDEPLOY_FAILURE; }
        else if ( st == "PROLOG_RESUME_FAILURE") { state = PROLOG_RESUME_FAILURE; }
        else if ( st == "PROLOG_UNDEPLOY_FAILURE") { state = PROLOG_UNDEPLOY_FAILURE; }
        else if ( st == "DISK_SNAPSHOT_POWEROFF") { state = DISK_SNAPSHOT_POWEROFF; }
        else if ( st == "DISK_SNAPSHOT_REVERT_POWEROFF") { state = DISK_SNAPSHOT_REVERT_POWEROFF; }
        else if ( st == "DISK_SNAPSHOT_DELETE_POWEROFF") { state = DISK_SNAPSHOT_DELETE_POWEROFF; }
        else {return -1;}

        return 0;
    }

    static string& lcm_state_to_str(string& st, LcmState state)
    {
        switch (state)
        {
            case LCM_INIT: st = "LCM_INIT"; break;
            case PROLOG: st = "PROLOG"; break;
            case BOOT: st = "BOOT"; break;
            case RUNNING: st = "RUNNING"; break;
            case MIGRATE: st = "MIGRATE"; break;
            case SAVE_STOP: st = "SAVE_STOP"; break;
            case SAVE_SUSPEND: st = "SAVE_SUSPEND"; break;
            case SAVE_MIGRATE: st = "SAVE_MIGRATE"; break;
            case PROLOG_MIGRATE: st = "PROLOG_MIGRATE"; break;
            case PROLOG_RESUME: st = "PROLOG_RESUME"; break;
            case EPILOG_STOP: st = "EPILOG_STOP"; break;
            case EPILOG: st = "EPILOG"; break;
            case SHUTDOWN: st = "SHUTDOWN"; break;
            case CLEANUP_RESUBMIT: st = "CLEANUP_RESUBMIT"; break;
            case UNKNOWN: st = "UNKNOWN"; break;
            case HOTPLUG: st = "HOTPLUG"; break;
            case SHUTDOWN_POWEROFF: st = "SHUTDOWN_POWEROFF"; break;
            case BOOT_UNKNOWN: st = "BOOT_UNKNOWN"; break;
            case BOOT_POWEROFF: st = "BOOT_POWEROFF"; break;
            case BOOT_SUSPENDED: st = "BOOT_SUSPENDED"; break;
            case BOOT_STOPPED: st = "BOOT_STOPPED"; break;
            case CLEANUP_DELETE: st = "CLEANUP_DELETE"; break;
            case HOTPLUG_SNAPSHOT: st = "HOTPLUG_SNAPSHOT"; break;
            case HOTPLUG_NIC: st = "HOTPLUG_NIC"; break;
            case HOTPLUG_SAVEAS: st = "HOTPLUG_SAVEAS"; break;
            case HOTPLUG_SAVEAS_POWEROFF: st = "HOTPLUG_SAVEAS_POWEROFF"; break;
            case HOTPLUG_SAVEAS_SUSPENDED: st = "HOTPLUG_SAVEAS_SUSPENDED"; break;
            case SHUTDOWN_UNDEPLOY: st = "SHUTDOWN_UNDEPLOY"; break;
            case EPILOG_UNDEPLOY: st = "EPILOG_UNDEPLOY"; break;
            case PROLOG_UNDEPLOY: st = "PROLOG_UNDEPLOY"; break;
            case BOOT_UNDEPLOY: st = "BOOT_UNDEPLOY"; break;
            case HOTPLUG_PROLOG_POWEROFF: st = "HOTPLUG_PROLOG_POWEROFF"; break;
            case HOTPLUG_EPILOG_POWEROFF: st = "HOTPLUG_EPILOG_POWEROFF"; break;
            case BOOT_MIGRATE: st = "BOOT_MIGRATE"; break;
            case BOOT_FAILURE: st = "BOOT_FAILURE"; break;
            case BOOT_MIGRATE_FAILURE: st = "BOOT_MIGRATE_FAILURE"; break;
            case PROLOG_MIGRATE_FAILURE: st = "PROLOG_MIGRATE_FAILURE"; break;
            case PROLOG_FAILURE: st = "PROLOG_FAILURE"; break;
            case EPILOG_FAILURE: st = "EPILOG_FAILURE"; break;
            case EPILOG_STOP_FAILURE: st = "EPILOG_STOP_FAILURE"; break;
            case EPILOG_UNDEPLOY_FAILURE: st = "EPILOG_UNDEPLOY_FAILURE"; break;
            case PROLOG_MIGRATE_POWEROFF: st = "PROLOG_MIGRATE_POWEROFF"; break;
            case PROLOG_MIGRATE_POWEROFF_FAILURE: st = "PROLOG_MIGRATE_POWEROFF_FAILURE"; break;
            case PROLOG_MIGRATE_SUSPEND: st = "PROLOG_MIGRATE_SUSPEND"; break;
            case PROLOG_MIGRATE_SUSPEND_FAILURE: st = "PROLOG_MIGRATE_SUSPEND_FAILURE"; break;
            case BOOT_STOPPED_FAILURE: st = "BOOT_STOPPED_FAILURE"; break;
            case BOOT_UNDEPLOY_FAILURE: st = "BOOT_UNDEPLOY_FAILURE"; break;
            case PROLOG_RESUME_FAILURE: st = "PROLOG_RESUME_FAILURE"; break;
            case PROLOG_UNDEPLOY_FAILURE: st = "PROLOG_UNDEPLOY_FAILURE"; break;
            case DISK_SNAPSHOT_POWEROFF: st = "DISK_SNAPSHOT_POWEROFF"; break;
            case DISK_SNAPSHOT_REVERT_POWEROFF: st = "DISK_SNAPSHOT_REVERT_POWEROFF"; break;
            case DISK_SNAPSHOT_DELETE_POWEROFF: st = "DISK_SNAPSHOT_DELETE_POWEROFF"; break;
        }

        return st;
    }

    /**
     * Returns the VM state to string, using the lcm state if the current state
     * is ACTIVE.
     * @return the state sting
     */
    string state_str()
    {
		string st;

        if (state == ACTIVE)
        {
            return lcm_state_to_str(st, lcm_state);
        }

        return vm_state_to_str(st, state);
    }

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
            _log->log(module,type,message.str().c_str());
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
     *  writes a log message in vm.log. The class lock should be locked and
     *  the VM MUST BE obtained through the VirtualMachinePool get() method.
     */
    void log(
        const char *            module,
        const Log::MessageType  type,
        const string&           message) const
    {
        log(module, type, message.c_str());
    };

    /**
     * Function to print the VirtualMachine object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const
    {
        return to_xml_extended(xml, 1);
    }

    /**
     * Function to print the VirtualMachine object into a string in
     * XML format, with extended information (full history records)
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml) const
    {
        return to_xml_extended(xml, 2);
    }

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

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
     *  Updates VM dynamic information (usage counters), and updates last_poll,
     *  and copies it to history record for acct.
     *   @param _memory Kilobytes used by the VM (total)
     *   @param _cpu used by the VM (rate)
     *   @param _net_tx transmitted bytes (total)
     *   @param _net_rx received bytes (total)
     */
    void update_info(
        const int _memory,
        const int _cpu,
        const long long _net_tx,
        const long long _net_rx,
        const map<string, string> &custom);

    /**
     *  Clears the VM monitor information: usage counters, last_poll,
     *  custom attributes, and copies it to the history record for acct.
     */
    void reset_info()
    {
        map<string,string> empty;

        update_info(0, 0, -1, -1, empty);
    }

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
     *    @param _et VM exit time (when it arrived DONE/FAILED states)
     */
    void set_exit_time(time_t et)
    {
        etime = et;
    };

    /**
     *  Sets the KERNEL OS attribute (path to the kernel file). Used when
     *  the template is using a FILE Datastore for it
     *    @param path to the kernel (in the remote host)
     */
    void set_kernel(const string& kernel)
    {
        vector<Attribute *> os_attr;
        VectorAttribute *   os;

        int num = obj_template->get("OS", os_attr);

        if ( num == 0 )
        {
            return;
        }

        os = dynamic_cast<VectorAttribute *>(os_attr[0]);

        os->replace("KERNEL", kernel);
    };

    /**
     *  Sets the INITRD OS attribute (path to the initrd file). Used when
     *  the template is using a FILE Datastore for it
     *    @param path to the initrd (in the remote host)
     */
    void set_initrd(const string& initrd)
    {
        vector<Attribute *> os_attr;
        VectorAttribute *   os;

        int num = obj_template->get("OS", os_attr);

        if ( num == 0 )
        {
            return;
        }

        os = dynamic_cast<VectorAttribute *>(os_attr[0]);

        os->replace("INITRD", initrd);
    };

    // ------------------------------------------------------------------------
    // Access to VM locations
    // ------------------------------------------------------------------------
    /**
     *  Returns the remote VM directory. The VM remote dir is in the form:
     *  $DATASTORE_LOCATION/$SYSTEM_DS_ID/$VM_ID. The remote system_dir stores
     *  disks for a running VM in the target host.
     *    @return the remote system directory for the VM
     */
    const string& get_remote_system_dir() const
    {
        return history->rsystem_dir;
    }

    /**
     *  Returns the remote VM directory for the previous host.
     *  The hasPreviousHistory() function MUST be called before this one.
     *    @return the remote system directory for the VM
     */
    const string & get_previous_remote_system_dir() const
    {
        return previous_history->rsystem_dir;
    };

    /**
     *  Returns the local VM directory. The VM local dir is in the form:
     *  $SYSTEM_DS_BASE_PATH/$VM_ID. Temporary stores VM disks.
     *    @return the system directory for the VM
     */
    string get_system_dir() const;

    // ------------------------------------------------------------------------
    // History
    // ------------------------------------------------------------------------
    /**
     *  Adds a new history record an writes it in the database.
     */
    void add_history(
        int     hid,
        int     cid,
        const string& hostname,
        const string& vmm_mad,
        const string& vnm_mad,
        const string& tm_mad,
        const string& ds_location,
        int           ds_id);

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
     *  Returns the VMM driver name for the previous host. The hasPreviousHistory()
     *  function MUST be called before this one.
     *    @return the VMM mad name
     */
    const string & get_previous_vmm_mad() const
    {
        return previous_history->vmm_mad_name;
    };

    /**
     *  Returns the VNM driver name for the current host. The hasHistory()
     *  function MUST be called before this one.
     *    @return the VNM mad name
     */
    const string & get_vnm_mad() const
    {
        return history->vnm_mad_name;
    };

    /**
     *  Returns the VNM driver name for the previous host. The hasPreviousHistory()
     *  function MUST be called before this one.
     *    @return the VNM mad name
     */
    const string & get_previous_vnm_mad() const
    {
        return previous_history->vnm_mad_name;
    };

    /**
     *  Returns the datastore ID of the system DS for the host. The hasHistory()
     *  function MUST be called before this one.
     *    @return the ds id
     */
    int get_ds_id() const
    {
        return history->ds_id;
    };

    /**
     *  Returns the datastore ID of the system DS for the previous host.
     *  The hasPreviousHistory() function MUST be called before this one.
     *    @return the TM mad name
     */
    int get_previous_ds_id() const
    {
        return previous_history->ds_id;
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
     *  Returns the TM driver name for the previous host. The
     *  hasPreviousHistory() function MUST be called before this one.
     *    @return the TM mad name
     */
    const string & get_previous_tm_mad() const
    {
        return previous_history->tm_mad_name;
    };

    /**
     *  Returns the transfer filename. The transfer file is in the form:
     *          $ONE_LOCATION/var/vms/$VM_ID/transfer.$SEQ
     *  or, in case that OpenNebula is installed in root
     *          /var/lib/one/vms/$VM_ID/transfer.$SEQ
     *  The hasHistory() function MUST be called before this one.
     *    @return the transfer filename
     */
    const string & get_transfer_file() const
    {
        return history->transfer_file;
    };

    /**
     *  Returns the deployment filename. The deployment file is in the form:
     *          $ONE_LOCATION/var/vms/$VM_ID/deployment.$SEQ
     *  or, in case that OpenNebula is installed in root
     *          /var/lib/one/vms/$VM_ID/deployment.$SEQ
     *  The hasHistory() function MUST be called before this one.
     *    @return the deployment file path
     */
    const string & get_deployment_file() const
    {
        return history->deployment_file;
    };

    /**
     *  Returns the context filename. The context file is in the form:
     *          $ONE_LOCATION/var/vms/$VM_ID/context.sh
     *  or, in case that OpenNebula is installed in root
     *          /var/lib/one/vms/$VM_ID/context.sh
     *  The hasHistory() function MUST be called before this one.
     *    @return the context file path
     */
    const string & get_context_file() const
    {
        return history->context_file;
    }

    /**
     *  Returns the token filename. The token file is in the form:
     *          $ONE_LOCATION/var/vms/$VM_ID/token.txt
     *  or, in case that OpenNebula is installed in root
     *          /var/lib/one/vms/$VM_ID/token.txt
     *  The hasHistory() function MUST be called before this one.
     *    @return the token file path
     */
    const string & get_token_file() const
    {
        return history->token_file;
    }

    /**
     *  Returns the remote deployment filename. The file is in the form:
     *          $DS_LOCATION/$SYSTEM_DS/$VM_ID/deployment.$SEQ
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
     *          $DS_LOCATION/$SYSTEM_DS/$VM_ID/checkpoint
     *  The hasHistory() function MUST be called before this one.
     *    @return the checkpoint filename
     */
    const string & get_checkpoint_file() const
    {
        return history->checkpoint_file;
    };

    /**
     *  Returns the checkpoint filename for the previous host.
     *  The hasPreviousHistory() function MUST be called before this one.
     *    @return the checkpoint filename
     */
    const string & get_previous_checkpoint_file() const
    {
        return previous_history->checkpoint_file;
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
     *  Returns if the host is a public cloud based on the system ds and tm_mad.
     *  The hasHistory() function MUST be called before this one.
     *    @return the hostname
     */
    bool get_host_is_cloud() const
    {
        return ((history->ds_id == -1) && history->tm_mad_name.empty());
    };

    /**
     * Updates the current hostname. The hasHistory()
     *  function MUST be called before this one.
     * @param hostname New hostname
     */
    void set_hostname(const string& hostname)
    {
        history->hostname = hostname;
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
     *  Returns the reason that closed the history record in the previous host
     *    @return the reason to close the history record in the previous host
     */
    const History::EndReason get_previous_reason() const
    {
        return previous_history->reason;
    };

    /**
     *  Returns the action that closed the current history record. The hasHistory()
     *  function MUST be called before this one.
     *    @return the action that closed the current history record
     */
    const History::VMAction get_action() const
    {
        return history->action;
    };

    /**
     *  Returns the action that closed the history record in the previous host
     *    @return the action that closed the history record in the previous host
     */
    const History::VMAction get_previous_action() const
    {
        return previous_history->action;
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
     *  Sets VM info (with monitoring info) in the history record
     */
    void set_vm_info()
    {
        to_xml_extended(history->vm_info, 0);
    };

    /**
     *  Sets VM info (with monitoring info) in the previous history record
     */
    void set_previous_vm_info()
    {
        to_xml_extended(previous_history->vm_info, 0);
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
     *  Gets the running start time for the VM
     */
    time_t get_running_stime()
    {
        return history->running_stime;
    }

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
     *  Sets the reason that closed the history record
     *    @param _reason reason to close the history record
     */
    void set_reason(History::EndReason _reason)
    {
        history->reason=_reason;
    };

    /**
     *  Sets the reason that closed the history record in the previous host
     *    @param _reason reason to close the history record in the previous host
     */
    void set_previous_reason(History::EndReason _reason)
    {
        previous_history->reason=_reason;
    };

    /**
     *  Sets the action that closed the history record
     *    @param action that closed the history record
     */
    void set_action(History::VMAction action)
    {
        history->action = action;
    };

    /**
     *  Sets the action that closed the history record in the previous host
     *    @param action that closed the history record in the previous host
     */
    void set_previous_action(History::VMAction action)
    {
        previous_history->action = action;
    };

    // ------------------------------------------------------------------------
    // Template
    // ------------------------------------------------------------------------
    /**
     *  Parse a string and substitute variables (e.g. $NAME) using the VM
     *  template values:
     *    @param attribute, the string to be parsed
     *    @param parsed, the resulting parsed string
     *    @param error description in case of failure
     *    @return 0 on success.
     */
    int  parse_template_attribute(const string& attribute,
                                  string&       parsed,
                                  string&       error);

    /**
     *  Parse a file string variable (i.e. $FILE) using the FILE_DS datastores.
     *  It should be used for OS/DS_KERNEL, OS/DS_INITRD, CONTEXT/DS_FILES.
     *    @param attribute the string to be parsed
     *    @param img_ids ids of the FILE images in the attribute
     *    @param error description in case of failure
     *    @return 0 on success.
     */
    int  parse_file_attribute(string       attribute,
                              vector<int>& img_ids,
                              string&      error);

    /**
     *  Factory method for virtual machine templates
     */
    Template * get_new_template() const
    {
        return new VirtualMachineTemplate;
    }

    /**
     *  Returns a copy of the VirtualMachineTemplate
     *    @return A copy of the VirtualMachineTemplate
     */
    VirtualMachineTemplate * clone_template() const
    {
        return new VirtualMachineTemplate(
                *(static_cast<VirtualMachineTemplate *>(obj_template)));
    };

    /**
     *  This function replaces the *user template*.
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int replace_template(const string& tmpl_str, bool keep_restricted, string& error);

    /**
     *  Append new attributes to the *user template*.
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int append_template(const string& tmpl_str, bool keep_restricted, string& error);

    /**
     *  This function gets an attribute from the user template
     *    @param name of the attribute
     *    @param value of the attribute
     */
    void get_user_template_attribute(const char * name, string& value) const
    {
        user_obj_template->get(name,value);
    }

    /**
     *  Sets an error message with timestamp in the template
     *    @param message Message string
     */
    void set_template_error_message(const string& message);

    /**
     *  Sets an error message with timestamp in the template
     *    @param name of the error attribute
     *    @param message Message string
     */
    void set_template_error_message(const string& name, const string& message);

    /**
     *  Deletes the error message from the template
     */
    void clear_template_error_message();

    /**
     *  Sets an error message with timestamp in the template (ERROR_MONITOR)
     *    @param message Message string
     */
    void set_template_monitor_error(const string& message);

    /**
     *  Deletes the error message from the template (ERROR_MONITOR)
     *    @param message Message string
     */
    void clear_template_monitor_error();

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

    VmState get_prev_state() const
    {
        return prev_state;
    };

    /**
     *  Returns the VM state (life-cycle Manager)
     *    @return the VM state
     */
    LcmState get_lcm_state() const
    {
        return lcm_state;
    };

    LcmState get_prev_lcm_state() const
    {
        return prev_lcm_state;
    };

    /**
     *  Sets VM state
     *    @param s state
     */
    void set_state(VmState s)
    {
        string st;

        state = s;

        log("VM", Log::INFO, "New state is " + vm_state_to_str(st, s));
    };

    /**
     *  Sets VM LCM state
     *    @param s state
     */
    void set_state(LcmState s)
    {
        string st;

        lcm_state = s;

        log("VM", Log::INFO, "New LCM state is " + lcm_state_to_str(st, s));
    };

    /**
     *  Sets the previous state to the current one
     */
    void set_prev_state()
    {
        prev_state     = state;
        prev_lcm_state = lcm_state;
    };

    /**
     *  Test if the VM has changed state since last time prev state was set
     *    @return true if VM changed state
     */
    bool has_changed_state()
    {
        return (prev_lcm_state != lcm_state || prev_state != state);
    }

    /**
     *  Sets the re-scheduling flag
     *    @param set or unset the re-schedule flag
     */
    void set_resched(bool do_sched)
    {
        if ( do_sched == true )
        {
            resched = 1;
        }
        else
        {
            resched = 0;
        }
    };

    // ------------------------------------------------------------------------
    // Timers & Requirements
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

    /**
     *  Checks if the resize parameters are valid
     *    @param cpu New CPU. 0 means unchanged.
     *    @param memory New MEMORY. 0 means unchanged.
     *    @param vcpu New VCPU. 0 means unchanged.
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success
     */
     int check_resize (float cpu, int memory, int vcpu, string& error_str);

    /**
     *  Resize the VM capacity
     *    @param cpu
     *    @param memory
     *    @param vcpu
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success
     */
     int resize (float cpu, int memory, int vcpu, string& error_str);

    // ------------------------------------------------------------------------
    // Network Leases & Disk Images
    // ------------------------------------------------------------------------
    /**
     *  Releases all network leases taken by this Virtual Machine
     */
    void release_network_leases();

    /**
     * Releases the network lease taken by this NIC
     *
     * @param nic NIC to be released
     * @param vmid Virtual Machine oid
     *
     * @return 0 on success, -1 otherwise
     */
    static int release_network_leases(VectorAttribute const * nic, int vmid);

    /**
     *  Releases all disk images taken by this Virtual Machine
     */
    void release_disk_images();

    /**
     *  Check if the given disk is volatile
     */
    static bool is_volatile(const VectorAttribute * disk);

    /**
     *  Check if the template contains a volatile disk
     */
    static bool is_volatile(const Template * tmpl);

    /**
     *  Check if the disk is persistent
     */
    static bool is_persistent(const VectorAttribute * disk);

    /**
     *  Check if the themplate is for an imported VM
     */
    bool is_imported() const;

    /**
     *  Return the total SIZE of volatile disks
     */
    static long long get_volatile_disk_size(Template * tmpl);

    /**
     * Returns a set of the security group IDs in use in this VM
     * @param sgs a set of security group IDs
     */
    void get_security_groups(set<int>& sgs) const;

	/**
	 *
	 */
    const VectorAttribute* get_disk(int disk_id) const;

    // ------------------------------------------------------------------------
    // Context related functions
    // ------------------------------------------------------------------------
    /**
     *  Writes the context file for this VM, and gets the paths to be included
     *  in the context block device (CBD)
     *    @param  files space separated list of paths to be included in the CBD
     *    @param  disk_id CONTEXT/DISK_ID attribute value
     *    @param  token_password Password to encrypt the token, if it is set
     *    @return -1 in case of error, 0 if the VM has no context, 1 on success
     */
    int  generate_context(string &files, int &disk_id, string& token_password);

    // -------------------------------------------------------------------------
    // "Save as" Disk related functions (save_as hot)
    // -------------------------------------------------------------------------
    /**
     *  Mark the disk that is going to be "save as"
     *    @param disk_id of the VM
     *    @param snap_id of the disk to save, -1 to select the active snapshot
     *    @param err_str describing the error
     *    @return -1 if the image cannot saveas or image_id of current disk
     */
    int set_saveas_disk(int disk_id, int snap_id, string& err_str);

    /**
     *  Set save attributes for the disk
     *    @param  disk_id Index of the disk to save
     *    @param  source to save the disk
     *    @param  img_id ID of the image this disk will be saved to
     */
    int set_saveas_disk(int disk_id, const string& source, int img_id);

    /**
     *  Sets the corresponding state to save the disk.
     *    @return 0 if the VM can be saved
     */
    int set_saveas_state();

    /**
     *  Clears the save state, moving the VM to the original state.
     *    @return 0 if the VM was in an saveas state
     */
    int clear_saveas_state();

    /**
     * Clears the SAVE_AS_* attributes of the disk being saved as
     *    @return the ID of the image this disk will be saved to or -1 if it
     *    is not found.
     */
    int clear_saveas_disk();

    /**
     * Get the original image id of the disk. It also checks that the disk can
     * be saved_as.
     *    @param  disk_id Index of the disk to save
     *    @param  source of the image to save the disk to
     *    @param  image_id of the image to save the disk to
     *    @param  tm_mad in use by the disk
     *    @param  ds_id of the datastore in use by the disk
     *    @return -1 if failure
     */
    int get_saveas_disk(int& disk_id, string& source, int& image_id,
            string& snap_id, string& tm_mad, string& ds_id);

    // ------------------------------------------------------------------------
    // Authorization related functions
    // ------------------------------------------------------------------------
    /**
     *  Sets an authorization request for a VirtualMachine template based on
     *  the images and networks used
     *    @param  uid for template owner
     *    @param  ar the AuthRequest object
     *    @param  tmpl the virtual machine template
     */
    static void set_auth_request(int uid,
                                 AuthRequest& ar,
                                 VirtualMachineTemplate *tmpl);

    // -------------------------------------------------------------------------
    // Hotplug related functions
    // -------------------------------------------------------------------------
    /**
     *  Collects information about VM DISKS
     *    @param max_disk_id of the VM
     *    @param used_targets by the DISKS of the VM
     */
    void get_disk_info(int& max_disk_id, set<string>& used_targets);

    /**
     *  Get the IMAGE_ID of the image that's being saved as hot
     *    @param disk_id of the DISK
     *    @param image_id id of the image being saved
     *    @return IMAGE_ID on success, -1 otherwise
     */
    //int get_disk_hot_info(int& image_id, int& disk_id, string& source);

    /**
     * Generate a DISK attribute to be attached to the VM.
     *   @param tmpl Template containing a single DISK vector attribute.
     *   @param used_targets targets in use by current DISKS
     *   @param max_disk_id Max DISK/DISK_ID of the VM
     *   @param uid of the VM owner
     *   @param image_id returns the id of the acquired image
     *   @param error_str describes the error
     *
     *   @return a new VectorAttribute with the DISK (should be freed if not
     *   added to the template), 0 in case of error;
     */
    static VectorAttribute * set_up_attach_disk(
                            int                      vm_id,
                            VirtualMachineTemplate * tmpl,
                            set<string>&             used_targets,
                            int                      max_disk_id,
                            int                      uid,
                            int&                     image_id,
                            Snapshots **             snap,
                            string&                  error_str);
    /**
     * Returns the disk that is waiting for an attachment action
     *
     * @return the disk waiting for an attachment action, or 0
     */
    VectorAttribute* get_attach_disk();

    /**
     * Cleans the ATTACH = YES attribute from the disks
     */
    void clear_attach_disk();

    /**
     * Deletes the DISK that was in the process of being attached
     *
     * @return the DISK or 0 if no disk was deleted
     */
    VectorAttribute * delete_attach_disk(Snapshots **snap);

    /**
     *  Adds a new disk to the virtual machine template. The disk should be
     *  generated by the build_attach_disk
     *    @param new_disk must be allocated in the heap
     *    @param snap list of snapshots associated to the disk
     */
    void set_attach_disk(VectorAttribute * new_disk, Snapshots * snap)
    {
        new_disk->replace("ATTACH", "YES");

        obj_template->set(new_disk);

        if (snap != 0)
        {
            int disk_id;

            new_disk->vector_value("DISK_ID", disk_id);
            snapshots.insert(pair<int, Snapshots *>(disk_id, snap));
        }
    }

    /**
     *  Sets the attach attribute to the given disk
     *    @param disk_id of the DISK
     *    @return 0 if the disk_id was found -1 otherwise
     */
    int set_attach_disk(int disk_id);

    // ------------------------------------------------------------------------
    // NIC Hotplug related functions
    // ------------------------------------------------------------------------

    /**
     * Gets info about the new NIC to attach
     *
     * @param tmpl Template containing a single NIC vector attribute.
     * @param max_nic_id Returns the max NIC_ID of the VM
     * @param error_str error reason, if any
     * @return a new VectorAttribute with the NIC (should be freed if not
     *   added to the template), 0 in case of error
     */
    VectorAttribute * get_attach_nic_info(
                            VirtualMachineTemplate * tmpl,
                            int&                     max_nic_id,
                            string&                  error_str);

    /**
     * Setups the new NIC attribute to be attached to the VM.
     *
     * @param vm_id Id of the VM where this nic will be attached
     * @param vm_sgs the securty group ids already present in the VM
     * @param new_nic New NIC vector attribute, obtained from get_attach_nic_info
     * @param rules Security Group rules will be added at the end of this
     * vector. If not used, the VectorAttributes must be freed by the calling
     * method
     * @param max_nic_id Max NIC/NIC_ID of the VM
     * @param uid of the VM owner
     * @param error_str error reason, if any
     * @return 0 on success, -1 otherwise
     */
    static int set_up_attach_nic(
                            int                      vm_id,
                            set<int>&                vm_sgs,
                            VectorAttribute *        new_nic,
                            vector<VectorAttribute*> &rules,
                            int                      max_nic_id,
                            int                      uid,
                            string&                  error_str);

    /**
     * Cleans the ATTACH = YES attribute from the NICs
     */
    void clear_attach_nic();

    /**
     * Deletes the NIC that was in the process of being attached
     *
     * @return the deleted NIC or 0 if none was deleted
     */
    VectorAttribute * delete_attach_nic();

    /**
     *  Adds a new NIC to the virtual machine template. The NIC should be
     *  generated by the build_attach_nic
     *    @param new_nic must be allocated in the heap
     *    @param rules Security Group rules obtained from set_up_attach_nic
     */
    void set_attach_nic(VectorAttribute * new_nic, vector<VectorAttribute*> &rules);

    /**
     *  Sets the attach attribute to the given NIC
     *    @param nic_id of the NIC
     *    @return 0 if the nic_id was found, -1 otherwise
     */
    int set_attach_nic(int nic_id);

    // ------------------------------------------------------------------------
    // Snapshot related functions
    // ------------------------------------------------------------------------

    /**
     *  Return the snapshot list for the disk
     *    @param disk_id of the disk
     *    @param error if any
     *    @return pointer to Snapshots or 0 if not found
     */
    const Snapshots * get_disk_snapshots(int did, string& err) const;

    /**
     *  Creates a new snapshot of the given disk
     *    @param disk_id of the disk
     *    @param tag a description for this snapshot
     *    @param error if any
     *    @return the id of the new snapshot or -1 if error
     */
    int new_disk_snapshot(int disk_id, const string& tag, string& error);

    /**
     *  Sets the snap_id as active, the VM will boot from it next time
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     *    @param error if any
     *    @return -1 if error
     */
    int revert_disk_snapshot(int disk_id, int snap_id);

    /**
     *  Deletes the snap_id from the list, test_delete_disk_snapshot *MUST* be
     *  called before actually deleting the snapshot.
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     *    @param type of quota used by this snapshot
     *    @param quotas template with snapshot usage
     */
    void delete_disk_snapshot(int disk_id, int snap_id, Quotas::QuotaType& type,
            Template **quotas);

    /**
     *  Get information about the disk to take the snapshot from
     *    @param ds_id id of the datastore
     *    @param tm_mad used by the datastore
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     */
    int get_snapshot_disk(string& ds_id, string& tm_mad, string& disk_id,
            string& snap_id);
    /**
     *  Unset the current disk being snapshotted (reverted...)
     */
    void clear_snapshot_disk();

    /**
     *  Set the disk as being snapshotted (reverted...)
     *    @param disk_id of the disk
     *    @param snap_id of the target snap_id
     */
    int set_snapshot_disk(int disk_id, int snap_id);

    // ------------------------------------------------------------------------
    // Snapshot related functions
    // ------------------------------------------------------------------------

    /**
     * Creates a new Snapshot attribute, and sets it to ACTIVE=YES
     *
     * @param name for the new Snapshot. If it is empty, the generated name
     * will be placed in this param
     * @param snap_id Id of the new snapshot
     *
     * @return 0 on success
     */
    int new_snapshot(string& name, int& snap_id);

    /**
     * Sets the given Snapshot as ACTIVE=YES
     *
     * @param snap_id the snapshow ID
     *
     * @return 0 on success
     */
    int set_active_snapshot(int snap_id);

    /**
     * Replaces HYPERVISOR_ID for the active SNAPSHOT
     *
     * @param hypervisor_id Id returned by the hypervisor for the newly
     * created snapshot
     */
    void update_snapshot_id(string& hypervisor_id);

    /**
     * Cleans the ACTIVE = YES attribute from the snapshots
     */
    void clear_active_snapshot();

    /**
     * Deletes the SNAPSHOT that was in the process of being created
     */
    void delete_active_snapshot();

    /**
     * Deletes all SNAPSHOT attributes
     */
    void delete_snapshots();

    // ------------------------------------------------------------------------
    // Public cloud templates related functions
    // ------------------------------------------------------------------------

    /**
     * Gets the list of public cloud hypervisors for which this VM has definitions
     * @param list to store the cloud hypervisors in the template
     * @return the number of public cloud hypervisors
     */
    int get_public_cloud_hypervisors(vector<string> &cloud_hypervisors) const;

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualMachinePool;

    // *************************************************************************
    // Virtual Machine Attributes
    // *************************************************************************

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
     *  The state of the virtual machine.
     */
    VmState     state;

    /**
     *  Previous state og the virtual machine, to trigger state hooks
     */
    VmState     prev_state;

    /**
     *  The state of the virtual machine (in the Life-cycle Manager).
     */
    LcmState    lcm_state;

    /**
     *  Previous state og the virtual machine, to trigger state hooks
     */
    LcmState    prev_lcm_state;

    /**
     *  Marks the VM as to be re-scheduled
     */
    int         resched;

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
     *  Memory in Kilobytes used by the VM
     */
    int         memory;

    /**
     *  CPU usage (percent)
     */
    int         cpu;

    /**
     *  Network usage, transmitted bytes
     */
    long long   net_tx;

    /**
     *  Network usage, received bytes
     */
    long long   net_rx;

    /**
     *  History record, for the current host
     */
    History *   history;

    /**
     *  History record, for the previous host
     */
    History *   previous_history;

    /**
     *  Complete set of history records for the VM
     */
    vector<History *> history_records;

    /**
     *  Snapshots for each disk
     */
    map<int, Snapshots *> snapshots;

    // -------------------------------------------------------------------------
    // Logging & Dirs
    // -------------------------------------------------------------------------

    /**
     *  Log class for the virtual machine, it writes log messages in
     *          $ONE_LOCATION/var/$VID/vm.log
     *  or, in case that OpenNebula is installed in root
     *          /var/log/one/$VM_ID.log
     *  For the syslog... TODO
     */
    Log * _log;

    /**
     *  User template to store custom metadata. This template can be updated
     *
     */
    VirtualMachineTemplate * user_obj_template;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Bootstraps the database table(s) associated to the VirtualMachine
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        int rc;

        ostringstream oss_vm(VirtualMachine::db_bootstrap);
        ostringstream oss_monit(VirtualMachine::monit_db_bootstrap);
        ostringstream oss_hist(History::db_bootstrap);
        ostringstream oss_showback(VirtualMachine::showback_db_bootstrap);

        rc =  db->exec(oss_vm);
        rc += db->exec(oss_monit);
        rc += db->exec(oss_hist);
        rc += db->exec(oss_showback);

        return rc;
    };

    /**
     *  Callback function to unmarshall a VirtualMachine object
     *  (VirtualMachine::select)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **names, char ** values);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Updates the VM history record
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_history(SqlDB * db)
    {
        if ( history != 0 )
        {
            return history->update(db);
        }
        else
            return -1;
    };

    /**
     *  Updates the previous history record
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_previous_history(SqlDB * db)
    {
        if ( previous_history != 0 )
        {
            return previous_history->update(db);
        }
        else
            return -1;
    };

    /**
     * Inserts the last monitoring, and deletes old monitoring entries.
     *
     * @param db pointer to the db
     * @return 0 on success
     */
    int update_monitoring(SqlDB * db);

    // -------------------------------------------------------------------------
    // Attribute Parser
    // -------------------------------------------------------------------------

    /**
     * Mutex to perform just one attribute parse at a time
     */
    static pthread_mutex_t lex_mutex;

    /**
     *  Generates image attributes (DS_ID, TM_MAD, SOURCE...) for KERNEL and
     *  INITRD files.
     *    @param os attribute of the VM template
     *    @param base_name of the attribute "KERNEL", or "INITRD"
     *    @param base_type of the image attribute KERNEL, RAMDISK
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int set_os_file(VectorAttribute *  os,
                    const string&      base_name,
                    Image::ImageType   base_type,
                    string&            error_str);
    /**
     *  Parse the "OS" attribute of the template by substituting
     *  $FILE variables
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_os(string& error_str);

    /**
     *  Attributes not allowed in NIC_DEFAULT to avoid authorization bypass and
     *  inconsistencies for NIC_DEFAULTS
     */
    static const char * NO_NIC_DEFAULTS[];

    static const int NUM_NO_NIC_DEFAULTS;

    /**
     * Parse the "NIC_DEFAULT" attribute
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_defaults(string& error_str);

    /**
     * Known attributes for network contextualization rendered as:
     *   ETH_<nicid>_<context[0]> = $NETWORK[context[1], vnet_name]
     *
     * The context[1] values in the map are searched in the NIC and
     * if not found in the AR and VNET. They can be also set in the
     * CONTEXT section it self using full name (ETH_).
     *
     * IPv4 context variables:
     *   {"IP", "IP"},
     *   {"MAC", "MAC"},
     *   {"MASK", "NETWORK_MASK"},
     *   {"NETWORK", "NETWORK_ADDRESS"},
     *   {"GATEWAY", "GATEWAY"},
     *   {"DNS", "DNS"},
     *   {"SEARCH_DOMAIN", "SEARCH_DOMAIN"}
     *
     * IPv6 context:
     *   {"IP6", "IP6_GLOBAL"},
     *   {"GATEWAY6", "GATEWAY6"},
     *   {"CONTEXT_FORCE_IPV4", "CONTEXT_FORCE_IPV4"}
     */
    static const char* NETWORK_CONTEXT[][2];
    static const int   NUM_NETWORK_CONTEXT;

    static const char* NETWORK6_CONTEXT[][2];
    static const int   NUM_NETWORK6_CONTEXT;

    /**
     *  Parse the "CONTEXT" attribute of the template by substituting
     *  $VARIABLE, $VARIABLE[ATTR] and $VARIABLE[ATTR, ATTR = VALUE]
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_context(string& error_str);

    /**
     *  Parse the "SCHED_REQUIREMENTS" attribute of the template by substituting
     *  $VARIABLE, $VARIABLE[ATTR] and $VARIABLE[ATTR, ATTR = VALUE]
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_requirements(string& error_str);

    /**
     * Adds automatic placement requirements: Datastore and Cluster
     *
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int automatic_requirements(string& error_str);

    /**
     *  Parse the "GRAPHICS" attribute and generates a default PORT if not
     *  defined
     */
    int parse_graphics(string& error_str);

    /**
     * Searches the meaningful attributes and moves them from the user template
     * to the internal template
     */
    void parse_well_known_attributes();

    /**
     *  Function that renders the VM in XML format optinally including
     *  extended information (all history records)
     *  @param xml the resulting XML string
     *  @param n_history Number of history records to include:
     *      0: none
     *      1: the last one
     *      2: all
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml, int n_history) const;

    /**
     * Merges NIC_DEFAULT with the given NIC
     * @param nic NIC to process
     */
    void merge_nic_defaults(VectorAttribute* nic);

    // -------------------------------------------------------------------------
    // NIC & DISK Management Helpers
    // -------------------------------------------------------------------------
    /**
     *  Get all network leases for this Virtual Machine
     *  @return 0 if success
     */
    int get_network_leases(string &error_str);

    /**
     * Acquires the security groups of this NIC
     *
     * @param vm_id Virtual Machine oid
     * @param sgs security group ID set
     * @param rules Security Group rules will be added at the end of this vector
     */
    static void get_security_group_rules(int vm_id, set<int>& sgs,
        vector<VectorAttribute*> &rules);

    /**
     * Releases the security groups of this NIC
     *
     * @param vm_id Virtual Machine oid
     * @param nic NIC to release the security groups
     * @return 0 on success, -1 otherwise
     */
    static void release_security_groups(int vm_id, VectorAttribute const * nic);

    /**
     * Returns a set of the security group IDs of this NIC
     * @param nic NIC to get the security groups from
     * @param sgs a set of security group IDs
     */
    static void get_security_groups(VectorAttribute const * nic, set<int>& sgs)
    {
        one_util::split_unique(nic->vector_value("SECURITY_GROUPS"), ',', sgs);
    }

    /**
     *  Get all disk images for this Virtual Machine
     *  @param error_str Returns the error reason, if any
     *  @return 0 if success
     */
    int get_disk_images(string &error_str);

    /**
     *  Return the VectorAttribute representation of a disk
     *    @param disk_id of the disk
     *    @return pointer to the VectorAttribute
     */
    VectorAttribute* get_disk(int disk_id)
    {
        return const_cast<VectorAttribute *>(
                static_cast<const VirtualMachine&>(*this).get_disk(disk_id));
    };


protected:

    //**************************************************************************
    // Constructor
    //**************************************************************************

    VirtualMachine(int id,
                   int uid,
                   int gid,
                   const string& uname,
                   const string& gname,
                   int umask,
                   VirtualMachineTemplate * _vm_template);

    virtual ~VirtualMachine();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * monit_table;

    static const char * monit_db_names;

    static const char * monit_db_bootstrap;

    static const char * showback_table;

    static const char * showback_db_names;

    static const char * showback_db_bootstrap;

    /**
     *  Reads the Virtual Machine (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db);

    /**
     *  Writes the Virtual Machine and its associated template in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db, string& error_str);

    /**
     *  Writes/updates the Virtual Machine data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Deletes a VM from the database and all its associated information
     *   @param db pointer to the db
     *   @return -1
     */
    int drop(SqlDB * db)
    {
        NebulaLog::log("ONE",Log::ERROR, "VM Drop not implemented!");
        return -1;
    }

};

#endif /*VIRTUAL_MACHINE_H_*/
