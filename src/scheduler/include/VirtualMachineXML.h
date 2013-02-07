/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include "VirtualMachineTemplate.h"

using namespace std;

class VirtualMachineXML : public ObjectXML
{
public:

    VirtualMachineXML(const string &xml_doc):
        ObjectXML(xml_doc)
    {
        init_attributes();
    };

    VirtualMachineXML(const xmlNodePtr node):
        ObjectXML(node)
    {
        init_attributes();
    }

    ~VirtualMachineXML();

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

    bool is_resched() const
    {
        return (resched == 1);
    }

    /**
     *  Adds a new host to the list of suitable hosts to start this VM
     *    @param  hid of the selected host
     */
    void add_host(int hid);

    /**
     *  Gets the matching hosts ids
     *    @param mh vector with the hids of the matching hosts
     */
    void get_matching_hosts(vector<int>& mh);

    /**
     *  Sets the priorities for each matching host
     */
    void set_priorities(vector<float>& total);

    /**
     *
     */
    int get_host(int& hid,
                 HostPoolXML * hpool,
                 map<int,int>& host_vms,
                 int max_vms);

    void get_requirements (int& cpu, int& memory, int& disk);

    const string& get_rank()
    {
        return rank;
    };

    const string& get_requirements()
    {
        return requirements;
    };

    /**
     *  Get the user template of the VM
     *    @return the template as a XML string
     */
    string& get_template(string& xml_str)
    {
        if (vm_template != 0)
        {
            vm_template->to_xml(xml_str);
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

        vm_template->remove("SCHED_ACTION", attributes);
    }

    /**
     * Sets an attribute in the VM Template, it must be allocated in the heap
     *
     * @param attributes to hold the VM actions
     */
    void set_attribute(Attribute* att)
    {
        return vm_template->set(att);
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
    friend ostream& operator<<(ostream& os, VirtualMachineXML& vm)
    {
        if (vm.hosts.empty())
        {
            return os;
        }

        vector<VirtualMachineXML::Host *>::reverse_iterator  i;
        vector<int>::iterator j;

        os  << "\t PRI\tHID  VM: " << vm.oid << endl
            << "\t-----------------------"  << endl;

        for (i=vm.hosts.rbegin();i!=vm.hosts.rend();i++)
        {
            os << "\t" << (*i)->priority << "\t" << (*i)->hid << endl;
        }

        os << endl;

        return os;
    };

    /**
     * Adds a message to the VM's USER_TEMPLATE/SCHED_MESSAGE attribute
     *   @param st Message to set
     */
    void log(const string &st);

protected:

    /**
     *  For constructors
     */
    void init_attributes();

    //--------------------------------------------------------------------------
    //--------------------------------------------------------------------------
    struct Host
    {
        int     hid;
        float   priority;

        Host(int _hid):
            hid(_hid),
            priority(0){};

        ~Host(){};

        bool operator<(const Host& b) const { //Sort by priority
            return priority < b.priority;
        }
    };

    static bool host_cmp (const Host * a, const Host * b )
    {
        return (*a < *b );
    };
    //--------------------------------------------------------------------------
    //--------------------------------------------------------------------------

    // ----------------------- VIRTUAL MACHINE ATTRIBUTES --------------------
    /**
     *
     */
    int     oid;

    int     uid;
    int     gid;

    int     hid;

    int     resched;

    int     memory;
    float   cpu;

    string  rank;
    string  requirements;

    /**
     *  Matching hosts
     */
    vector<VirtualMachineXML::Host *>   hosts;

    /**
     * The VM user template
     */
     VirtualMachineTemplate * vm_template;
};

#endif /* VM_XML_H_ */
