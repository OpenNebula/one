/* ------------------------------------------------------------------------ */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)           */
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
#include "Clusterable.h"

using namespace std;

/**
 *  The Host class.
 */
class Host : public PoolObjectSQL, public Clusterable
{
public:

    // ----------------------------------------------------------------------
    // Host States
    // ----------------------------------------------------------------------

    enum HostState
    {
        INIT                 = 0, /**< Initial state for enabled hosts. */
        MONITORING_MONITORED = 1, /**< Monitoring the host (from monitored). */
        MONITORED            = 2, /**< The host has been successfully monitored. */
        ERROR                = 3, /**< An error ocurrer while monitoring the host. */
        DISABLED             = 4, /**< The host is disabled won't be monitored. */
        MONITORING_ERROR     = 5  /**< Monitoring the host (from error). */
    };

    /**
     * Function to print the Host object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     *  Check if the host is enabled
     *    @return true if the host is enabled
     */
     bool isEnabled() const
     {
        return state != DISABLED;
     }

    /**
     *  Check if the host is being monitored
     *    @return true if the host is enabled
     */
     bool isMonitoring() const
     {
        return ((state == MONITORING_ERROR) || (state==MONITORING_MONITORED));
     }

    /**
     *  Updates the Host's last_monitored time stamp.
     *    @param success if the monitored action was successfully performed
     */
    void touch(bool success)
    {
        last_monitored = time(0);

        if ( state != DISABLED) //Don't change the state is host is disabled
        {
            if (success == true)
            {
                state = MONITORED;
            }
            else
            {
                state = ERROR;
            }
        }
    };

    /**
     *   Disables the current host, it will not be monitored nor used by the
     *   scheduler
     */
    void disable()
    {
        state = DISABLED;
    };

    /**
     *   Enables the current host, it will be monitored and could be used by
     *   the scheduler
     */
    void enable()
    {
        state = INIT;
    };

    /** Update host counters and update the whole host on the DB
     *    @param parse_str string with values to be parsed
     *    @return 0 on success
     **/
    int update_info(string &parse_str);

    /**
     * Inserts the last monitoring, and deletes old monitoring entries.
     *
     * @param db pointer to the db
     * @return 0 on success
     */
    int update_monitoring(SqlDB * db);

    /**
     * Retrives host state
     *    @return HostState code number
     */
    HostState get_state() const
    {
        return state;
    };

    /**
     * Retrives VMM mad name
     *    @return string vmm mad name
     */
    const string& get_vmm_mad() const
    {
        return vmm_mad_name;
    };

    /**
     * Retrives VNM mad name
     *    @return string vnm mad name
     */
    const string& get_vnm_mad() const
    {
        return vnm_mad_name;
    };

    /**
     * Retrives IM mad name
     *    @return string im mad name
     */
    const string& get_im_mad() const
    {
        return im_mad_name;
    };

    /**
     * Sets host state
     *    @param HostState state that applies to this host
     */
    void set_state(HostState state)
    {
        this->state = state;
    };

    /**
     * Sets the corresponding monitoring state based on the actual host state
     */
    void set_monitoring_state()
    {
        if ( state == ERROR )
        {
            state = MONITORING_ERROR;
        }
        else if ( state == MONITORED )
        {
            state = MONITORING_MONITORED;
        }
    };

    /**
     * Retrives last time the host was monitored
     *    @return time_t last monitored time
     */
    time_t get_last_monitored() const
    {
        return last_monitored;
    };

    // ------------------------------------------------------------------------
    // Share functions. Returns the value associated with each host share 
    // metric
    // ------------------------------------------------------------------------

    int get_share_running_vms()
    {
        return host_share.running_vms;
    }

    int get_share_disk_usage()
    {
        return host_share.disk_usage;
    }

    int get_share_mem_usage()
    {
        return host_share.mem_usage;
    }

    int get_share_cpu_usage()
    {
        return host_share.cpu_usage;
    }

    int get_share_max_disk()
    {
        return host_share.max_disk;
    }

    int get_share_max_mem()
    {
        return host_share.max_mem;
    }

    int get_share_max_cpu()
    {
        return host_share.max_cpu;
    }

    int get_share_free_disk()
    {
        return host_share.free_disk;
    }

    int get_share_free_mem()
    {
        return host_share.free_mem;
    }

    int get_share_free_cpu()
    {
        return host_share.free_cpu;
    }

    int get_share_used_disk()
    {
        return host_share.used_disk;
    }

    int get_share_used_mem()
    {
        return host_share.used_mem;
    }

    int get_share_used_cpu()
    {
        return host_share.used_cpu;
    }

    /**
     *  Adds a new VM to the given share by icrementing the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in Kb)
     *    @param disk needed by the VM
     *    @return 0 on success
     */
    void add_capacity(int cpu, int mem, int disk)
    {
        host_share.add(cpu,mem,disk);
    };

    /**
     *  Deletes a new VM from the given share by decrementing the cpu,mem and
     *  disk counters
     *    @param cpu useded by the VM (percentage)
     *    @param mem used by the VM (in Kb)
     *    @param disk used by the VM
     *    @return 0 on success
     */
    void del_capacity(int cpu, int mem, int disk)
    {
        host_share.del(cpu,mem,disk);
    };

    /**
     *  Tests whether a new VM can be hosted by the host or not
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in Kb)
     *    @param disk needed by the VM
     *    @return true if the share can host the VM
     */
    bool test_capacity(int cpu, int mem, int disk)
    {
        return host_share.test(cpu,mem,disk);
    }

    /**
     *  Factory method for host templates
     */
    Template * get_new_template() const
    {
        return new HostTemplate;
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

	/**
     *  Name of the IM driver used to monitor this host
     */
	string      im_mad_name;

	/**
     *  Name of the VM driver used to execute VMs in this host
     */
	string      vmm_mad_name;

    /**
     *  Name of the VN driver used to manage networking in this host
     */
    string      vnm_mad_name;

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
    HostShare       host_share;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Host(int           id,
         const string& hostname,
         const string& im_mad_name,
         const string& vmm_mad_name,
         const string& vnm_mad_name,
         int           cluster_id,
         const string& cluster_name);

    virtual ~Host();

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

        rc =  db->exec(oss_host);
        rc += db->exec(oss_monit);

        return rc;
    };

    /**
     *  Writes the Host and its associated HostShares in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str)
    {
        return insert_replace(db, false, error_str);
    };

    /**
     *  Writes/updates the Hosts data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    };
};

#endif /*HOST_H_*/
