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

#include "RequestManagerCluster.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

// TODO: same method in RequestManagerChown, should be moved to Request

int RequestManagerCluster::get_info (PoolSQL *                 pool,
                                   int                       id,
                                   PoolObjectSQL::ObjectType type,
                                   RequestAttributes&        att,
                                   PoolObjectAuth&           perms,
                                   string&                   name)
{
    PoolObjectSQL * ob;

    if ((ob = pool->get(id,true)) == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(type), id), att);
        return -1;
    }

    ob->get_permissions(perms);

    name = ob->get_name();

    ob->unlock();

    return 0;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ClusterAddHost::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int cluster_id  = xmlrpc_c::value_int(paramList.getInt(1));
    int host_id     = xmlrpc_c::value_int(paramList.getInt(2));

    int rc;

    string cluster_name;
    string host_name;
    string err_msg;

    Cluster * cluster;
    Host *    host;

    PoolObjectAuth c_perms;
    PoolObjectAuth h_perms;

    int     old_cluster_id;
    string  old_cluster_name;

    rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att, c_perms, cluster_name);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(hpool, host_id, PoolObjectSQL::HOST, att, h_perms, host_name);

    if ( rc == -1 )
    {
        return;
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.gid);

        ar.add_auth(auth_op, c_perms);              // MANAGE CLUSTER
        ar.add_auth(AuthRequest::ADMIN, h_perms);   // ADMIN  HOST

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                             authorization_error(ar.message, att),
                             att);

            return;
        }
    }

    // ------------- Set new cluster id in host ---------------------

    host = hpool->get(host_id, true);

    if ( host == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::HOST), host_id),
                att);

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

    // ------------- Add host to new cluster ---------------------

    cluster = clpool->get(cluster_id, true);

    if ( cluster == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::CLUSTER),cluster_id),
                att);

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

    if ( cluster->add_host(host_id, err_msg) < 0 )
    {
        cluster->unlock();

        failure_response(INTERNAL,
                request_error("Cannot add host to cluster", err_msg),
                att);

        return;
    }

    clpool->update(cluster);

    cluster->unlock();

    // ------------- Remove host from old cluster ---------------------

    cluster = clpool->get(old_cluster_id, true);

    if ( cluster == 0 )
    {
        // This point should be unreachable.
        // The old cluster is not empty (at least has the host_id),
        // so it cannot be deleted
        success_response(cluster_id, att);
        return;
    }

    if ( cluster->del_host(host_id, err_msg) < 0 )
    {
        cluster->unlock();

        failure_response(INTERNAL,
                request_error("Cannot remove host from cluster", err_msg),
                att);

        return;
    }

    clpool->update(cluster);

    cluster->unlock();

    success_response(cluster_id, att);

    return;
}
