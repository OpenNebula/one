/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

using namespace std;

/**
 *  Virtual Network Template class, it represents a VN configuration file.
 */
class VirtualNetworkTemplate : public Template
{
public:
    VirtualNetworkTemplate():Template(false,'=',"TEMPLATE"){};

    VirtualNetworkTemplate(bool replace_mode,
                           const char   separator,
                           const char * xml_root):Template(replace_mode,
                                                           separator,
                                                           xml_root){};

    ~VirtualNetworkTemplate(){};

    VirtualNetworkTemplate(VirtualNetworkTemplate& vnt):Template(vnt){};

    // -------------------------------------------------------------------------
    // Restricted attributes interface implementation
    // -------------------------------------------------------------------------
    virtual bool check_restricted(string& rs_attr, const Template* base)
    {
        return Template::check_restricted(rs_attr, base, restricted);
    }

    virtual bool check_restricted(string& rs_attr)
    {
        return Template::check_restricted(rs_attr, restricted);
    }

    static void parse_restricted(vector<const SingleAttribute *>& ra)
    {
        Template::parse_restricted(ra, restricted);
    }

    // -------------------------------------------------------------------------
    // Encrypted attributes interface implementation
    // -------------------------------------------------------------------------
    virtual void encrypt(const std::string& one_key)
    {
        Template::encrypt(one_key, encrypted);
    }

    virtual void decrypt(const std::string& one_key)
    {
        Template::decrypt(one_key, encrypted);
    }

    // One-time execution
    static void parse_encrypted(vector<const SingleAttribute *>& ea)
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
