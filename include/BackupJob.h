/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef BACKUP_JOB_H_
#define BACKUP_JOB_H_

#include "PoolObjectSQL.h"
#include "ObjectXML.h"
#include "ObjectCollection.h"

/**
 *  The BackuJob class, it organize backups of multiple VMs
 *
 *  The schema is as follows:
 *  <BACKUPJOB>
 *
 *   <!-- PoolObjectSQL attributes -->
 *
 *   <PRIORITY> Of this backup job. BJ with higher priority are scheduled first
 *   <SCHED_ACTIONS> List of associated scheduled action
 *     <ID>
 *   <UPDATED_VMS> VMs with all backups up to date
 *     <ID>
 *   <OUTDATED_VMS> VMs that need a backup
 *     <ID>
 *   <BACKING_UP_VMS> VMs with an ongoing backup operation
 *     <ID>
 *   <ERROR_VMS>  VMs that fail the last backup operation
 *     <ID>
 *   <LAST_BACKUP_TIME> Last time the backup job was triggered
 *   <LAST_BACKUP_DURATION> Time to backup all VMs int the backup job
 *   <TEMPLATE>
 *     <KEEP_LAST> Just keep the last N backups
 *     <BACKUP_VOLATILE> Backup volatile disks or not
 *     <FS_FREEZE> FS freeze operation to perform on the VM
 *     <MODE> Backup mode
 *     <BACKUP_VMS> comma separated list of VMs to backup, order is implicit
 *     <DATASTORE_ID> The dastore ID used to store the active backups
 *     <EXECUTION>
 */
class BackupJob : public PoolObjectSQL
{
public:
    // *************************************************************************
    // Priority Limits
    // *************************************************************************
    static const int MAX_PRIO;

    static const int MIN_PRIO;

    static const int MAX_USER_PRIO;

    // *************************************************************************
    // Backup modes
    // *************************************************************************
    enum Execution
    {
        SEQUENTIAL = 0, /** < Backup VMs one by one  */
        PARALLEL   = 1, /** < Backup all VMs in parallel */
    };

    static std::string execution_to_str(Execution exec)
    {
        switch (exec)
        {
            case SEQUENTIAL: return "SEQUENTIAL";
            case PARALLEL:   return "PARALLEL";
            default:         return "";
        }
    };

    static Execution str_to_execution(std::string& str_exec)
    {
        Execution exec = SEQUENTIAL;

        one_util::toupper(str_exec);

        if ( str_exec == "SEQUENTIAL" )
        {
            exec = SEQUENTIAL;
        }
        else if ( str_exec == "PARALELL" )
        {
            exec = PARALLEL;
        }

        return exec;
    };

    /**
     * Function to print the BackuJob object into a string in
     * XML format.
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override
    {
        return to_xml_extended(xml, false);
    }

    std::string& to_xml_extended(std::string& xml, bool do_sa) const;

    /**
     * Starts execution of the Backup Job
     * Add VMs to WAITING_VMS list, the backup of individual VMs
     * is managed by Scheduled Action Manager
     */
    int execute(std::string& error);

    /**
     * Cancel pending Backup Job action, clear the waiting and pending list
     */
    void cancel();

    /**
     * Retry Backup Job, move VMs from error list to outdated
     */
    void retry();

    /**
     * Returns VMs waiting for a backup, the order define the priority
     */
    std::vector<int> backup_vms() const
    {
        std::string vms_str;
        std::vector<int> vms;
        get_template_attribute("BACKUP_VMS", vms_str);

        one_util::split(vms_str, ',', vms);

        return vms;
    }

    /**
     * Returns VMs waiting for a backup, the order define the priority
     */
    const std::set<int>& outdated() const
    {
        return _outdated.get_collection();
    }

    /**
     * Returns VMs that are currently being backed up
     */
    const std::set<int>& backing_up() const
    {
        return _backing_up.get_collection();
    }

    /**
     * Get priority
     */
    int priority() const
    {
        return _priority;
    }

    /**
     * Set priority
     */
    void priority(int pr)
    {
        if ( pr >= MIN_PRIO && pr <= MAX_PRIO )
        {
            _priority = pr;
        }
    }

    /**
     * Returns execution mode: SEQUENTIAL or PARALLEL
    */
    Execution exec_mode() const;

    /**
     * Returns Datastore ID, where to backup the VMs
    */
    int ds_id() const;

    /**
     * Returns the 'reset' attribute for the Backup Config
    */
    int reset() const;

    /**
     * VM backup started, move the VM from waiting to pending list
    */
    void backup_started(int vm_id);

    /**
     * Remove Virtual Machine from outdated and VMS list
    */
    void remove_vm(int vm_id);

    /**
     * VM backup finished, remove it from backing_up list
    */
    void backup_finished(int vm_id, bool success);

    /**
     * Add Virtual Machine to error_vms list
    */
    void add_error(int vm_id);

    /**
     * Return Backup Config in format for Virtual Machine
    */
    void get_backup_config(Template &tmpl);

    /**
     * Get IDs of the associated scheduled actions
     */
    ObjectCollection& sched_actions()
    {
        return _sched_actions;
    }

    const ObjectCollection& sched_actions() const
    {
        return _sched_actions;
    }

    /**
     *  Replace template for this object. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int replace_template(const std::string& tmpl_str,
                                 bool keep_restricted,
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

    friend class BackupJobPool;
    friend class PoolSQL;

protected:
    /**
     * Child classes can process the new template set with replace_template or
     * append_template with this method
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error) override
    {
        remove_template_attribute("NAME");
        remove_template_attribute("PRIORITY");
        remove_template_attribute("SCHED_ACTION");

        return parse(error);
    }

    // *************************************************************************
    // Database implementation
    // *************************************************************************
    /**
     *  Bootstraps the database table(s) associated to the Backup Jobs
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes the BackupJob to the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int insert(SqlDB * db, std::string& error_str) override;

    /**
     *  Updates the BackupJob record
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
     int update(SqlDB * db) override;

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 on success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

private:
    /**
     *  Priority for this backup job [0, 99]
     */
    int _priority;

    /**
     * Associated scheduled action for this backup job
     */
    ObjectCollection _sched_actions;

    /**
     *  These collections stores the collection of VMs in the Virtual
     *  Networks and manages the update process
     *    - updated VMs with not pending backups
     *    - outdated VMs that need backup
     *    - backing_up VMs with an ongoing backup operation
     *    - error VMs that fail the last backup operation
     */
    ObjectCollection _updated;

    ObjectCollection _outdated;

    ObjectCollection _backing_up;

    ObjectCollection _error;

    /**
     *  Time stats for the last backup action (start - epoch, duration - sec)
     */
    time_t _last_time;

    time_t _last_duration;

    /**
     *  @param uid
     *  @param id
     *  @param uname
     *  @param gname
     *  @param umask
     *  @param tmpl
     */
    BackupJob(int                 uid,
              int                 gid,
              const std::string&  uname,
              const std::string&  gname,
              int                 umask,
              std::unique_ptr<Template> templ);

    /**
     *  Factory method for Hook templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<Template>(true);
    }

    /*
     * Parse configuration attributes for the backup operation
     *  - KEEP_LAST
     *  - BACKUP_VOLATILE
     *  - FSFREEZE
     *  - MODE
     *  - BACKUP_VMS
     *
     * This method also updates the VMs collections removing those VMs no longer
     * present in BACKUP_VMS
     */
    int parse(std::string& error);

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     * Check if the VM belongs only to one Backup Job.
     * Assign Backup Job ID to added Virtual Machines, remove ID for removed VMs.
     *   @param vms_new_str New value of BACKUP_VMS attribute
     *   @param vms_old_str Old value of BACKUP_VMS attribute
     *   @param error string describing the error if any
     *   @return 0 on success, -1 otherwise
     */
    int process_backup_vms(const std::string& vms_new_str,
                           const std::string& vms_old_str,
                                 std::string& error);

    /**
     * Remove Backup Job ID from Virtual Machines listed in BACKUP_VMS attribute
     */
    void remove_id_from_vms();

    /**
     * Remove Backup Job ID from Virtual Machines
     *   @param vms Virtual Machine IDs to remove the Backup Job ID
     */
    void remove_id_from_vms(const std::set<unsigned int>& vms);
};

#endif /*BACKUP_JOB_H_*/

