/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef NEBULA_TEST_HOST_H_
#define NEBULA_TEST_HOST_H_

#include "NebulaTest.h"

class NebulaTestHost : public NebulaTest
{
public:
    NebulaTestHost():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_vm_pool   = true;
        need_host_pool = true;    
        need_user_pool = true;
        need_group_pool = true;
        need_vnet_pool = true;
        need_image_pool= true;

        need_hm  = true;
    }

    ~NebulaTestHost(){};

    // -----------------------------------------------------------
    // Pools
    // -----------------------------------------------------------

    HostPool* create_hpool(SqlDB* db, string hook_location, string var_location)
    {
        map<string,string> hook_value;
        VectorAttribute *  hook;

        vector<const Attribute *> host_hooks;

        hook_value.insert(make_pair("NAME","create_test"));
        hook_value.insert(make_pair("ON","CREATE"));
        hook_value.insert(make_pair("COMMAND","/bin/touch"));
        hook_value.insert(make_pair("ARGUMENTS","./var/hook_create_$HID"));
        hook_value.insert(make_pair("REMOTE","no"));

        hook = new VectorAttribute("HOST_HOOK",hook_value);
        host_hooks.push_back(hook);

        map<string,string> hook_value2;

        hook_value2.insert(make_pair("NAME","error_test"));
        hook_value2.insert(make_pair("ON","ERROR"));
        hook_value2.insert(make_pair("COMMAND","/bin/touch"));
        hook_value2.insert(make_pair("ARGUMENTS","./var/hook_error_$HID"));
        hook_value2.insert(make_pair("REMOTE","no"));

        hook = new VectorAttribute("HOST_HOOK",hook_value2);
        host_hooks.push_back(hook);

        map<string,string> hook_value3;

        hook_value3.insert(make_pair("NAME","create_test"));
        hook_value3.insert(make_pair("ON","DISABLE"));
        hook_value3.insert(make_pair("COMMAND","/bin/touch"));
        hook_value3.insert(make_pair("ARGUMENTS","./var/hook_disable_$HID"));
        hook_value3.insert(make_pair("REMOTE","no"));

        hook = new VectorAttribute("HOST_HOOK",hook_value3);
        host_hooks.push_back(hook);


        return new HostPool(db, host_hooks, hook_location, var_location, 0);
    }
};

#endif /*NEBULA_TEST_H_*/
