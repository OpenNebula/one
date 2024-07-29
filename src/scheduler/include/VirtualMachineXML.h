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


#ifndef VM_XML_H_
#define VM_XML_H_

#include <sstream>

#include <nlohmann/json.hpp>

#include "ObjectXML.h"
#include "HostPoolXML.h"
#include "Resource.h"

#include "VirtualMachineTemplate.h"

class ImageDatastorePoolXML;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineNicXML : public ObjectXML
{
public:

    /**
     *  Returns a vector of matched datastores
    */
    const std::vector<Resource *>& get_match_networks() const
    {
        return match_networks.get_resources();
    }

    /**
     *  Adds a matching network
     *    @param oid of the network
     */
    void add_match_network(int oid)
    {
        match_networks.add_resource(oid);
    }

    /**
     *  Sort the matched networks for the VM
     */
    void sort_match_networks()
    {
        match_networks.sort_resources();
    }

    /**
     *  Removes the matched networks
     */
    void clear_match_networks()
    {
        match_networks.clear();
    }

    //--------------------------------------------------------------------------
    // Rank & requirements set & get
    //--------------------------------------------------------------------------
    const std::string& get_rank() const
    {
        return rank;
    };

    void set_rank(const std::string& r)
    {
        rank = r;
    }

    const std::string& get_requirements() const
    {
        return requirements;
    };

    void set_requirements(const std::string& r)
    {
        requirements = r;
    }

private:
    ResourceMatch match_networks;

    std::string rank;

    std::string requirements;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineXML : public ObjectXML
{
public:

    VirtualMachineXML(const std::string &xml_doc): ObjectXML(xml_doc)
    {
        init_attributes();
    };

    VirtualMachineXML(const xmlNodePtr node): ObjectXML(node)
    {
        init_attributes();
    }

    ~VirtualMachineXML()
    {
        for (auto nic : nics)
        {
            delete nic.second;
        }
    }

    //--------------------------------------------------------------------------
    // Get Methods for VirtualMachineXML class
    //--------------------------------------------------------------------------
    int get_state() const { return state; };

    std::string get_state_str() const;

    int get_lcm_state() const { return lcm_state; };

    int get_oid() const { return oid; };

    int get_uid() const { return uid; };

    int get_gid() const { return gid; };

    int get_hid() const { return hid; };

    int get_dsid() const { return dsid; };

    time_t get_stime() const { return stime; }

    bool is_resched() const { return resched; }

    bool is_resume() const { return resume; }

    bool is_public_cloud() const { return public_cloud; }

    bool is_active() const { return active; }

    bool is_only_public_cloud() const { return only_public_cloud; }

    void set_only_public_cloud() { only_public_cloud = true; }

    void to_json(nlohmann::json &vm_json);

    //--------------------------------------------------------------------------
    // Scheduling requirements and rank
    //--------------------------------------------------------------------------
    const std::string& get_requirements() const { return requirements; };

    const std::string& get_ds_requirements() const { return ds_requirements; }

    const std::string& get_rank() const { return rank; };

    const std::string& get_ds_rank() const { return ds_rank; };

    /**
     *  Adds (logical AND) new placement requirements to the current ones
     *    @param reqs additional requirements
     */
    void add_requirements(const std::string& reqs);

    //--------------------------------------------------------------------------
    // Functions to schedule network interfaces (NIC)
    //--------------------------------------------------------------------------
    VirtualMachineNicXML * get_nic(int nic_id) const;

    const std::string& get_nic_rank(int nic_id) const;

    const std::string& get_nic_requirements(int nic_id) const;

    /**
     *  Return ids of NICs with NETWORK_MODE=auto (i.e. need to schedule networks)
     */
    const std::set<int>& get_nics_ids() const
    {
        return nics_ids_auto;
    }

    //--------------------------------------------------------------------------
    // Capacity Interface
    //--------------------------------------------------------------------------
    /**
     *  This function fills a share capacity request based on the VM information:
     *    - cpu
     *    - memory
     *    - system_ds disk usage
     *    - PCI devices
     *    - NUMA node topology
     */
    void get_capacity(HostShareCapacity &sr) const;

    /**
     *  Add capacity to (cpu, mem, system_ds disk, numa_nodes) this VM
     *    @param the capacity to be added
     */
    void add_capacity(HostShareCapacity &sr);

    /**
     *  Clears the capacity allocaton of this VM and return it.
     *    @param sr, the sorage requirements
     */
    void reset_capacity(HostShareCapacity &sr);

    /**
     *  Tests if the Image DS have enough free space to host the VM
     *    @param img_datastores Image Datastores
     *    @param error_msg error reason
     *    @return true if the Image Datastores can host the VM
     */
    bool test_image_datastore_capacity(
            ImageDatastorePoolXML * img_dspool, std::string & error_msg) const;

    /**
     *  Adds the VM disk requirements to each Image Datastore counter
     *    @param img_datastores Image Datastores
     */
    void add_image_datastore_capacity(ImageDatastorePoolXML * img_dspool);

    /**
     *  @return storage usage for the VM
     */
    const std::map<int, long long>& get_storage_usage() const
    {
        return ds_usage;
    }

    //--------------------------------------------------------------------------
    // Matched Resources Interface
    //--------------------------------------------------------------------------
    /**
     *  Adds a matching host if it is not equal to the actual one
     *    @param oid of the host
     */
    void add_match_host(int oid)
    {
        if ((resched && hid != oid) || !resched )
        {
            match_hosts.add_resource(oid);
        }
    };

    /**
     *  Adds a matching datastore
     *    @param oid of the datastore
     */
    void add_match_datastore(int oid)
    {
        match_datastores.add_resource(oid);
    }

    /**
     *  Adds a matching network
     *    @param oid of the network
     */
    void add_match_network(int oid, int nic_id)
    {
        auto it = nics.find(nic_id);

        if ( it != nics.end() )
        {
            it->second->add_match_network(oid);
        }
    }

    /**
     *  Returns a vector of matched hosts
     */
    const std::vector<Resource *>& get_match_hosts() const
    {
        return match_hosts.get_resources();
    }

    /**
     *  Returns a vector of matched datastores
     */
    const std::vector<Resource *>& get_match_datastores() const
    {
        return match_datastores.get_resources();
    }

    /**
     *  Returns a vector of matched networks
     */
    const std::vector<Resource *>& get_match_networks(int nic_id) const
    {
        static std::vector<Resource *> ev;

        auto it = nics.find(nic_id);

        if ( it != nics.end() )
        {
            return it->second->get_match_networks();
        }

        return ev;
    }

    /**
     *  Sort the matched hosts for the VM
     */
    void sort_match_hosts()
    {
        match_hosts.sort_resources();
    }

    /**
     *  Sort the matched datastores for the VM
     */
    void sort_match_datastores()
    {
        match_datastores.sort_resources();
    }

    /**
     *  Sort the matched networks for the VM
     */
    void sort_match_networks(int nic_id)
    {
        auto it = nics.find(nic_id);

        if ( it != nics.end() )
        {
            it->second->sort_match_networks();
        }
    }

    /**
     *  Removes the matched hosts
     */
    void clear_match_hosts()
    {
        match_hosts.clear();
    }

    /**
     *  Removes the matched datastores
     */
    void clear_match_datastores()
    {
        match_datastores.clear();
    }

    /**
     *  Removes the matched networks
     */
    void clear_match_networks()
    {
        for (auto it = nics.begin(); it != nics.end(); it++ )
        {
            it->second->clear_match_networks();
        }
    }

    /**
     *  Add a VM to the set of affined VMs. This is used for the VM leader
     *  when scheduling a group.
     *
     *  @param vmid of the affined vm
     *
     */
    void add_affined(int vmid)
    {
        affined_vms.insert(vmid);
    }

    const std::set<int>& get_affined_vms() const
    {
        return affined_vms;
    }

    /**
     *  Get the user template of the VM
     *    @return the template as a XML string
     */
    std::string& get_template(std::string& xml_str) const
    {
        if (user_template != 0)
        {
            user_template->to_xml(xml_str);
        }
        else
        {
            xml_str = "";
        }

        return xml_str;
    }

    VirtualMachineTemplate * get_template()
    {
        return vm_template.get();
    }

    VirtualMachineTemplate * get_user_template()
    {
        return user_template.get();
    }

    /**
     * Sets an attribute in the VM Template, it must be allocated in the heap
     *
     * @param attributes to hold the VM actions
     */
    void set_attribute(Attribute* att)
    {
        return user_template->set(att);
    }

    /**
     *  Checks the action to be performed and returns the corresponding XML-RPC
     *  method name.
     *    @param action_st, the action to be performed. The XML-RPC name is
     *    returned here
     *    @return 0 on success.
     */
    static int parse_action_name(std::string& action_st);

    /**
     *  Init list of attributes serialized to External Scheduler
     *    @param attrs List of strings with format 'path:name', where
     *          path could be
     *              absolute '/VM/TEMPLATE/CPU'
     *              relative '//CPU` - first attribute with name CPU
     *          name - name of the attribute visible in External Scheduler
     *          Examples '/VM/TEMPLATE/MEMORY:MEM', '//ROLE:VMGROUP_ROLE'
     */
    static void init_external_attrs(const std::vector<const SingleAttribute *>& attrs);

    //--------------------------------------------------------------------------
    // Logging
    //--------------------------------------------------------------------------
    /**
     *  Function to write a Virtual Machine in an output stream
     */
    friend std::ostream& operator<<(std::ostream& os, VirtualMachineXML& vm);

    /**
     * Adds a message to the VM's USER_TEMPLATE/SCHED_MESSAGE attribute
     *   @param st Message to set
     */
    void log(const std::string &st);

    /**
     * Clears the VM's USER_TEMPLATE/SCHED_MESSAGE attribute
     * @return true if the template was modified, false if SCHED_MESSAGE did not
     * need to be deleted
     */
    bool clear_log();

protected:
    /**
     *  For constructors
     */
    void init_attributes();

    void init_storage_usage();

    /**
     * Update the VM object in oned
     * @param vm_template Object template as xml or ...
     * @param append Append mode
     */
    bool update(const std::string &vm_template, bool append);

    /* ---------------------- SCHEDULER INFORMATION ------------------------- */
    ResourceMatch match_hosts;

    ResourceMatch match_datastores;

    bool only_public_cloud;

    std::set<int> affined_vms;

    /* ----------------------- VIRTUAL MACHINE ATTRIBUTES ------------------- */
    int oid;

    int uid;
    int gid;

    int hid;
    int dsid;

    int state;
    int lcm_state;

    bool resched;
    bool resume;
    bool active;
    bool public_cloud;

    long int    memory;
    float       cpu;
    long long   system_ds_usage;

    std::map<int, long long> ds_usage;

    std::string rank;
    std::string requirements;

    std::string ds_requirements;
    std::string ds_rank;

    time_t stime;

    std::set<int> nics_ids_auto;

    std::map<int, VirtualMachineNicXML *> nics;

    std::unique_ptr<VirtualMachineTemplate> vm_template;   /**< The VM template */
    std::unique_ptr<VirtualMachineTemplate> user_template; /**< The VM user template */

    static std::map<std::string, std::string> external_attributes;
};

#endif /* VM_XML_H_ */
