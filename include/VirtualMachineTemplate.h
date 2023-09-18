/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include <string>
#include <memory>

/**
 *  Virtual Machine Template class, it represents a VM configuration file.
 */
class VirtualMachineTemplate : public Template
{
public:
    VirtualMachineTemplate():Template(false,'=',"TEMPLATE"){};

    VirtualMachineTemplate(
            bool _replace_mode,
            const char   _separator,
            const char * _xml_root):
        Template(_replace_mode, _separator, _xml_root){};

    ~VirtualMachineTemplate(){};

    VirtualMachineTemplate(const Template& vmt):Template(vmt){};

    VirtualMachineTemplate(const VirtualMachineTemplate& t) = default;

    VirtualMachineTemplate& operator=(const VirtualMachineTemplate& t)
    {
        if (this != &t)
        {
            Template::operator=(t);
        }

        return *this;
    }

    void set_xml_root(const char * _xml_root)
    {
        Template::set_xml_root(_xml_root);
    };

    /**
     * Replaces the given image from the DISK attribute with a new one
     *   @param target_id IMAGE_ID the image to be replaced
     *   @param target_name IMAGE the image to be replaced
     *   @param target_uname IMAGE_UNAME the image to be replaced
     *   @param new_name of the new image
     *   @param new_uname of the owner of the new image
     */
    int replace_disk_image(int target_id, const std::string&
        target_name, const std::string& target_uname,
        const std::string& new_name, const std::string& new_uname);

    // -------------------------------------------------------------------------
    // Restricted attributes interface implementation
    // -------------------------------------------------------------------------
    bool check_restricted(std::string& rs_attr, const Template* base, bool append) override
    {
        return Template::check_restricted(rs_attr, base, restricted, append);
    }

    bool check_restricted(std::string& rs_attr) override
    {
        return Template::check_restricted(rs_attr, restricted);
    }

    static void parse_restricted(const std::vector<const SingleAttribute *>& ra)
    {
        Template::parse_restricted(ra, restricted);
    }

    // -------------------------------------------------------------------------
    // UpdateConf attributes
    // -------------------------------------------------------------------------
    static std::map<std::string,std::vector<std::string>> UPDATECONF_ATTRS;

    /**
     *  Returns a new template that contains only the attribues vaild in an
     *  update conf operation
     *
     *  @return pointer to new VM template
     */
    std::unique_ptr<VirtualMachineTemplate> get_updateconf_template() const;

    // -------------------------------------------------------------------------
    // Encrypted attributes interface implementation
    // -------------------------------------------------------------------------
    void encrypt(const std::string& one_key) override
    {
        Template::encrypt(one_key, encrypted);
    }

    void decrypt(const std::string& one_key) override
    {
        Template::decrypt(one_key, encrypted);
    }

    static void parse_encrypted(const std::vector<const SingleAttribute *>& ea)
    {
        Template::parse_encrypted(ea, encrypted);
    }

    std::string& to_xml_short(std::string& xml) const;

    /**
     *  Get restricted attributes for NIC
     */
    static void restricted_nic(std::set<std::string>& rs)
    {
        get_restricted("NIC", rs);
    }

    /**
     *  Get restricted attributes for DISK
     */
    static void restricted_disk(std::set<std::string>& rs)
    {
        get_restricted("DISK", rs);
    }

private:
    /**
     *  Restricted attribute list for VirtualMachineTemplates
     */
    static std::map<std::string, std::set<std::string> > restricted;

    /**
     *  Encrypted attribute list for VirtualMachineTemplates
     */
    static std::map<std::string, std::set<std::string> > encrypted;

    /**
     *  @param rs set of restricted attributes for a key
     *  @param name key in the restricted map
     */
    static void get_restricted(const std::string& name, std::set<std::string>& rs)
    {
        auto it = restricted.find(name);

        if ( it != restricted.end())
        {
            rs = it->second;
        }
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_MACHINE_TEMPLATE_H_*/
