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

#include "SchedulerManagerDriver.h"
#include "SchedulerManagerMatch.h"

#include "AclManager.h"
#include "VMGroupPool.h"
#include "ClusterPool.h"
#include "Nebula.h"

SchedulerManagerDriver::SchedulerManagerDriver(const std::string& c,
        const std::string& a, int ct): Driver(c, a, ct)
{
    auto& nebula = Nebula::instance();

    vmpool = nebula.get_vmpool();
    hpool  = nebula.get_hpool();
    dspool = nebula.get_dspool();
    vnpool = nebula.get_vnpool();
    upool  = nebula.get_upool();
    clpool = nebula.get_clpool();
    vmgpool= nebula.get_vmgrouppool();
};

/* -------------------------------------------------------------------------- */

void SchedulerManagerDriver::place() const
{
    SchedRequest sr(vmpool, hpool, dspool, vnpool, upool, clpool);

    setup_place_pools(sr);

    match(sr, "Cannot dispatch VM: ");

    std::ostringstream oss;

    scheduler_message(sr, oss);

    place(oss);
}

void SchedulerManagerDriver::optimize(int cluster_id) const
{
    SchedRequest sr(vmpool, hpool, dspool, vnpool, upool, clpool);

    setup_optimize_pools(cluster_id, sr);

    match(sr, "Optimize: ");

    std::ostringstream oss;

    scheduler_message(sr, oss);

    optimize(cluster_id, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerManagerDriver::scheduler_message(SchedRequest& sr, std::ostringstream& oss) const
{
    std::string temp;

    oss << "<SCHEDULER_DRIVER_ACTION>";

    sr.vmpool.to_xml(oss, sr.match.vms);

    sr.hpool.to_xml(oss, sr.match.match_host);

    //Include Image and System datastores to compute SELF LN/CP methods
    dspool->dump(temp, "", 0, -1, false);

    oss << temp;

    sr.vnpool.to_xml(oss, sr.match.match_net);

    if ( sr.match.match_vmgroups.empty() )
    {
        oss << "<VM_GROUP_POOL/>";
    }
    else
    {
        oss << "<VM_GROUP_POOL>";

        for (int id: sr.match.match_vmgroups)
        {
            if (auto grp = vmgpool->get_ro(id))
            {
                std::string grp_s;

                oss << grp->to_xml(grp_s);
            }
        }

        oss << "</VM_GROUP_POOL>";
    }

    sr.clpool.to_xml(oss);

    sr.match.to_xml(oss);

    oss << "</SCHEDULER_DRIVER_ACTION>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SchedulerManagerDriver::log_vm(int id, const std::string& msg) const
{
    if (auto vm = vmpool->get(id))
    {
        vm->set_template_error_message("SCHED_MESSAGE", msg);

        vmpool->update(vm.get());
    }
}

void SchedulerManagerDriver::log_cluster(int cluster_id, const std::string& msg) const
{
    if (auto cluster = clpool->get(cluster_id))
    {
        cluster->set_error_message("SCM", "SCHED_MESSAGE", msg);

        clpool->update(cluster.get());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SchedulerManagerDriver::setup_place_pools(SchedRequest &sr) const
{
    // -------------------------------------------------------------------------
    // Setup VM pool with pending VMs
    // -------------------------------------------------------------------------
    if ( vmpool->get_pending(sr.vmpool.ids) != 0 || sr.vmpool.ids.empty() )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Host matching
    // -------------------------------------------------------------------------
    int rc = hpool->search(sr.hpool.ids, "state = 1 OR state = 2");

    if ( rc != 0 )
    {
        NebulaLog::error("SCM", "Error getting host list.");
        return -1;
    }
    else if ( sr.hpool.ids.empty() )
    {
        sr.vmpool.each_id([this](int id) {
            log_vm(id, "Cannot dispatch VM: No hosts enabled to run VMs");
        });
        return -1;
    }

    sr.merge_cluster_to_host();

    // -------------------------------------------------------------------------
    // Datastore matching (only for system ds)
    // -------------------------------------------------------------------------
    rc = dspool->list(sr.dspool.ids);

    if ( rc != 0 )
    {
        NebulaLog::error("SCM", "Error getting dastore list.");
        return -1;
    }

    for (auto it = sr.dspool.ids.begin(); it != sr.dspool.ids.end(); )
    {
        auto ds = dspool->get_ro(*it);

        if (!ds ||
            (ds->get_type() != Datastore::SYSTEM_DS) ||
            (ds->is_shared() && !ds->is_monitored())||
            (!ds->is_enabled()))
        {
            it = sr.dspool.ids.erase(it);
            continue;
        }
        else
        {
            sr.dspool.set(*it, std::move(ds));
            ++it;
        }
    }

    if ( sr.dspool.ids.empty() )
    {
        sr.vmpool.each_id([this](int id) {
            log_vm(id, "Cannot dispatch VM: No system datastores found to run VMs");
        });
        return -1;
    }

    // -------------------------------------------------------------------------
    // Virtual Network matching (only for NETWORK_MODE = auto)
    // -------------------------------------------------------------------------
    rc = vnpool->list(sr.vnpool.ids);

    if ( rc != 0 )
    {
        NebulaLog::error("SCM", "Error getting virtual network list.");
        return -1;
    }

    return 0;
}

int SchedulerManagerDriver::setup_optimize_pools(int cluster_id, SchedRequest& sr) const
{
    // -------------------------------------------------------------------------
    // Setup VM pool with pending VMs
    // -------------------------------------------------------------------------
    if ( vmpool->get_cluster_vms(-1, -1, cluster_id, sr.vmpool.ids) != 0 ||
            sr.vmpool.ids.empty() )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Host matching
    // -------------------------------------------------------------------------
    std::string filter = "cid = " + std::to_string(cluster_id) + " AND (state = 1 OR state = 2)";

    if ( hpool->search(sr.hpool.ids, filter) != 0 )
    {
        NebulaLog::error("SCM", "Optimize: error getting host list.");
        return -1;
    }
    else if ( sr.hpool.ids.empty() )
    {
        log_cluster(cluster_id, "Optimize: No hosts enabled in cluster");
        return -1;
    }

    sr.merge_cluster_to_host();

    // -------------------------------------------------------------------------
    // Datastore matching (only for system ds)
    // -------------------------------------------------------------------------
    if (dspool->list(sr.dspool.ids) != 0)
    {
        NebulaLog::error("SCM", "Optimize: error getting dastore list.");
        return -1;
    }

    for (auto it = sr.dspool.ids.begin(); it != sr.dspool.ids.end(); )
    {
        auto ds = dspool->get_ro(*it);

        if (!ds ||
            (ds->get_type() != Datastore::SYSTEM_DS) ||
            (ds->is_shared() && !ds->is_monitored()) ||
            (!ds->is_enabled()) ||
            (ds->get_cluster_ids().count(cluster_id) == 0))
        {
            it = sr.dspool.ids.erase(it);
            continue;
        }
        else
        {
            sr.dspool.set(*it, std::move(ds));
            ++it;
        }
    }

    if ( sr.dspool.ids.empty() )
    {
        log_cluster(cluster_id, "Optimize: No system datastores found in cluster");
        return -1;
    }

    // -------------------------------------------------------------------------
    // Virtual Network matching (only for NETWORK_MODE = auto)
    // -------------------------------------------------------------------------
    if (vnpool->list(sr.vnpool.ids) != 0)
    {
        NebulaLog::error("SCM", "Optimize: error getting virtual network list.");
        return -1;
    }

    sr.clpool.ids.push_back(cluster_id);

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Match-making functions for hosts, system ds and vnets
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

static std::string * build_requirements(std::string& ar, std::string& r)
{
    std::string *req = &r;

    if (!r.empty())
    {
        if (!ar.empty())
        {
            std::ostringstream oss;

            oss << ar << " & ( " << r << " )";

            r = oss.str();
        }
    }
    else if (!ar.empty())
    {
        req = &ar;
    }

    return req;
}

// -----------------------------------------------------------------------------

static int authorize(VirtualMachine * vm,
                      PoolObjectSQL *obj,
                      AuthRequest::Operation op,
                      SchedPool<UserPool, User>& upool)
{
    static auto aclm = Nebula::instance().get_aclm();

    if (vm->get_uid() == 0 || vm->get_gid() == 0 )
    {
        return 1;
    }

    PoolObjectAuth perms;

    obj->get_permissions(perms);

    User * user = upool.get(vm->get_uid());

    if (user == nullptr)
    {
        return 2;
    }

    if(!aclm->authorize(vm->get_uid(), user->get_groups(), perms, op))
    {
        return 0;
    }

    return 1;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

static int match_hosts(SchedRequest& sr, VirtualMachine * vm, std::string& error);

static int match_system_ds(SchedRequest& sr, VirtualMachine * vm, std::string& error);

static int match_networks(SchedRequest& sr, VirtualMachine * vm, std::string& error);

void SchedulerManagerDriver::match(SchedRequest& sr, const std::string& ebase) const
{
    int rc;
    std::string error;

    for(int vm_id: sr.vmpool.ids)
    {
        VirtualMachine * vm = sr.vmpool.get(vm_id);

        if ( vm == nullptr )
        {
            continue;
        }

        rc = match_hosts(sr, vm, error);

        if ( rc == -1 )
        {
            if (!error.empty())
            {
                log_vm(vm_id, ebase + error);
            }

            continue;
        }

        rc = match_system_ds(sr, vm, error);

        if ( rc == -1 )
        {
            if (!error.empty())
            {
                log_vm(vm_id, ebase + error);
            }

            continue;
        }

        rc = match_networks(sr, vm, error);

        if ( rc == -1 )
        {
            if (!error.empty())
            {
                log_vm(vm_id, ebase + error);
            }

            continue;
        }

        int gid = vm->vmgroup_id();

        if ( gid != -1 )
        {
            sr.match.match_vmgroups.insert(gid);
        }
    }

    // Add all matched VMs to the match.vms set
    for (auto vid : sr.vmpool.ids)
    {
        if (sr.match.is_host_matched(vid) &&
            sr.match.is_ds_matched(vid) &&
            sr.match.is_net_matched(vid))
        {
            sr.match.vms.insert(vid);
        }
    }

    // Add all VMs in the VM groups to the match vms set
    for (auto gid : sr.match.match_vmgroups)
    {
        if (auto grp = vmgpool->get_ro(gid))
        {
            for (const auto r : grp->roles())
            {
                const auto& vms = r->get_vms();
                sr.match.vms.insert(vms.begin(), vms.end());
            }
        }
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
int match_hosts(SchedRequest& sr, VirtualMachine * vm, std::string& error)
{
    int n_auth  = 0;
    int n_match = 0;

    error.clear();

    // -------------------------------------------------------------------------
    // Prepare VM requirements expression for Host matching
    // -------------------------------------------------------------------------
    std::string areqs, reqs;

    vm->get_user_template_attribute("SCHED_REQUIREMENTS", reqs);
    vm->get_template_attribute("AUTOMATIC_REQUIREMENTS", areqs);

    std::string *requirements = build_requirements(areqs, reqs);

    for (int host_id: sr.hpool.ids)
    {
        Host * host = sr.hpool.get(host_id);

        if (host == nullptr)
        {
            continue;
        }

        //VM cannot be migrated to its current Host
        if (vm->is_resched() &&
               (vm->hasHistory() && (vm->get_hid() == host->get_oid())))
        {
            continue;
        }

        // ---------------------------------------------------------------------
        // Check if user is authorized to deploy on the host
        // ---------------------------------------------------------------------
        int auth = authorize(vm, host, AuthRequest::MANAGE, sr.upool);

        if (auth == 0)
        {
            continue;
        }
        else if (auth == 2)
        {
            return -1; //user does not exists. stop host matching
        }

        n_auth++;

        // ---------------------------------------------------------------------
        // Check if user is authorized to deploy on the host
        // ---------------------------------------------------------------------
        if (!requirements->empty())
        {
            char * estr;
            bool   matched;

            if ( host->eval_bool(*requirements, matched, &estr) != 0 )
            {
                std::ostringstream oss;

                oss << "Error in SCHED_REQUIREMENTS: '" << requirements
                    << "', error: " << estr;

                error = oss.str();

                free(estr);
                return -1;
            }

            if (matched == false)
            {
                continue;
            }
        }

        sr.match.add_host(vm->get_oid(), host_id);

        n_match++;
    }

    if (n_auth == 0)
    {
        error = "User is not authorized to use any host";
        return -1;
    }
    else if (n_match == 0)
    {
        error = "No host meets SCHED_REQUIREMENTS";
        return -1;
    }

    return 0;
}

// -----------------------------------------------------------------------------

int match_system_ds(SchedRequest& sr, VirtualMachine * vm, std::string& error)
{
    int n_auth  = 0;
    int n_match = 0;

    error.clear();

    if (vm->is_resched())
    {
        if (vm->hasHistory())
        {
            sr.match.add_ds(vm->get_oid(), vm->get_ds_id());
        }

        return 0;
    }

    // -------------------------------------------------------------------------
    // Prepare VM requirements expression for Host matching
    // -------------------------------------------------------------------------
    std::string areqs, reqs;

    vm->get_user_template_attribute("SCHED_DS_REQUIREMENTS", reqs);
    vm->get_template_attribute("AUTOMATIC_DS_REQUIREMENTS", areqs);

    std::string *requirements = build_requirements(areqs, reqs);

    for (int ds_id: sr.dspool.ids)
    {
        Datastore * ds = sr.dspool.get(ds_id);

        if (ds == nullptr)
        {
            continue;
        }

        // ---------------------------------------------------------------------
        // Check if user is authorized
        // ---------------------------------------------------------------------
        int auth = authorize(vm, ds, AuthRequest::USE, sr.upool);

        if (auth == 0)
        {
            continue;
        }
        else if (auth == 2)
        {
            return -1; //user does not exists. stop host matching
        }

        n_auth++;

        // ---------------------------------------------------------------------
        // Evaluate VM requirements
        // ---------------------------------------------------------------------
        if (!requirements->empty())
        {
            char * estr;
            bool   matched;

            if ( ds->eval_bool(*requirements, matched, &estr) != 0 )
            {
                std::ostringstream oss;

                oss << "Error in SCHED_DS_REQUIREMENTS: '" << requirements
                    << "', error: " << estr;

                error = oss.str();

                free(estr);
                return -1;
            }

            if (matched == false)
            {
                continue;
            }
        }

        sr.match.add_ds(vm->get_oid(), ds_id);

        n_match++;
    }

    if (n_auth == 0)
    {
        error = "User is not authorized to use any system datastore";
        return -1;
    }
    else if (n_match == 0)
    {
        error = "No system datastore meets SCHED_DS_REQUIREMENTS";
        return -1;
    }

    return 0;
}

// -----------------------------------------------------------------------------

int match_networks(SchedRequest& sr, VirtualMachine * vm, std::string& error)
{
    error.clear();

    std::set<int> auto_ids;

    if ( vm->get_auto_nics(auto_ids) == 0 || vm->is_resched() )
    {
        return 0;
    }

    sr.match.init_net(vm->get_oid(), auto_ids);

    // -------------------------------------------------------------------------
    // Prepare VM requirements expression for VirtualNetwork matching
    // -------------------------------------------------------------------------
    std::string areqs;

    vm->get_template_attribute("AUTOMATIC_NIC_REQUIREMENTS", areqs);

    for (auto nic_id : auto_ids)
    {
        int n_auth  = 0;
        int n_match = 0;

        auto nic = vm->get_nic(nic_id);

        if ( nic == nullptr )
        {
            continue;
        }

        std::string reqs = nic->vector_value("SCHED_REQUIREMENTS");

        std::string *requirements = build_requirements(areqs, reqs);

        for (int net_id: sr.vnpool.ids)
        {
            VirtualNetwork * net = sr.vnpool.get(net_id);

            // -----------------------------------------------------------------
            // Check if user is authorized
            // -----------------------------------------------------------------
            int auth = authorize(vm, net, AuthRequest::USE, sr.upool);

            if (auth == 0)
            {
                continue;
            }
            else if (auth == 2)
            {
                return -1; //user does not exists. stop host matching
            }

            n_auth++;

            // -----------------------------------------------------------------
            // Evaluate VM requirements
            // -----------------------------------------------------------------
            if (!requirements->empty())
            {
                char * estr;
                bool   matched;

                if ( net->eval_bool(*requirements, matched, &estr) != 0 )
                {
                    std::ostringstream oss;

                    oss << "Error in SCHED_NIC_REQUIREMENTS in NIC " << nic_id
                        << ": '" << requirements << "', error: " << estr;

                    error = oss.str();

                    free(estr);
                    return -1;
                }

                if (matched == false)
                {
                    continue;
                }
            }

            sr.match.add_net(vm->get_oid(), nic_id, net_id);

            n_match++;
        }

        if (n_auth == 0)
        {
            error = "User is not authorized to use any virtual network for NIC "
                    + std::to_string(nic_id);
            return -1;
        }
        else if (n_match == 0)
        {
            error = "No virtual network meets SCHED_NIC_REQUIREMENTS for NIC "
                    + std::to_string(nic_id);
            return -1;
        }

    }

    return 0;
}
