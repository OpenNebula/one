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

#include "HookStateImage.h"
#include "Image.h"
#include "NebulaUtil.h"
#include "SSLUtil.h"

using namespace std;

bool HookStateImage::trigger(Image * image)
{
    return image->has_changed_state();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string HookStateImage::format_message(Image * image)
{
    std::ostringstream oss;

    std::string image_xml;
    std::string base64;

    oss << "<HOOK_MESSAGE>"
        << "<HOOK_TYPE>STATE</HOOK_TYPE>"
        << "<HOOK_OBJECT>IMAGE</HOOK_OBJECT>"
        << "<STATE>" << Image::state_to_str(image->get_state()) << "</STATE>"
        << "<RESOURCE_ID>" << image->get_oid() << "</RESOURCE_ID>"
        << image->to_xml(image_xml)
        << "</HOOK_MESSAGE>";

    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateImage::parse_template(Template * tmpl, std::string& error_str)
{

    std::string state_str;

    if (!tmpl->get("STATE", state_str))
    {
        error_str = "Hook STATE attribute not found or invalid";
        return -1;
    }

    Image::ImageState st = Image::str_to_state(state_str);

    if ( st == Image::INIT )
    {
        error_str = "Invalid or unkown STATE condition: " + state_str;
        return -1;
    }

    tmpl->replace("STATE", Image::state_to_str(st));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateImage::from_template(const Template * tmpl, string& error)
{
    std::string state_str;

    if ( tmpl->get("STATE", state_str) )
    {
        Image::ImageState is = Image::str_to_state(state_str);

        if (is == Image::INIT)
        {
            error = "Invalid or unknown STATE attribute";
            return -1;
        }
    }
    else
    {
        error = "STATE attribute not found or invalid";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateImage::post_update_template(Template * tmpl, std::string& error)
{
    std::string new_state_str;

    if ( tmpl->get("STATE", new_state_str) )
    {
        Image::ImageState new_state = Image::str_to_state(new_state_str);

        if ( new_state != Image::INIT )
        {
            state = new_state;
            tmpl->replace("STATE", new_state_str);
        }
    }
    else
    {
        error = "The STATE attribute is not defined or it's invalid.";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
