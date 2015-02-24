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

#ifndef QUOTA_VIRTUALMACHINE_H_
#define QUOTA_VIRTUALMACHINE_H_

#include "Quota.h"

/**
 *  VM Quotas, defined as:
 *  VM  = [
 *        VMS           = <Max. number of VMs>
 *        MEMORY        = <Max. number of MB requested by VMs>
 *        CPU           = <Max. number of CPU units requested by VMs>
 *        VOLATILE_SIZE = <Max. number of volatile disk MB>
 *        VMS_USED      = Current number of VMs
 *        MEMORY_USED   = Overall Memory requested
 *        CPU_USED      = Overall CPU requested
 *        VOLATILE_SIZE_USED = <Max. number of volatile disk MB>
 *    ]
 *
 *   0 = unlimited, default if missing
 */

class QuotaVirtualMachine :  public Quota
{
public:

    QuotaVirtualMachine(bool is_default):
        Quota("VM_QUOTA",
              "VM",
              VM_METRICS,
              NUM_VM_METRICS,
              is_default)
    {};

    ~QuotaVirtualMachine(){};

    /**
     *  Check if the resource allocation will exceed the quota limits. If not
     *  the usage counters are updated
     *    @param tmpl template for the resource
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    bool check(Template* tmpl, Quotas& default_quotas, string& error);

    /**
     *  Check if the resource update (change in MEMORY or CPU) will exceed the
     *  quota limits. If not the usage counters are updated
     *    @param tmpl with increments in MEMORY and CPU
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    bool update(Template * tmpl, Quotas& default_quotas, string& error);

    /**
     *  Decrement usage counters when deallocating image
     *    @param tmpl template for the resource
     */
    void del(Template* tmpl);

    /**
     *  Gets a quota, overrides base to not to use ID.
     *    @param id of the quota, ignored
     *    @param va The quota
     *
     *    @return a pointer to the quota or 0 if not found
     */
    int get_quota(const string& id, VectorAttribute **va);

protected:

    /**
     * Gets a quota, overrides base to not to use ID.
     *
     *    @param id of the quota, ignored
     *    @param va The quota
     *    @param it The quota iterator, if it is found
     *
     *    @return 0 on success, -1 if not found
     */
    int get_quota(
            const string& id,
            VectorAttribute **va,
            map<string, Attribute *>::iterator& it)
    {
        it = attributes.begin();
        return get_quota(id, va);
    }

    /**
     * Gets the default quota identified by its ID.
     *
     *    @param id of the quota
     *    @param default_quotas Quotas that contain the default limits
     *    @param va The quota, if it is found
     *
     *    @return 0 on success, -1 if not found
     */
    int get_default_quota(
        const string& id,
        Quotas& default_quotas,
        VectorAttribute **va);

    static const char * VM_METRICS[];

    static const int NUM_VM_METRICS;
};

#endif /*QUOTA_VIRTUALMACHINE_H_*/
