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

#ifndef QUOTA_VIRTUALMACHINE_H_
#define QUOTA_VIRTUALMACHINE_H_

#include "Quota.h"

/**
 *  VM Quotas, defined as:
 *  VM  = [
 *        VMS     = <Max. number of VMs>
 *        MEMORY  = <Max. number of MB requested by VMs>
 *        CPU     = <Max. number of CPU units requested by VMs>
 *        VMS_USED    = Current number of VMs
 *        MEMORY_USED = Overall Memory requested
 *        CPU_USED    = Overall CPU requested
 *    ]
 *
 *   0 = unlimited, default if missing
 */

class QuotaVirtualMachine :  public Quota
{
public:
    
    QuotaVirtualMachine():Quota("VM_QUOTA",
                                "VM",
                                VM_METRICS, 
                                NUM_VM_METRICS)
    {};

    ~QuotaVirtualMachine(){};

    /**
     *  Check if the resource allocation will exceed the quota limits. If not 
     *  the usage counters are updated
     *    @param tmpl template for the resource
     *    @param error string 
     *    @return true if the operation can be performed
     */
    bool check(Template* tmpl,  string& error);

    /**
     *  Decrement usage counters when deallocating image
     *    @param tmpl template for the resource
     */
    void del(Template* tmpl);

    /**
     *  Gets a quota, overrides base to not to use ID.
     *    @param id of the quota
     *    @return a pointer to the quota or 0 if not found
     */
    int get_quota(const string& id, VectorAttribute **va);

protected:
    static const char * VM_METRICS[];

    static const int NUM_VM_METRICS;
};

#endif /*QUOTA_VIRTUALMACHINE_H_*/