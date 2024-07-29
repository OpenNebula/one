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

#ifndef OPENNEBULA_TEMPLATE_H_
#define OPENNEBULA_TEMPLATE_H_

#include "NebulaTemplate.h"
#include "ActionSet.h"
#include "AuthRequest.h"
#include "VMActions.h"

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

class OpenNebulaTemplate : public NebulaTemplate
{
public:

    OpenNebulaTemplate(const std::string& etc_location,
                       const std::string& _var_location,
                       const std::string& _conf_name = conf_name):
        NebulaTemplate(etc_location, _conf_name.c_str(), "OPENNEBULA_CONFIGURATION"),
        var_location(_var_location)
    {};

    ~OpenNebulaTemplate() = default;

    /**
     *  Read or Generate the master key file to encrypt DB data when needed
     *  this key is added to the configuration of OpenNebula and can be obtained
     *  through one.system.config
     */
    int load_key();

    /**
     *  Parse and loads the configuration in the template
     */
    int load_configuration() override;

    /**
     *  Returns action set from a string of actions seperated by commas
     */
    static int set_vm_auth_ops(const std::string& ops_str,
                               ActionSet<VMActions::Action>& ops_set, std::string& error);

    /**
     *  @param  action
     *  @return authorization operation configured for the given VM action
     */
    AuthRequest::Operation get_vm_auth_op(VMActions::Action action) const
    {
        return vm_actions.get_auth_op(action);
    }

private:
    /**
     *  Name for the configuration file, oned.conf
     */
    static const char * conf_name;

    /**
     *  Path for the var directory, for defaults
     */
    std::string var_location;

    /**
     *  Default set of VM action permissions
     */
    VMActions vm_actions;

    /**
     *  Sets the defaults value for the template
     */
    void set_conf_default() override;

    /**
     *  Sets the defaults value for multiple attributes
     */
    void set_multiple_conf_default() override;

    /**
     *  register the multiple configuration attributes and clean the
     *  conf_default hash
     */
    void register_multiple_conf_default(const std::string& conf_section);

    /**
     *  Sets a the defaults for a DS
     */
    void set_conf_ds(const std::string& name,
                     const std::string& required_attrs,
                     const std::string& persistent_only);

    /**
     *  Sets a the defaults for a TM
     */
    void set_conf_tm(const std::string& name,
                     const std::string& ln_target,
                     const std::string& clone_target,
                     const std::string& shared,
                     const std::string& ds_migrate,
                     const std::string& driver);

    /**
     *  Sets a the defaults for a Market
     */
    void set_conf_market(const std::string& name,
                         const std::string& required_attrs,
                         const std::string& app_actions);
    /**
     *  Sets a the defaults for a Auth drivers
     */
    void set_conf_auth(const std::string& name,
                       const std::string& change_password,
                       const std::string& driver_managed_groups,
                       const std::string& driver_managed_group_admin,
                       const std::string& max_token_time);

    /**
     * Sets a the defaults for a Network drivers
     */
    void set_conf_vn(const std::string& name,
                     const std::string& bridge_type);
};

#endif /*OPENNEBULA_TEMPLATE_H_*/
