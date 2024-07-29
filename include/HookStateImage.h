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

#ifndef HOOK_STATE_IMAGE_H_
#define HOOK_STATE_IMAGE_H_

#include "Image.h"
#include "HookImplementation.h"

class HookStateImage : public HookImplementation
{
public:
    /**
     *  @return true if an state hook needs to be trigger for this VM
     */
    static bool trigger(Image * img);

    /**
     *  Function to build a XML message for a state hook
     */
    static std::string format_message(Image * img);

private:
    friend class Hook;

    // *************************************************************************
    // Constructor/Destructor
    // *************************************************************************

    HookStateImage():state(Image::INIT) {};

    virtual ~HookStateImage() = default;

    /**
     *  Check if type dependent attributes are well defined.
     *    @param tmpl pointer to the Hook template
     *    @param error_str string with error information
     *    @return 0 on success
     */
    int parse_template(Template *tmpl, std::string& error_str) override;

    /**
     *  Rebuilds the object from a template
     *    @param tmpl The template
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_template(const Template * tmpl, std::string& error) override;

    /* Checks the mandatory template attributes
     *    @param tmpl The hook template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(Template * tmpl, std::string& error) override;

    // -------------------------------------------------------------------------
    // Hook API Attributes
    // -------------------------------------------------------------------------
    /**
     * VirtualMachine::VmState custom_state VM state which trigger the hook
     * if hook_state is set to CUSTOM
     */
    Image::ImageState state;
};

#endif
