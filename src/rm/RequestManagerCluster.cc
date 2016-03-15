/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
    string err_msg;

    Cluster *       cluster;
    Clusterable *   cluster_obj = 0;
    PoolObjectSQL * object = 0;

    PoolObjectAuth c_perms;
    PoolObjectAuth obj_perms;

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att, c_perms,
                cluster_name, true);

        if ( rc == -1 )
        {
            return;
        }
    }
    else
    {
        cluster_name = ClusterPool::NONE_CLUSTER_NAME;
    }

    rc = get_info(pool, object_id, type, att, obj_perms, obj_name, true);

    if ( rc == -1 )
    {
        return;
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
        {
            ar.add_auth(auth_op, c_perms);          // ADMIN  CLUSTER
        }

        ar.add_auth(AuthRequest::ADMIN, obj_perms); // ADMIN  OBJECT

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);

            return;
        }
    }

    // ------------- Set new cluster id in object ---------------------
    get(object_id, true, &object, &cluster_obj);

    if ( object == 0 )
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
        object->unlock();
        success_response(cluster_id, att);
        return;
    }

    pool->update(object);

    object->unlock();

    // ------------- Add/del object to new cluster ---------------------
    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        cluster = clpool->get(cluster_id, true);

        if ( cluster == 0 )
        {
            att.resp_obj = PoolObjectSQL::CLUSTER;
            att.resp_id  = cluster_id;
            failure_response(NO_EXISTS, att);

            // Rollback
            get(object_id, true, &object, &cluster_obj);

            if ( object != 0 )
            {
                if (add)
                {
                    cluster_obj->del_cluster(cluster_id);
                }
                else
                {
                    cluster_obj->add_cluster(cluster_id);
                }

                pool->update(object);

                object->unlock();
            }

            return;
        }

        if (add)
        {
            rc = add_object(cluster, object_id, att.resp_msg);
        }
        else
        {
            rc = del_object(cluster, object_id, att.resp_msg);
        }

        if ( rc < 0 )
        {
            cluster->unlock();

            failure_response(INTERNAL, att);

            // Rollback
            get(object_id, true, &object, &cluster_obj);

            if ( object != 0 )
            {
                if (add)
                {
                    cluster_obj->del_cluster(cluster_id);
                }
                else
                {
                    cluster_obj->add_cluster(cluster_id);
                }

                pool->update(object);

                object->unlock();
            }

            return;
        }

        clpool->update(cluster);

        cluster->unlock();
    }

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
    string err_msg;

    Cluster *   cluster = 0;
    Host *      host = 0;

    PoolObjectAuth c_perms;
    PoolObjectAuth obj_perms;

    int     old_cluster_id;
    string  old_cluster_name;

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att, c_perms,
                cluster_name, true);

        if ( rc == -1 )
        {
            return;
        }
    }
    else
    {
        cluster_name = ClusterPool::NONE_CLUSTER_NAME;
    }

    rc = get_info(hpool, host_id, PoolObjectSQL::HOST, att, obj_perms, obj_name, true);

    if ( rc == -1 )
    {
        return;
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
        {
            ar.add_auth(auth_op, c_perms);          // ADMIN  CLUSTER
        }

        ar.add_auth(AuthRequest::ADMIN, obj_perms); // ADMIN  HOST

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);

            return;
        }
    }

    // ------------- Set new cluster id in object ---------------------
    host = hpool->get(host_id, true);

    if ( host == 0 )
    {
        att.resp_obj = PoolObjectSQL::HOST;
        att.resp_id  = host_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    old_cluster_id   = host->get_cluster_id();
    old_cluster_name = host->get_cluster_name();

    if ( old_cluster_id == cluster_id )
    {
        host->unlock();
        success_response(cluster_id, att);
        return;
    }

    host->set_cluster(cluster_id, cluster_name);

    hpool->update(host);

    host->unlock();

    // ------------- Add object to new cluster ---------------------
    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        cluster = clpool->get(cluster_id, true);

        if ( cluster == 0 )
        {
            att.resp_obj = PoolObjectSQL::CLUSTER;
            att.resp_id  = cluster_id;
            failure_response(NO_EXISTS, att);

            // Rollback
            host = hpool->get(host_id, true);

            if ( host != 0 )
            {
                host->set_cluster(old_cluster_id, old_cluster_name);

                hpool->update(host);

                host->unlock();
            }

            return;
        }

        if ( cluster->add_host(host_id, att.resp_msg) < 0 )
        {
            cluster->unlock();

            failure_response(INTERNAL, att);

            // Rollback
            host = hpool->get(host_id, true);

            if ( host != 0 )
            {
                host->set_cluster(old_cluster_id, old_cluster_name);

                hpool->update(host);

                host->unlock();
            }

            return;
        }

        clpool->update(cluster);

        cluster->unlock();
    }

    // ------------- Remove host from old cluster ---------------------

    if ( old_cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        cluster = clpool->get(old_cluster_id, true);

        if ( cluster == 0 )
        {
            // This point should be unreachable.
            // The old cluster is not empty (at least has the host_id),
            // so it cannot be deleted
            success_response(cluster_id, att);
            return;
        }

        if ( cluster->del_host(host_id, att.resp_msg) < 0 )
        {
            cluster->unlock();

            failure_response(INTERNAL, att);
            return;
        }

        clpool->update(cluster);

        cluster->unlock();
    }

    success_response(cluster_id, att);

    return;
}
