/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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
    NebulaTemplate(const std::string& etc_location, const char * _conf_name,
            const char * root_name) : Template(false, '=', root_name)
    {
        conf_file = etc_location + _conf_name;
    }

    virtual ~NebulaTemplate() = default;

    /**
     *  Parse and loads the configuration in the template
     */
    virtual int load_configuration();

protected:
    /**
     *  Full path to the configuration file
     */
    std::string                  conf_file;

    /**
     *  Defaults for the configuration file
     */
    std::multimap<std::string, Attribute*> conf_default;

    /**
     *  Sets the defaults value for the template
     */
    virtual void set_conf_default() = 0;

    /**
     *  Sets the defaults value for multiple attributes
     */
    virtual void set_multiple_conf_default() = 0;

    /**
     *  Sets a default single attribute value
     */
    void set_conf_single(const std::string& attr, const std::string& value);
};

#endif /*NEBULA_TEMPLATE_H_*/
