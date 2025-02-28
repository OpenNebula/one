/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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


class VirtualMachinePoolXML : public PoolXML
{
public:
    VirtualMachinePoolXML(const xmlNodePtr node,
                          const xmlNodePtr _requirements)
        : PoolXML(node)
        , requirements(_requirements)
    {}

    virtual ~VirtualMachinePoolXML() {};

    /**
     * Retrieves the pending and rescheduling VMs
     *
     * @return   0 on success
     *          -1 on error
     *          -2 if no VMs need to be scheduled
     */
    void set_up() override;

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
     *  Returns a vector of matched hosts
     */
    const std::vector<Resource *>& get_vm_resources() const
    {
        return vm_resources.get_resources();
    }

    /**
     *  Sort the VMs in the pool
     */
    void sort_vm_resources()
    {
        vm_resources.sort_resources();
    }

    /**
     *  Sort the VMs in the pool
     */
    void remove_vm_resources(int oid)
    {
        vm_resources.remove_resource(oid);
    }

protected:

    int get_suitable_nodes(std::vector<xmlNodePtr>& content) const override
    {
        // Pending or ((running or unknown) and resched))
        return get_nodes("/VM_POOL/VM[STATE=1 or ((STATE=8 or "
                         "(LCM_STATE=3 or LCM_STATE=16)) and RESCHED=1)]", content);
    }

    void add_object(xmlNodePtr node) override;

    xmlNodePtr requirements = nullptr;
private:
    /**
     *  Stores the list of vms, and it associated user prioty vm_resources.
     */
    VirtualMachineResourceMatch vm_resources;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineRolePoolXML : public VirtualMachinePoolXML
{
public:

    VirtualMachineRolePoolXML(const xmlNodePtr node, const xmlNodePtr requirements):
        VirtualMachinePoolXML(node, requirements) {};

    virtual ~VirtualMachineRolePoolXML() {};

    /**
     * Retrieves the VMs part of a role
     *
     * @return   0 on success
     *          -1 on error
     */
    void set_up() override;

protected:

    int get_suitable_nodes(std::vector<xmlNodePtr>& content) const override
    {
        std::ostringstream oss;

        oss << "/VM_POOL/VM[TEMPLATE/VMGROUP/ROLE]";

        return get_nodes(oss.str(), content);
    }
};
#endif /* VM_POOL_XML_H_ */
