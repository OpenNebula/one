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

#include "RequestManagerRename.h"
#include "PoolObjectSQL.h"

#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerRename::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributes& att)
{
    int     oid      = xmlrpc_c::value_int(paramList.getInt(1));
    string  new_name = xmlrpc_c::value_string(paramList.getString(2));

    int    rc;
    string old_name;

    PoolObjectAuth  operms;
    PoolObjectSQL * object;

    if (test_and_set_rename(oid) == false)
    {
        att.resp_msg = "Object is being renamed";
        failure_response(INTERNAL, att);

        return;
    }

    rc = get_info(pool, oid, auth_object, att, operms, old_name, true);

    if ( rc == -1 )
    {
        clear_rename(oid);
        return;
    }

    if (old_name == new_name)
    {
        success_response(oid, att);

        clear_rename(oid);
        return;
    }

    // ------------- Set authorization request for non-oneadmin's --------------

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(auth_op, operms); // MANAGE OBJECT

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);
            clear_rename(oid);
            return;
        }
    }

    // ----------------------- Check name uniqueness ---------------------------

    object = get(new_name, operms.uid, true);

    if ( object != 0 )
    {
        ostringstream oss;
        int id = object->get_oid();

        object->unlock();

        oss << object_name(auth_object) << " cannot be renamed to " << new_name
            << " because it collides with " << object_name(auth_object) << " "
            << id;

        att.resp_msg = oss.str();

        failure_response(ACTION, att);

        clear_rename(oid);
        return;
    }

    // -------------------------- Update the object ----------------------------

    object = pool->get(oid, true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        clear_rename(oid);
        return;
    }

    if ( object->set_name(new_name, att.resp_msg) != 0 )
    {
        object->unlock();

        failure_response(ACTION, att);

        clear_rename(oid);
        return;
    }

    pool->update(object);

    object->unlock();

    pool->update_cache_index(old_name, operms.uid, new_name, operms.uid);

    batch_rename(oid);

    success_response(oid, att);

    clear_rename(oid);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClusterRename::batch_rename(int oid)
{
    Cluster * cluster = static_cast<ClusterPool *>(pool)->get(oid, true);

    if (cluster == 0)
    {
        return;
    }

    const set<int> & hosts      = cluster->get_host_ids();
    const set<int> & datastores = cluster->get_datastore_ids();
    const set<int> & vnets      = cluster->get_vnet_ids();

    set<int>::iterator it;

    string cluster_name = cluster->get_name();

    cluster->unlock();

    Host *              host;
    HostPool*           hpool = Nebula::instance().get_hpool();

    Datastore *         ds;
    DatastorePool*      dspool = Nebula::instance().get_dspool();

    VirtualNetwork*     vnet;
    VirtualNetworkPool* vnpool = Nebula::instance().get_vnpool();

    for (it = hosts.begin(); it != hosts.end(); it++)
    {
        host = hpool->get(*it, true);

        if (host != 0)
        {
            if (host->get_cluster_id() == oid)
            {
                host->set_cluster(oid, cluster_name);
                hpool->update(host);
            }

            host->unlock();
        }
    }

    for (it = datastores.begin(); it != datastores.end(); it++)
    {
        ds = dspool->get(*it, true);

        if (ds != 0)
        {
            if (ds->get_cluster_id() == oid)
            {
                ds->set_cluster(oid, cluster_name);
                dspool->update(ds);
            }

            ds->unlock();
        }
    }

    for (it = vnets.begin(); it != vnets.end(); it++)
    {
        vnet = vnpool->get(*it, true);

        if (vnet != 0)
        {
            if (vnet->get_cluster_id() == oid)
            {
                vnet->set_cluster(oid, cluster_name);
                vnpool->update(vnet);
            }

            vnet->unlock();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DatastoreRename::batch_rename(int oid)
{
    Datastore * datastore = static_cast<DatastorePool*>(pool)->get(oid, true);

    if (datastore == 0)
    {
        return;
    }

    const set<int> & images = datastore->get_image_ids();

    set<int>::iterator it;

    string image_name = datastore->get_name();

    datastore->unlock();

    Image *     image;
    ImagePool * ipool = Nebula::instance().get_ipool();

    for (it = images.begin(); it != images.end(); it++)
    {
        image = ipool->get(*it, true);

        if (image != 0)
        {
            if (image->get_ds_id() == oid)
            {
                image->set_ds_name(image_name);
                ipool->update(image);
            }

            image->unlock();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostRename::batch_rename(int oid)
{
    Host * host = static_cast<HostPool*>(pool)->get(oid, true);

    if (host == 0)
    {
        return;
    }

    const set<int> & vms = host->get_vm_ids();

    set<int>::iterator it;

    string host_name = host->get_name();

    host->unlock();

    VirtualMachine *     vm;
    VirtualMachinePool * vmpool = Nebula::instance().get_vmpool();

    for (it = vms.begin(); it != vms.end(); it++)
    {
        vm = vmpool->get(*it, true);

        if (vm != 0)
        {
            if (vm->hasHistory() && vm->get_hid() == oid)
            {
                vm->set_hostname(host_name);
                vmpool->update(vm);
            }

            vm->unlock();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
