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


#ifndef VIRTUAL_MACHINE_BASE_H_
#define VIRTUAL_MACHINE_BASE_H_

#include <ostream>
#include <set>
#include <map>
#include <memory>

#include "BaseObject.h"
#include "VirtualMachineTemplate.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineBase : public BaseObject
{
public:

    explicit VirtualMachineBase(const std::string &xml_doc)
        : BaseObject(xml_doc)
    {
        init_attributes();
    };

    explicit VirtualMachineBase(const xmlNodePtr node)
        : BaseObject(node)
    {
        init_attributes();
    }

    virtual ~VirtualMachineBase() = default;

    /**
     * Rebuilds the object from an xml formatted string
     * @param xml_str The xml-formatted string
     * @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     * Print object to xml string
     *  @return xml formatted string
     */
    std::string to_xml() const override;

    //--------------------------------------------------------------------------
    // Get Methods for VirtaulMachineBase class
    //--------------------------------------------------------------------------
    int get_hid() const { return hid; }

    int get_dsid() const { return dsid; }

    time_t get_stime() const { return stime; }

    bool is_resched() const { return resched; }

    bool is_resume() const { return resume; }

    bool is_public_cloud() const { return public_cloud; }

    bool is_active() const { return active; }

    /**
     *  @return storage usage for the VM
     */
    const std::map<int, long long>& get_storage_usage() const
    {
        return ds_usage;
    }

    //--------------------------------------------------------------------------
    // Logging
    //--------------------------------------------------------------------------
    /**
     *  Function to write a Virtual Machine in an output stream
     */
    friend std::ostream& operator<<(std::ostream& os, VirtualMachineBase& vm);

protected:
    /**
     *  For constructors
     */
    int init_attributes();

    void init_storage_usage();

    /* ----------------------- VIRTUAL MACHINE ATTRIBUTES ------------------- */
    int hid;
    int dsid;

    bool resched;
    bool resume;
    bool active;
    bool public_cloud;

    long int    memory;
    float       cpu;
    long long   system_ds_usage;

    std::map<int, long long> ds_usage;

    time_t stime;

    std::set<int> nics_ids_auto;

    // std::map<int, VirtualMachineNicXML *> nics;

    std::unique_ptr<VirtualMachineTemplate> vm_template;
    std::unique_ptr<VirtualMachineTemplate> user_template;
};

#endif // VIRTUAL_MACHINE_BASE_H_
