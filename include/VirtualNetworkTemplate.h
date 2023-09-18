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

#ifndef VIRTUAL_NETWORK_TEMPLATE_H_
#define VIRTUAL_NETWORK_TEMPLATE_H_

#include "Template.h"

/**
 *  Virtual Network Template class, it represents a VN configuration file.
 */
class VirtualNetworkTemplate : public Template
{
public:
    VirtualNetworkTemplate():Template(false,'=',"TEMPLATE"){};

    VirtualNetworkTemplate(bool replace_mode,
                           const char   separator,
                           const char * xml_root)
        : Template(replace_mode, separator, xml_root) {}

    ~VirtualNetworkTemplate(){};

    VirtualNetworkTemplate(const Template& vnt):Template(vnt){};

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

    // One-time execution
    static void parse_encrypted(const std::vector<const SingleAttribute *>& ea)
    {
        auto eas = const_cast<std::map<std::string, std::set<std::string>> *>(&encrypted);

        Template::parse_encrypted(ea, *eas);
    }

    /**
     *  Encrypted attribute list for VirtualNetworkTemplates
     */
    static const std::map<std::string, std::set<std::string> > encrypted;

private:
    /**
     *  Restricted attribute list for VirtualNetworkTemplates
     */
    static std::map<std::string, std::set<std::string> > restricted;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_NETWORK_TEMPLATE_H_*/
