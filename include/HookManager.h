/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#ifndef HOOK_MANAGER_H_
#define HOOK_MANAGER_H_

#include "MadManager.h"
#include "HookManagerDriver.h"
#include "VirtualMachinePool.h"

using namespace std;

class HookManager : public MadManager
{
public:

    HookManager(vector<const Attribute*>& _mads, VirtualMachinePool * _vmpool)
        :MadManager(_mads),vmpool(_vmpool){};

    ~HookManager(){};
    
    /**
     *  Generic name for the Hook driver
     */
     static const char *  hook_driver_name;    

    /**
     *  
     */
    void load_mads(int uid=0);

    /**
     *  Returns a pointer to a Information Manager MAD. The driver is 
     *  searched by its name and owned by oneadmin with uid=0.
     *    @param name of the driver
     *    @return the Hook driver owned by uid 0, with attribute "NAME" equal to 
     *    name or 0 in not found
     */
    const HookManagerDriver * get()
    {
        string name("NAME");
        string hook_name(hook_driver_name);
        
        return static_cast<const HookManagerDriver *>
               (MadManager::get(0,name,hook_driver_name));
    };
    
private:
    /**
     *  Pointer to the VirtualMachine Pool
     */
     VirtualMachinePool * vmpool;     
};

#endif /*HOOK_MANAGER_H*/

