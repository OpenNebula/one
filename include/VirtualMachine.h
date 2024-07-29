/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "VirtualMachineDisk.h"
#include "VirtualMachineNic.h"
#include "VirtualMachineMonitorInfo.h"
#include "PoolObjectSQL.h"
#include "History.h"
#include "Image.h"
#include "NebulaLog.h"
#include "Backups.h"

#include <time.h>
#include <set>
#include <sstream>

class AuthRequest;
class Snapshots;
class HostShareCapacity;

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
        INIT            = 0,
        PENDING         = 1,
        HOLD            = 2,
        ACTIVE          = 3,
        STOPPED         = 4,
        SUSPENDED       = 5,
        DONE            = 6,
        //FAILED        = 7,
        POWEROFF        = 8,
        UNDEPLOYED      = 9,
        CLONING         = 10,
        CLONING_FAILURE = 11
    };

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
        DISK_SNAPSHOT_POWEROFF         = 51,
        DISK_SNAPSHOT_REVERT_POWEROFF  = 52,
        DISK_SNAPSHOT_DELETE_POWEROFF  = 53,
        DISK_SNAPSHOT_SUSPENDED        = 54,
        //DISK_SNAPSHOT_REVERT_SUSPENDED = 55,
        DISK_SNAPSHOT_DELETE_SUSPENDED = 56,
        DISK_SNAPSHOT        = 57,
        //DISK_SNAPSHOT_REVERT = 58,
        DISK_SNAPSHOT_DELETE = 59,
        PROLOG_MIGRATE_UNKNOWN = 60,
        PROLOG_MIGRATE_UNKNOWN_FAILURE = 61,
        DISK_RESIZE = 62,
        DISK_RESIZE_POWEROFF = 63,
        DISK_RESIZE_UNDEPLOYED = 64,
        HOTPLUG_NIC_POWEROFF   = 65,
        HOTPLUG_RESIZE         = 66,
        HOTPLUG_SAVEAS_UNDEPLOYED = 67,
        HOTPLUG_SAVEAS_STOPPED    = 68,
        BACKUP            = 69,
        BACKUP_POWEROFF   = 70,
        RESTORE           = 71
    };

    static const int MAX_VNC_PASSWD_LENGTH = 8;
    static const int MAX_SPICE_PASSWD_LENGTH = 59;

    /**
     *  Functions to convert to/from string the VM states
     */
    static int vm_state_from_str(std::string& st, VmState& state);

    static std::string& vm_state_to_str(std::string& st, VmState state);

    static int lcm_state_from_str(std::string& st, LcmState& state);

    static std::string& lcm_state_to_str(std::string& st, LcmState state);

    virtual ~VirtualMachine();

    /**
     * Returns the VM state to string, using the lcm state if the current state
     * is ACTIVE.
     * @return the state sting
     */
    std::string state_str();

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
        std::string st;

        state = s;

        log("VM", Log::INFO, "New state is " + vm_state_to_str(st, s));
    };

    /**
     *  Sets VM LCM state
     *    @param s state
     */
    void set_state(LcmState s)
    {
        std::string st;

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
    bool has_changed_state() const
    {
        return (prev_lcm_state != lcm_state || prev_state != state);
    }

    /**
     *  Sets the re-scheduling flag
     *    @param set or unset the re-schedule flag
     */
    void set_resched(bool do_sched)
    {
        resched = do_sched ? 1 : 0;
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
            const std::ostringstream&    message) const
    {
        if (_log != 0)
        {
            _log->log(module, type, message.str().c_str());
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
            _log->log(module, type, message);
        }
    };

    /**
     *  writes a log message in vm.log. The class lock should be locked and
     *  the VM MUST BE obtained through the VirtualMachinePool get() method.
     */
    void log(
            const char *            module,
            const Log::MessageType  type,
            const std::string&      message) const
    {
        log(module, type, message.c_str());
    };

    // ------------------------------------------------------------------------
    // Dynamic Info
    // ------------------------------------------------------------------------
    /**
     *  Updates VM dynamic information (id).
     *   @param _deploy_id the VMM driver specific id
     */
    void set_deploy_id(const std::string& _deploy_id)
    {
        deploy_id = _deploy_id;
    };

    /**
     * @return monitor info
     */
    VirtualMachineMonitorInfo& get_info()
    {
        return monitoring;
    }

    /**
     *  Read monitoring from DB
     */
    void load_monitoring();

    /**
     *  Returns the deployment ID
     *    @return the VMM driver specific ID
     */
    const std::string& get_deploy_id() const
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
    void set_kernel(const std::string& kernel)
    {
        VectorAttribute * os = obj_template->get("OS");

        if ( os == nullptr )
        {
            return;
        }

        os->replace("KERNEL", kernel);
    };

    /**
     *  Sets the INITRD OS attribute (path to the initrd file). Used when
     *  the template is using a FILE Datastore for it
     *    @param path to the initrd (in the remote host)
     */
    void set_initrd(const std::string& initrd)
    {
        VectorAttribute * os = obj_template->get("OS");

        if ( os == nullptr )
        {
            return;
        }

        os->replace("INITRD", initrd);
    };

    bool test_machine_type(const std::string& machine_type) const
    {
        VectorAttribute * os = obj_template->get("OS");

        if ( os == nullptr )
        {
            return false;
        }

        const std::string machine = os->vector_value("MACHINE");

        return machine.find(machine_type) != std::string::npos;
    }

    // ------------------------------------------------------------------------
    // Access to VM locations
    // ------------------------------------------------------------------------
    /**
     *  Returns the remote VM directory. The VM remote dir is in the form:
     *  $DATASTORE_LOCATION/$SYSTEM_DS_ID/$VM_ID. The system_dir stores
     *  disks for a running VM in the target host.
     *    @return the remote system directory for the VM
     */
    const std::string& get_system_dir() const
    {
        return history->system_dir;
    }

    /**
     *  Returns the remote VM directory for the previous host. It maybe different
     *  if a system ds migration
     *  The hasPreviousHistory() function MUST be called before this one.
     *    @return the remote system directory for the VM
     */
    const std::string & get_previous_system_dir() const
    {
        return previous_history->system_dir;
    };

    // ------------------------------------------------------------------------
    // History
    // ------------------------------------------------------------------------
    /**
     *  Adds a new history record an writes it in the database.
     */
    void add_history(
            int                hid,
            int                cid,
            const std::string& hostname,
            const std::string& vmm_mad,
            const std::string& tm_mad,
            int                ds_id);

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

    bool is_history_open() const
    {
        return (history != 0) && (history->etime == 0);
    }

    bool is_previous_history_open() const
    {
        return (previous_history != 0) && (previous_history->etime == 0);
    }

    /**
     *  Returns the VMM driver name for the current host. The hasHistory()
     *  function MUST be called before this one.
     *    @return the VMM mad name
     */
    const std::string & get_vmm_mad() const
    {
        return history->vmm_mad_name;
    };

    /**
     *  Returns the VMM driver name for the previous host. The hasPreviousHistory()
     *  function MUST be called before this one.
     *    @return the VMM mad name
     */
    const std::string & get_previous_vmm_mad() const
    {
        return previous_history->vmm_mad_name;
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
    const std::string & get_tm_mad() const
    {
        return history->tm_mad_name;
    };

    /**
     *  Returns the TM driver name for the previous host. The
     *  hasPreviousHistory() function MUST be called before this one.
     *    @return the TM mad name
     */
    const std::string & get_previous_tm_mad() const
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
    const std::string & get_transfer_file() const
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
    const std::string & get_deployment_file() const
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
    const std::string & get_context_file() const
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
    const std::string & get_token_file() const
    {
        return history->token_file;
    }

    /**
     *  Returns the remote deployment filename. The file is in the form:
     *          $DS_LOCATION/$SYSTEM_DS/$VM_ID/deployment.$SEQ
     *  The hasHistory() function MUST be called before this one.
     *    @return the deployment filename
     */
    const std::string & get_remote_deployment_file() const
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
    const std::string & get_checkpoint_file() const
    {
        return history->checkpoint_file;
    };

    /**
     *  Returns the checkpoint filename for the previous host.
     *  The hasPreviousHistory() function MUST be called before this one.
     *    @return the checkpoint filename
     */
    const std::string & get_previous_checkpoint_file() const
    {
        return previous_history->checkpoint_file;
    };

    /**
     *  Returns the hostname for the current host. The hasHistory()
     *  function MUST be called before this one.
     *    @return the hostname
     */
    const std::string & get_hostname() const
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
    void set_hostname(const std::string& hostname)
    {
        history->hostname = hostname;
    };

    /**
     *  Returns the hostname for the previous host. The hasPreviousHistory()
     *  function MUST be called before this one.
     *    @return the hostname
     */
    const std::string & get_previous_hostname() const
    {
        return previous_history->hostname;
    };

    /**
     *  Returns the action that closed the current history record. The hasHistory()
     *  function MUST be called before this one.
     *    @return the action that closed the current history record
     */
    VMActions::Action get_action() const
    {
        return history->action;
    };

    /**
     *  Returns the action that closed the history record in the previous host
     *    @return the action that closed the history record in the previous host
     */
    VMActions::Action get_previous_action() const
    {
        return previous_history->action;
    };

    /**
     *  Get host id where the VM is or is going to execute. The hasHistory()
     *  function MUST be called before this one.
     */
    int get_hid() const
    {
        return history->hid;
    }

    /**
     *  Get host id where the VM was executing. The hasPreviousHistory()
     *  function MUST be called before this one.
     */
    int get_previous_hid() const
    {
        return previous_history->hid;
    }

    /**
     *  Get cluster id where the VM is or is going to execute. The hasHistory()
     *  function MUST be called before this one.
     */
    int get_cid() const
    {
        return history->cid;
    }

    /**
     *  Get cluster id where the VM was executing. The hasPreviousHistory()
     *  function MUST be called before this one.
     */
    int get_previous_cid() const
    {
        return previous_history->cid;
    }

    /**
     *  Sets start time of a VM.
     *    @param _stime time when the VM started
     */
    void set_stime(time_t _stime)
    {
        history->stime = _stime;
    };

    /**
     *  Sets VM info (with monitoring info) in the history record
     */
    void set_vm_info()
    {
        load_monitoring();

        to_xml_extended(history->vm_info, 0, false);
    };

    /**
     *  Sets VM info (with monitoring info) in the previous history record
     */
    void set_previous_vm_info()
    {
        to_xml_extended(previous_history->vm_info, 0, false);
    };

    /**
     *  Sets end time of a VM
     *    @param _etime time when the VM finished
     */
    void set_etime(time_t _etime)
    {
        history->etime = _etime;
    };

    /**
     *  Gets end time of a VM
     */
    time_t get_etime()
    {
        return history->etime;
    }

    /**
     *  Sets end time of a VM in the previous Host
     *    @param _etime time when the VM finished
     */
    void set_previous_etime(time_t _etime)
    {
        previous_history->etime = _etime;
    };

    /**
     *  Sets start time of VM prolog.
     *    @param _stime time when the prolog started
     */
    void set_prolog_stime(time_t _stime)
    {
        history->prolog_stime = _stime;
    };

    /**
     *  Sets end time of VM prolog.
     *    @param _etime time when the prolog finished
     */
    void set_prolog_etime(time_t _etime)
    {
        history->prolog_etime = _etime;
    };

    /**
     *  Sets start time of VM running state.
     *    @param _stime time when the running state started
     */
    void set_running_stime(time_t _stime)
    {
        history->running_stime = _stime;
    };

    /**
     *  Gets the running start time for the VM
     */
    time_t get_running_stime() const
    {
        return history->running_stime;
    }

    /**
     *  Sets end time of VM running state.
     *    @param _etime time when the running state finished
     */
    void set_running_etime(time_t _etime)
    {
        history->running_etime = _etime;
    };

    /**
     *  Gets the running end time for the VM
     */
    time_t get_running_etime() const
    {
        return history->running_etime;
    }

    /**
     *  Sets end time of VM running state in the previous host.
     *    @param _etime time when the running state finished
     */
    void set_previous_running_etime(time_t _etime)
    {
        previous_history->running_etime = _etime;
    };

    /**
     *  Sets start time of VM epilog.
     *    @param _stime time when the epilog started
     */
    void set_epilog_stime(time_t _stime)
    {
        history->epilog_stime = _stime;
    };

    /**
     *  Sets end time of VM epilog.
     *    @param _etime time when the epilog finished
     */
    void set_epilog_etime(time_t _etime)
    {
        history->epilog_etime = _etime;
    };

    /**
     *  Sets the action that closed the history record
     *    @param action that closed the history record
     */
    void set_action(VMActions::Action action, int uid, int gid, int req_id)
    {
        history->action = action;

        history->uid = uid;
        history->gid = gid;

        history->req_id = req_id;
    };

    void set_internal_action(VMActions::Action action)
    {
        history->action = action;

        history->uid = -1;
        history->gid = -1;

        history->req_id = -1;
    };

    void clear_action()
    {
        history->action = VMActions::NONE_ACTION;

        history->uid = -1;
        history->gid = -1;

        history->req_id = -1;
    }

    void set_previous_action(VMActions::Action action, int uid, int gid, int rid)
    {
        previous_history->action = action;

        previous_history->uid = uid;
        previous_history->gid = gid;

        previous_history->req_id = rid;
    };

    /**
     *  Release VNC port
     */
    void release_vnc_port();

    /**
     *  Release the previous VNC port when a VM is migrated to another cluster
     *  (GRAPHICS/PREVIOUS_PORT present)
     */
    void release_previous_vnc_port();

    /**
     *  Frees current PORT from **current** cluster and sets it to PREVIOUS_PORT
     *  (which is allocated in previous cluster). This function is called when
     *  the migration fails.
     */
    void rollback_previous_vnc_port();

    // ------------------------------------------------------------------------
    // Template & Object Representation
    // ------------------------------------------------------------------------
    /**
     * Function to print the VirtualMachine object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override
    {
        return to_xml_extended(xml, 1, false);
    }

    /**
     * Function to print the VirtualMachine object into a string in
     * XML format, with reduced information
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml_short(std::string& xml);

    /**
     * Function to print the VirtualMachine object into a string in
     * XML format, with extended information (full history records)
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml_extended(std::string& xml) const
    {
        return to_xml_extended(xml, 2, true);
    }

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     *  Factory method for virtual machine templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<VirtualMachineTemplate>();
    }

    /**
     *  Returns a copy of the VirtualMachineTemplate
     *    @return A copy of the VirtualMachineTemplate
     */
    std::unique_ptr<VirtualMachineTemplate> clone_template() const
    {
        return std::make_unique<VirtualMachineTemplate>(*obj_template);
    }

    /**
     *  Returns a copy of the VirtualMachine User Template
     *    @return A copy of the VirtualMachine User Template
     */
    std::unique_ptr<VirtualMachineTemplate> clone_user_template() const
    {
        return std::make_unique<VirtualMachineTemplate>(*user_obj_template);
    }

    /**
     *  This function replaces the *user template*.
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int replace_template(const std::string& tmpl_str, bool keep_restricted,
                         std::string& error) override;

    /**
     *  Append new attributes to the *user template*.
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int append_template(const std::string& tmpl_str, bool keep_restricted,
                        std::string& error) override;

    /**
     *  This function gets an attribute from the user template
     *    @param name of the attribute
     *    @param value of the attribute
     */
    template<typename T>
    bool get_user_template_attribute(const std::string& name, T& value) const
    {
        return user_obj_template->get(name, value);
    }

    /**
     *  Sets an error message with timestamp in the template
     *    @param message Message string
     */
    void set_template_error_message(const std::string& message) override;

    /**
     *  Sets an error message with timestamp in the template
     *    @param name of the error attribute
     *    @param message Message string
     */
    void set_template_error_message(const std::string& name,
                                    const std::string& message) override;

    /**
     *  Deletes the error message from the template
     */
    void clear_template_error_message() override;

    // ------------------------------------------------------------------------
    // Timers & Requirements
    // ------------------------------------------------------------------------
    /**
     *   @return time when the VM was created (in epoch)
     */
    time_t get_stime() const
    {
        return stime;
    };

    /**
     *  Get the VM physical capacity requirements for the host.
     *    @param sr the HostShareCapacity to store the capacity request.
     */
    void get_capacity(HostShareCapacity &sr) const;

    /**
     * Adds automatic placement requirements: Datastore and Cluster
     *    @param cluster_ids set of viable clusters for this VM
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int automatic_requirements(std::set<int>& cluster_ids, std::string& error_str);

    /**
     *  Resize the VM capacity
     *    @param cpu
     *    @param memory
     *    @param vcpu
     */
    int resize(float cpu, long int memory, unsigned int vcpu, std::string& error);

    /**
     *  Store old values of resize parameters, to be able to revert in case of failure
     *    @param cpu - old cpu value
     *    @param memory - old memory value
     *    @param vcpu - old vcpu value
     */
    void store_resize(float cpu, long int memory, unsigned int vcpu);

    /**
     *  Clear resize parameters
     */
    void reset_resize();

    /**
     *  Parse TOPOLOGY and NUMA_NODE
     *    @param tmpl template of the virtual machine
     *    @param error if any
     *
     *    @return 0 on sucess
     */
    static int parse_topology(Template * tmpl, std::string &error);

    /**
     *  @return true if the VM is being deployed with a pinned policy
     */
    bool is_pinned() const;

    /**
     * @return true if Virtual Machine is in state, when running quota applies
    */
    bool is_running_quota() const;

    /**
    * Fill a template only with the necessary attributes to update the quotas
    *   @param qtmpl template that will be filled
    *   @param basic_quota true to add basic quota attributes (from Template and User template)
    *   @param running_quota true to add RUNNING_ quota attributes (for Template and User Template)
    */
    void get_quota_template(VirtualMachineTemplate& quota_tmpl, bool basic_quota, bool running_quota);

    // ------------------------------------------------------------------------
    // Virtual Machine Disks
    // ------------------------------------------------------------------------
    /**
     *  Releases all disk images taken by this Virtual Machine
     *    @param quotas disk space to free from image datastores
     *    @param check_state to update image state based on VM state
     */
    void release_disk_images(std::vector<Template *>& quotas, bool check_state);

    /**
     *  @return reference to the VirtualMachine disks
     */
    VirtualMachineDisks& get_disks()
    {
        return disks;
    }

    /**
     *  @return a pointer to the given disk
     */
    VirtualMachineDisk * get_disk(int disk_id) const
    {
        return disks.get_disk(disk_id);
    }

    // ------------------------------------------------------------------------
    // Virtual Machine Nics
    // ------------------------------------------------------------------------
    /**
     *  Get a NIC by its id
     *    @param nic_id of the NIC
     */
    VirtualMachineNic * get_nic(int nic_id) const
    {
        return nics.get_nic(nic_id);
    }

    /**
     * Returns a set of the security group IDs in use in this VM.
     *     @param sgs a set of security group IDs
     */
    void get_security_groups(std::set<int>& sgs)
    {
        nics.get_security_groups(sgs);
    }

    /**
     *  Releases all network leases taken by this Virtual Machine
     */
    void release_network_leases()
    {
        nics.release_network_leases(oid);
    }

    /**
     * Update nic with values from Virtual Network
     *   @param vnid ID of the network with updated attributes
     *   @return 0 on success, -1 on error,
     */
    int nic_update(int vnid);

    /**
     * Update nic with values user template
     *   @param vnid ID of the network with updated attributes
     *   @return 0 on success, -1 on error
     */
    int nic_update(int nic_id, VirtualMachineNic *new_nic, bool live);

    /**
     *  Remove the rules associated to the given security group rules
     *    @param sgid the security group ID
     */
    void remove_security_group(int sgid);

    // ------------------------------------------------------------------------
    // Virtual Machine Groups
    // ------------------------------------------------------------------------
    /**
     *  Remove this VM from its role and VM group if any
     */
    void release_vmgroup();

    // ------------------------------------------------------------------------
    // Imported VM interface
    // ------------------------------------------------------------------------
    /**
     *  Check if the VM is imported
     */
    bool is_imported() const;

    /**
     *  Return state of the VM right before import
     */
    std::string get_import_state() const;

    /**
     * Checks if the current VM MAD supports the given action for imported VMs
     * @param action VM action to check
     * @return true if the current VM MAD supports the given action for imported VMs
     */
    bool is_imported_action_supported(VMActions::Action action) const;

    // ------------------------------------------------------------------------
    // Virtual Router related functions
    // ------------------------------------------------------------------------
    /**
     * Returns the Virtual Router ID if this VM is a VR, or -1
     * @return VR ID or -1
     */
    int get_vrouter_id() const;

    /**
     * Returns true if this VM is a Virtual Router
     * @return true if this VM is a Virtual Router
     */
    bool is_vrouter() const;

    // ------------------------------------------------------------------------
    // Context related functions
    // ------------------------------------------------------------------------
    /**
     *  Writes the context file for this VM, and gets the paths to be included
     *  in the context block device (CBD)
     *    @param  files space separated list of paths to be included in the CBD
     *    @param  disk_id CONTEXT/DISK_ID attribute value
     *    @param  password Password to encrypt the token, if it is set
     *    @param  only_auto boolean to generate context only for vnets
     *            with NETWORK_MODE = auto
     *    @return -1 in case of error, 0 if the VM has no context, 1 on success
     */
    int generate_context(std::string &files, int &disk_id,
                         const std::string& password);

    /**
     * Returns the CREATED_BY template attribute, or the uid if it does not exist
     * @return uid
     */
    int get_created_by_uid() const;

    /**
     *  Updates the configuration attributes based on a template, the state of
     *  the virtual machine is checked to assure operation consistency
     *    @param tmpl with the new attributes include: OS, RAW, FEAUTRES,
     *      CONTEXT, INPUT, BACKUP_CONFIG, CPU_MODEL and GRAPHICS.
     *    @param err description if any
     *    @param append true append, false replace
     *
     *    @return -1 (error), 0 (context change), 1 (no context changed)
     */
    int updateconf(VirtualMachineTemplate* tmpl, std::string &err, bool append);

    /**
     *  Check if the template includes any restricted attribute, different from
     *  this VM template.
     *    @param template to look for for restricted. The resulting tgt template
     *    will have the same restricted Attributes as this VM.
     *    @param ra the restricted attribute found to be different
     *    @return true if a different restricted is found
     */
    bool check_restricted(std::string& ra, VirtualMachineTemplate * tgt, bool append) const
    {
        return tgt->check_restricted(ra, obj_template.get(), append);
    }

    // -------------------------------------------------------------------------
    // "Save as" Disk related functions (save_as hot)
    // -------------------------------------------------------------------------
    /**
     *  Mark the disk that is going to be "save as"
     *    @param disk_id of the VM
     *    @param snap_id of the disk to save, -1 to select the active snapshot
     *    @param img_id The image id used by the disk
     *    @param size The disk size. This may be different to the original
     *    image size
     *    @param err_str describing the error if any
     *    @return -1 if the image cannot saveas, 0 on success
     */
    int set_saveas_disk(int disk_id, int snap_id, int &img_id, long long &size,
                        std::string& err_str)
    {
        return disks.set_saveas(disk_id, snap_id, img_id, size, err_str);
    }

    /**
     *  Set save attributes for the disk
     *    @param  disk_id Index of the disk to save
     *    @param  source to save the disk
     *    @param  img_id ID of the image this disk will be saved to
     */
    int set_saveas_disk(int disk_id, const std::string& source, int img_id)
    {
        if (lcm_state != HOTPLUG_SAVEAS &&
            lcm_state != HOTPLUG_SAVEAS_SUSPENDED &&
            lcm_state != HOTPLUG_SAVEAS_POWEROFF &&
            lcm_state != HOTPLUG_SAVEAS_UNDEPLOYED &&
            lcm_state != HOTPLUG_SAVEAS_STOPPED)
        {
            return -1;
        }

        return disks.set_saveas(disk_id, source, img_id);
    }

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
    int clear_saveas_disk()
    {
        return disks.clear_saveas();
    }

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
    int get_saveas_disk(int& disk_id, std::string& source, int& image_id,
                        std::string& snap_id, std::string& tm_mad, std::string& ds_id) const
    {
        return disks.get_saveas_info(disk_id, source, image_id, snap_id,
                                     tm_mad, ds_id);
    }

    // ------------------------------------------------------------------------
    // Authorization related functions
    // ------------------------------------------------------------------------
    /**
     *  Sets an authorization request for a VirtualMachine template based on
     *  the images and networks used
     *    @param  uid for template owner
     *    @param  ar the AuthRequest object
     *    @param  tmpl the virtual machine template
     *    @param  check_lock for check if the resource is lock or not
     */
    static void set_auth_request(int uid, AuthRequest& ar,
                                 VirtualMachineTemplate *tmpl, bool check_lock);

    // -------------------------------------------------------------------------
    // Attach Disk Interface
    // -------------------------------------------------------------------------
    /**
     * Generate and attach a new DISK attribute to the VM. This method check
     * that the DISK is compatible with the VM cluster allocation and disk target
     * usage.
     *   @param tmpl Template containing a single DISK vector attribute.
     *   @param error_str describes the error
     *
     *   @return 0 if success
     */
    int set_up_attach_disk(VirtualMachineTemplate * tmpl, std::string& error_str);

    /**
     * Returns the disk that is waiting for an attachment action
     *
     * @return the disk waiting for an attachment action, or 0
     */
    VirtualMachineDisk * get_attach_disk() const
    {
        return disks.get_attach();
    }

    /**
     * Cleans the ATTACH = YES attribute from the disks
     */
    void clear_attach_disk()
    {
        disks.clear_attach();
    }

    /**
     * Deletes the DISK that was in the process of being attached
     *
     * @return the DISK or 0 if no disk was deleted
     */
    VirtualMachineDisk * delete_attach_disk()
    {
        VirtualMachineDisk * disk = disks.delete_attach();

        if (disk == nullptr)
        {
            return nullptr;
        }

        obj_template->remove(disk->vector_attribute());

        return disk;
    }

    /**
     *  Sets the attach attribute to the given disk
     *    @param disk_id of the DISK
     *    @return 0 if the disk_id was found -1 otherwise
     */
    int set_attach_disk(int disk_id)
    {
        return disks.set_attach(disk_id);
    }

    // -------------------------------------------------------------------------
    // Resize Disk Interface
    // -------------------------------------------------------------------------
    /**
     * Returns the disk that is going to be resized
     *
     * @return the disk or 0 if not found
     */
    VirtualMachineDisk * get_resize_disk() const
    {
        return disks.get_resize();
    }

    /**
     *  Cleans the RESIZE = YES attribute from the disks
     *    @param restore if true the previous disk size is restored
     */
    VirtualMachineDisk * clear_resize_disk(bool restore)
    {
        VirtualMachineDisk * disk = disks.get_resize();

        if ( disk == 0 )
        {
            return 0;
        }

        disk->clear_resize(restore);

        return disk;
    }

    /**
     *  Prepares a disk to be resized.
     *     @param disk_id of disk
     *     @param size new size for the disk (needs to be greater than current)
     *     @param error
     *
     *     @return 0 on success
     */
    int set_up_resize_disk(int disk_id, long size, std::string& error)
    {
        return disks.set_up_resize(disk_id, size, error);
    }

    // ------------------------------------------------------------------------
    // NIC/PCI Hotplug related functions
    // ------------------------------------------------------------------------

    /**
     *  Checks the attributes of a PCI device
     */
    static int check_pci_attributes(VectorAttribute * pci, std::string& err);

    /**
     *  Get PCI attribute from VM (VectorAttribute form)
     *
     *  @param pci_id of the PCI device
     *
     *  @return pointer to the PCI Attribute
     */
    VectorAttribute * get_pci(int pci_id);

    /**
     *  Attach/Detach a PCI attribute to the VM it generates the PCI_ID and VM_BUS
     *  paratmeters.
     *
     *  @param vpci attribute wih the PCI information
     *  @param err string
     *
     *  @return 0 on success
     */
    int attach_pci(VectorAttribute * vpci, std::string& err);

    void detach_pci(VectorAttribute * vpci);

    /**
     * Generate and attach a new NIC attribute to the VM. This method check
     * that the NIC is compatible with the VM cluster allocation and fills SG
     * information.
     *   @param tmpl Template containing a single NIC vector attribute.
     *   @param error_str error reason, if any
     *
     *   @return 0 on success, -1 otherwise
     */
    int set_up_attach_nic(VirtualMachineTemplate *tmpl, std::string& error_str);

    /**
     *  Sets the attach attribute to the given NIC
     *    @param nic_id of the NIC
     *    @return 0 if the nic_id was found, -1 otherwise
     */
    int set_detach_nic(int nic_id);

    /**
     * Cleans the ATTACH = YES attribute from the NICs
     */
    void clear_attach_nic()
    {
        nics.clear_attach();
    }

    /**
     * Deletes the NIC that was in the process of being attached/detached
     *
     * @return the deleted NIC or 0 if none was deleted
     */
    VirtualMachineNic * delete_attach_nic()
    {
        VirtualMachineNic * nic = nics.delete_attach();

        if (nic == 0)
        {
            return 0;
        }

        obj_template->remove(nic->vector_attribute());

        return nic;
    }

    /**
     * Deletes the alias of the NIC that was in the process of being attached/detached
     */
    void delete_attach_alias(VirtualMachineNic *nic);

    // ------------------------------------------------------------------------
    // Disk Snapshot related functions
    // ------------------------------------------------------------------------
    /**
     *  Return the snapshot list for the disk
     *    @param disk_id of the disk
     *    @param error if any
     *    @return pointer to Snapshots or 0 if not found
     */
    const Snapshots * get_disk_snapshots(int did, std::string& err) const
    {
        return disks.get_snapshots(did, err);
    }

    /**
     *  Creates a new snapshot of the given disk
     *    @param disk_id of the disk
     *    @param name a description for this snapshot
     *    @param error if any
     *    @return the id of the new snapshot or -1 if error
     */
    int new_disk_snapshot(int disk_id, const std::string& name, std::string& error)
    {
        return disks.create_snapshot(disk_id, name, error);
    }

    /**
     *  Renames the snap_id from the list
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     *    @param new_name of the snapshot
     *    @return 0 on success
     */
    int rename_disk_snapshot(int disk_id, int snap_id,
                             const std::string& new_name,
                             std::string& error_str)
    {
        return disks.rename_snapshot(disk_id, snap_id, new_name, error_str);
    }

    /**
     * Deletes all the disk snapshots for non-persistent disks and for persistent
     * disks in no shared system ds.
     *     @param vm_quotas The SYSTEM_DISK_SIZE freed by the deleted snapshots
     *     @param ds_quotas The DS SIZE freed from image datastores.
     */
    void delete_non_persistent_disk_snapshots(Template& vm_quotas,
                                              std::vector<Template *>& ds_quotas)
    {
        disks.delete_non_persistent_snapshots(vm_quotas, ds_quotas);
    }

    /**
     *  Get information about the disk to take the snapshot from
     *    @param ds_id id of the datastore
     *    @param tm_mad used by the datastore
     *    @param disk_id of the disk
     *    @param snap_id of the snapshot
     */
    int get_snapshot_disk(int& ds_id, std::string& tm_mad, int& disk_id,
                          int& snap_id) const
    {
        return disks.get_active_snapshot(ds_id, tm_mad, disk_id, snap_id);
    }

    /**
     *  Unset the current disk being snapshotted (reverted...)
     */
    void clear_snapshot_disk()
    {
        disks.clear_active_snapshot();
    }

    /**
     *  Set the disk as being snapshotted (reverted...)
     *    @param disk_id of the disk
     *    @param snap_id of the target snap_id
     */
    int set_snapshot_disk(int disk_id, int snap_id)
    {
        return disks.set_active_snapshot(disk_id, snap_id);
    }

    // ------------------------------------------------------------------------
    // System Snapshot related functions
    // ------------------------------------------------------------------------
    /**
     * @return true if VM has system snapshots defined
     */
    bool has_snapshots();

    /**
     * Creates a new Snapshot attribute, and sets it to ACTIVE=YES
     *
     * @param name for the new Snapshot. If it is empty, the generated name
     * will be placed in this param
     * @param snap_id Id of the new snapshot
     *
     * @return Created VectorAttribute with the snapshot data
     */
    VectorAttribute* new_snapshot(std::string& name, int& snap_id);

    /**
     * Sets the given Snapshot as ACTIVE=YES
     *
     * @param snap_id the snapshow ID
     *
     * @return 0 on success
     */
    int set_revert_snapshot(int snap_id);

    int set_delete_snapshot(int snap_id);

    /**
     *  @return the on-going ACTION associated to the ACTIVE snapshot
     */
    std::string get_snapshot_action() const;

    VectorAttribute* get_active_snapshot() const;

    /**
     * Replaces HYPERVISOR_ID for the active SNAPSHOT
     *
     * @param hypervisor_id Id returned by the hypervisor for the newly
     * created snapshot. The no hypervisor_id version uses the snap_id.
     */
    void update_snapshot_id(const std::string& hypervisor_id);

    void update_snapshot_id();

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
     * @param snapshots Returns template with deleted snapshots
     */
    void delete_snapshots(Template& snapshots);

    /**
     * Returns size acquired on system DS by VM snapshots
     */
    static long long get_snapshots_system_size(Template *tmpl);

    // ------------------------------------------------------------------------
    // Cloning state related functions
    // ------------------------------------------------------------------------
    /**
     * Returns true if any of the disks is waiting for an image in LOCKED state
     * @return true if cloning
     */
    bool has_cloning_disks()
    {
        return disks.has_cloning();
    }

    /**
     * Returns the image IDs for the disks waiting for the LOCKED state to finish
     * @param ids image ID set
     */
    void get_cloning_image_ids(std::set<int>& ids)
    {
        disks.get_cloning_image_ids(ids);
    }

    /**
     * Clears the flag for the disks waiting for the given image
     */
    void clear_cloning_image_id(int image_id,
                                const std::string& source,
                                const std::string& format)
    {
        disks.clear_cloning_image_id(image_id, source, format);
    }

    /**
     *  Get network leases with NETWORK_MODE = auto for this Virtual Machine
     *    @pram tmpl with the scheduling results for the auto NICs
     *    @param estr description if any
     *    @return 0 if success
     */
    int get_auto_network_leases(VirtualMachineTemplate * tmpl, std::string &estr);

    /**
     *  Check if a tm_mad is valid for the Virtual Machine Disks and set
     *  clone_target and ln_target
     *  @param tm_mad is the tm_mad for system datastore chosen
     */
    int check_tm_mad_disks(const std::string& tm_mad, std::string& error);

    /**
     *  Check if VM has shareable disks and vmm_mad supports them
     *  @param vmm_mad is the tm_mad for system datastore chosen
     */
    int check_shareable_disks(const std::string& vmm_mad, std::string& error);

    // ------------------------------------------------------------------------
    // Backup related functions
    // ------------------------------------------------------------------------
    long long backup_size(Template &ds_quota)
    {
        return disks.backup_size(ds_quota, _backups.do_volatile());
    }

    Backups& backups()
    {
        return _backups;
    }

    // ------------------------------------------------------------------------
    // Scheduled actions functions
    // ------------------------------------------------------------------------
    ObjectCollection& sched_actions()
    {
        return _sched_actions;
    }

    const ObjectCollection& sched_actions() const
    {
        return _sched_actions;
    }

private:

    static const int MAX_ERROR_MSG_LENGTH = 100;

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualMachinePool;
    friend class PoolSQL;

    // *************************************************************************
    // Virtual Machine Attributes
    // *************************************************************************

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
    std::string      deploy_id;

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
    std::vector<History *> history_records;

    /**
     *  VirtualMachine disks
     */
    VirtualMachineDisks disks;

    /**
     *  VirtualMachine nics
     */
    VirtualMachineNics nics;

    /**
     *  User template to store custom metadata. This template can be updated
     */
    std::unique_ptr<VirtualMachineTemplate> user_obj_template;

    /**
     *  Monitoring information for the VM
     */
    VirtualMachineMonitorInfo monitoring;

    /**
     *  Log class for the virtual machine, it writes log messages in
     *          $ONE_LOCATION/var/$VID/vm.log
     *  or, in case that OpenNebula is installed in root
     *          /var/log/one/$VM_ID.log
     *  For the syslog it will use the predefined /var/log/ locations
     */
    Log * _log;

    /**
     *
     */
    Backups _backups;

    /**
     * Associated scheduled action for this VM
     */
    ObjectCollection _sched_actions;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************
    /**
     *  Bootstraps the database table(s) associated to the VirtualMachine
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Updates the VM history record
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_history(SqlDB * db)
    {
        if ( history == 0 )
        {
            return -1;
        }

        return history->update(db);
    };

    /**
     *  Insert a new VM history record
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert_history(SqlDB * db)
    {
        std::string error;

        if ( history == 0 )
        {
            return -1;
        }

        return history->insert(db, error);
    }

    /**
     *  Updates the previous history record
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update_previous_history(SqlDB * db)
    {
        if ( previous_history == 0 )
        {
            return -1;
        }

        return previous_history->update(db);
    };

    /**
     * Updates the VM search information.
     *
     * @param db pointer to the db
     * @return 0 on success
     */
    int update_search(SqlDB * db);

    /**
     *  Function that renders the VM in XML format optinally including
     *  extended information (all history records)
     *  @param xml the resulting XML string
     *  @param n_history Number of history records to include:
     *      0: none
     *      1: the last one
     *      2: all
     *  @param sa include scheduled action information
     *  @return a reference to the generated string
     */
    std::string& to_xml_extended(std::string& xml, int n_history, bool sa) const;

    std::string& to_json(std::string& json) const;

    // -------------------------------------------------------------------------
    // Attribute Parser
    // -------------------------------------------------------------------------

    /**
     *  Attributes not allowed in NIC_DEFAULT to avoid authorization bypass and
     *  inconsistencies for NIC_DEFAULTS
     */
    static const char* NO_NIC_DEFAULTS[];
    static const int   NUM_NO_NIC_DEFAULTS;

    /**
     * Known Virtual Router attributes, to be moved from the user template
     * to the template
     */
    static const char* VROUTER_ATTRIBUTES[];
    static const int   NUM_VROUTER_ATTRIBUTES;

    /**
     *  Parse a string and substitute variables (e.g. $NAME) using the VM
     *  template values:
     *    @param attribute, the string to be parsed
     *    @param parsed, the resulting parsed string
     *    @param error description in case of failure
     *    @return 0 on success.
     */
    int  parse_template_attribute(const std::string& attribute,
                                  std::string&       parsed,
                                  std::string&       error);

    /**
     *  Parse a file string variable (i.e. $FILE) using the FILE_DS datastores.
     *  It should be used for OS/DS_KERNEL, OS/DS_INITRD, CONTEXT/DS_FILES.
     *    @param attribute the string to be parsed
     *    @param img_ids ids of the FILE images in the attribute
     *    @param error description in case of failure
     *    @return 0 on success.
     */
    int  parse_file_attribute(std::string       attribute,
                              std::vector<int>& img_ids,
                              std::string&      error);

    /**
     *  Generates image attributes (DS_ID, TM_MAD, SOURCE...) for KERNEL and
     *  INITRD files.
     *    @param os attribute of the VM template
     *    @param base_name of the attribute "KERNEL", or "INITRD"
     *    @param base_type of the image attribute KERNEL, RAMDISK
     *    @param error_str Returns the error reason, if any
     *    @return 0 on succes
     */
    int set_os_file(VectorAttribute* os, const std::string& base_name,
                    Image::ImageType base_type, std::string& error_str);

    /**
     *  Parse the "OS" attribute of the template by substituting
     *  $FILE variables
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_os(std::string& error_str);

    /**
     *  Parse the "CPU_MODEL" attribute of the template
     *    @return 0 on success
     */
    int parse_cpu_model(Template * tmpl);

    /**
     * Parse the "NIC_DEFAULT" attribute
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_defaults(std::string& error_str, Template * tmpl);

    /**
     * Parse virtual router related attributes
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_vrouter(std::string& error_str, Template * tmpl);

    /**
     * Parse the "PCI" attribute of the template and checks mandatory attributes
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_pci(std::string& error_str, Template * tmpl);

    /**
     *  Parse the "SCHED_REQUIREMENTS" attribute of the template by substituting
     *  $VARIABLE, $VARIABLE[ATTR] and $VARIABLE[ATTR, ATTR = VALUE]
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int parse_requirements(std::string& error_str);

    /**
     *  Parse the "GRAPHICS" attribute and generates a default PORT if not
     *  defined
     */
    int parse_graphics(std::string& error_str, Template * tmpl);

    /**
     *  Parse the "VIDEO" attribute to verify the TYPE exists, and that the VRAM
     *  and RESOLUTION values are a good format
    */
    int parse_video(std::string& error_str, Template * tmpl);

    /**
     * Searches the meaningful attributes and moves them from the user template
     * to the internal template
     */
    void parse_well_known_attributes();

    // -------------------------------------------------------------------------
    // Context related functions
    // -------------------------------------------------------------------------
    /**
     *  Generate the NETWORK related CONTEXT setions, i.e. ETH_*. This function
     *  is invoked when ever the context is prepared for the VM to capture
     *  netowrking updates.
     *    @param context attribute of the VM
     *    @param error string if any
     *    @param  only_auto boolean to generate context only for vnets
     *            with NETWORK_MODE = auto
     *    @return 0 on success
     */
    int generate_network_context(VectorAttribute * context, std::string& error,
                                 bool only_auto);

    /**
     *  Deletes the NETWORK related CONTEXT section for the given nic, i.e.
     *  ETH_<id>
     *    @param nicid the id of the NIC
     */
    void clear_nic_context(int nicid);

    /**
     *  Deletes the NETWORK ALIAS related CONTEXT section for the given nic, i.e.
     *  ETH_<id>_ALIAS<aliasid>
     *    @param nicid the id of the NIC
     *    @param aliasid the idx of the ALIAS
     */
    void clear_nic_alias_context(int nicid, int aliasidx);

    /**
     *  Generate the PCI related CONTEXT setions, i.e. PCI_*. This function
     *  is also adds basic network attributes for pass-through NICs
     *    @param context attribute of the VM
     *    @return true if the net context was generated.
     */
    bool generate_pci_context(VectorAttribute * context);

    /**
     *  Deletes the PCI (non NIC) related CONTEXT section for the given nic, i.e.
     *  PCI<id>_ADDRESS
     *    @param pciid the id of the PCI
     */
    void clear_pci_context(VectorAttribute * pci);

    /**
     *  Deletes the PCI (non NIC) related CONTEXT section for the given nic, i.e.
     *  PCI<id>_ADDRESS
     *    @param pci device to add context for
     */
    void add_pci_context(VectorAttribute * pci);

    /**
     *  Generate the ONE_GATE token & url
     *    @param context attribute of the VM
     *    @param error_str describing the error
     *    @return 0 if success
     */
    int generate_token_context(VectorAttribute * context,
                               std::string& error_str);

    /**
     *  Parse the "CONTEXT" attribute of the template by substituting
     *  $VARIABLE, $VARIABLE[ATTR] and $VARIABLE[ATTR, ATTR = VALUE]
     *    @param error_str Returns the error reason, if any
     *    @param  only_auto boolean to parse only the context for vnets
     *            with NETWORK_MODE = auto
     *    @return 0 on success
     */
    int parse_context(std::string& error_str, bool all_nics);

    /**
     * Parses the current contents of the context vector attribute, without
     * adding any attributes. Substitutes $VARIABLE, $VARIABLE[ATTR] and
     * $VARIABLE[ATTR, ATTR = VALUE]
     *   @param pointer to the context attribute. It will be updated to point
     *   to the new parsed CONTEXT
     *   @param error_str description in case of error
     *   @return 0 on success
     */
    int parse_context_variables(VectorAttribute ** context,
                                std::string& error_str);

    // -------------------------------------------------------------------------
    // Management helpers: NIC, DISK and VMGROUP
    // -------------------------------------------------------------------------
    /**
     *  Get network leases (no auto NICs, NETWORK_MODE != auto) for this VM
     *  @return 0 if success
     */
    int get_network_leases(std::string &error_str);

    /**
     *  Get all disk images for this Virtual Machine
     *  @param error_str Returns the error reason, if any
     *  @return 0 if success
     */
    int get_disk_images(std::string &error_str);

    /**
     *  Adds the VM to the VM group if needed
     *  @param error_str Returns the error reason, if any
     *  @return 0 if success
     */
    int get_vmgroup(std::string& error);

    // ------------------------------------------------------------------------
    // Public cloud templates related functions
    // ------------------------------------------------------------------------
    /**
     * Gets the list of public clouds defined in this VM.
     * @param clouds list to store the cloud hypervisors in the template
     * @return the number of public cloud hypervisors
     */
    int get_public_clouds(std::set<std::string> &clouds) const
    {
        get_public_clouds("PUBLIC_CLOUD", clouds);

        return clouds.size();
    };

    /**
     * Same as above but specifies the attribute name to handle old versions
     * @param name Attribute name
     * @param clouds list to store the cloud hypervisors in the template
     */
    void get_public_clouds(const std::string& name,
                           std::set<std::string> &clouds) const;

    /**
     *  Parse the public cloud attributes and subsititue variable definition
     *  for the values in the template, i.e.:
     *    INSTANCE_TYPE="m1-small"
     *
     *    PUBLIC_CLOUD=[ TYPE="ec2", INSTANCE="$INSTANCE_TYPE"...
     *
     *  @param error description if any
     *  @return -1 in case of error
     */
    int parse_public_clouds(std::string& error)
    {
        int rc = parse_public_clouds("PUBLIC_CLOUD", error);

        if (rc == 0)
        {
            rc = parse_public_clouds("EC2", error);
        }

        return rc;
    };

    /**
     * Same as above but specifies the attribute name to handle old versions
     */
    int parse_public_clouds(const char *name, std::string& error);

    /**
     *  Encrypt all secret attributes
     */
    void encrypt() override;

    /**
     *  Decrypt all secret attributes
     */
    void decrypt() override;

protected:

    //**************************************************************************
    // Constructor
    //**************************************************************************

    VirtualMachine(int id,
                   int uid,
                   int gid,
                   const std::string& uname,
                   const std::string& gname,
                   int umask,
                   std::unique_ptr<VirtualMachineTemplate> _vm_template);

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    /**
     *  Reads the Virtual Machine (identified with its OID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db) override;

    /**
     *  Writes the Virtual Machine and its associated template in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db, std::string& error_str) override;

    /**
     *  Writes/updates the Virtual Machine data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Deletes a VM from the database and all its associated information
     *   @param db pointer to the db
     *   @return -1
     */
    int drop(SqlDB * db) override
    {
        NebulaLog::log("ONE", Log::ERROR, "VM Drop not implemented!");
        return -1;
    }

};

#endif /*VIRTUAL_MACHINE_H_*/
