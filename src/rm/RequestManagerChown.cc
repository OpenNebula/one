/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
    RequestAttributes&        att)
{
    Template * tmpl;

    int old_uid;
    int old_gid;

    PoolObjectSQL *   object;
    Quotas::QuotaType qtype;

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return 0;
    }

    if (auth_object == PoolObjectSQL::VM)
    {
        tmpl  = (static_cast<VirtualMachine*>(object))->clone_template();
        qtype = Quotas::VIRTUALMACHINE;
    }
    else if (auth_object == PoolObjectSQL::IMAGE)
    {
        Image * img = static_cast<Image *>(object);
        tmpl        = new Template;

        tmpl->add("DATASTORE", img->get_ds_id());
        tmpl->add("SIZE",img->get_size()+img->get_snapshots().get_total_size());

        qtype = Quotas::DATASTORE;
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

        tmpl = new Template;

        for (unsigned int i= 0 ; i < total ; i++)
        {
            oss << " NIC = [ NETWORK_ID = " << parent << " ]" << endl;
        }

        tmpl->parse_str_or_xml(oss.str(), att.resp_msg);

        qtype = Quotas::NETWORK;
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

    if ( quota_authorization(tmpl, qtype, att_new, att.resp_msg) == false )
    {
        failure_response(AUTHORIZATION, att);

        delete tmpl;
        return 0;
    }

    quota_rollback(tmpl, qtype, att_old);

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        quota_rollback(tmpl, qtype, att_new);

        quota_authorization(tmpl, qtype, att_old, att.resp_msg);

        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
    }

    delete tmpl;

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

    object = pool->get(oid, true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return -1;
    }

    name = object->get_name();

    object->unlock();

    object = get(name, noid, true);

    if ( object != 0 )
    {
        obj_oid = object->get_oid();
        object->unlock();

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

    string  obj_name;
    int     old_uid;

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

    if ( att.uid != 0 )
    {
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
        object = pool->get(oid,true);

        if ( object == 0 )
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);
        }
    }

    if ( object == 0 )
    {
        return;
    }

    if ( noid != -1 )
    {
        obj_name = object->get_name();
        old_uid  = object->get_uid();

        object->set_user(noid,nuname);
    }

    if ( ngid != -1 )
    {
        object->set_group(ngid,ngname);
    }

    pool->update(object);

    object->unlock();

    if ( noid != -1 )
    {
        pool->update_cache_index(obj_name, old_uid, obj_name, noid);
    }

    success_response(oid, att);

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

    User *  user;
    Group * group;

    PoolObjectAuth uperms;
    PoolObjectAuth ngperms;

    if ( ngid < 0 )
    {
        att.resp_msg = "Wrong group ID";
        failure_response(XML_RPC_API, att);
        return;
    }

    rc = get_info(upool, oid, PoolObjectSQL::USER, att, uperms, uname, true);

    if ( rc == -1 )
    {
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

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(auth_op, uperms);           // MANAGE USER
        ar.add_auth(AuthRequest::USE, ngperms); // USE    GROUP

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);

            return;
        }
    }

    // ------------- Change users primary group ---------------------

    user = upool->get(oid,true);

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

    group = gpool->get(ngid, true);

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
        group = gpool->get(old_gid, true);

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
