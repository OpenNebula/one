/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "RequestManagerDelete.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerDelete::delete_authorization(
        int                         oid,
        RequestAttributes&          att)
{
    PoolObjectSQL * object;
    PoolObjectAuth  perms;

    if ( att.uid == 0 )
    {
        return true;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS,
                         get_error(object_name(auth_object),oid),
                         att);
        return false;
    }

    object->get_permissions(perms);

    object->unlock();

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(auth_op, perms);    // <MANAGE|ADMIN> OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION,
                authorization_error(ar.message, att),
                att);

        return false;
    }

    return true;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerDelete::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributes& att)
{
    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
    PoolObjectSQL * object;
    string          error_msg;

    if ( delete_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(auth_object), oid),
                att);
        return;
    }

    int rc = drop(oid, object, error_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION,
            request_error("Cannot delete "+object_name(auth_object),error_msg),
            att);
        return;
    }

    aclm->del_resource_rules(oid, auth_object);

    success_response(oid, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int RequestManagerDelete::drop(
        int             oid,
        PoolObjectSQL * object,
        string&         error_msg)
{
    int cluster_id = get_cluster_id(object);

    int rc = pool->drop(object, error_msg);

    object->unlock();

    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID && rc == 0 )
    {
        Cluster * cluster = clpool->get(cluster_id, true);

        if( cluster != 0 )
        {
            rc = del_from_cluster(cluster, oid, error_msg);

            if ( rc < 0 )
            {
                cluster->unlock();
                return rc;
            }

            clpool->update(cluster);

            cluster->unlock();
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int HostDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    Nebula& nd              = Nebula::instance();
    InformationManager * im = nd.get_im();

    HostPool * hpool = nd.get_hpool();

    Host* host = static_cast<Host *>(object);

    //Do not trigger delete event on IM if there are VMs running on the host
    if ( host->get_share_running_vms() > 0 )
    {
        error_msg = "Can not remove a host with running VMs";

        host->unlock();

        return -1;
    }

    host->disable();

    hpool->update(host);

    host->unlock();

    im->trigger(InformationManager::STOPMONITOR, oid);

    return 0;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ImageDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    Nebula&         nd     = Nebula::instance();

    ImageManager *  imagem = nd.get_imagem();
    DatastorePool * dspool = nd.get_dspool();

    Datastore * ds;
    Image *     img;

    int    ds_id, rc;
    string ds_data;

    img   = static_cast<Image *>(object);
    ds_id = img->get_ds_id();

    img->unlock();

    ds = dspool->get(ds_id, true);

    if ( ds == 0 )
    {
       error_msg = "Datastore no longer exists cannot remove image";
       return -1;
    }

    ds->to_xml(ds_data);

    ds->unlock();

    rc = imagem->delete_image(oid, ds_data, error_msg);

    if ( rc == 0 )
    {
        ds = dspool->get(ds_id, true);

        if ( ds != 0 )
        {
            ds->del_image(oid);
            dspool->update(ds);

            ds->unlock();
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int GroupDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    int rc = RequestManagerDelete::drop(oid, object, error_msg);

    if ( rc == 0 )
    {
        aclm->del_gid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ClusterDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    int rc = RequestManagerDelete::drop(oid, object, error_msg);

    if ( rc == 0 )
    {
        aclm->del_cid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int UserDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    set<int>            group_set;
    set<int>::iterator  it;

    User * user = static_cast<User *>(object);
    group_set   = user->get_groups();

    if (oid == 0)
    {
        error_msg = "oneadmin cannot be deleted.";

        object->unlock();
        return -1;
    }

    int rc = pool->drop(object, error_msg);

    object->unlock();

    if ( rc == 0 )
    {
        Group * group;

        for ( it = group_set.begin(); it != group_set.end(); it++ )
        {
            group = gpool->get(*it, true);

            if( group == 0 )
            {
                continue;
            }

            group->del_user(oid);
            gpool->update(group);

            group->unlock();
        }

        aclm->del_uid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ZoneDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    int rc = RequestManagerDelete::drop(oid, object, error_msg);

    if ( rc == 0 )
    {
        aclm->del_zid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int VirtualNetworkDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    VirtualNetwork * vnet = static_cast<VirtualNetwork *>(object);

    if ( vnet->get_used() > 0 )
    {
        error_msg = "Can not remove a virtual network with leases in use";

        vnet->unlock();

        return -1;
    }

    int pvid = vnet->get_parent();
    int uid  = vnet->get_uid();
    int gid  = vnet->get_gid();

    int rc  = RequestManagerDelete::drop(oid, object, error_msg);

    if (pvid != -1)
    {
        vnet = (static_cast<VirtualNetworkPool *>(pool))->get(pvid, true);

        if (vnet == 0)
        {
            return rc;
        }

        int freed = vnet->free_addr_by_owner(PoolObjectSQL::NET, oid);

        pool->update(vnet);

        vnet->unlock();

        if (freed > 0)
        {
            ostringstream oss;
            Template      tmpl;

            for (int i= 0 ; i < freed ; i++)
            {
                oss << " NIC = [ NETWORK_ID = " << pvid << " ]" << endl;
            }

            tmpl.parse_str_or_xml(oss.str(), error_msg);

            Quotas::quota_del(Quotas::NETWORK, uid, gid, &tmpl);
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int SecurityGroupDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    if (object->get_oid() == 0)
    {
        error_msg = "The default security group (ID 0) cannot be deleted.";

        object->unlock();

        return -1;
    }

    SecurityGroup * sgroup = static_cast<SecurityGroup *>(object);

    if ( sgroup->get_vms() > 0 )
    {
        error_msg = "The security group has VMs using it";

        sgroup->unlock();

        return -1;
    }

    return RequestManagerDelete::drop(oid, object, error_msg);
}
