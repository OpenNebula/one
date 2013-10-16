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

    VirtualMachineTemplate(
            bool _replace_mode,
            const char   _separator,
            const char * _xml_root):
        Template(_replace_mode, _separator, _xml_root){};

    ~VirtualMachineTemplate(){};

    VirtualMachineTemplate(VirtualMachineTemplate& vmt):Template(vmt){};

    /**
     *  Checks the template for RESTRICTED ATTRIBUTES
     *    @param rs_attr the first restricted attribute found if any
     *    @return true if a restricted attribute is found in the template
     */
    bool check(string& rs_attr)
    {
        return Template::check(rs_attr, restricted_attributes);
    };

    void set_xml_root(const char * _xml_root)
    {
        Template::set_xml_root(_xml_root);
    };

    /**
     * Deletes all restricted attributes
     */
    void remove_restricted();

    /**
     * Deletes all the attributes, excepts the restricted ones
     */
    void remove_all_except_restricted();

    /**
     *  Returns the hypervisor name if the template is hybrid
     *  @param hypervisor the resulting hypervisor string
     *  @return true if any hybrid hypervisor attribute found, false otherwise
     */
     bool get_hybrid_hypervisor(string& hypervisor) const;

private:

    friend class VirtualMachinePool;

    static vector<string> restricted_attributes;

    /**
     * Array containing the hybrid attributes, and counter. There is a
     * correspondence between Host::HYBRID_HYPERVISOR and
     * VirtualMachine::HYBRID_ATTRIBUTES. Attributes in HYBRID_ATTRIBUTES[i] are
     * meant to be used in hosts reporting a a hypervisor of type
     * HYBRID_HYPERVISOR[i]
     */
    static const char * HYBRID_ATTRIBUTES[];

    static const int NUM_HYBRID_ATTRIBUTES;

    /**
     * Stores the attributes as restricted, these attributes will be used in
     * VirtualMachineTemplate::check
     * @param rattrs Attributes to restrict
     */
    static void set_restricted_attributes(vector<const Attribute *>& rattrs)
    {
        Template::set_restricted_attributes(rattrs, restricted_attributes);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_MACHINE_TEMPLATE_H_*/
