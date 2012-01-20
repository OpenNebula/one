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

#ifndef VIRTUAL_MACHINE_TEMPLATE_H_
#define VIRTUAL_MACHINE_TEMPLATE_H_

#include "Template.h"

#include <string.h>

using namespace std;

/**
 *  Virtual Machine Template class, it represents a VM configuration file.
 */
class VirtualMachineTemplate : public Template
{
public:
    VirtualMachineTemplate():
        Template(false,'=',"TEMPLATE"){};

    ~VirtualMachineTemplate(){};

    VirtualMachineTemplate(VirtualMachineTemplate& vmt):Template(vmt){};

    /**
     *  Checks the template for RESTRICTED ATTRIBUTES
     *    @param rs_attr the first restricted attribute found if any
     *    @return true if a restricted attribute is found in the template
     */
    bool check(string& rs_attr)
    {
        vector<string> restricted_attributes;

        restricted_attributes.push_back("CONTEXT/FILES");
        restricted_attributes.push_back("DISK/SOURCE");
        restricted_attributes.push_back("NIC/MAC");
        restricted_attributes.push_back("NIC/VLAN_ID");
        restricted_attributes.push_back("RANK");

        return Template::check(rs_attr, restricted_attributes);
    };
    
    friend class VirtualMachine;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_MACHINE_TEMPLATE_H_*/
