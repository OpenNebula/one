/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUAL_MACHINE_POOL_H_
#define VIRTUAL_MACHINE_POOL_H_

#include "PoolSQL.h"
#include "VirtualMachine.h"

#include <time.h>

using namespace std;

/**
 *  The Virtual Machine Pool class. ...
 */
class VirtualMachinePool : public PoolSQL
{
public:

    VirtualMachinePool(SqlDB *                      db,
                       vector<const VectorAttribute *> hook_mads,
                       const string&                hook_location,
                       const string&                remotes_location,
                       vector<const SingleAttribute *>& restricted_attrs,
                       time_t                       expire_time,
                       bool                         on_hold,
                       float                        default_cpu_cost,
                       float                        default_mem_cost,
                       float                        default_disk_cost);

    ~VirtualMachinePool(){};

    /**
     *  Function to allocate a new VM object
     *    @param uid user id (the owner of the VM)
     *    @param gid the id of the group this object is assigned to
     *    @param uname user name
     *    @param gname group name
     *    @param umask permissions umask
     *    @param vm_template a VM Template object describing the VM
     *    @param oid the id assigned to the VM (output)
     *    @param error_str Returns the error reason, if any
     *    @param on_hold flag to submit on hold
     *
     *    @return oid on success, -1 error inserting in DB or -2 error parsing
     *  the template
     */
    int allocate (
        int                      uid,
        int                      gid,
        const string&            uname,
        const string&            gname,
        int                      umask,
        VirtualMachineTemplate * vm_template,
        int *                    oid,
        string&                  error_str,
        bool                     on_hold = false);

    /**
     *  Function to get a VM from the pool, if the object is not in memory
     *  it is loade from the DB
     *    @param oid VM unique id
     *    @param lock locks the VM mutex
     *    @return a pointer to the VM, 0 if the VM could not be loaded
     */
    VirtualMachine * get(
        int     oid,
        bool    lock)
    {
        return static_cast<VirtualMachine *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Function to get a VM from the pool, string version for VM ID
     */
    VirtualMachine * get(
        const string& oid_s,
        bool          lock)
    {
        istringstream iss(oid_s);
        int           oid;

        iss >> oid;

        if ( iss.fail() )
        {
            return 0;
        }

        return static_cast<VirtualMachine *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Updates a VM in the data base. The VM SHOULD be locked. It also updates
     *  the previous state after executing the hooks.
     *    @param objsql a pointer to the VM
     *
     *    @return 0 on success.
     */
    virtual int update(PoolObjectSQL * objsql)
    {
        VirtualMachine * vm = dynamic_cast<VirtualMachine *>(objsql);

        if ( vm == 0 )
        {
            return -1;
        }

        do_hooks(objsql, Hook::UPDATE);

        vm->set_prev_state();

        return vm->update(db);
    };

    /**
     *  Gets a VM ID by its deploy_id, the dedploy_id - VM id mapping is keep
     *  in the import_table.
     *    @param deploy_id to search the id for
     *    @return -1 if not found or VMID
     *
     */
    int get_vmid(const string& deploy_id);

    /**
     *  Function to get the IDs of running VMs
     *   @param oids a vector that contains the IDs
     *   @param vm_limit Max. number of VMs returned
     *   @param last_poll Return only VMs which last_poll is less than or equal
     *          to this value.
     *   @return 0 on success
     */
    int get_running(
        vector<int>&    oids,
        int             vm_limit,
        time_t          last_poll);

    /**
     *  Function to get the IDs of pending VMs
     *   @param oids a vector that contains the IDs
     *   @return 0 on success
     */
    int get_pending(
        vector<int>&    oids);

    /**
     *  Gets the IDs of VMs matching the given SQL where string.
     *    @param oids a vector that contains the IDs
     *    @param where SQL clause
     *    @return 0 on success
     */
    int search(vector<int>& oids, const string& where)
    {
        return PoolSQL::search(oids, VirtualMachine::table, where);
    };

    //--------------------------------------------------------------------------
    // Virtual Machine DB access functions
    //--------------------------------------------------------------------------

    /**
     *  Updates the history record of a VM, the vm's mutex SHOULD be locked
     *    @param vm pointer to the virtual machine object
     *    @return 0 on success
     */
    int update_history(
        VirtualMachine * vm)
    {
        return vm->update_history(db);
    }

    /**
     *  Updates the previous history record, the vm's mutex SHOULD be locked
     *    @param vm pointer to the virtual machine object
     *    @return 0 on success
     */
    int update_previous_history(
        VirtualMachine * vm)
    {
        return vm->update_previous_history(db);
    }

    /**
     * Inserts the last monitoring, and deletes old monitoring entries for this
     * VM
     *
     * @param vm pointer to the virtual machine object
     * @return 0 on success
     */
    int update_monitoring(
        VirtualMachine * vm)
    {
        if ( _monitor_expiration <= 0 )
        {
            return 0;
        }

        return vm->update_monitoring(db);
    };

    /**
     * Deletes the expired monitoring entries for all VMs
     *
     * @return 0 on success
     */
    int clean_expired_monitoring();

    /**
     * Deletes all monitoring entries for all VMs
     *
     * @return 0 on success
     */
    int clean_all_monitoring();

    /**
     *  Bootstraps the database table(s) associated to the VirtualMachine pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        int rc;
        ostringstream oss_import(import_db_bootstrap);

        rc  = VirtualMachine::bootstrap(_db);
        rc += _db->exec_local_wr(oss_import);

        return rc;
    };

    /**
     *  Dumps the VM pool in XML format. A filter can be also added to the query
     *  Also the hostname where the VirtualMachine is running is added to the
     *  pool
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where, const string& limit)
    {
        return PoolSQL::dump(oss, "VM_POOL", VirtualMachine::table, where,
                             limit);
    };

    /**
     *  Dumps the VM accounting information in XML format. A filter can be also
     *  added to the query as well as a time frame.
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump_acct(ostringstream& oss,
                  const string&  where,
                  int            time_start,
                  int            time_end);

    /**
     *  Dumps the VM showback information in XML format. A filter can be also
     *  added to the query as well as a time frame.
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param start_month First month (+year) to include. January is 1.
     *  Use -1 to unset
     *  @param start_year First year (+month) to include. e.g. 2014.
     *  Use -1 to unset
     *  @param end_month Last month (+year) to include. January is 1.
     *  Use -1 to unset
     *  @param end_year Last year (+month) to include. e.g. 2014.
     *  Use -1 to unset
     *
     *  @return 0 on success
     */
    int dump_showback(ostringstream& oss,
                      const string&  where,
                      int            start_month,
                      int            start_year,
                      int            end_month,
                      int            end_year);

    /**
     *  Dumps the VM monitoring information entries in XML format. A filter
     *  can be also added to the query.
     *
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump_monitoring(ostringstream& oss,
                        const string&  where);

    /**
     *  Dumps the VM monitoring information  for a single VM
     *
     *  @param oss the output stream to dump the pool contents
     *  @param vmid id of the target VM
     *
     *  @return 0 on success
     */
    int dump_monitoring(ostringstream& oss,
                        int            vmid)
    {
        ostringstream filter;

        filter << "oid = " << vmid;

        return dump_monitoring(oss, filter.str());
    }

    /**
     * Processes all the history records, and stores the monthly cost for each
     * VM
     *  @param start_month First month (+year) to process. January is 1.
     *  Use -1 to unset
     *  @param start_year First year (+month) to process. e.g. 2014.
     *  Use -1 to unset
     *  @param end_month Last month (+year) to process. January is 1.
     *  Use -1 to unset
     *  @param end_year Last year (+month) to process. e.g. 2014.
     *  Use -1 to unset
     *  @param error_str Returns the error reason, if any
     *
     *  @return 0 on success
     */
    int calculate_showback(
                int start_month,
                int start_year,
                int end_month,
                int end_year,
                string &error_str);

    /**
     * Deletes the DISK that was in the process of being attached. Releases
     * Images and updates usage quotas
     *
     * @param vid VM id
     */
    void delete_attach_disk(int vid);

    /**
     * Deletes the NIC that was in the process of being attached
     *
     * @param vid VM id
     */
    void attach_nic_failure(int vid)
    {
        delete_hotplug_nic(vid, true);
    }

    /**
     * Deletes the NIC that was in the process of being detached
     *
     * @param vid VM id
     */
    void detach_nic_success(int vid)
    {
        delete_hotplug_nic(vid, false);
    }

    /**
     * Deletes an entry in the HV-2-vmid mapping table for imported VMs
     *   @param deploy_id of the VM
     */
    void drop_index(const string& deploy_id);

private:
    /**
     *  Factory method to produce VM objects
     *    @return a pointer to the new VM
     */
    PoolObjectSQL * create()
    {
        return new VirtualMachine(-1,-1,-1,"","",0,0);
    };

    /**
     * Size, in seconds, of the historical monitoring information
     */
    time_t _monitor_expiration;

    /**
     * True or false whether to submit new VM on HOLD or not
     */
    bool _submit_on_hold;

    /**
     * Default values for cpu and memory cost
     */
    float _default_cpu_cost;
    float _default_mem_cost;
    float _default_disk_cost;

    /**
     * Callback used to get an int in the DB it is used by VM Pool in:
     *   - calculate_showback (min_stime)
     *   - get_vmid (vmid)
     */
    int db_int_cb(void * _min_stime, int num, char **values, char **names);

    // -------------------------------------------------------------------------
    // Virtual Machine ID - Deploy ID index for imported VMs
    // The index is managed by the VirtualMachinePool
    // -------------------------------------------------------------------------
    static const char * import_table;

    static const char * import_db_names;

    static const char * import_db_bootstrap;

    /**
     * Insert deploy_id - vmid index.
     *   @param replace will replace and not insert
     *   @return 0 on success
     */
    int insert_index(const string& deploy_id, int vm_id, bool replace);

    // -------------------------------------------------------------------------

    /**
     * Helper method for delete attach/detach
     * @param vid VM id
     * @param attach true for an attach action, false for detach
     */
    void delete_hotplug_nic(int vid, bool attach);
};

#endif /*VIRTUAL_MACHINE_POOL_H_*/
