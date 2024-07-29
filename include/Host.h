/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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

#include "PoolObjectSQL.h"
#include "HostTemplate.h"
#include "HostMonitoringTemplate.h"
#include "HostShare.h"
#include "ClusterableSingle.h"
#include "ObjectCollection.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"

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
        //MONITORING_MONITORED = 1, /**< Monitoring the host (from monitored). */
        MONITORED            = 2, /**< The host has been monitored. */
        ERROR                = 3, /**< An error ocurrer in host monitoring. */
        DISABLED             = 4, /**< The host is disabled see above. */
        //MONITORING_ERROR     = 5, /**< Monitoring the host (from error). */
        //MONITORING_INIT      = 6, /**< Monitoring the host (from init). */
        //MONITORING_DISABLED  = 7, /**< Monitoring the host (from disabled). */
        OFFLINE              = 8  /**< The host is set offline, see above */
    };

    /**
     *  Functions to convert to/from string the Host states
     */
    static int str_to_state(std::string& st, HostState& state)
    {
        one_util::toupper(st);

        state = INIT;

        if ( st == "INIT" )
        {
            state = INIT;
        }
        else if ( st == "MONITORED" )
        {
            state = MONITORED;
        }
        else if ( st == "ERROR" )
        {
            state = ERROR;
        }
        else if ( st == "DISABLED" )
        {
            state = DISABLED;
        }
        else if ( st == "OFFLINE" )
        {
            state = OFFLINE;
        }
        else
        {
            return -1;
        }

        return 0;
    }

    static std::string state_to_str(HostState state)
    {
        std::string st = "";

        switch (state)
        {
            case INIT:
                st = "INIT";
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
            case OFFLINE:
                st = "OFFLINE";
                break;
        }

        return st;
    }

    virtual ~Host() = default;

    /**
     * Function to print the Host object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

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
     *  Sets the host in error state (if not disabled/offline) and update
     *  template with the associated error message
     *    @param message associated error message
     */
    void error(const std::string& message);

    /**
     *  Test if the Host has changed state since last time prev state was set
     *    @return true if Host changed state
     */
    bool has_changed_state()
    {
        return prev_state != state;
    }

    /**
     *  Sets the previous state to the current one
     */
    void set_prev_state()
    {
        prev_state = state;
    };

    /**
     * Update host after a successful monitor. It modifies counters, state
     * and template attributes
     *    @param parse_str string with values to be parsed
     *    @return 0 on success
     **/
    int update_info(Template &tmpl);

    /**
     * Retrieves host state
     *    @return HostState code number
     */
    HostState get_state() const
    {
        return state;
    };

    /**
     * Retrieves host state
     *    @return HostState code number
     */
    void set_state(HostState new_state)
    {
        state = new_state;
    };

    /**
     * Retrieves VMM mad name
     *    @return string vmm mad name
     */
    const std::string& get_vmm_mad() const
    {
        return vmm_mad_name;
    };

    /**
     * Retrieves IM mad name
     *    @return string im mad name
     */
    const std::string& get_im_mad() const
    {
        return im_mad_name;
    };

    // -------------------------------------------------------------------------
    // Share functions.
    // -------------------------------------------------------------------------

    long long get_share_running_vms() const
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
            std::ostringstream oss;
            oss << "VM " << sr.vmid << " is already in host " << oid << ".";

            NebulaLog::log("ONE", Log::ERROR, oss);
        }
    };

    bool add_pci(HostShareCapacity &sr)
    {
        return host_share.add_pci(sr);
    }

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
            std::ostringstream oss;
            oss << "VM " << sr.vmid << " is not in host " << oid << ".";

            NebulaLog::log("ONE", Log::ERROR, oss);
        }
    };

    void del_pci(HostShareCapacity& sr)
    {
        host_share.del_pci(sr);
    }

    /**
     *  Revert changes in PCI Devices after migrate failure
     *    @param sr host share capacity info
     */
    void revert_pci(HostShareCapacity& sr)
    {
        host_share.revert_pci(sr);
    }

    /**
     *  Tests whether a VM device capacity can be allocated in the host
     *    @param sr capacity requested by the VM
     *    @param error returns the error reason, if any
     *
     *    @return true if the share can host the VM
     */
    bool test_capacity(HostShareCapacity &sr, std::string& error)
    {
        return host_share.test(sr, error);
    }

    /**
     *  Update reserved capacity according to cluster reservations
     *    @param ccpu cluster reserved cpu
     *    @param cmem cluster reserved mem
     *
     *    @return true capacity was updated,
     *            false if host has its own reservations
     */
    bool update_reserved_capacity(const std::string& ccpu, const std::string& cmem);

    /**
     *  Returns a copy of the VM IDs set
     */
    const std::set<int>& get_vm_ids() const
    {
        return vm_collection.get_collection();
    }

    /**
     *  Factory method for host templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<HostTemplate>();
    }

    /**
     *  Executed after an update operation to process the new template
     *    - encrypt secret attributes.
     */
    int post_update_template(std::string& error) override;

    /**
     *  Read monitoring from DB
     */
    void load_monitoring();

    void update_zombies(const std::set<int>& ids);

private:
    friend class HostPool;

    /**
     *  The state of the Host
     */
    HostState state;
    HostState prev_state;

    /**
     *  Name of the IM and VMM drivers
     */
    std::string im_mad_name;
    std::string vmm_mad_name;

    /**
     *  The Share represents the logical capacity associated with the host
     */
    HostShare host_share;

    /**
     *  Stores a collection with the VMs running in the host
     */
    ObjectCollection vm_collection;

    /**
     *  Stores monitor information for the host
     */
    HostMonitoringTemplate monitoring;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Host(int id, const std::string& hostname, const std::string& im_mad,
         const std::string& vmm_mad, int clusterid, const std::string& cluster);


    // *************************************************************************
    // Helper functions
    // *************************************************************************
    /**
     *  Gets the reserved capacity of this host, if not defined it will be used
     *  the cluster one (if any)
     *    @param rcpu reserved cpu
     *    @param rmem reserved mem
     */
    void reserved_capacity(std::string& rcpu, std::string& rmem) const;

    void update_wilds();

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Writes the Host and its associated HostShares in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override
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
        std::string error_str;
        return insert_replace(db, true, error_str);
    };
};

#endif /*HOST_H_*/
