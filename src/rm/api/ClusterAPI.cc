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

#include "ClusterAPI.h"

#include "DatastorePool.h"
#include "HostPool.h"
#include "PlanPool.h"
#include "VdcPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"

#include "AclManager.h"
#include "PlanManager.h"
#include "SchedulerManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::AddHost(int oid,
                                       int host_id,
                                       RequestAttributes& att)
{
    string cluster_name;
    string obj_name;

    PoolObjectAuth c_perms;
    PoolObjectAuth obj_perms;

    int     old_cluster_id;
    string  old_cluster_name;

    set<int> vm_ids;

    auto hpool = Nebula::instance().get_hpool();

    if (get_info(clpool, oid, PoolObjectSQL::CLUSTER, att, c_perms, cluster_name, true) != 0
        || get_info(hpool, host_id, PoolObjectSQL::HOST, att, obj_perms, obj_name, true) != 0)
    {
        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, c_perms);          // ADMIN  CLUSTER
    ar.add_auth(AuthRequest::ADMIN, obj_perms); // ADMIN  HOST

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    string ccpu;
    string cmem;

    if (auto cluster = clpool->get_ro(oid))
    {
        cluster->get_reserved_capacity(ccpu, cmem);
    }
    else
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = oid;

        return Request::NO_EXISTS;
    }

    // ------------- Set new cluster id in object ---------------------
    if ( auto host = hpool->get(host_id) )
    {
        old_cluster_id   = host->get_cluster_id();
        old_cluster_name = host->get_cluster_name();

        if ( old_cluster_id == oid )
        {
            return Request::SUCCESS;
        }

        host->set_cluster(oid, cluster_name);
        host->update_reserved_capacity(ccpu, cmem);

        vm_ids = host->get_vm_ids();

        hpool->update(host.get());
    }
    else
    {
        att.resp_obj = PoolObjectSQL::HOST;
        att.resp_id  = host_id;

        return Request::NO_EXISTS;
    }

    // ------------- Add object to new cluster ---------------------
    auto cluster = clpool->get(oid);

    if ( clpool->add_to_cluster(PoolObjectSQL::HOST, cluster.get(), host_id, att.resp_msg) < 0 )
    {
        // Rollback
        cluster = clpool->get_ro(old_cluster_id);

        if ( cluster != nullptr )
        {
            cluster->get_reserved_capacity(ccpu, cmem);
        }
        else
        {
            old_cluster_id   = ClusterPool::DEFAULT_CLUSTER_ID;
            old_cluster_name = ClusterPool::DEFAULT_CLUSTER_NAME;

            ccpu = "0";
            cmem = "0";
        }

        if ( auto host = hpool->get(host_id) )
        {
            host->set_cluster(old_cluster_id, old_cluster_name);
            host->update_reserved_capacity(ccpu, cmem);

            hpool->update(host.get());
        }

        return Request::INTERNAL;
    }

    // ------------- Remove host from old cluster ---------------------
    cluster = clpool->get(old_cluster_id);

    if ( cluster == nullptr )
    {
        // This point should be unreachable as old cluster is not empty (host_id)
        return Request::SUCCESS;
    }

    if ( clpool->del_from_cluster(PoolObjectSQL::HOST, cluster.get(), host_id, att.resp_msg) < 0 )
    {
        return Request::INTERNAL;
    }

    // Update cluster quotas and cluster ID in VM
    auto vmpool = Nebula::instance().get_vmpool();

    for (int vm_id : vm_ids)
    {
        VirtualMachineTemplate quota_tmpl;
        int uid = -1, gid = -1;

        if (auto vm = vmpool->get(vm_id))
        {
            if (!vm->hasHistory())
            {
                continue;
            }

            uid = vm->get_uid();
            gid = vm->get_gid();

            vm->get_quota_template(quota_tmpl, true, vm->is_running_quota());

            vm->set_cid(oid);

            vmpool->update_history(vm.get());
            vmpool->update(vm.get());
        }

        // Check cluster quotas on new cluster, remove resources from old cluster
        if (quota_tmpl.empty())
        {
            continue;;
        }

        quota_tmpl.add("SKIP_GLOBAL_QUOTA", true);
        quota_tmpl.replace("CLUSTER_ID", old_cluster_id);

        Quotas::vm_del(uid, gid, &quota_tmpl);

        quota_tmpl.replace("CLUSTER_ID", oid);

        Quotas::vm_add(uid, gid, &quota_tmpl);
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::DelHost(int oid,
                                       int host_id,
                                       RequestAttributes& att)
{
    // Cluster ID is ignored, host can be only in one cluster
    // Removing host from cluster means assign it to default cluster
    return AddHost(ClusterPool::DEFAULT_CLUSTER_ID, host_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::AddDatastore(int oid,
                                            int ds_id,
                                            RequestAttributes& att)
{
    return action_generic(oid,
                          ds_id,
                          att,
                          Nebula::instance().get_dspool(),
                          PoolObjectSQL::DATASTORE,
                          true);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::DelDatastore(int oid,
                                            int ds_id,
                                            RequestAttributes& att)
{
    return action_generic(oid,
                          ds_id,
                          att,
                          Nebula::instance().get_dspool(),
                          PoolObjectSQL::DATASTORE,
                          false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::AddVNet(int oid,
                                       int vnet_id,
                                       RequestAttributes& att)
{
    return action_generic(oid,
                          vnet_id,
                          att,
                          Nebula::instance().get_vnpool(),
                          PoolObjectSQL::NET,
                          true);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::DelVNet(int oid,
                                       int vnet_id,
                                       RequestAttributes& att)
{
    return action_generic(oid,
                          vnet_id,
                          att,
                          Nebula::instance().get_vnpool(),
                          PoolObjectSQL::NET,
                          false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::Optimize(int oid,
                                        RequestAttributes& att)
{
    if ( clpool->exist(oid) == -1 )
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = oid;

        return Request::NO_EXISTS;
    }

    auto plpool = Nebula::instance().get_planpool();

    if (auto plan = plpool->get_ro(oid))
    {
        if (plan->state() == PlanState::APPLYING)
        {
            att.resp_msg = "Can't optimize cluster. A previous plan is currently being applied.";

            return Request::ACTION;
        }

        Nebula::instance().get_sm()->trigger_optimize(oid);

        return Request::SUCCESS;
    }
    else
    {
        att.resp_msg = "Can't find plan for existing cluster.";

        return Request::INTERNAL;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::PlanExecute(int oid,
                                           RequestAttributes& att)
{
    string error_msg;

    if ( clpool->exist(oid) == -1 )
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = oid;

        return Request::NO_EXISTS;
    }

    auto planm = Nebula::instance().get_planm();

    if (planm->start_plan(oid, error_msg) != 0)
    {
        att.resp_msg = error_msg;

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::PlanDelete(int oid,
                                          RequestAttributes& att)
{
    auto cluster = clpool->get(oid);

    if (!cluster)
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = oid;

        return Request::NO_EXISTS;
    }

    auto plpool = Nebula::instance().get_planpool();
    auto plan = plpool->get(oid);

    if (!plan || plan->state() == PlanState::NONE)
    {
        att.resp_msg = "Plan for cluster " + to_string(oid) + " does not exist";

        return Request::ACTION;
    }

    plan->clear();

    if (plpool->update(plan.get()) != 0)
    {
        att.resp_msg = "Unable to delete plan for cluster " + to_string(oid);

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                     bool recursive,
                     RequestAttributes& att)
{
    int oid = object->get_oid();
    int rc = SharedAPI::drop(std::move(object), false, att);

    if (rc != 0)
    {
        return rc;
    }

    Nebula& nd = Nebula::instance();
    auto plan_pool = nd.get_planpool();
    auto plan = plan_pool->get(oid);
    rc += plan_pool->drop(plan.get());

    auto aclm = nd.get_aclm();
    aclm->del_cid_rules(oid);

    // Remove cluster from VDC
    int zone_id = nd.get_zone_id();

    VdcPool * vdcpool = nd.get_vdcpool();

    std::string error;
    std::vector<int> vdcs;

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_cluster(zone_id, oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAPI::action_generic(
        int                         cluster_id,
        int                         object_id,
        RequestAttributes&          att,
        PoolSQL *                   pool,
        PoolObjectSQL::ObjectType   type,
        bool                        add)
{
    string cluster_name;
    string obj_name;

    PoolObjectAuth c_perms;
    PoolObjectAuth obj_perms;

    int rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att, c_perms,
                      cluster_name, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    rc = get_info(pool, object_id, type, att, obj_perms, obj_name, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, c_perms);          // ADMIN  CLUSTER
    ar.add_auth(AuthRequest::ADMIN, obj_perms); // ADMIN  OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // ------------- Set new cluster id in object ---------------------
    unique_ptr<PoolObjectSQL> object = pool->get<PoolObjectSQL>(object_id);
    Clusterable* cluster_obj = dynamic_cast<Clusterable *>(object.get());

    if ( object == nullptr )
    {
        att.resp_obj = type;
        att.resp_id  = object_id;

        return Request::NO_EXISTS;
    }

    if (add)
    {
        rc = cluster_obj->add_cluster(cluster_id);
    }
    else
    {
        rc = cluster_obj->del_cluster(cluster_id);
    }

    if ( rc == -1 )
    {
        return Request::SUCCESS;
    }

    pool->update(object.get());

    object.reset();

    // ------------- Add/del object to new cluster ---------------------
    auto cluster = clpool->get(cluster_id);

    if ( cluster == nullptr )
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = cluster_id;

        // Rollback
        object = pool->get<PoolObjectSQL>(object_id);
        cluster_obj = dynamic_cast<Clusterable *>(object.get());

        if ( object != nullptr )
        {
            if (add)
            {
                cluster_obj->del_cluster(cluster_id);
            }
            else
            {
                cluster_obj->add_cluster(cluster_id);
            }

            pool->update(object.get());
        }

        return Request::NO_EXISTS;
    }

    if (add)
    {
        rc = clpool->add_to_cluster(type, cluster.get(), object_id, att.resp_msg);
    }
    else
    {
        rc = clpool->del_from_cluster(type, cluster.get(), object_id, att.resp_msg);
    }

    if ( rc < 0 )
    {
        cluster.reset();

        // Rollback
        object = pool->get<PoolObjectSQL>(object_id);
        cluster_obj = dynamic_cast<Clusterable *>(object.get());

        if ( object != nullptr )
        {
            if (add)
            {
                cluster_obj->del_cluster(cluster_id);
            }
            else
            {
                cluster_obj->add_cluster(cluster_id);
            }

            pool->update(object.get());
        }

        return Request::ACTION;
    }

    clpool->update(cluster.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAllocateAPI::allocate(const std::string& name,
                                                int& oid,
                                                RequestAttributes& att)
{
    _name = name;

    return SharedAPI::allocate("", ClusterPool::NONE_CLUSTER_ID, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ClusterAllocateAPI::pool_allocate(
        unique_ptr<Template>        tmpl,
        int&                        id,
        RequestAttributes&          att)
{
    int rc = clpool->allocate(_name, &id, att.resp_msg);

    return rc < 0 ? Request::ALLOCATE : Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ClusterUpdateAPI::extra_updates(PoolObjectSQL * obj)
{
    // -------------------------------------------------------------------------
    // Update host capacity reservations
    // -------------------------------------------------------------------------
    auto hpool = Nebula::instance().get_hpool();

    string ccpu;
    string cmem;

    auto cluster = static_cast<Cluster*>(obj);

    const std::set<int>& hosts = cluster->get_host_ids();

    cluster->get_reserved_capacity(ccpu, cmem);

    for (auto hid : hosts)
    {
        auto host = hpool->get(hid);

        if (host == nullptr)
        {
            continue;
        }

        if (host->update_reserved_capacity(ccpu, cmem))
        {
            hpool->update(host.get());
        }
    }

    return 0;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ClusterRenameAPI::batch_rename(int oid)
{
    set<int> hosts;
    string cluster_name;

    if ( auto cluster = clpool->get_ro(oid) )
    {
        hosts = cluster->get_host_ids();

        cluster_name = cluster->get_name();
    }
    else
    {
        return;
    }

    HostPool* hpool = Nebula::instance().get_hpool();

    for (auto hid : hosts)
    {
        if (auto host = hpool->get(hid))
        {
            if (host->get_cluster_id() == oid)
            {
                host->set_cluster(oid, cluster_name);
                hpool->update(host.get());
            }
        }
    }
}