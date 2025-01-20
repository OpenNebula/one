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

#include "QuotaVirtualMachine.h"
#include "Quotas.h"
#include "VirtualMachine.h"
#include "VirtualMachineDisk.h"
#include "VirtualMachinePool.h"
#include "Nebula.h"
#include "ClusterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::vector<std::string> QuotaVirtualMachine::VM_METRICS = {"VMS", "RUNNING_VMS", "CPU",
                                                            "RUNNING_CPU", "MEMORY", "RUNNING_MEMORY", "SYSTEM_DISK_SIZE"
                                                           };

std::vector<std::string> QuotaVirtualMachine::VM_GENERIC;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaVirtualMachine::check(Template * tmpl,
                                Quotas& default_quotas,
                                string& error)
{
    map<string, float> vm_request;

    int         memory, running_memory;
    int         vms, running_vms;
    float       cpu, running_cpu;
    long long   size;

    if ( tmpl->get("MEMORY", memory)  )
    {
        if ( memory < 0 )
        {
            error = "MEMORY attribute must be a positive integer value";
            return false;
        }

        vm_request.insert(make_pair("MEMORY", memory));
    }

    if ( tmpl->get("CPU", cpu) )
    {
        if ( cpu < 0 )
        {
            error = "CPU attribute must be a positive float or integer value";
            return false;
        }

        vm_request.insert(make_pair("CPU", cpu));
    }

    size = VirtualMachineDisks::system_ds_size(tmpl, true);

    size += VirtualMachine::get_snapshots_system_size(tmpl);

    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    if ( tmpl->get("VMS", vms) )
    {
        vm_request.insert(make_pair("VMS", vms));
    }

    if ( tmpl->get("RUNNING_MEMORY", running_memory) )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", running_memory));
    }

    if ( tmpl->get("RUNNING_CPU", running_cpu) )
    {
        vm_request.insert(make_pair("RUNNING_CPU", running_cpu));
    }

    if ( tmpl->get("RUNNING_VMS", running_vms) )
    {
        vm_request.insert(make_pair("RUNNING_VMS", running_vms));
    }

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;

        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    string cluster_ids;

    if (get_quota_id(*tmpl, cluster_ids) == 0)
    {
        if (!check_quota(cluster_ids, vm_request, default_quotas, error))
        {
            return false;
        }
    }

    bool skip_global = false;

    tmpl->get("SKIP_GLOBAL_QUOTA", skip_global);

    if (skip_global)
    {
        return true;
    }

    return check_quota("", vm_request, default_quotas, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaVirtualMachine::add(Template * tmpl)
{
    map<string, float> vm_request;

    float value;

    if ( tmpl->get("MEMORY", value) )
    {
        vm_request.insert(make_pair("MEMORY", value));
    }

    if ( tmpl->get("CPU", value) )
    {
        vm_request.insert(make_pair("CPU", value));
    }

    if ( tmpl->get("VMS", value) )
    {
        vm_request.insert(make_pair("VMS", value));
    }

    if ( tmpl->get("RUNNING_MEMORY", value) )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", value));
    }

    if ( tmpl->get("RUNNING_CPU", value) )
    {
        vm_request.insert(make_pair("RUNNING_CPU", value));
    }

    if ( tmpl->get("RUNNING_VMS", value) )
    {
        vm_request.insert(make_pair("RUNNING_VMS", value));
    }

    long long size = VirtualMachineDisks::system_ds_size(tmpl, true);

    size += VirtualMachine::get_snapshots_system_size(tmpl);

    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;
        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    string cluster_ids;

    if (get_quota_id(*tmpl, cluster_ids) == 0)
    {
        add_quota(cluster_ids, vm_request);
    }

    bool skip_global = false;

    tmpl->get("SKIP_GLOBAL_QUOTA", skip_global);

    if (skip_global)
    {
        return;
    }

    add_quota("", vm_request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaVirtualMachine::del(Template * tmpl)
{
    map<string, float> vm_request;

    int         memory, running_memory, running_vms, vms;
    float       cpu, running_cpu;
    long long   size;

    if ( tmpl->get("MEMORY", memory) )
    {
        vm_request.insert(make_pair("MEMORY", memory));
    }

    if ( tmpl->get("CPU", cpu) )
    {
        vm_request.insert(make_pair("CPU", cpu));
    }

    if ( tmpl->get("VMS", vms) )
    {
        vm_request.insert(make_pair("VMS", vms));
    }

    if ( tmpl->get("RUNNING_MEMORY", running_memory) )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", running_memory));
    }

    if ( tmpl->get("RUNNING_CPU", running_cpu) )
    {
        vm_request.insert(make_pair("RUNNING_CPU", running_cpu));
    }

    if ( tmpl->get("RUNNING_VMS", running_vms) )
    {
        vm_request.insert(make_pair("RUNNING_VMS", running_vms));
    }

    size = VirtualMachineDisks::system_ds_size(tmpl, true);

    size += VirtualMachine::get_snapshots_system_size(tmpl);

    vm_request.insert(make_pair("SYSTEM_DISK_SIZE", size));

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;
        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    string cluster_ids;
    if (get_quota_id(*tmpl, cluster_ids) == 0)
    {
        del_quota(cluster_ids, vm_request);
    }

    bool skip_global = false;
    tmpl->get("SKIP_GLOBAL_QUOTA", skip_global);

    if (skip_global)
    {
        return;
    }

    del_quota("", vm_request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaVirtualMachine::recompute_clusters(int user_id, int group_id, VectorAttribute* vm_quota)
{
    auto vm_pool = Nebula::instance().get_vmpool();

    string id = vm_quota->vector_value("CLUSTER_IDS");

    std::set<int> cluster_ids;

    one_util::split_unique(id, ',', cluster_ids);

    for (auto cluster_id : cluster_ids)
    {
        // Get all VMs on the cluster, owned by the user or group
        vector<int> oids;
        vm_pool->get_cluster_vms(user_id, group_id, cluster_id, oids);

        for (auto oid : oids)
        {
            auto vm = vm_pool->get_ro(oid);

            VirtualMachineTemplate quota_tmpl;
            vm->get_quota_template(quota_tmpl, true, vm->is_running_quota());

            quota_tmpl.add("SKIP_GLOBAL_QUOTA", true);
            add(&quota_tmpl);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::add_metric_generic(const std::string& metric)
{
    if (std::find(VM_METRICS.begin(), VM_METRICS.end(), metric) != VM_METRICS.end())
    {
        return -1;
    }

    VM_METRICS.push_back(metric);
    VM_METRICS.push_back("RUNNING_" + metric);
    VM_GENERIC.push_back(metric);

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void QuotaVirtualMachine::add_running_quota_generic(Template& tmpl)
{
    for (const string& metric : VM_GENERIC)
    {
        string value;
        if (tmpl.get(metric, value))
        {
            tmpl.add("RUNNING_" + metric, value);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::get_quota(
        const std::string& cluster_ids,
        VectorAttribute **va,
        std::map<std::string, Attribute *>::iterator& it)
{
    *va = nullptr;

    for ( it = attributes.begin(); it != attributes.end(); ++it)
    {
        auto q = static_cast<VectorAttribute *>(it->second);

        if (q->vector_value("CLUSTER_IDS") == cluster_ids)
        {
            *va = q;
            return 0;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::get_quota(int cluster_id, VectorAttribute **va)
{
    *va = nullptr;

    for (auto quota : attributes)
    {
        auto q = static_cast<VectorAttribute *>(quota.second);

        string id = q->vector_value("CLUSTER_IDS");

        std::set<int> cluster_ids;

        one_util::split_unique(id, ',', cluster_ids);

        if (cluster_ids.count(cluster_id) == 1)
        {
            *va = q;
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::get_quota_id(const Template& tmpl, string& cluster_ids)
{
    int cluster_id;

    if ( tmpl.get("CLUSTER_ID", cluster_id) )
    {
        VectorAttribute* va;

        if (get_quota(cluster_id, &va) == 0)
        {
            cluster_ids = va->vector_value("CLUSTER_IDS");
            return 0;
        }
    }

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::set(vector<VectorAttribute*> * new_quotas, string& error)
{
    vector<VectorAttribute *>::iterator  it;

    ostringstream oss;

    std::vector<int> clusters_vector; // List of existing clusters
    auto cpool = Nebula::instance().get_clpool();

    cpool->list(clusters_vector);

    std::set<int> clusters(clusters_vector.begin(), clusters_vector.end());

    for (it = new_quotas->begin(); it != new_quotas->end(); ++it)
    {
        VectorAttribute * tq;

        string id = (*it)->vector_value("CLUSTER_IDS");

        std::set<int> cluster_ids;

        // Normalize the cluster ids attribute: comma separated, unique ids, sorted
        if (!id.empty())
        {
            one_util::split_unique(id, ',', cluster_ids);

            id = one_util::join(cluster_ids, ',');

            (*it)->replace("CLUSTER_IDS", id);
        }

        get_quota(id, &tq);

        if ( tq == nullptr )
        {
            for (auto cluster : cluster_ids)
            {
                // Check cluster exists
                if (clusters.find(cluster) == clusters.end())
                {
                    oss <<  "Cluster " << cluster << " does not exist";
                    error = oss.str();

                    return -1;
                }

                VectorAttribute * va;

                // Check cluster ID does not exist in other quota
                if (get_quota(cluster, &va) == 0 && va != tq)
                {
                    oss <<  "Quota for cluster id " << cluster << " already exists";
                    error = oss.str();

                    return -1;
                }
            }

            VectorAttribute * nq;

            if ((nq = new_quota(*it)) == 0)
            {
                goto error_limits;
            }

            Quota::add(nq);

            if (!nq->vector_value("CLUSTER_IDS").empty())
            {
                int user_id = -1, group_id = -1;

                (*it)->vector_value("UID", user_id);
                (*it)->vector_value("GID", group_id);

                recompute_clusters(user_id, group_id, nq);
            }
        }
        else
        {
            if (update_limits(tq, *it) != 0)
            {
                goto error_limits;
            }
        }

        cleanup_quota(id);
    }

    return 0;

error_limits:
    oss <<  "Negative limits or bad format in quota " << template_name;

    oss << " = [ " << (*it)->marshall(",") << " ]";

    error = oss.str();

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaVirtualMachine::get_default_quota(
        const string& id,
        Quotas& default_quotas,
        VectorAttribute **va)
{
    return default_quotas.vm_get(id, va);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaVirtualMachine::update(Template * tmpl,
                                 Quotas& default_quotas,
                                 string& error)
{
    map<string, float> vm_request;

    int         delta_memory, delta_running_memory, delta_running_vms;
    float       delta_cpu, delta_running_cpu;
    long long   delta_size;


    if ( tmpl->get("MEMORY", delta_memory) == true )
    {
        vm_request.insert(make_pair("MEMORY", delta_memory));
    }

    if ( tmpl->get("RUNNING_MEMORY", delta_running_memory) == true )
    {
        vm_request.insert(make_pair("RUNNING_MEMORY", delta_running_memory));
    }

    if ( tmpl->get("RUNNING_VMS", delta_running_vms) == true )
    {
        vm_request.insert(make_pair("RUNNING_VMS", delta_running_vms));
    }

    if ( tmpl->get("CPU", delta_cpu) == true )
    {
        vm_request.insert(make_pair("CPU", delta_cpu));
    }

    if ( tmpl->get("RUNNING_CPU", delta_running_cpu) == true )
    {
        vm_request.insert(make_pair("RUNNING_CPU", delta_running_cpu));
    }

    delta_size = VirtualMachineDisks::system_ds_size(tmpl, true);

    delta_size += VirtualMachine::get_snapshots_system_size(tmpl);

    if ( delta_size != 0 )
    {
        vm_request.insert(make_pair("SYSTEM_DISK_SIZE", delta_size));
    }

    for (const auto& metric : VM_GENERIC)
    {
        float generic_quota;
        if ( tmpl->get(metric, generic_quota) )
        {
            vm_request.insert(make_pair(metric, generic_quota));
        }

        if ( tmpl->get("RUNNING_" + metric, generic_quota) )
        {
            vm_request.insert(make_pair("RUNNING_" + metric, generic_quota));
        }
    }

    string cluster_ids;

    if (get_quota_id(*tmpl, cluster_ids) == 0)
    {
        if (!check_quota(cluster_ids, vm_request, default_quotas, error))
        {
            return false;
        }

    }

    return check_quota("", vm_request, default_quotas, error);
}
