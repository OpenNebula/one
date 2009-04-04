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

#include "HookManager.h"
#include "Nebula.h"

const char * HookManager::hook_driver_name = "hook_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::load_mads(int uid) 
{
    HookManagerDriver *     hm_mad;
    ostringstream           oss;
    const VectorAttribute * vattr;
    int                     rc;
    
    Nebula::log("HKM",Log::INFO,"Loading Hook Manager driver.");
    
    vattr = static_cast<const VectorAttribute *>(mad_conf[0]);
    
    if ( vattr == 0 )
    {
        Nebula::log("HKM",Log::INFO,"Failed to load Hook Manager driver.");
        return;
    }

    VectorAttribute hook_conf("HOOK_MAD",vattr->value());
        
    hook_conf.replace("NAME",hook_driver_name);
    
    hm_mad = new HookManagerDriver(0,hook_conf.value(),false,vmpool);
    
    rc = add(hm_mad);
                
    if ( rc == 0 )
    {
        oss.str("");            
        oss << "\tHook Manager loaded";
            
        Nebula::log("HKM",Log::INFO,oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

