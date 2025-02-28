/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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
 *        CLUSTER_IDS           = Comma separated list of clusters or empty for global quotas
 *        VMS                   = <Max. number of VMs>
 *        RUNNING_VMS           = <Max. number of RUNNING VMS>
 *        MEMORY                = <Max. number of MB requested by VMs>
 *        RUNNING_MEMORY        = <Max. number of MB requested by RUNNING VMs>
 *        CPU                   = <Max. number of CPU units requested by VMs>
 *        RUNNING_CPU           = <Max. number of running CPU units requested by VMs>
 *        SYSTEM_DISK_SIZE      = <Max. number of system disk MB>
 *        VMS_USED              = Current number of VMs
 *        RUNNING_VMS_USED      = Current number of running VMs
 *        MEMORY_USED           = Overall Memory requested
 *        RUNNING_MEMORY_USED   = Overall running Memory requested
 *        CPU_USED              = Overall CPU requested
 *        RUNNING_CPU_USED      = Overall running CPU requested
 *        SYSTEM_DISK_SIZE_USED = Overall system disk requested
 *    ]
 *
 *   0 = unlimited, default if missing
 */

class QuotaVirtualMachine : public Quota
{
public:

    QuotaVirtualMachine(bool is_default):
        Quota("VM_QUOTA",
              "VM",
              VM_METRICS,
              is_default)
    {};

    ~QuotaVirtualMachine() {};

    int get_quota(const std::string& id, VectorAttribute **va) override
    {
        std::map<std::string, Attribute *>::iterator it;
        return get_quota(id, va, it);
    }

    /**
     *  Set the quotas. If the quota previously exists its limit is updated.
     *  The quotas are indexed by CLUSTER_IDS
     *    @param quota_str the quota template in ASCII or XML formats
     *    @param error describe the error in case of error
     *
     *    @return 0 on success -1 otherwise
     */
    int set(std::vector<VectorAttribute*> * quotas, std::string& error) override;

    /**
     *  Check if the resource allocation will exceed the quota limits. If not
     *  the usage counters are updated
     *    @param tmpl template for the resource
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    bool check(Template* tmpl, Quotas& default_quotas, std::string& error) override;

    /**
     *  Check if the resource update (change in MEMORY or CPU) will exceed the
     *  quota limits. If not the usage counters are updated
     *    @param tmpl with increments in MEMORY and CPU
     *    @param default_quotas Quotas that contain the default limits
     *    @param error string
     *    @return true if the operation can be performed
     */
    bool update(Template * tmpl, Quotas& default_quotas, std::string& error) override;

    /**
     *  Add usage counters. Use carefully this method does not care about exceeding the quota
     *    @param tmpl Template with the quota usage
     */
    void add(Template* tmpl);

    /**
     *  Decrement usage counters when deallocating image
     *    @param tmpl template for the resource
     */
    void del(Template* tmpl) override;

    /**
     *  Add generic quota to metrics. It adds also RUNNING_ quota attribute
     *    @param metric Name of the quota metri
     *
     *    @return 0 success, -1 if metric already exists
     */
    static int add_metric_generic(const std::string& metric);

    /**
     * Return vector of generic quota metrics
    */
    static const std::vector<std::string>& generic_metrics()
    {
        return VM_GENERIC;
    }

    /*
     * Add RUNNING_ quotas for generic metrics present in the template
    */
    static void add_running_quota_generic(Template& tmpl);

protected:

    /**
     * Gets a quota, overrides base to use CLUSTER_IDS as id
     *
     *    @param cluster_ids Comma separated list of cluster ids
     *    @param va The quota
     *    @param it The quota iterator, if it is found
     *
     *    @return 0 on success, -1 if not found
     */
    int get_quota(
            const std::string& cluster_ids,
            VectorAttribute **va,
            std::map<std::string, Attribute *>::iterator& it) override;

    /**
     * Gets a quota for cluster ID (the id is included in cluster_ids)
     *
     *    @param cluster_id Cluster ID
     *    @param va The quota
     *
     *    @return 0 on success, -1 if not found
     */
    int get_quota(
            int cluster_id,
            VectorAttribute **va);

    int get_quota_id(const Template& tmpl, std::string& cluster_ids);

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
            const std::string& id,
            Quotas& default_quotas,
            VectorAttribute **va) override;

    /**
     *  Recomputes VM cluster quota usage for specific user or group.
     *    @param user_id user ID or -1 if not specified
     *    @param group_id group ID or -1 if not specified
     *    @param vm_quota New VM cluster quota to recompute
     */
    void recompute_clusters(int user_id, int group_id, VectorAttribute* vm_quota);

    static std::vector<std::string> VM_METRICS;
    static std::vector<std::string> VM_GENERIC;
};

#endif /*QUOTA_VIRTUALMACHINE_H_*/
