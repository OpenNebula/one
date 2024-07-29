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

#ifndef SCHEDULER_TEMPLATE_H_
#define SCHEDULER_TEMPLATE_H_

#include "NebulaTemplate.h"


class SchedulerTemplate : public NebulaTemplate
{
public:

    SchedulerTemplate(const std::string& etc_location):
        NebulaTemplate(etc_location, conf_name, "SCHEDULER_CONFIGURATION")
    {};

    ~SchedulerTemplate() {};

    std::string get_policy() const;

    std::string get_ds_policy() const;

    std::string get_nics_policy() const;

private:
    /**
     *  Name for the configuration file, oned.conf
     */
    static const char * conf_name;

    /**
     *  Sets the defaults value for the template
     */
    void set_conf_default() override;

    /**
     *  Sets the defaults value for multiple attributes
     */
    void set_multiple_conf_default()  override {};
};

#endif /*SCHEDULER_TEMPLATE_H_*/
