/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

    ~VirtualMachinePoolXML(){};

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
    int dispatch(int vid, int hid, bool resched) const;

protected:

    int get_suitable_nodes(vector<xmlNodePtr>& content)
    {
        return get_nodes("/VM_POOL/VM[STATE=1 or (LCM_STATE=3 and RESCHED=1)]",
                         content);
    };

    virtual void add_object(xmlNodePtr node);

    virtual int load_info(xmlrpc_c::value &result);

    /* Do live migrations to resched VMs*/
    bool live_resched;
};

#endif /* VM_POOL_XML_H_ */
