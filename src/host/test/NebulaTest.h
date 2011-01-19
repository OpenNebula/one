/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef NEBULA_TEST_H_
#define NEBULA_TEST_H_

#include "SqlDB.h"

#include "NebulaTemplate.h"

#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "HostPool.h"
#include "UserPool.h"

#include "VirtualMachineManager.h"
#include "LifeCycleManager.h"
#include "InformationManager.h"
#include "TransferManager.h"
#include "DispatchManager.h"
#include "RequestManager.h"
#include "HookManager.h"
#include "AuthManager.h"

class NebulaTest
{
private:
    bool mysql;

    NebulaTest()
    {
        mysql = false;
    };

public:

    static NebulaTest& instance()
    {
        static NebulaTest instance;

        return instance;
    };

    void setMysql(bool _mysql)
    {
        mysql = _mysql;
    }

    bool isMysql()
    {
        return mysql;
    }

    // -----------------------------------------------------------
    // Pools
    // -----------------------------------------------------------

    static VirtualMachinePool* create_vmpool(SqlDB* db, string hook_location)
    {
        vector<const Attribute *> hooks;
        return new VirtualMachinePool(db, hooks, hook_location);
    }

    static HostPool* create_hpool(SqlDB* db, string hook_location)
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


        return new HostPool(db, host_hooks, hook_location);
    }

    static VirtualNetworkPool* create_vnpool(SqlDB* db, string mac_prefix, int size)
    {
        return new VirtualNetworkPool(db,mac_prefix,size);
    }

    static UserPool* create_upool(SqlDB* db)
    {
        return new UserPool(db);
    }

    static ImagePool* create_ipool( SqlDB* db,
                                    string repository_path,
                                    string default_image_type,
                                    string default_device_prefix)
    {
        return new ImagePool(db,repository_path,default_image_type,
                            default_device_prefix);
    }

    // -----------------------------------------------------------
    // Managers
    // -----------------------------------------------------------

    static VirtualMachineManager* create_vmm(VirtualMachinePool* vmpool,
                                             HostPool*           hpool,
                                             time_t              timer_period,
                                             time_t              poll_period)
    {
        return NULL;
    }

    static LifeCycleManager* create_lcm(VirtualMachinePool* vmpool, HostPool* hpool)
    {
        return NULL;
    }

    static InformationManager* create_im(   HostPool*   hpool,
                                            time_t      timer_period,
                                            string      remotes_location)
    {
        return NULL;
    }

    static TransferManager* create_tm(  VirtualMachinePool* vmpool,
                                        HostPool*           hpool)
    {
        return NULL;
    }

    static DispatchManager* create_dm(   VirtualMachinePool* vmpool,
                                        HostPool*           hpool)
    {
        return NULL;
    }

    static RequestManager* create_rm(
                    VirtualMachinePool *    vmpool,
                    HostPool *              hpool,
                    VirtualNetworkPool *    vnpool,
                    UserPool           *    upool,
                    ImagePool          *    ipool,
                    string                  log_file)
    {
        return NULL;
    }

    static HookManager* create_hm(VirtualMachinePool * vmpool)
    {
        map<string,string>          mad_value;
        VectorAttribute *           mad;
        vector<const Attribute *>   hm_mads;

        ostringstream               oss;

        // we need the full path (i.e, starting with '/')
        // for the dummy executable
        oss << getenv("PWD") << "/../../hm_mad/test/dummy";
        mad_value.insert(make_pair("EXECUTABLE",oss.str()));

        mad = new VectorAttribute("HM_MAD",mad_value);
        hm_mads.push_back(mad);

        return new HookManager(hm_mads,vmpool);
    }

    static AuthManager* create_authm(time_t timer_period)
    {
        return NULL;
    }
};

#endif /*NEBULA_TEST_H_*/