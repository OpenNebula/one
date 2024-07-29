/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef VMGROUP_XML_H_
#define VMGROUP_XML_H_

#include "ObjectXML.h"
#include "VMGroupRole.h"
#include "VMGroupRule.h"

class VirtualMachinePoolXML;
class VirtualMachineRolePoolXML;

class VMGroupXML : public ObjectXML
{
public:
    VMGroupXML(const std::string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    VMGroupXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    int get_oid() const
    {
        return oid;
    };

    const std::string& get_name() const
    {
        return name;
    };

    /**
     *  Dumps a Group, its roles and affinity rules to an output stream
     */
    friend std::ostream& operator<<(std::ostream& os, VMGroupXML& vmg);

    /**
     *  Adds the internal role placement rules to each VM in the role
     *    @params vmpool VM set of pending VMs
     *    @params oss stream to output debug information
     */
    void set_antiaffinity_requirements(VirtualMachinePoolXML * vmpool,
                                       std::ostringstream& oss);

    /**
     *  Adds the internal role placement rules to each VM in the role
     *    @params vmpool VM set of pending VMs
     *    @params oss stream to output debug information
     */
    void set_affinity_requirements(VirtualMachinePoolXML * vmpool,
                                   VirtualMachineRolePoolXML * vm_roles_pool, std::ostringstream& oss);

    /**
     *  Adds host affinity rules to each VM in the roles
     *    @params vmp the VM set of pending VMs
     *    @params oss stream to output debug information
     */
    void set_host_requirements(VirtualMachinePoolXML * vmp,
                               std::ostringstream& oss);


private:
    // ------------------------------------------------------------------------
    // VMGroup Attributes
    // ------------------------------------------------------------------------
    int oid;

    std::string name;

    VMGroupRoles roles;

    VMGroupRule::rule_set affined;
    VMGroupRule::rule_set anti_affined;

    // ------------------------------------------------------------------------
    // ------------------------------------------------------------------------
    /**
     *  Bootstrap VMGroup roles ans rules
     */
    void init_attributes();
};

#endif /* VMGROUP_XML_H_ */
