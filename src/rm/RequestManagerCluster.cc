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

void RequestManagerCluster::add_generic(
        int                         cluster_id,
        int                         object_id,
        RequestAttributes&          att,
        PoolSQL *                   pool,
        PoolObjectSQL::ObjectType   type)
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

    int     old_cluster_id;
    string  old_cluster_name;

    Datastore::DatastoreType ds_type;

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

    old_cluster_id   = cluster_obj->get_cluster_id();
    old_cluster_name = cluster_obj->get_cluster_name();

    ds_type = get_ds_type(object);

    if ( old_cluster_id == cluster_id )
    {
        object->unlock();
        success_response(cluster_id, att);
        return;
    }

    cluster_obj->set_cluster(cluster_id, cluster_name);

    pool->update(object);

    object->unlock();

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
            get(object_id, true, &object, &cluster_obj);

            if ( object != 0 )
            {
                cluster_obj->set_cluster(old_cluster_id, old_cluster_name);

                pool->update(object);

                object->unlock();
            }

            return;
        }

        if ( add_object(cluster, object_id, ds_type, att.resp_msg) < 0 )
        {
            cluster->unlock();

            failure_response(INTERNAL, att);

            // Rollback
            get(object_id, true, &object, &cluster_obj);

            if ( object != 0 )
            {
                cluster_obj->set_cluster(old_cluster_id, old_cluster_name);

                pool->update(object);

                object->unlock();
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

        if ( del_object(cluster, object_id, att.resp_msg) < 0 )
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
