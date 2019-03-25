/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * RequestManagerChown::get_and_quota(
    int                       oid,
    int                       new_uid,
    int                       new_gid,
    RequestAttributes&        att,
    PoolSQL *                 pool,
    PoolObjectSQL::ObjectType auth_object)
{
    std::map<Quotas::QuotaType, Template *> quota_map;
    std::map<Quotas::QuotaType, Template *> quota_to_rback;

    std::map<Quotas::QuotaType, Template *>::iterator it;

    int old_uid;
    int old_gid;

    std::string memory, cpu;

    PoolObjectSQL *   object;

    object = pool->get(oid);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return 0;
    }

    if (auth_object == PoolObjectSQL::VM)
    {
        VirtualMachine * vm = static_cast<VirtualMachine*>(object);

        vector<Template *> ds_quotas;
        vector<Template *>::iterator it;

        if ( vm->get_state() == VirtualMachine::DONE )
        {
            vm->unlock();

            att.resp_msg = "Could not change VM ownership, wrong state";
            failure_response(ACTION, att);
            return 0;
        }

        Template * tmpl = vm->clone_template();

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

        quota_map.insert(make_pair(Quotas::VIRTUALMACHINE, tmpl));

        VirtualMachineDisks::image_ds_quotas(tmpl, ds_quotas);

        for ( it = ds_quotas.begin() ; it != ds_quotas.end() ; ++it )
        {
            quota_map.insert(make_pair(Quotas::DATASTORE, *it));
        }
    }
    else if (auth_object == PoolObjectSQL::IMAGE)
    {
        Image * img     = static_cast<Image *>(object);
        Template * tmpl = new Template;

        tmpl->add("DATASTORE", img->get_ds_id());
        tmpl->add("SIZE",img->get_size()+img->get_snapshots().get_total_size());

        quota_map.insert(make_pair(Quotas::DATASTORE, tmpl));
    }
    else if (auth_object == PoolObjectSQL::NET)
    {
        VirtualNetwork * vn = static_cast<VirtualNetwork *>(object);
        unsigned int  total = vn->get_size();

        ostringstream oss;

        int parent = vn->get_parent();

        if (parent == -1)
        {
            return object;
        }

        Template * tmpl = new Template;

        for (unsigned int i= 0 ; i < total ; i++)
        {
            oss << " NIC = [ NETWORK_ID = " << parent << " ]" << endl;
        }

        tmpl->parse_str_or_xml(oss.str(), att.resp_msg);

        quota_map.insert(make_pair(Quotas::NETWORK, tmpl));
    }
    else
    {
        object->unlock();

        return 0;
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

    object->unlock();

    RequestAttributes att_new(new_uid, new_gid, att);
    RequestAttributes att_old(old_uid, old_gid, att);

    bool error = false;

    // -------------------------------------------------------------------------
    // Apply quotas to new owner free old owner
    // -------------------------------------------------------------------------
    for ( it = quota_map.begin(); it != quota_map.end() ; )
    {
        Quotas::QuotaType qtype = it->first;
        Template *        tmpl  = it->second;

        if ( quota_authorization(tmpl, qtype, att_new, att.resp_msg) == false )
        {
            error = true;
            break;
        }
        else
        {
            quota_to_rback.insert(make_pair(qtype, tmpl));

            it = quota_map.erase(it);
        }
    }

    if (!error)
    {
        for (it = quota_to_rback.begin(); it != quota_to_rback.end(); ++it)
        {
            quota_rollback(it->second, it->first, att_old);
        }

        object = pool->get(oid);
    }

    // -------------------------------------------------------------------------
    // Error or object deleted. Rollback chown quota operation. Add again usage
    // to old owner, decrement to new owner.
    // -------------------------------------------------------------------------
    if ( object == 0 || error )
    {
        for (it = quota_to_rback.begin(); it != quota_to_rback.end(); ++it)
        {
            if ( object == 0 )
            {
                quota_authorization(it->second, it->first,att_old,att.resp_msg);
            }

            quota_rollback(it->second, it->first, att_new);
        }

        if ( object == 0 )
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);
        }
        else
        {
            failure_response(AUTHORIZATION, att);
        }

        object = 0;
    }

    // -------------------------------------------------------------------------
    // Clean up memory for templates
    // -------------------------------------------------------------------------
    for ( it = quota_map.begin(); it != quota_map.end() ; ++it)
    {
        delete it->second;
    }

    for (it = quota_to_rback.begin(); it != quota_to_rback.end(); ++it)
    {
        delete it->second;
    }

    return object;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerChown::check_name_unique(int oid, int noid, RequestAttributes& att)
{
    PoolObjectSQL *     object;
    string          name;
    int             obj_oid;
    ostringstream   oss;

    object = pool->get(oid);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return -1;
    }

    name = object->get_name();

    object->unlock();

    obj_oid = pool->exist(name, noid);

    if ( obj_oid != -1 )
    {
        oss << object_name(PoolObjectSQL::USER) << " ["<<noid<<"] already owns "
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
    int noid = xmlrpc_c::value_int(paramList.getInt(2));
    int ngid = xmlrpc_c::value_int(paramList.getInt(3));

    int rc;

    string oname;
    string nuname;
    string ngname;

    PoolObjectAuth  operms;
    PoolObjectAuth  nuperms;
    PoolObjectAuth  ngperms;

    PoolObjectSQL * object;

    set<int> vms;

    // ------------- Check new user and group id's ---------------------

    if ( noid > -1  )
    {
        rc = get_info(upool,noid,PoolObjectSQL::USER,att,nuperms,nuname,true);

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

    ar.add_auth(auth_op, operms); // MANAGE OBJECT

    if ( noid > -1  )
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

    if ( noid != -1 )
    {
        if ( check_name_unique(oid, noid, att) != 0 )
        {
            return;
        }
    }

    // --------------- Update the object and check quotas ----------------------

    if ( auth_object == PoolObjectSQL::VM ||
         auth_object == PoolObjectSQL::IMAGE ||
         auth_object == PoolObjectSQL::NET)
    {
        object = get_and_quota(oid, noid, ngid, att);
    }
    else
    {
        object = pool->get(oid);

        if ( object == 0 )
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);
        }
        else if ( auth_object == PoolObjectSQL::VROUTER )
        {
            vms = static_cast<VirtualRouter *>(object)->get_vms();
        }
    }

    if ( object == 0 )
    {
        return;
    }

    if ( noid != -1 )
    {
        object->set_user(noid, nuname);
    }

    if ( ngid != -1 )
    {
        object->set_group(ngid, ngname);
    }

    pool->update(object);

    object->unlock();

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

    for (set<int>::const_iterator it = vms.begin(); it != vms.end(); it++)
    {
        int vm_id = *it;

        PoolObjectSQL * vm = get_and_quota(vm_id, noid, ngid, att, vm_pool, PoolObjectSQL::VM);

        if ( vm == 0 )
        {
            error_vm_quotas = true;

            continue;
        }

        if ( noid != -1 )
        {
            vm->set_user(noid, nuname);
        }

        if ( ngid != -1 )
        {
            vm->set_group(ngid, ngname);
        }

        vm_pool->update(vm);

        vm->unlock();
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
    string uname;
    string auth_driver;

    User *  user;
    Group * group;

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

    if ((user = upool->get_ro(oid)) == 0 )
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    user->get_permissions(uperms);

    uname = user->get_name();

    auth_driver = user->get_auth_driver();
    new_group   = user->get_groups().count(ngid) != 1;

    user->unlock();

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

    ar.add_auth(auth_op, uperms);           // MANAGE USER
    ar.add_auth(AuthRequest::USE, ngperms); // USE GROUP

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // ------------- Change users primary group ---------------------

    user = upool->get(oid);

    if ( user == 0 )
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    if ((old_gid = user->get_gid()) == ngid)
    {
        user->unlock();
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

    upool->update(user);

    user->unlock();

    // ------------- Updates new group with this new user ---------------------

    group = gpool->get(ngid);

    if( group == 0 )
    {
        //TODO Rollback
        att.resp_obj = PoolObjectSQL::GROUP;
        att.resp_id  = ngid;
        failure_response(NO_EXISTS, att);

        return;
    }

    group->add_user(oid);

    gpool->update(group);

    group->unlock();

    // ------------- Updates old group removing the user ---------------------

    if (remove_old_group)
    {
        group = gpool->get(old_gid);

        if( group != 0 )
        {
            group->del_user(oid);

            gpool->update(group);

            group->unlock();
        }
    }

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

