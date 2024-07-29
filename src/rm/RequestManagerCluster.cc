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

#include "RequestManagerCluster.h"
#include "HostPool.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerCluster::action_generic(
        int                         cluster_id,
        int                         object_id,
        RequestAttributes&          att,
        PoolSQL *                   pool,
        PoolObjectSQL::ObjectType   type,
        bool                        add)
{
    int rc;

    string cluster_name;
    string obj_name;

    Clusterable * cluster_obj = nullptr;

    unique_ptr<PoolObjectSQL> object;

    PoolObjectAuth c_perms;
    PoolObjectAuth obj_perms;

    rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att, c_perms,
                  cluster_name, true);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(pool, object_id, type, att, obj_perms, obj_name, true);

    if ( rc == -1 )
    {
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, c_perms);          // ADMIN  CLUSTER
    ar.add_auth(AuthRequest::ADMIN, obj_perms); // ADMIN  OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // ------------- Set new cluster id in object ---------------------
    get(object_id, object, &cluster_obj);

    if ( object == nullptr )
    {
        att.resp_obj = type;
        att.resp_id  = object_id;
        failure_response(NO_EXISTS, att);
        return;
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
        success_response(cluster_id, att);
        return;
    }

    pool->update(object.get());

    object.reset();

    // ------------- Add/del object to new cluster ---------------------
    auto cluster = clpool->get(cluster_id);

    if ( cluster == nullptr )
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = cluster_id;
        failure_response(NO_EXISTS, att);

        // Rollback
        get(object_id, object, &cluster_obj);

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

        return;
    }

    if (add)
    {
        rc = add_object(cluster.get(), object_id, att.resp_msg);
    }
    else
    {
        rc = del_object(cluster.get(), object_id, att.resp_msg);
    }

    if ( rc < 0 )
    {
        cluster.reset();

        failure_response(ACTION, att);

        // Rollback
        get(object_id, object, &cluster_obj);

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

        return;
    }

    clpool->update(cluster.get());

    success_response(cluster_id, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerClusterHost::add_generic(
        int                 cluster_id,
        int                 host_id,
        RequestAttributes&  att)
{
    int rc;

    string cluster_name;
    string obj_name;

    PoolObjectAuth c_perms;
    PoolObjectAuth obj_perms;

    int     old_cluster_id;
    string  old_cluster_name;

    rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att, c_perms,
                  cluster_name, true);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(hpool, host_id, PoolObjectSQL::HOST, att, obj_perms, obj_name, true);

    if ( rc == -1 )
    {
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, c_perms);          // ADMIN  CLUSTER
    ar.add_auth(AuthRequest::ADMIN, obj_perms); // ADMIN  HOST

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    string ccpu;
    string cmem;

    if (auto cluster = clpool->get_ro(cluster_id))
    {
        cluster->get_reserved_capacity(ccpu, cmem);
    }
    else
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = cluster_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    // ------------- Set new cluster id in object ---------------------
    if ( auto host = hpool->get(host_id) )
    {
        old_cluster_id   = host->get_cluster_id();
        old_cluster_name = host->get_cluster_name();

        if ( old_cluster_id == cluster_id )
        {
            success_response(cluster_id, att);
            return;
        }

        host->set_cluster(cluster_id, cluster_name);
        host->update_reserved_capacity(ccpu, cmem);

        hpool->update(host.get());
    }
    else
    {
        att.resp_obj = PoolObjectSQL::HOST;
        att.resp_id  = host_id;
        failure_response(NO_EXISTS, att);

        return;
    }

    // ------------- Add object to new cluster ---------------------
    auto cluster = clpool->get(cluster_id);

    if ( clpool->add_to_cluster(PoolObjectSQL::HOST, cluster.get(), host_id, att.resp_msg) < 0 )
    {
        failure_response(INTERNAL, att);

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

        return;
    }

    // ------------- Remove host from old cluster ---------------------
    cluster = clpool->get(old_cluster_id);

    if ( cluster == nullptr )
    {
        // This point should be unreachable.
        // The old cluster is not empty (at least has the host_id),
        // so it cannot be deleted
        success_response(cluster_id, att);
        return;
    }

    if ( clpool->del_from_cluster(PoolObjectSQL::HOST, cluster.get(), host_id, att.resp_msg) < 0 )
    {

        failure_response(INTERNAL, att);
        return;
    }

    success_response(cluster_id, att);

    return;
}
