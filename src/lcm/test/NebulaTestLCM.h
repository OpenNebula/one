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

#ifndef NEBULA_TEST_LCM_H_
#define NEBULA_TEST_LCM_H_

#include "NebulaTest.h"

class NebulaTestLCM: public NebulaTest
{
public:
    NebulaTestLCM():NebulaTest()
    {
        NebulaTest::the_tester = this;

        need_vm_pool   = true;
        need_host_pool = true;    
        need_user_pool = true;
        need_group_pool = true;
        need_vnet_pool = true;
        need_image_pool= true;

        need_vmm = true;
        need_lcm = true;
        need_tm  = true;
        need_dm  = true;
    }

    ~NebulaTestLCM(){};

    TransferManager* create_tm(VirtualMachinePool* vmpool,
                               HostPool*           hpool)
    {
        vector<const Attribute *> tm_mads;

        return new TransferManagerTest(vmpool, hpool, tm_mads);
    }


    VirtualMachineManager* create_vmm(VirtualMachinePool* vmpool,
                                      HostPool*           hpool,
                                      time_t              timer_period,
                                      time_t              poll_period)
    {
        vector<const Attribute *> vmm_mads;
        return new VirtualMachineManagerTest(vmpool,
                                            hpool,
                                            timer_period,
                                            poll_period,
                                            vmm_mads);
    }

};

#endif /*NEBULA_TEST_LCM_H_*/
