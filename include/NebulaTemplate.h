/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#ifndef NEBULA_TEMPLATE_H_
#define NEBULA_TEMPLATE_H_

#include "Template.h"
#include <map>

/**
 * This class provides the basic abstraction for OpenNebula configuration files
 */
class NebulaTemplate : public Template
{
public:
    NebulaTemplate(const string& etc_location, const char * _conf_name)
    {
        conf_file = etc_location + _conf_name;
    }

    virtual ~NebulaTemplate(){};

    /**
     *  Parse and loads the configuration in the template
     */
    int load_configuration();

protected:
    /**
     *  Full path to the configuration file
     */
    string                  conf_file;

    /**
     *  Defaults for the configuration file
     */
    multimap<string, Attribute*> conf_default;

    /**
     *  Sets the defaults value for the template
     */
    virtual void set_conf_default() = 0;

    /**
     *  Sets the defaults value for multiple attributes
     */
    virtual void set_multiple_conf_default() = 0;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

class OpenNebulaTemplate : public NebulaTemplate
{
public:

    OpenNebulaTemplate(const string& etc_location, const string& _var_location):
        NebulaTemplate(etc_location, conf_name), var_location(_var_location)
        {};

    ~OpenNebulaTemplate(){};

    /**
     *  Read or Generate the master key file to encrypt DB data when needed
     *  this key is added to the configuration of OpenNebula and can be obtained
     *  through one.system.config
     */
    int load_key();

private:
    /**
     *  Name for the configuration file, oned.conf
     */
    static const char * conf_name;

    /**
     *  Path for the var directory, for defaults
     */
    string var_location;

    /**
     *  Sets the defaults value for the template
     */
    void set_conf_default();

    /**
     *  Sets the defaults value for multiple attributes
     */
    void set_multiple_conf_default();

    /**
     *  register the multiple configuration attributes and clean the
     *  conf_default hash
     */
    void register_multiple_conf_default(const std::string& conf_section);

    /**
     *  Sets a default single attribute value
     */
    void set_conf_single(const std::string& attr, const std::string& value);

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
                     const std::string& ds_migrate);

    /**
     *  Sets a the defaults for a Market
     */
    void set_conf_market(const std::string& name,
                         const std::string& required_attrs);
    /**
     *  Sets a the defaults for a Auth drivers
     */
    void set_conf_auth(const std::string& name,
                       const std::string& change_password);
};


#endif /*NEBULA_TEMPLATE_H_*/
