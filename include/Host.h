/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef HOST_H_
#define HOST_H_

#include "PoolSQL.h"
#include "HostShare.h"
#include "HostTemplate.h"

using namespace std;

/**
 *  The Host class.
 */
class Host : public PoolObjectSQL
{
public:

    // ------------------------------------------------------------------------
    // Host States
    // ------------------------------------------------------------------------

    enum HostState
    {
        INIT       = 0, /**< Initial state for enabled hosts. */
        MONITORING = 1, /**< The host is being monitored. */
        MONITORED  = 2, /**< The host has been successfully monitored. */
        ERROR      = 3, /**< An error ocurrer while monitoring the host. */
        DISABLED   = 4  /**< The host is disabled won't be monitored. */
    };

    /**
     *  Function to write a Host on an output stream
     */
     friend ostream& operator<<(ostream& os, Host& h);

	/**
	 * Function to print the Host object into a string in plain text
	 *  @param str the resulting string
	 *  @return a reference to the generated string
	 */
	string& to_str(string& str) const;

	/**
	 * Function to print the Host object into a string in XML format
	 *  @param xml the resulting XML string
	 *  @return a reference to the generated string
	 */
	string& to_xml(string& xml) const;

    /**
     * Get the Host unique identifier HID, that matches the OID of the object
     *    @return HID Host identifier
     */
    int get_hid() const
    {
        return oid;
    };

    /**
     *  Check if the host is enabled
     *    @return true if the host is enabled
     */
     bool isEnabled() const
     {
        return state != DISABLED;
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

    /**
     *  Returns host host_name
     *     @return host_name Host's hostname
     */
 	const string& get_hostname() const
    {
	    return hostname;
	};

    /** Update host counters and update the whole host on the DB
     *    @param parse_str string with values to be parsed
     *    @return 0 on success
     **/
    int update_info(string &parse_str);

    /**
     *
     */
    HostState get_state() const
    {
        return state;
    };

    /**
     *
     */
    const string& get_vmm_mad() const
    {
        return vmm_mad_name;
    };

    /**
     *
     */
    const string& get_tm_mad() const
    {
        return tm_mad_name;
    };

    /**
     *
     */
    const string& get_im_mad() const
    {
        return im_mad_name;
    };

    /**
     *
     */
    void set_state(HostState state)
    {
        this->state = state;
    };

    /**
     *
     */
    time_t get_last_monitored() const
    {
        return last_monitored;
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
        return host_template.get(name,values);
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
        return host_template.get(str,values);
    };

    /**
     *  Gets a string based host attribute
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined
     */
    void get_template_attribute(
        const char *    name,
        string&         value) const
    {
        string str=name;
        host_template.get(str,value);
    }

    /**
     *  Gets a string based host attribute
     *    @param name of the attribute
     *    @param value of the attribute (an int), will be 0 if not defined
     */
    void get_template_attribute(
        const char *    name,
        int&            value) const
    {
        string str=name;
        host_template.get(str,value);
    }

    // ---------------------------------------------------------
    //  Lex & bison parser for requirements and rank expressions
    // ---------------------------------------------------------

    /**
     *  Evaluates a requirement expression on the given host.
     *    @param requirements string
     *    @param result true if the host matches the requirements
     *    @param errmsg string describing the error, must be freed by the
     *    calling function
     *    @return 0 on success
     */
    int match(const string& requirements, bool& result, char **errmsg);

    /**
     *  Evaluates a rank expression on the given host.
     *    @param rank string
     *    @param result of the rank evaluation
     *    @param errmsg string describing the error, must be freed by the
     *    calling function
     *    @return 0 on success
     */
    int rank(const string& rank, int& result, char **errmsg);

    // ------------------------------------------------------------------------
    // Share functions
    // ------------------------------------------------------------------------

    /**
     *
     *
     */
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

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class HostPool;

    // -------------------------------------------------------------------------
    // Host Description
    // -------------------------------------------------------------------------

    string      hostname;

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
     *  Name of the TM driver used to transfer file to and from this host
     */
	string      tm_mad_name;

	/**
     *  If Host State = MONITORED  last time it got fully monitored or 1 Jan 1970
     *     Host State = MONITORING last time it got a signal to be monitored
     */
    time_t      last_monitored;

    // -------------------------------------------------------------------------
    //  Host Attributes
    // -------------------------------------------------------------------------

    /**
     *  The Host template, holds the Host attributes.
     */
    HostTemplate    host_template;

    /**
     *  The Share represents the logical capacity associated with the host
     */
    HostShare       host_share;

    // -------------------------------------------------------------------------
    //  Lex & bison
    // -------------------------------------------------------------------------

    /**
     *  Mutex to perform just one flex-bison parsing at a time
     */
    static pthread_mutex_t	lex_mutex;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Callback function to unmarshall a Host object (Host::select)
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Bootstraps the database table(s) associated to the Host
     */
    static void bootstrap(SqlDB * db)
    {
        ostringstream oss_host(Host::db_bootstrap);
        ostringstream oss_share(HostShare::db_bootstrap);
        ostringstream oss_templ(HostTemplate::db_bootstrap);

        db->exec(oss_host);
        db->exec(oss_share);
        db->exec(oss_templ);
    };

protected:

    // *************************************************************************
    // Constructor
    // *************************************************************************

    Host(int     id=-1,
         string _hostname="",
         string _im_mad_name="",
         string _vmm_mad_name="",
         string _tm_mad_name="");

    virtual ~Host();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    enum ColNames
    {
        OID              = 0,
        HOST_NAME        = 1,
        STATE            = 2,
        IM_MAD           = 3,
        VM_MAD           = 4,
        TM_MAD           = 5,
        LAST_MON_TIME    = 6,
        LIMIT            = 7
    };

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Reads the Host (identified with its OID=HID) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int select(SqlDB *db);

    /**
     *  Writes the Host and its associated HostShares in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int insert(SqlDB *db);

    /**
     *  Writes/updates the Hosts data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int update(SqlDB *db);

    /**
     *  Drops host from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int drop(SqlDB *db);

    /**
     *  Callabck function to output a Host object in to an stream in XML format
     *  (Host::dump)
     *    @param oss the output stream
     *    @param num the number of columns read from the DB
     *    @param names the column names
     *    @param vaues the column values
     *    @return 0 on success
     */
    static int dump(ostringstream& oss, int num, char **values, char **names);
};

#endif /*HOST_H_*/
