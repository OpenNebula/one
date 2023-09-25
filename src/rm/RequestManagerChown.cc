/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerChown.h"
#include "PoolObjectSQL.h"

#include "Nebula.h"
#include "VirtualMachinePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

unique_ptr<PoolObjectSQL> RequestManagerChown::get_and_quota(
    int                       oid,
    int                       new_uid,
    int                       new_gid,
    RequestAttributes&        att,
    PoolSQL *                 pool,
    PoolObjectSQL::ObjectType auth_object)
{
    std::map<Quotas::QuotaType, std::unique_ptr<Template>> quota_map;
    std::map<Quotas::QuotaType, std::unique_ptr<Template>> quota_to_rback;

    int old_uid;
    int old_gid;

    std::string memory, cpu;

    auto object = pool->get_ro<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return 0;
    }

    if (auth_object == PoolObjectSQL::VM)
    {
        VirtualMachine * vm = static_cast<VirtualMachine*>(object.get());

        vector<unique_ptr<Template>> ds_quotas;

        if ( vm->get_state() == VirtualMachine::DONE )
        {
            att.resp_msg = "Could not change VM ownership, wrong state";
            failure_response(ACTION, att);
            return 0;
        }

        auto tmpl = vm->clone_template();

        if ( (vm->get_state() == VirtualMachine::ACTIVE) ||
         (vm->get_state() == VirtualMachine::PENDING) ||
         (vm->get_state() == VirtualMachine::CLONING) ||
         (vm->get_state() == VirtualMachine::CLONING_FAILURE) ||
         (vm->get_state() == VirtualMachine::HOLD) )
        {
            vm->get_template_attribute("MEMORY", memory);
            vm->get_template_attribute("CPU", cpu);

            tmpl->add("RUNNING_MEMORY", memory);
            tmpl->add("RUNNING_CPU", cpu);
            tmpl->add("RUNNING_VMS", 1);
        }

        VirtualMachineDisks::image_ds_quotas(tmpl.get(), ds_quotas);

        quota_map.insert(make_pair(Quotas::VIRTUALMACHINE, move(tmpl)));

        for (auto& quota : ds_quotas)
        {
            quota_map.insert(make_pair(Quotas::DATASTORE, move(quota)));
        }
    }
    else if (auth_object == PoolObjectSQL::IMAGE)
    {
        Image * img     = static_cast<Image *>(object.get());
        auto tmpl = make_unique<Template>();

        tmpl->add("DATASTORE", img->get_ds_id());
        tmpl->add("SIZE",img->get_size()+img->get_snapshots().total_size());

        quota_map.insert(make_pair(Quotas::DATASTORE, move(tmpl)));
    }
    else if (auth_object == PoolObjectSQL::NET)
    {
        VirtualNetwork * vn = static_cast<VirtualNetwork *>(object.get());
        unsigned int  total = vn->get_size();

        ostringstream oss;

        int parent = vn->get_parent();

        if (parent == -1)
        {
            return object;
        }

        auto tmpl = make_unique<Template>();

        for (unsigned int i= 0 ; i < total ; i++)
        {
            oss << " NIC = [ NETWORK_ID = " << parent << " ]" << endl;
        }

        tmpl->parse_str_or_xml(oss.str(), att.resp_msg);

        quota_map.insert(make_pair(Quotas::NETWORK, move(tmpl)));
    }
    else
    {
        return nullptr;
    }

    if ( new_uid == -1 )
    {
        old_uid = -1;
    }
    else
    {
        old_uid = object->get_uid();
    }

    if ( new_gid == -1 )
    {
        old_gid = -1;
    }
    else
    {
        old_gid = object->get_gid();
    }

    object.reset();

    RequestAttributes att_new(new_uid, new_gid, att);
    RequestAttributes att_old(old_uid, old_gid, att);

    bool error = false;

    // -------------------------------------------------------------------------
    // Apply quotas to new owner free old owner
    // -------------------------------------------------------------------------
    for ( auto it = quota_map.begin(); it != quota_map.end() ; )
    {
        Quotas::QuotaType qtype = it->first;
        auto&             tmpl  = it->second;

        if ( quota_authorization(tmpl.get(), qtype, att_new, att.resp_msg) == false )
        {
            error = true;
            break;
        }
        else
        {
            quota_to_rback.insert(make_pair(qtype, move(tmpl)));

            it = quota_map.erase(it);
        }
    }

    object = pool->get<PoolObjectSQL>(oid);

    // -------------------------------------------------------------------------
    // Error or object deleted. Rollback chown quota operation. Add again usage
    // to old owner, decrement to new owner.
    // -------------------------------------------------------------------------
    if ( object == nullptr || error )
    {
        for (auto& it : quota_to_rback)
        {
            quota_rollback(it.second.get(), it.first, att_new);
        }

        if ( error )
        {
            failure_response(AUTHORIZATION, att);
        }
        else
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);
        }

        return nullptr;
    }

    for (auto& it : quota_to_rback)
    {
        quota_rollback(it.second.get(), it.first, att_old);
    }

    return object;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerChown::check_name_unique(int oid, int nuid, RequestAttributes& att)
{
    string          name;
    int             obj_oid;
    ostringstream   oss;

    if ( auto object = pool->get_ro<PoolObjectSQL>(oid) )
    {
        name = object->get_name();
    }
    else
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return -1;
    }

    obj_oid = pool->exist(name, nuid);

    if ( obj_oid != -1 )
    {
        oss << object_name(PoolObjectSQL::USER) << " ["<<nuid<<"] already owns "
            << object_name(auth_object) << " ["<<obj_oid<<"] with NAME " << name;

        att.resp_msg = oss.str();

        failure_response(INTERNAL, att);
        return -1;
    }

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerChown::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributes& att)
{
    int oid  = xmlrpc_c::value_int(paramList.getInt(1));
    int nuid = xmlrpc_c::value_int(paramList.getInt(2));
    int ngid = xmlrpc_c::value_int(paramList.getInt(3));

    int rc;

    string oname;
    string nuname;
    string ngname;

    PoolObjectAuth  operms;
    PoolObjectAuth  nuperms;
    PoolObjectAuth  ngperms;

    unique_ptr<PoolObjectSQL> object;

    set<int> vms;

    // ------------- Check new user and group id's ---------------------

    if ( nuid > -1  )
    {
        rc = get_info(upool,nuid,PoolObjectSQL::USER,att,nuperms,nuname,true);

        if ( rc == -1 )
        {
            return;
        }
    }

    if ( ngid > -1  )
    {
        rc = get_info(gpool,ngid,PoolObjectSQL::GROUP,att,ngperms,ngname,true);

        if ( rc == -1 )
        {
            return;
        }
    }

    // ------------- Set authorization request for non-oneadmin's --------------

    AuthRequest ar(att.uid, att.group_ids);

    rc = get_info(pool, oid, auth_object, att, operms, oname, true);

    if ( rc == -1 )
    {
        return;
    }

    // Ingore chown to the same user or the same group
    if (nuid == operms.uid)
    {
        nuid = -1;
    }

    if (ngid == operms.gid)
    {
        ngid = -1;
    }

    ar.add_auth(att.auth_op, operms); // MANAGE OBJECT

    if ( nuid > -1  )
    {
        ar.add_auth(AuthRequest::MANAGE, nuperms); // MANAGE USER
    }

    if ( ngid > -1  )
    {
        ar.add_auth(AuthRequest::USE, ngperms); // USE GROUP
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // --------------- Check name uniqueness -----------------------------------

    if ( nuid != -1 )
    {
        if ( check_name_unique(oid, nuid, att) != 0 )
        {
            return;
        }
    }

    // --------------- Update the object and check quotas ----------------------

    if ( auth_object == PoolObjectSQL::VM ||
         auth_object == PoolObjectSQL::IMAGE ||
         auth_object == PoolObjectSQL::NET)
    {
        object = get_and_quota(oid, nuid, ngid, att);
    }
    else
    {
        object = pool->get<PoolObjectSQL>(oid);

        if ( object == nullptr )
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);
        }
        else if ( auth_object == PoolObjectSQL::VROUTER )
        {
            vms = static_cast<VirtualRouter *>(object.get())->get_vms();
        }
        else if (auth_object == PoolObjectSQL::MARKETPLACEAPP)
        {
            auto app = static_cast<MarketPlaceApp*>(object.get());

            auto market_id = app->get_market_id();

            auto mpool = Nebula::instance().get_marketpool();

            auto market = mpool->get_ro(market_id);

            if (market && market->is_public())
            {
                att.resp_msg = "App " + to_string(oid) +
                    ": Changing the ownership for an App from the public Marketplace is not permitted";
                failure_response(INTERNAL, att);

                return;
            }
        }
    }

    if ( object == nullptr )
    {
        return;
    }

    if ( nuid != -1 )
    {
        object->set_user(nuid, nuname);
    }

    if ( ngid != -1 )
    {
        object->set_group(ngid, ngname);
    }

    if (auth_object == PoolObjectSQL::VM)
    {
        VirtualMachine* vm = static_cast<VirtualMachine*>(object.get());

        if (vm->hasHistory())
        {
            vm->set_vm_info();
            static_cast<VirtualMachinePool*>(pool)->update_history(vm);
        }
    }

    pool->update(object.get());

    object.reset();

    if ( auth_object != PoolObjectSQL::VROUTER )
    {
        success_response(oid, att);
        return;
    }

    // --------------- Recursive change associated VM objects ------------------
    // IMPORTANT!: pool/auth_object members are redirected to the VM pool to
    // chown VMs
    // -------------------------------------------------------------------------
    bool error_vm_quotas = false;

    PoolSQL * vm_pool = Nebula::instance().get_vmpool();

    for (auto vm_id : vms)
    {
        auto vm = get_and_quota(vm_id, nuid, ngid, att, vm_pool, PoolObjectSQL::VM);

        if ( vm == nullptr )
        {
            error_vm_quotas = true;

            continue;
        }

        if ( nuid != -1 )
        {
            vm->set_user(nuid, nuname);
        }

        if ( ngid != -1 )
        {
            vm->set_group(ngid, ngname);
        }

        vm_pool->update(vm.get());
    }

    if (!error_vm_quotas)
    {
        success_response(oid, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserChown::request_execute(xmlrpc_c::paramList const& paramList,
                                RequestAttributes& att)
{
    int oid  = xmlrpc_c::value_int(paramList.getInt(1));
    int ngid = xmlrpc_c::value_int(paramList.getInt(2));
    int old_gid;

    int rc;

    bool remove_old_group;

    string ngname;
    string auth_driver;

    PoolObjectAuth uperms;
    PoolObjectAuth ngperms;

    bool driver_managed_groups;
    bool new_group;

    if ( ngid < 0 )
    {
        att.resp_msg = "Wrong group ID";
        failure_response(XML_RPC_API, att);
        return;
    }

    if ( auto user = upool->get_ro(oid) )
    {
        user->get_permissions(uperms);

        auth_driver = user->get_auth_driver();
        new_group   = user->get_groups().count(ngid) != 1;
    }
    else
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    if ( Nebula::instance().get_auth_conf_attribute(auth_driver,
            "DRIVER_MANAGED_GROUPS", driver_managed_groups) != 0 )
    {
        driver_managed_groups = false;
    }

    if (driver_managed_groups && new_group)
    {
        att.resp_msg = "Groups cannot be manually managed for auth driver " +
            auth_driver;
        failure_response(ACTION, att);
        return;
    }

    rc = get_info(gpool, ngid, PoolObjectSQL::GROUP, att, ngperms, ngname,true);

    if ( rc == -1 )
    {
        return;
    }

    if ( oid == UserPool::ONEADMIN_ID )
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::USER) << " ["
            << UserPool::ONEADMIN_ID << "] " << UserPool::oneadmin_name
            << " cannot be moved outside of the "
            << object_name(PoolObjectSQL::GROUP)
            << " [" << GroupPool::ONEADMIN_ID << "] "
            << GroupPool::ONEADMIN_NAME;

        att.resp_msg = oss.str();

        failure_response(INTERNAL, att);
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, uperms);       // MANAGE USER
    ar.add_auth(AuthRequest::USE, ngperms); // USE GROUP

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // ------------- Change users primary group ---------------------

    if ( auto user = upool->get(oid) )
    {
        if ((old_gid = user->get_gid()) == ngid)
        {
            success_response(oid, att);
            return;
        }

        user->set_group(ngid,ngname);

        // The user is removed from the old group only if the new group is not a
        // secondary one

        rc = user->add_group(ngid);

        remove_old_group = (rc == 0);

        if (remove_old_group)
        {
            user->del_group(old_gid);
        }

        upool->update(user.get());
    }
    else
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    // ------------- Updates new group with this new user ---------------------

    if ( auto group = gpool->get(ngid) )
    {
        group->add_user(oid);

        gpool->update(group.get());
    }
    else
    {
        //TODO Rollback
        att.resp_obj = PoolObjectSQL::GROUP;
        att.resp_id  = ngid;
        failure_response(NO_EXISTS, att);

        return;
    }

    // ------------- Updates old group removing the user ---------------------

    if (remove_old_group)
    {
        if ( auto group = gpool->get(old_gid) )
        {
            group->del_user(oid);

            gpool->update(group.get());
        }
    }

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

