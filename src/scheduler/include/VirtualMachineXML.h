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


#ifndef VM_XML_H_
#define VM_XML_H_

#include <sstream>

#include "ObjectXML.h"
#include "HostPoolXML.h"
#include "Resource.h"

#include "VirtualMachineTemplate.h"

class ImageDatastorePoolXML;

using namespace std;

class VirtualMachineXML : public ObjectXML
{
public:

    VirtualMachineXML(const string &xml_doc): ObjectXML(xml_doc)
    {
        init_attributes();
    };

    VirtualMachineXML(const xmlNodePtr node): ObjectXML(node)
    {
        init_attributes();
    }

    ~VirtualMachineXML()
    {
        if (vm_template != 0)
        {
            delete vm_template;
        }

        if (user_template != 0)
        {
            delete user_template;
        }
    }

    //--------------------------------------------------------------------------
    // Get Methods for VirtualMachineXML class
    //--------------------------------------------------------------------------

    int get_oid() const
    {
        return oid;
    };

    int get_uid() const
    {
        return uid;
    };

    int get_gid() const
    {
        return gid;
    };

    int get_hid() const
    {
        return hid;
    };

    int get_dsid() const
    {
        return dsid;
    };

    bool is_resched() const
    {
        return (resched == 1);
    }

    bool is_resume() const
    {
        return resume;
    }

    const string& get_rank()
    {
        return rank;
    };

    const string& get_ds_rank()
    {
        return ds_rank;
    };

    const string& get_requirements()
    {
        return requirements;
    };

    const string& get_ds_requirements()
    {
        return ds_requirements;
    }

    void get_requirements (int& cpu, int& memory, long long& disk,
        vector<Attribute *> &pci);

    map<int,long long> get_storage_usage();

    /**
     * Checks if the VM can be deployed in a public cloud provider
     * @return true if the VM can be deployed in a public cloud provider
     */
    bool is_public_cloud() const
    {
        return public_cloud;
    };

    //--------------------------------------------------------------------------
    // Matched Resources Interface
    //--------------------------------------------------------------------------

    /**
     *  Adds a matching host if it is not equal to the actual one
     *    @param oid of the host
     */
    void add_match_host(int oid)
    {
        if (( resched == 1 && hid != oid ) || ( resched == 0 ))
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
     *  Returns a vector of matched hosts
     */
    const vector<Resource *> get_match_hosts()
    {
        return match_hosts.get_resources();
    }

    /**
     *  Returns a vector of matched datastores
     */
    const vector<Resource *> get_match_datastores()
    {
        return match_datastores.get_resources();
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
     * Marks the VM to be only deployed on public cloud hosts
     */
    void set_only_public_cloud();

    /**
     * Returns true is the VM can only be deployed in public cloud hosts
     * @return true is the VM can only be deployed in public cloud hosts
     */
    bool is_only_public_cloud() const;

    //--------------------------------------------------------------------------
    // Capacity Interface
    //--------------------------------------------------------------------------

    /**
     *  Tests if the Image DS have enough free space to host the VM
     *    @param img_datastores Image Datastores
     *    @param error_msg error reason
     *    @return true if the Image Datastores can host the VM
     */
    bool test_image_datastore_capacity(
            ImageDatastorePoolXML * img_dspool, string & error_msg) const;

    /**
     *  Tests if the Image DS have enough free space to host the VM
     *    @param img_datastores Image Datastores
     *    @return true if the Image Datastores can host the VM
     */
    bool test_image_datastore_capacity(
            ImageDatastorePoolXML * img_dspool) const
    {
        string tmp_st;
        return test_image_datastore_capacity(img_dspool, tmp_st);
    }

    /**
     *  Adds the VM disk requirements to each Image Datastore counter
     *    @param img_datastores Image Datastores
     */
    void add_image_datastore_capacity(ImageDatastorePoolXML * img_dspool);

    //--------------------------------------------------------------------------
    // Action Interface
    //--------------------------------------------------------------------------

    /**
     *  Get the user template of the VM
     *    @return the template as a XML string
     */
    string& get_template(string& xml_str)
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

    /**
     * Removes (but does not delete) the scheduled actions of the VM
     *
     * @param attributes to hold the VM actions
     */
    void get_actions(vector<Attribute *>& attributes) const
    {
        attributes.clear();

        user_template->remove("SCHED_ACTION", attributes);
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
    static int parse_action_name(string& action_st);

    /**
     *  Function to write a Virtual Machine in an output stream
     */
    friend ostream& operator<<(ostream& os, VirtualMachineXML& vm);

    /**
     * Adds a message to the VM's USER_TEMPLATE/SCHED_MESSAGE attribute
     *   @param st Message to set
     */
    void log(const string &st);

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

    ResourceMatch match_hosts;

    ResourceMatch match_datastores;

    bool only_public_cloud;

    /* ----------------------- VIRTUAL MACHINE ATTRIBUTES ------------------- */
    int   oid;

    int   uid;
    int   gid;

    int   hid;
    int   dsid;

    int   resched;
    bool  resume;

    int         memory;
    float       cpu;
    long long   system_ds_usage;

    map<int,long long> ds_usage;

    bool   public_cloud;

    string rank;
    string requirements;

    string ds_requirements;
    string ds_rank;

    VirtualMachineTemplate * vm_template;   /**< The VM template */
    VirtualMachineTemplate * user_template; /**< The VM user template */
};

#endif /* VM_XML_H_ */
