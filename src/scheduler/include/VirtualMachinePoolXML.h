/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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


#ifndef VM_POOL_XML_H_
#define VM_POOL_XML_H_

#include "PoolXML.h"
#include "VirtualMachineXML.h"

using namespace std;

class VirtualMachinePoolXML : public PoolXML
{
public:

    VirtualMachinePoolXML(Client*        client,
                          unsigned int   machines_limit,
                          bool           _live_resched):
        PoolXML(client, machines_limit), live_resched(_live_resched){};

    virtual ~VirtualMachinePoolXML(){};

    /**
     * Retrieves the pending and rescheduling VMs
     *
     * @return   0 on success
     *          -1 on error
     *          -2 if no VMs need to be scheduled
     */
    int set_up();

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    VirtualMachineXML * get(int oid) const
    {
        return static_cast<VirtualMachineXML *>(PoolXML::get(oid));
    };

    /**
     *  Dispatch a VM to the given host
     *    @param vid the VM id
     *    @param hid the id of the target host
     *    @param resched the machine is going to be rescheduled
     */
    int dispatch(int vid, int hid, int dsid, bool resched) const;

    /**
     *  Update the VM template
     *    @param vid the VM id
     *    @param st the template string
     *
     *    @return 0 on success, -1 otherwise
     */
    int update(int vid, const string &st) const;

    /**
     *  Update the VM template
     *      @param the VM
     *
     *      @return 0 on success, -1 otherwise
     */
    int update(VirtualMachineXML * vm) const
    {
        string xml;

        return update(vm->get_oid(), vm->get_template(xml));
    };

protected:

    int get_suitable_nodes(vector<xmlNodePtr>& content)
    {
        // Pending or ((running or unknown) and resched))
        return get_nodes("/VM_POOL/VM[STATE=1 or "
            "((LCM_STATE=3 or LCM_STATE=16) and RESCHED=1)]", content);
    }

    virtual void add_object(xmlNodePtr node);

    virtual int load_info(xmlrpc_c::value &result);

    /**
     * Do live migrations to resched VMs
     */
    bool live_resched;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineActionsPoolXML : public VirtualMachinePoolXML
{
public:

    VirtualMachineActionsPoolXML(Client*       client,
                                 unsigned int  machines_limit):
        VirtualMachinePoolXML(client, machines_limit, false){};

    virtual ~VirtualMachineActionsPoolXML(){};

    /**
     * Retrieves the VMs with pending actions
     *
     * @return   0 on success
     *          -1 on error
     *          -2 if no VMs with pending actions
     */
    int set_up();

    /**
     * Calls one.vm.action
     *
     * @param vid The VM id
     * @param action Action argument (shutdown, hold, release...)
     * @param error_msg Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int action(int vid, const string &action, string &error_msg) const;

protected:

    int get_suitable_nodes(vector<xmlNodePtr>& content)
    {
        ostringstream oss;

        oss << "/VM_POOL/VM/USER_TEMPLATE/SCHED_ACTION[TIME < " << time(0)
            << " and not(DONE > 0)]/../..";

        return get_nodes(oss.str().c_str(), content);
    }
};

#endif /* VM_POOL_XML_H_ */
