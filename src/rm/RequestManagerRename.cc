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

#include "RequestManagerRename.h"
#include "PoolObjectSQL.h"

#include "NebulaLog.h"
#include "Nebula.h"

using namespace std;

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

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, operms); // MANAGE OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);
        clear_rename(oid);
        return;
    }

    // ----------------------- Check name uniqueness ---------------------------

    int db_id = exist(new_name, operms.uid);

    if ( db_id !=-1  )
    {
        ostringstream oss;

        oss << object_name(auth_object) << " cannot be renamed to " << new_name
            << " because it collides with " << object_name(auth_object) << " "
            << db_id;

        att.resp_msg = oss.str();

        failure_response(ACTION, att);

        clear_rename(oid);
        return;
    }

    // -------------------------- Update the object ----------------------------
    if ( auto object = pool->get<PoolObjectSQL>(oid) )
    {
        if ( object->set_name(new_name, att.resp_msg) != 0 )
        {
            failure_response(ACTION, att);

            clear_rename(oid);
            return;
        }

        pool->update(object.get());
    }
    else
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        clear_rename(oid);
        return;
    }

    batch_rename(oid);

    success_response(oid, att);

    clear_rename(oid);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ClusterRename::batch_rename(int oid)
{
    set<int> hosts;
    string cluster_name;

    if ( auto cluster = pool->get_ro<Cluster>(oid) )
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DatastoreRename::batch_rename(int oid)
{
    set<int> images;
    string image_name;

    if ( auto datastore = pool->get_ro<Datastore>(oid) )
    {
        images = datastore->get_image_ids();

        image_name = datastore->get_name();
    }
    else
    {
        return;
    }

    ImagePool * ipool = Nebula::instance().get_ipool();

    for (auto iid : images)
    {
        if (auto image = ipool->get(iid))
        {
            if (image->get_ds_id() == oid)
            {
                image->set_ds_name(image_name);
                ipool->update(image.get());
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostRename::batch_rename(int oid)
{
    set<int> vms;
    string host_name;

    if ( auto host = pool->get_ro<Host>(oid) )
    {
        vms = host->get_vm_ids();

        host_name = host->get_name();
    }
    else
    {
        return;
    }

    VirtualMachinePool * vmpool = Nebula::instance().get_vmpool();

    for (auto vid : vms)
    {
        if (auto vm = vmpool->get(vid))
        {
            if (vm->hasHistory() && vm->get_hid() == oid)
            {
                vm->set_hostname(host_name);

                vmpool->update_history(vm.get());
                vmpool->update_search(vm.get());
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceRename::batch_rename(int oid)
{
    std::set<int>   apps;
    std::string     market_name;

    if ( auto market = pool->get_ro<MarketPlace>(oid) )
    {
        apps = market->get_marketapp_ids();

        market_name = market->get_name();
    }
    else
    {
        return;
    }

    MarketPlaceAppPool * apppool = Nebula::instance().get_apppool();

    for (auto app_id : apps)
    {
        if (auto app = apppool->get(app_id))
        {
            if (app->get_market_id() == oid)
            {
                app->set_market_name(market_name);
                apppool->update(app.get());
            }
        }
    }
}

