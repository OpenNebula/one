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

#ifndef HOOK_IMPLEMENTATION_H_
#define HOOK_IMPLEMENTATION_H_

#include <string>

class Template;
class Hook;

/**
 *  This is an abstract interface for any Hook class. It provides the
 *  specific logic for the Hook type. It is included by the Hook class that
 *  handles persistency.
 */
class HookImplementation
{
protected:
    friend class Hook;

    HookImplementation() = default;

    virtual ~HookImplementation() = default;

    /**
     *  Builds the hook from its template implementation
     *    @param tmpl Template with hook attributes
     *    @param error description
     *
     *    @return 0 on success
     */
    virtual int from_template(const Template * tmpl, std::string& error) = 0;

    /**
     *  This function is execute custom setups after updating the hook template
     *    @param tmpl updated template
     *    @param error description
     *
     *    @return 0 on success
     */
    virtual int post_update_template(Template * tmpl, std::string& error) = 0;

    /**
     *  This function parses the hook template upon creation
     *    @param tmpl updated template
     *    @param error description
     *
     *    @return 0 on success
     */
    virtual int parse_template(Template *tmpl, std::string& error_str) = 0;
};

#endif
