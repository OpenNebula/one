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

#include "SharedAPI.h"
#include "ClusterPool.h"
#include "AclManager.h"
#include "RequestLogger.h"

#include "VirtualNetwork.h"
#include "VirtualMachine.h"
#include "VirtualMachinePool.h"
#include "VirtualRouter.h"
#include "MarketPlaceApp.h"
#include "MarketPlacePool.h"
#include "GroupPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* Static methods ----------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static Request::ErrorCode delete_authorization(PoolSQL* pool, int oid,
                                               RequestAttributes& att)
{
    PoolObjectAuth  perms;

    if (auto object = pool->get<PoolObjectSQL>(oid))
    {
        object->get_permissions(perms);
    }
    else
    {
        att.resp_id = oid;
        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms); // <MANAGE|ADMIN> OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* API ---------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::allocate(const std::string& str_tmpl,
                                       int cluster_id,
                                       int& oid,
                                       RequestAttributes& att)
{
    unique_ptr<Template> tmpl;

    int rc;

    string          cluster_name = ClusterPool::NONE_CLUSTER_NAME;
    PoolObjectAuth  cluster_perms;

    auto clpool = Nebula::instance().get_clpool();

    if ( !str_tmpl.empty() )
    {
        tmpl = get_object_template();

        rc   = tmpl->parse_str_or_xml(str_tmpl, att.resp_msg);

        if ( rc != 0 )
        {
            return Request::INTERNAL;
        }
    }

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        if (get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER, att,
                     cluster_perms, cluster_name, true) != 0)
        {
            return Request::NO_EXISTS;
        }
    }
    else
    {
        cluster_perms.oid = ClusterPool::NONE_CLUSTER_ID;
    }

    if ( auto ec = allocate_authorization(tmpl.get(), att, &cluster_perms); ec != Request::SUCCESS )
    {
        return ec;
    }

    Request::ErrorCode ec = pool_allocate(std::move(tmpl), oid, att, cluster_id, cluster_name);

    if ( ec != Request::SUCCESS )
    {
        return ec;
    }

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        if (auto cluster = clpool->get(cluster_id))
        {
            rc = add_to_cluster(cluster.get(), oid, att.resp_msg);
        }
        else
        {
            att.resp_obj = PoolObjectSQL::CLUSTER;
            att.resp_id  = cluster_id;

            return Request::NO_EXISTS;
        }

        if ( rc < 0 )
        {
            string drop_err;

            if ( auto obj = pool->get<PoolObjectSQL>(oid) )
            {
                pool->drop(obj.get(), drop_err);
            }

            return Request::INTERNAL;
        }
    }

    //Take object body for hooks.
    if (auto obj = pool->get<PoolObjectSQL>(oid))
    {
        obj->to_xml(att.extra_xml);
    }

    att.resp_id = oid;

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::del(int oid,
                                  bool recursive,
                                  RequestAttributes& att)
{
    // Save body before deleting it for hooks
    if (auto obj = pool->get_ro<PoolObjectSQL>(oid))
    {
        obj->to_xml(att.extra_xml);
    }

    return delete_object(oid, recursive, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::info(int oid,
                                   bool decrypt,
                                   string& xml,
                                   RequestAttributes& att)
{
    if ( oid == -1 )
    {
        if ( request.auth_object() == PoolObjectSQL::USER )
        {
            oid = att.uid;
        }
        else if ( request.auth_object() == PoolObjectSQL::GROUP )
        {
            oid = att.gid;
        }
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto object = pool->get_ro<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ( decrypt && att.is_admin() )
    {
        object->decrypt();
    }

    load_extended_data(object.get());

    to_xml(att, object.get(), xml);

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::update(int oid,
                                     const std::string& tmpl,
                                     int update_type,
                                     RequestAttributes& att)
{
    int rc;

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    if ( update_type < 0 || update_type > 1 )
    {
        att.resp_msg = "Wrong update type";

        return Request::RPC_API;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (update_type == 0)
    {
        rc = object->replace_template(tmpl, !att.is_admin(), att.resp_msg);
    }
    else //if (update_type == 1)
    {
        rc = object->append_template(tmpl, !att.is_admin(), att.resp_msg);
    }

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot update template. " + att.resp_msg;

        return Request::INTERNAL;
    }

    pool->update(object.get());

    extra_updates(object.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::rename(int oid,
                                     const std::string& new_name,
                                     RequestAttributes& att)
{
    string old_name;

    PoolObjectAuth  operms;

    if (test_and_set_rename(oid) == false)
    {
        att.resp_msg = "Object is being renamed";

        return Request::INTERNAL;
    }

    int rc = get_info(pool, oid, request.auth_object(), att, operms, old_name, true);

    if ( rc == -1 )
    {
        clear_rename(oid);

        return Request::NO_EXISTS;
    }

    if (old_name == new_name)
    {
        clear_rename(oid);

        return Request::SUCCESS;
    }

    // ------------- Set authorization request for non-oneadmin's --------------

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, operms); // MANAGE OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        clear_rename(oid);

        return Request::AUTHORIZATION;
    }

    // ----------------------- Check name uniqueness ---------------------------

    int db_id = exist(new_name, operms.uid);

    if ( db_id !=-1  )
    {
        ostringstream oss;

        string object_name = RequestLogger::object_name(request.auth_object());
        oss << object_name << " cannot be renamed to " << new_name
            << " because it collides with " << object_name << " "
            << db_id;

        att.resp_msg = oss.str();

        clear_rename(oid);
        return Request::ACTION;
    }

    // -------------------------- Update the object ----------------------------
    if ( auto object = pool->get<PoolObjectSQL>(oid) )
    {
        if ( object->set_name(new_name, att.resp_msg) != 0 )
        {
            clear_rename(oid);

            return Request::ACTION;
        }

        pool->update(object.get());
    }
    else
    {
        att.resp_id = oid;

        clear_rename(oid);

        return Request::NO_EXISTS;
    }

    batch_rename(oid);

    clear_rename(oid);

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::quota_update(std::string& quota,
                                           RequestAttributes& att)
{
    Template quota_tmpl;

    int     rc;

    if ( att.gid != GroupPool::ONEADMIN_ID )
    {
        att.resp_msg = "The default quotas can only be updated by users in the"
                       " oneadmin group";

        return Request::AUTHORIZATION;
    }

    rc = quota_tmpl.parse_str_or_xml(quota, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    std::vector<const VectorAttribute*> vm_quotas;
    quota_tmpl.get("VM", vm_quotas);

    if (vm_quotas.size() > 1)
    {
        att.resp_msg = "Only one default VM quota can be defined";

        return Request::ACTION;
    }

    if (!vm_quotas.empty() && !vm_quotas[0]->vector_value("CLUSTER_IDS").empty())
    {
        att.resp_msg = "CLUSTER_IDS attribute is not allowed for default VM quota";

        return Request::ACTION;
    }

    rc = set_default_quota(&quota_tmpl, att);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    get_default_quota()->to_xml(quota);

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::chown(int oid,
                                    int new_uid,
                                    int new_gid,
                                    RequestAttributes& att)
{
    int rc;

    string oname;
    string nuname;
    string ngname;

    PoolObjectAuth  operms;
    PoolObjectAuth  nuperms;
    PoolObjectAuth  ngperms;

    unique_ptr<PoolObjectSQL> object;

    set<int> vms;

    auto upool = Nebula::instance().get_upool();
    auto gpool = Nebula::instance().get_gpool();

    // ------------- Check new user and group id's ---------------------

    if ( new_uid > -1  )
    {
        rc = get_info(upool, new_uid, PoolObjectSQL::USER, att, nuperms, nuname, true);

        if ( rc == -1 )
        {
            return Request::NO_EXISTS;
        }
    }

    if ( new_gid > -1  )
    {
        rc = get_info(gpool, new_gid, PoolObjectSQL::GROUP, att, ngperms, ngname, true);

        if ( rc == -1 )
        {
            return Request::NO_EXISTS;
        }
    }

    // ------------- Set authorization request for non-oneadmin's --------------

    AuthRequest ar(att.uid, att.group_ids);

    rc = get_info(pool, oid, request.auth_object(), att, operms, oname, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    // Ingore chown to the same user or the same group
    if (new_uid == operms.uid)
    {
        new_uid = -1;
    }

    if (new_gid == operms.gid)
    {
        new_gid = -1;
    }

    ar.add_auth(att.auth_op, operms); // MANAGE OBJECT

    if ( new_uid > -1  )
    {
        ar.add_auth(AuthRequest::MANAGE, nuperms); // MANAGE USER
    }

    if ( new_gid > -1  )
    {
        ar.add_auth(AuthRequest::USE, ngperms); // USE GROUP
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // --------------- Check name uniqueness -----------------------------------

    if ( new_uid != -1 )
    {
        if ( auto ec = check_name_unique(oid, new_uid, att); ec != Request::SUCCESS )
        {
            return ec;
        }
    }

    // --------------- Update the object and check quotas ----------------------

    if ( request.auth_object() == PoolObjectSQL::VM ||
         request.auth_object() == PoolObjectSQL::IMAGE ||
         request.auth_object() == PoolObjectSQL::NET)
    {
        auto qr = get_and_quota(oid, new_uid, new_gid, att);
        if (qr.ec != Request::SUCCESS)
        {
            return qr.ec;
        }
        object = std::move(qr.obj);
    }
    else
    {
        object = pool->get<PoolObjectSQL>(oid);

        if ( object == nullptr )
        {
            att.resp_id = oid;

            return Request::NO_EXISTS;
        }
        else if ( request.auth_object() == PoolObjectSQL::VROUTER )
        {
            vms = static_cast<VirtualRouter *>(object.get())->get_vms();
        }
        else if (request.auth_object() == PoolObjectSQL::MARKETPLACEAPP)
        {
            auto app = static_cast<MarketPlaceApp*>(object.get());

            auto market_id = app->get_market_id();

            auto mpool = Nebula::instance().get_marketpool();

            auto market = mpool->get_ro(market_id);

            if (market && market->is_public())
            {
                att.resp_msg = "App " + to_string(oid) +
                               ": Changing the ownership for an App from the public Marketplace is not permitted";

                return Request::INTERNAL;
            }
        }
    }

    if ( object == nullptr )
    {
        return Request::INTERNAL;
    }

    if ( new_uid != -1 )
    {
        object->set_user(new_uid, nuname);
    }

    if ( new_gid != -1 )
    {
        object->set_group(new_gid, ngname);
    }

    if (request.auth_object() == PoolObjectSQL::VM)
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

    if ( request.auth_object() != PoolObjectSQL::VROUTER )
    {
        return Request::SUCCESS;
    }

    // --------------- Recursive change associated VM objects ------------------
    // IMPORTANT!: pool/auth_object members are redirected to the VM pool to
    // chown VMs
    // -------------------------------------------------------------------------
    bool error_vm_quotas = false;

    PoolSQL * vm_pool = Nebula::instance().get_vmpool();

    for (auto vm_id : vms)
    {
        auto qr = get_and_quota(vm_id, new_uid, new_gid, att, vm_pool, PoolObjectSQL::VM);
        if (qr.ec != Request::SUCCESS)
        {
            return qr.ec;
        }

        auto vm = std::move(qr.obj);

        if ( vm == nullptr )
        {
            error_vm_quotas = true;

            continue;
        }

        if ( new_uid != -1 )
        {
            vm->set_user(new_uid, nuname);
        }

        if ( new_gid != -1 )
        {
            vm->set_group(new_gid, ngname);
        }

        vm_pool->update(vm.get());
    }

    if (!error_vm_quotas)
    {
        return Request::SUCCESS;
    }

    return Request::INTERNAL;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::chmod(int oid,
                                    int owner_u, int owner_m, int owner_a,
                                    int group_u, int group_m, int group_a,
                                    int other_u, int other_m, int other_a,
                                    RequestAttributes& att)
{
    AuthRequest::Operation op = AuthRequest::MANAGE;
    PoolObjectAuth  perms;

    if (auto object = pool->get_ro<PoolObjectSQL>(oid))
    {
        object->get_permissions(perms);
    }
    else
    {
        att.resp_id = oid;
        return Request::NO_EXISTS;
    }

    if ( owner_a == perms.owner_a )
    {
        owner_a = -1;
    }

    if ( group_a == perms.group_a )
    {
        group_a = -1;
    }

    if ( other_u == perms.other_u )
    {
        other_u = -1;
    }

    if ( other_m == perms.other_m )
    {
        other_m = -1;
    }

    if ( other_a == perms.other_a )
    {
        other_a = -1;
    }

    if ( owner_a != -1 || group_a != -1 || other_a != -1 )
    {
        op = AuthRequest::ADMIN;
    }

    if ( other_u != -1 || other_m != -1 || other_a != -1 )
    {
        bool enable_other;

        Nebula::instance().get_configuration_attribute(
                "ENABLE_OTHER_PERMISSIONS", enable_other);

        if ( !enable_other && !att.is_admin())
        {
            att.resp_msg = "'other' permissions is disabled in oned.conf";

            return Request::AUTHORIZATION;
        }
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(op, perms);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // ------------- Update the object ---------------------

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( !object )
    {
        att.resp_id = oid;
        return Request::NO_EXISTS;
    }

    int rc = object->set_permissions(owner_u, owner_m, owner_a,
                                     group_u, group_m, group_a,
                                     other_u, other_m, other_a,
                                     att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    pool->update(object.get());

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::lock(int oid,
                                   int level,
                                   bool test,
                                   RequestAttributes& att)
{
    att.auth_op = AuthRequest::MANAGE_NO_LCK;

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    switch(level)
    {
        case 1: //USE + MANAGE + ADMIN
            level = PoolObjectSQL::ST_USE;
            break;
        case 2: //MANAGE + ADMIN
            level = PoolObjectSQL::ST_MANAGE;
            break;
        case 3: //ADMIN
            level = PoolObjectSQL::ST_ADMIN;
            break;
        case 4: //ALL equals USE
            level = PoolObjectSQL::ST_USE;
            break;

        default:
            att.resp_msg = "Wrong lock level specified";

            return Request::ACTION;
    }

    if ((request.auth_object() & PoolObjectSQL::LockableObject) != 0)
    {
        if ( test && object->test_lock_db(att.resp_msg) != 0 )
        {
            return Request::ACTION;
        }
        else
        {
            int rc = object->lock_db(att.uid, att.req_id, level, att.is_admin());

            pool->update(object.get());

            if (rc != 0)
            {
                att.resp_msg = "Error trying to lock the resource.";

                return Request::ACTION;
            }
        }
    }
    else
    {
        att.resp_msg = "Object cannot be locked.";

        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::unlock(int oid, RequestAttributes& att)
{
    att.auth_op = AuthRequest::MANAGE_NO_LCK;

    int owner  = att.uid;

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == 0 )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ( att.is_admin() ) //admins can unlock even if nor owners of lock
    {
        owner = -1;
    }

    if ( object->unlock_db(owner, att.req_id) == -1)
    {
        att.resp_msg = "Cannot unlock: Lock is owned by another user";

        return Request::ACTION;
    }

    pool->update(object.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::clone(int source_id,
                                    const string &name,
                                    bool recursive,
                                    const string& s_uattr,
                                    int &new_id,
                                    RequestAttributes& att)
{
    att.auth_op = AuthRequest::CREATE;

    PoolObjectAuth perms;

    unique_ptr<Template> tmpl;

    if ( auto source_obj = pool->get_ro<PoolObjectSQL>(source_id) )
    {
        tmpl = clone_template(source_obj.get());

        source_obj->get_permissions(perms);
    }
    else
    {
        att.resp_id = source_id;
        return Request::NO_EXISTS;
    }

    if (auto ec = merge(tmpl.get(), s_uattr, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    tmpl->erase("NAME");
    tmpl->set(new SingleAttribute("NAME", name));

    string tmpl_str = "";

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms); //USE OBJECT

    tmpl->to_xml(tmpl_str);

    ar.add_create_auth(att.uid, att.gid, request.auth_object(), tmpl_str);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    return pool_allocate(source_id, std::move(tmpl), new_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::update_db(int oid,
                                        const std::string& xml,
                                        RequestAttributes& att)
{
    if (!att.is_oneadmin())
    {
        return Request::AUTHORIZATION;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == 0 )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    std::string old_xml;

    object->to_xml(old_xml);

    if ( object->from_xml(xml) != 0 )
    {
        object->from_xml(old_xml);
        att.resp_msg = "Cannot update object from XML";

        return Request::INTERNAL;
    }

    if ( object->get_oid() != oid )
    {
        object->from_xml(old_xml);
        att.resp_msg = "Consistency check failed";

        return Request::INTERNAL;
    }

    pool->update(object.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::allocate_db(int& oid,
                                          const std::string& xml,
                                          RequestAttributes& att)
{
    if (!att.is_oneadmin())
    {
        return Request::AUTHORIZATION;
    }

    auto obj = std::unique_ptr<PoolObjectSQL>(create(xml));

    oid = pool->allocate(*obj, att.resp_msg);

    return (oid == -1) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::drop_db(int oid,
                                      RequestAttributes& att)
{
    if (!att.is_oneadmin())
    {
        return Request::AUTHORIZATION;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if (!object)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ( pool->drop(object.get(), att.resp_msg) != 0 )
    {

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* Helpers ----------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::basic_authorization(int oid, RequestAttributes& att)
{
    return basic_authorization(pool, oid, request.auth_object(), att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::basic_authorization(
        PoolSQL *pool,
        int oid,
        PoolObjectSQL::ObjectType auth_object,
        RequestAttributes& att)
{
    PoolObjectAuth  perms;

    if ( oid >= 0 )
    {
        auto object = pool->get_ro<PoolObjectSQL>(oid);

        if ( !object )
        {
            att.resp_id = oid;

            return Request::NO_EXISTS;
        }

        object->get_permissions(perms);
    }
    else
    {
        perms.obj_type = auth_object;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms);

    if ( UserPool::authorize(ar) == -1 )
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SharedAPI::user_quota_authorization(Template * tmpl,
                                         Quotas::QuotaType qtype,
                                         bool resize,
                                         const RequestAttributes& att,
                                         string& error_str)
{
    Nebula   &nd    = Nebula::instance();
    UserPool *upool = nd.get_upool();

    auto user = upool->get(att.uid);

    if ( !user )
    {
        error_str = "User not found";
        return false;
    }

    DefaultQuotas default_user_quotas = nd.get_default_user_quota();

    bool rc = false;

    if (resize)
    {
        rc = user->quota.quota_update(qtype, tmpl, default_user_quotas, error_str);
    }
    else
    {
        rc = user->quota.quota_check(qtype, tmpl, default_user_quotas, error_str);
    }

    if ( rc )
    {
        upool->update_quotas(user.get());
    }
    else
    {
        ostringstream oss;

        oss << RequestLogger::object_name(PoolObjectSQL::USER) << " [" << att.uid << "] "
            << error_str;

        error_str = oss.str();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SharedAPI::group_quota_authorization(Template * tmpl,
                                          Quotas::QuotaType qtype,
                                          bool resize,
                                          const RequestAttributes& att,
                                          string& error_str)
{
    Nebula    &nd    = Nebula::instance();
    GroupPool *gpool = nd.get_gpool();

    auto group = gpool->get(att.gid);

    if ( !group )
    {
        error_str = "Group not found";
        return false;
    }

    DefaultQuotas default_group_quotas = nd.get_default_group_quota();

    bool rc = false;

    if (resize)
    {
        rc = group->quota.quota_update(qtype, tmpl, default_group_quotas, error_str);
    }
    else
    {
        rc = group->quota.quota_check(qtype, tmpl, default_group_quotas, error_str);
    }

    if ( rc )
    {
        gpool->update_quotas(group.get());
    }
    else
    {
        ostringstream oss;

        oss << RequestLogger::object_name(PoolObjectSQL::GROUP) << " [" << att.gid << "] "
            << error_str;

        error_str = oss.str();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SharedAPI::user_quota_rollback(Template *        tmpl,
                                    Quotas::QuotaType qtype,
                                    const RequestAttributes& att)
{
    UserPool *upool = Nebula::instance().get_upool();

    if ( auto user = upool->get(att.uid) )
    {
        user->quota.quota_del(qtype, tmpl);

        upool->update_quotas(user.get());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SharedAPI::group_quota_rollback(Template *        tmpl,
                                     Quotas::QuotaType qtype,
                                     const RequestAttributes& att)
{
    GroupPool *gpool = Nebula::instance().get_gpool();

    if ( auto group = gpool->get(att.gid) )
    {
        group->quota.quota_del(qtype, tmpl);

        gpool->update_quotas(group.get());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SharedAPI::quota_authorization(
        Template *          tmpl,
        Quotas::QuotaType   qtype,
        const RequestAttributes&  att,
        string&             error_str,
        bool                resize)
{
    // uid/gid == -1 means do not update user/group

    bool do_user_quota = att.uid != UserPool::ONEADMIN_ID && att.uid != -1;
    bool do_group_quota = att.gid != GroupPool::ONEADMIN_ID && att.gid != -1;

    if ( do_user_quota )
    {
        if ( !user_quota_authorization(tmpl, qtype, resize, att, error_str) )
        {
            return false;
        }
    }

    if ( do_group_quota )
    {
        if ( !group_quota_authorization(tmpl, qtype, resize, att, error_str) )
        {
            if ( do_user_quota )
            {
                user_quota_rollback(tmpl, qtype, att);
            }

            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SharedAPI::quota_rollback(Template *         tmpl,
                               Quotas::QuotaType  qtype,
                               const RequestAttributes& att)
{
    // uid/gid == -1 means do not update user/group

    if ( att.uid != UserPool::ONEADMIN_ID && att.uid != -1 )
    {
        user_quota_rollback(tmpl, qtype, att);
    }

    if ( att.gid != GroupPool::ONEADMIN_ID && att.gid != -1 )
    {
        group_quota_rollback(tmpl, qtype, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SharedAPI::get_info(PoolSQL *                 pool,
                        int                       id,
                        PoolObjectSQL::ObjectType type,
                        RequestAttributes&        att,
                        PoolObjectAuth&           perms,
                        string&                   name,
                        bool                      throw_error)
{
    auto ob = pool->get_ro<PoolObjectSQL>(id);

    if ( !ob )
    {
        if ( throw_error )
        {
            att.resp_obj = type;
            att.resp_id  = id;
        }

        return -1;
    }

    ob->get_permissions(perms);

    name = ob->get_name();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::as_uid_gid(Template * tmpl, RequestAttributes& att)
{
    string gname;
    string uname;

    PoolObjectAuth uperms;
    PoolObjectAuth gperms;

    int uid = att.uid, as_uid = -1, as_gid = -1;

    set<int> gids = att.group_ids;

    int rc;

    UserPool * upool  = Nebula::instance().get_upool();
    GroupPool * gpool = Nebula::instance().get_gpool();

    if ( tmpl->get("AS_UID", as_uid) )
    {
        tmpl->erase("AS_UID");

        rc = get_info(upool, as_uid, PoolObjectSQL::USER, att, uperms, uname, true);

        if ( rc == -1 )
        {
            return Request::NO_EXISTS;
        }
    }
    else
    {
        as_uid = -1;
    }

    if ( tmpl->get("AS_GID", as_gid) )
    {
        tmpl->erase("AS_GID");

        rc = get_info(gpool, as_gid, PoolObjectSQL::GROUP, att, gperms, gname, true);

        if ( rc == -1 )
        {
            return Request::NO_EXISTS;
        }
    }
    else
    {
        as_gid = -1;
    }

    if ( as_gid == -1 && as_uid == -1)
    {
        return Request::SUCCESS;
    }

    if ( uid != 0 )
    {
        AuthRequest ar(uid, gids);

        if ( as_uid > 0 )
        {
            ar.add_auth(AuthRequest::MANAGE, uperms); // MANAGE USER
        }
        if ( as_gid > 0 )
        {
            ar.add_auth(AuthRequest::MANAGE, gperms); // MANAGE GROUP
        }

        if ( UserPool::authorize(ar) == -1 )
        {
            att.resp_msg = ar.message;

            return Request::AUTHORIZATION;
        }
    }

    if ( as_uid > 0 )
    {
        att.uid = as_uid;
        att.uname = uname;
    }

    if ( as_gid > 0 )
    {
        att.gid = as_gid;
        att.gname = gname;
        att.group_ids.clear();
        att.group_ids.insert(as_gid);
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::allocate_authorization(
        Template *          tmpl,
        RequestAttributes&  att,
        PoolObjectAuth *    cluster_perms)
{
    string tmpl_str;

    AuthRequest ar(att.uid, att.group_ids);

    if ( tmpl )
    {
        tmpl->to_xml(tmpl_str);
    }

    ar.add_create_auth(att.uid, att.gid, request.auth_object(), tmpl_str);

    if ( cluster_perms->oid != ClusterPool::NONE_CLUSTER_ID )
    {
        ar.add_auth(AuthRequest::ADMIN, *cluster_perms); // ADMIN CLUSTER
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::delete_object(int oid,
                                            bool recursive,
                                            RequestAttributes& att)
{
    Request::ErrorCode ec = delete_authorization(pool, oid, att);

    if ( ec != Request::SUCCESS )
    {
        return ec;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;
        return Request::NO_EXISTS;
    }

    int rc = drop(std::move(object), recursive, att);

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot delete " +
                       RequestLogger::object_name(request.auth_object()) + ". " +
                       att.resp_msg;

        return Request::ACTION;
    }

    auto aclm = Nebula::instance().get_aclm();

    aclm->del_resource_rules(oid, request.auth_object());

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int SharedAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                    bool recursive,
                    RequestAttributes& att)
{
    set<int> cluster_ids = get_cluster_ids(object.get());

    int oid = object->get_oid();

    int rc  = pool->drop(object.get(), att.resp_msg);

    object.reset();

    if ( rc != 0 )
    {
        return rc;
    }

    for (auto cid : cluster_ids)
    {
        auto clpool = Nebula::instance().get_clpool();

        if ( auto cluster = clpool->get(cid) )
        {
            rc = del_from_cluster(cluster.get(), oid, att.resp_msg);

            if ( rc < 0 )
            {
                return rc;
            }
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

SharedAPI::QuotaResult SharedAPI::get_and_quota(int                       oid,
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

    auto object = pool->get_ro<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;

        return { nullptr, Request::NO_EXISTS };
    }

    if (auth_object == PoolObjectSQL::VM)
    {
        VirtualMachine * vm = static_cast<VirtualMachine*>(object.get());

        vector<unique_ptr<Template>> ds_quotas;

        if ( vm->get_state() == VirtualMachine::DONE )
        {
            att.resp_msg = "Could not change VM ownership, wrong state";

            return { nullptr, Request::ACTION };
        }

        auto tmpl = std::make_unique<VirtualMachineTemplate>();

        vm->get_quota_template(*tmpl, true, vm->is_running_quota());

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
        tmpl->add("SIZE", img->get_size()+img->get_snapshots().total_size());

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
            return { std::move(object), Request::SUCCESS};
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
        return {nullptr, Request::INTERNAL};
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
            return { nullptr, Request::AUTHORIZATION };
        }
        else
        {
            att.resp_id = oid;
            return { nullptr, Request::NO_EXISTS };
        }

        return {nullptr, Request::INTERNAL};
    }

    for (auto& it : quota_to_rback)
    {
        quota_rollback(it.second.get(), it.first, att_old);
    }

    return {std::move(object), Request::SUCCESS};
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode SharedAPI::check_name_unique(int oid, int new_uid, RequestAttributes& att)
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

        return Request::NO_EXISTS;
    }

    obj_oid = pool->exist(name, new_uid);

    if ( obj_oid != -1 )
    {
        oss << RequestLogger::object_name(PoolObjectSQL::USER) << " ["<<new_uid<<"] already owns "
            << RequestLogger::object_name(request.auth_object()) << " ["<<obj_oid<<"] with NAME " << name;

        att.resp_msg = oss.str();

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

