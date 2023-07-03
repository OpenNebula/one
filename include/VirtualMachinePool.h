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

#ifndef VIRTUAL_MACHINE_POOL_H_
#define VIRTUAL_MACHINE_POOL_H_

#include "PoolSQL.h"
#include "VirtualMachine.h"
#include "OneDB.h"

#include <time.h>

/**
 *  The Virtual Machine Pool class. ...
 */
class VirtualMachinePool : public PoolSQL
{
public:

    VirtualMachinePool(SqlDB * db,
                       const std::vector<const SingleAttribute *>& restricted_attrs,
                       const std::vector<const SingleAttribute *>& encrypted_attrs,
                       bool                         on_hold,
                       float                        default_cpu_cost,
                       float                        default_mem_cost,
                       float                        default_disk_cost,
                       bool                         showback_only_running);

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
        const std::string&       uname,
        const std::string&       gname,
        int                      umask,
        std::unique_ptr<VirtualMachineTemplate> vm_template,
        int *                    oid,
        std::string&             error_str,
        bool                     on_hold = false);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the VM unique identifier
     *   @return a pointer to the VM, nullptr in case of failure
     */
    std::unique_ptr<VirtualMachine> get(int     oid)
    {
        return PoolSQL::get<VirtualMachine>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the VM unique identifier
     *   @return a pointer to the VM, nullptr in case of failure
     */
    std::unique_ptr<VirtualMachine> get_ro(int     oid)
    {
        return PoolSQL::get_ro<VirtualMachine>(oid);
    }

    /**
     *  Function to get a VM from the pool, string version for VM ID
     */
    std::unique_ptr<VirtualMachine> get(const std::string& oid_s)
    {
        std::istringstream iss(oid_s);
        int                oid;

        iss >> oid;

        if ( iss.fail() )
        {
            return 0;
        }

        return PoolSQL::get<VirtualMachine>(oid);
    }

    /**
     *  Function to get a read only VM from the pool, string version for VM ID
     */
    std::unique_ptr<VirtualMachine> get_ro(const std::string& oid_s)
    {
        std::istringstream iss(oid_s);
        int                oid;

        iss >> oid;

        if ( iss.fail() )
        {
            return 0;
        }

        return PoolSQL::get_ro<VirtualMachine>(oid);
    }

    /**
     *  Updates a VM in the data base. The VM SHOULD be locked. It also updates
     *  the previous state after executing the hooks.
     *    @param objsql a pointer to the VM
     *
     *    @return 0 on success.
     */
    int update(PoolObjectSQL * objsql) override;

    /**
     *  Gets a VM ID by its deploy_id, the dedploy_id - VM id mapping is keep
     *  in the import_table.
     *    @param deploy_id to search the id for
     *    @return -1 if not found or VMID
     *
     */
    int get_vmid(const std::string& deploy_id);

    /**
     *  Function to get the IDs of running VMs
     *   @param oids a vector that contains the IDs
     *   @param vm_limit Max. number of VMs returned
     *   @param last_poll Return only VMs which last_poll is less than or equal
     *          to this value.
     *   @return 0 on success
     */
    int get_running(
        std::vector<int>&    oids,
        int             vm_limit,
        time_t          last_poll);

    /**
     *  Function to get the IDs of pending VMs
     *   @param oids a vector that contains the IDs
     *   @return 0 on success
     */
    int get_pending(
        std::vector<int>&    oids);

    /**
     *  Function to get the IDs of VMs in backup state
     *   @param oids a vector that contains the IDs
     *   @return 0 on success
     */
    int get_backup(std::vector<int>& oids);

    /**
     *  Gets the IDs of VMs matching the given SQL where string.
     *    @param oids a vector that contains the IDs
     *    @param where SQL clause
     *    @return 0 on success
     */
    int search(std::vector<int>& oids, const std::string& where)
    {
        return PoolSQL::search(oids, one_db::vm_table, where);
    };

    //--------------------------------------------------------------------------
    // Virtual Machine DB access functions
    //--------------------------------------------------------------------------

    /**
     *  Insert a new history record of a VM, the vm's mutex SHOULD be locked
     *    @param vm pointer to the virtual machine object
     *    @return 0 on success
     */
    int insert_history(
        VirtualMachine * vm)
    {
        return vm->insert_history(db);
    }

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
     *  Updates the VM's search information
     *    @param vm pointer to the virtual machine object
     *    @return 0 on success
     */
    int update_search(
        VirtualMachine * vm)
    {
        return vm->update_search(db);
    }

    /**
     *  Bootstraps the database table(s) associated to the VirtualMachine pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        int rc;
        std::ostringstream oss_import(one_db::vm_import_db_bootstrap);

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
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
        bool desc) override
    {
        return PoolSQL::dump(oss, "VM_POOL", "short_body", one_db::vm_table, where,
                             sid, eid, desc);
    };

    /**
     *  Dumps the VM pool in extended XML format
     *  A filter can be also added to the query
     *  Also the hostname where the VirtualMachine is running is added to the
     *  pool
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump_extended(std::string& oss, const std::string& where,
                      int sid, int eid,
                      bool desc) override
    {
        return PoolSQL::dump(oss, "VM_POOL", "body", one_db::vm_table, where,
                             sid, eid, desc);
    };

    /**
     *  Dumps the VM accounting information in XML format. A filter can be also
     *  added to the query as well as a time frame.
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param time_start start date to include history record
     *  @param time_end end date to include history record
     *
     *  @return 0 on success
     */
    int dump_acct(std::string&       oss,
                  const std::string& where,
                  int                time_start,
                  int                time_end);

    /**
     *  Dumps the VM accounting information in XML format. Faster version,
     *  which doesn't allow filters, except time. Allows paging.
     *  @param oss the output stream to dump the pool contents
     *  @param time_start start date to include history record
     *  @param time_end end date to include history record
     *  @param sid first element used for pagination
     *  @param rows number of records to retrieve, -1 to disable
     *
     *  @return 0 on success
     */
    int dump_acct(std::string&       oss,
                  int                time_start,
                  int                time_end,
                  int                sid = 0,
                  int                rows = -1);
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
    int dump_showback(std::string&       oss,
                      const std::string& where,
                      int                start_month,
                      int                start_year,
                      int                end_month,
                      int                end_year);

    /**
     *  Dumps the VM monitoring information entries in XML format. A filter
     *  can be also added to the query.
     *
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param seconds Retrieve monitor records in the last seconds
     *
     *  @return 0 on success
     */
    int dump_monitoring(std::string& oss, const std::string&  where, const int seconds);

    /**
     *  Dumps the VM monitoring information  for a single VM
     *
     *  @param oss the output stream to dump the pool contents
     *  @param vmid id of the target VM
     *
     *  @return 0 on success
     */
    int dump_monitoring(std::string& oss, int vmid)
    {
        std::ostringstream filter;

        filter << "oid = " << vmid;

        return dump_monitoring(oss, filter.str(), -1);
    }

    /**
     * Returns last monitoring info for a VM
     *  @param vmid Virtual Machine id
     */
    VirtualMachineMonitorInfo get_monitoring(int vmid);

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
                std::string &error_str);

    /**
     * Deletes the DISK that was in the process of being attached. Releases
     * Images and updates usage quotas
     *
     * @param vm unique_ptr to VM, will be release in the method
     */
    void delete_attach_disk(std::unique_ptr<VirtualMachine> vm);

    /**
     * Deletes the NIC that was in the process of being attached/detached
     *
     * @param vm unique_ptr to VM, will be release in the method
     */
    void delete_attach_nic(std::unique_ptr<VirtualMachine> vm);

    /**
     * Deletes an entry in the HV-2-vmid mapping table for imported VMs
     *   @param deploy_id of the VM
     */
    void drop_index(const std::string& deploy_id);

private:
    /**
     *  Factory method to produce VM objects
     *    @return a pointer to the new VM
     */
    PoolObjectSQL * create() override
    {
        return new VirtualMachine(-1,-1,-1,"","",0,0);
    };

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
     * Switch for showback cpu and memory cost calculation
     *  - true:  count only running VMs for CPU and MEMORY
     *  - false: include reservations for CPU and MEMORY
     *           this includes poweroff and suspended VM states
     * note: datastore cost is always counted in poweroff and suspended state
     */
    bool _showback_only_running;

    /**
     * Callback used to get an int in the DB it is used by VM Pool in:
     *   - calculate_showback (min_stime)
     *   - get_vmid (vmid)
     */
    int db_int_cb(void * _min_stime, int num, char **values, char **names);

    /**
     * Insert deploy_id - vmid index.
     *   @param replace will replace and not insert
     *   @return 0 on success
     */
    int insert_index(const std::string& deploy_id, int vm_id, bool replace);
};

#endif /*VIRTUAL_MACHINE_POOL_H_*/
