/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "Hook.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void AllocateRemoveHook::do_hook(void *arg)
{
    PoolObjectSQL * obj = static_cast<PoolObjectSQL *>(arg);
    string          parsed_args = args;

    if ( obj == 0 )
    {
        return;
    }

    parse_hook_arguments(obj, parsed_args);

    Nebula& ne                    = Nebula::instance();
    HookManager * hm              = ne.get_hm();
    const HookManagerDriver * hmd = hm->get();

    if ( hmd != 0 )
    {
        if ( remote == true )
        {
            string hostname;

            hmd->execute(obj->get_oid(),
                         name,
                         remote_host(obj, hostname),
                         cmd,
                         parsed_args);
        }
        else
        {
            hmd->execute(obj->get_oid(), name, cmd, parsed_args);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Hook::parse_hook_arguments(PoolObjectSQL *obj,
                                string&       parsed)
{
    size_t  found;

    found = parsed.find("$ID");

    if ( found !=string::npos )
    {
        ostringstream oss;
        oss << obj->get_oid();

        parsed.replace(found, 3, oss.str());
    }

    found = parsed.find("$TEMPLATE");

    if ( found != string::npos )
    {
        string templ;
        parsed.replace(found, 9, obj->to_xml64(templ));
    }
}
