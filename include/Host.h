/* ------------------------------------------------------------------------ */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#ifndef HOST_H_
#define HOST_H_

#include "PoolSQL.h"
#include "HostTemplate.h"
#include "HostShare.h"
#include "ClusterableSingle.h"
#include "ObjectCollection.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"

using namespace std;

/**
 *  The Host class.
 */
class Host : public PoolObjectSQL, public ClusterableSingle
{
public:

    //  HOST STATES                   +----------------+
    //                                |  VM DEPLOYMENT |
    //  +----------------+------------+--------+-------+
    //  | STATE          | MONITORING | MANUAL | SCHED |
    //  +----------------+------------+--------+-------+
    //  | INIT/MONITORED |    Yes     |       Yes      |
    //  +----------------+------------+--------+-------+
    //  | DISABLED       |    Yes     | Yes    |  No   |
    //  +----------------+------------+----------------+
    //  | OFFLINE        |    No      |        No      |
    //  +----------------+-----------------------------+

    enum HostState
    {
        INIT                 = 0, /**< Initial state for enabled hosts. */
        MONITORING_MONITORED = 1, /**< Monitoring the host (from monitored). */
        MONITORED            = 2, /**< The host has been monitored. */
        ERROR                = 3, /**< An error ocurrer in host monitoring. */
        DISABLED             = 4, /**< The host is disabled see above. */
        MONITORING_ERROR     = 5, /**< Monitoring the host (from error). */
        MONITORING_INIT      = 6, /**< Monitoring the host (from init). */
        MONITORING_DISABLED  = 7, /**< Monitoring the host (from disabled). */
        OFFLINE              = 8  /**< The host is set offline, see above */
    };

    /**
     *  Functions to convert to/from string the Host states
     */
    static int str_to_state(std::string& st, HostState& state)
    {
        one_util::toupper(st);

        state = INIT;

        if ( st == "INIT" ) {
            state = INIT;
        } else if ( st == "MONITORING_MONITORED" ) {
            state = MONITORING_MONITORED;
        } else if ( st == "MONITORED" ) {
            state = MONITORED;
        } else if ( st == "ERROR" ) {
            state = ERROR;
        } else if ( st == "DISABLED" ) {
            state = DISABLED;
        } else if ( st == "MONITORING_ERROR" ) {
            state = MONITORING_ERROR;
        } else if ( st == "MONITORING_INIT" ) {
            state = MONITORING_INIT;
        } else if ( st == "MONITORING_DISABLED" ) {
            state = MONITORING_DISABLED;
        } else if ( st == "OFFLINE" ) {
            state = OFFLINE;
        }
        else
        {
            return -1;
        }

        return 0;
    }

    static string& state_to_str(std::string& st, HostState state)
    {
        st = "";

        switch (state)
        {
            case INIT:
                st = "INIT";
                break;
            case MONITORING_MONITORED:
                st = "MONITORING_MONITORED";
                break;
            case MONITORED:
                st = "MONITORED";
                break;
            case ERROR:
                st = "ERROR";
                break;
            case DISABLED:
                st = "DISABLED";
                break;
            case MONITORING_ERROR:
                st = "MONITORING_ERROR";
                break;
            case MONITORING_INIT:
                st = "MONITORING_INIT";
                break;
            case MONITORING_DISABLED:
                st = "MONITORING_DISABLED";
                break;
            case OFFLINE:
                st = "OFFLINE";
                break;
        }

        return st;
    }

    /**
     * Function to print the Host object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str) override;

     /**
      *  Checks if the host is a remote public cloud
      *    @return true if the host is a remote public cloud
      */
     bool is_public_cloud() const;

    /**
     *   Sets the current host offline, it will not be monitored nor used by the
     *   scheduler, manual VM deployment is also restricted
     */
    void offline();

    /**
     *  Sets the current host disable, it will receive monitor updates, manual
     *  deployment of VMs is allowed and the scheduler will not consider this
     *  host.
     */
    void disable();

    /**
     *   Enables the current host, it will be monitored and could be used by
     *   the scheduler
     */
    void enable();

    /**
     *  Sets the host in error
     */
     void set_error()
     {
        state = ERROR;
     }

    /**
     *  Test if the Host has changed state since last time prev state was set
     *    @return true if Host changed state
     */
    bool has_changed_state();

    /**
     *  Sets the previous state to the current one
     */
    void set_prev_state()
    {
        prev_state = state;
    };

     /**
      *  Updates the Host's last_monitored time stamp.
      *    @param success if the monitored action was successfully performed
      */
    void touch(bool success)
    {
        last_monitored = time(0);

        switch (state)
        {
            case OFFLINE:
                state = OFFLINE;
            break;

            case DISABLED:
            case MONITORING_DISABLED:
                state = DISABLED;
            break;

            case INIT:
            case ERROR:
            case MONITORED:
            case MONITORING_ERROR:
            case MONITORING_INIT:
            case MONITORING_MONITORED:
                if (success == true)
                {
                    state = MONITORED;
                }
                else
                {
                    state = ERROR;
                }
            break;
        }
    };

    /**
     * Update host after a successful monitor. It modifies counters, state
     * and template attributes
     *    @param parse_str string with values to be parsed
     *    @param with_vm_info if monitoring contains VM information
     *    @param lost set of VMs that should be in the host and were not found
     *    @param found VMs running in the host (as expected) and info.
     *    @param reserved_cpu from cluster defaults
     *    @param reserved_mem from cluster defaults
     *    @return 0 on success
     **/
    int update_info(Template        &tmpl,
                    bool            &with_vm_info,
                    set<int>        &lost,
                    map<int,string> &found,
                    const set<int>  &non_shared_ds,
                    const string&   reserved_cpu,
                    const string&   reserved_mem);
    /**
     * Extracts the DS attributes from the given template
     * @param parse_str string with values to be parsed
     * @param ds map of DS monitoring information
     * @param template object parsed from parse_str
     *
     * @return 0 on success
     */
    int extract_ds_info(
            string          &parse_str,
            Template        &tmpl,
            map<int, const VectorAttribute*> &ds);

    /**
     * Update host after a failed monitor. It state
     * and template attributes
     *    @param message from the driver
     *    @param vm_ids running on the host
     */
    void error_info(const string& message, set<int> &vm_ids);

    /**
     * Inserts the last monitoring, and deletes old monitoring entries.
     *
     * @param db pointer to the db
     * @return 0 on success
     */
    int update_monitoring(SqlDB * db);

    /**
     * Retrieves host state
     *    @return HostState code number
     */
    HostState get_state() const
    {
        return state;
    };

    /**
     * Retrieves VMM mad name
     *    @return string vmm mad name
     */
    const string& get_vmm_mad() const
    {
        return vmm_mad_name;
    };

    /**
     * Retrieves IM mad name
     *    @return string im mad name
     */
    const string& get_im_mad() const
    {
        return im_mad_name;
    };

    /**
     * Sets the corresponding monitoring state based on the actual host state
     */
    void set_monitoring_state()
    {
        last_monitored = time(0); //Needed to expire this monitor action

        switch (state)
        {
            case ERROR:
                state = MONITORING_ERROR;
            break;

            case MONITORED:
                state = MONITORING_MONITORED;
            break;

            case INIT:
                state = MONITORING_INIT;
            break;

            case DISABLED:
                state = MONITORING_DISABLED;
            break;

            default:
            break;
        }
    };

    /**
     * Retrieves last time the host was monitored
     *    @return time_t last monitored time
     */
    time_t get_last_monitored() const
    {
        return last_monitored;
    };

    /**
     *  Get the reserved capacity for this host. Parameters will be only updated
     *  if values are defined in the host. Reserved capacity will be subtracted
     *  from the Host total capacity.
     *    @param cpu reserved cpu (in percentage)
     *    @param mem reserved mem (in KB)
     */
    void get_reserved_capacity(string& cpu, string& mem) const
    {
        get_template_attribute("RESERVED_CPU", cpu);
        get_template_attribute("RESERVED_MEM", mem);
    }

    void get_cluster_capacity(string& cluster_rcpu, string& cluster_rmem) const;

    // -------------------------------------------------------------------------
    // Share functions.
    // -------------------------------------------------------------------------

    long long get_share_running_vms()
    {
        return host_share.get_running_vms();
    }

    /**
     *  Adds a new VM to the host share by incrementing usage counters
     *    @param sr the capacity request of the VM
     *    @return 0 on success
     */
    void add_capacity(HostShareCapacity &sr)
    {
        if ( vm_collection.add(sr.vmid) == 0 )
        {
            host_share.add(sr);
        }
        else
        {
            ostringstream oss;
            oss << "VM " << sr.vmid << " is already in host " << oid << ".";

            NebulaLog::log("ONE", Log::ERROR, oss);
        }
    };

    /**
     *  Deletes a new VM to the host share by incrementing usage counters
     *    @param sr the capacity request of the VM
     *    @return 0 on success
     */
    void del_capacity(HostShareCapacity& sr)
    {
        if ( vm_collection.del(sr.vmid) == 0 )
        {
            host_share.del(sr);
        }
        else
        {
            ostringstream oss;
            oss << "VM " << sr.vmid << " is not in host " << oid << ".";

            NebulaLog::log("ONE", Log::ERROR, oss);
        }
    };

    /**
     *  Tests whether a VM device capacity can be allocated in the host
     *    @param sr capacity requested by the VM
     *    @param error returns the error reason, if any
     *
     *    @return true if the share can host the VM
     */
    bool test_capacity(HostShareCapacity &sr, string& error)
    {
        return host_share.test(sr, error);
    }

    /**
     *  Returns a copy of the VM IDs set
     */
    set<int> get_vm_ids()
    {
        return vm_collection.clone();
    }

    /**
     *  Factory method for host templates
     */
    Template * get_new_template() const override
    {
        return new HostTemplate;
    }

    /**
     *  Executed after an update operation to process the new template
     *    - encrypt secret attributes.
     */
    int post_update_template(string& error) override;

    /**
     * Returns the rediscovered VMs (from poff to running) in the previous
     * monitorization cycle
     * @return the previous rediscovered VMs (from poff to running)
     */
    const set<int>& get_prev_rediscovered_vms() const
    {
        return *prev_rediscovered_vms;
    }

    /**
     * Sets the previous rediscovered VMs (from poff to running). This set
     * is not stored in the DB, the pool update method is not needed
     * @param rediscovered_vms the previous rediscovered VMs (from poff to running)
     */
    void set_prev_rediscovered_vms(const set<int>& rediscovered_vms)
    {
        *prev_rediscovered_vms = rediscovered_vms;
    }

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class HostPool;

    // -------------------------------------------------------------------------
    // Host Description
    // -------------------------------------------------------------------------
    /**
     *  The state of the Host
     */
    HostState   state;
    HostState   prev_state;

    /**
     *  Name of the IM driver used to monitor this host
     */
    string      im_mad_name;

    /**
     *  Name of the VM driver used to execute VMs in this host
     */
    string      vmm_mad_name;

    /**
     *  If Host State = MONITORED last time it got fully monitored or 1 Jan 1970
     *     Host State = MONITORING* last time it got a signal to be monitored
     */
    time_t      last_monitored;

    // -------------------------------------------------------------------------
    //  Host Attributes
    // -------------------------------------------------------------------------
    /**
     *  The Share represents the logical capacity associated with the host
     */
    HostShare host_share;

    /**
     * Tmp set of lost VM IDs. Used to give lost VMs one grace cycle, in case
     * they reappear.
     */
    set<int> * tmp_lost_vms;

    /**
     * Tmp set of zombie VM IDs. Used to give zombie VMs one grace cycle, in
     * case they are cleaned.
     */
    set<int> * tmp_zombie_vms;

    /**
     * Set that stores the VMs reported as found from the poweroff state. This
     * is managed from outside the host to avoid deadlocks, as the current
     * VM state is needed
     */
    set<int> * prev_rediscovered_vms;

    // -------------------------------------------------------------------------
    //  VM Collection
    // -------------------------------------------------------------------------
    /**
     *  Stores a collection with the VMs running in the host
     */
    ObjectCollection vm_collection;


    // *************************************************************************
    // Constructor
    // *************************************************************************

    Host(int           id,
         const string& hostname,
         const string& im_mad_name,
         const string& vmm_mad_name,
         int           cluster_id,
         const string& cluster_name);

    virtual ~Host() = default;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    static const char * monit_db_names;

    static const char * monit_db_bootstrap;

    static const char * monit_table;

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the Host
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        int rc;

        ostringstream oss_host(Host::db_bootstrap);
        ostringstream oss_monit(Host::monit_db_bootstrap);

        rc =  db->exec_local_wr(oss_host);
        rc += db->exec_local_wr(oss_monit);

        return rc;
    };

    /**
     *  Writes the Host and its associated HostShares in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str) override
    {
        return insert_replace(db, false, error_str);
    };

    /**
     *  Writes/updates the Hosts data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        string error_str;
        return insert_replace(db, true, error_str);
    };
};

#endif /*HOST_H_*/
