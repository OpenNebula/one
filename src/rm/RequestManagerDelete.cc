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

#include "RequestManagerDelete.h"
#include "NebulaUtil.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode RequestManagerDelete::delete_authorization(
        PoolSQL*                pool,
        int                     oid,
        AuthRequest::Operation  auth_op,
        RequestAttributes&      att)
{
    PoolObjectSQL * object;
    PoolObjectAuth  perms;

    if ( att.uid == 0 )
    {
        return SUCCESS;
    }

    object = pool->get(oid, true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        return NO_EXISTS;
    }

    object->get_permissions(perms);

    object->unlock();

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(auth_op, perms);    // <MANAGE|ADMIN> OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        return AUTHORIZATION;
    }

    return SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerDelete::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributes& att)
{
    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
    PoolObjectSQL * object;
    string          error_msg;
    ErrorCode       ec;

    ec = delete_authorization(pool, oid, auth_op, att);

    if ( ec != SUCCESS )
    {
        failure_response(ec, att);
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    int rc = drop(oid, object, error_msg);

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot delete " + object_name(auth_object) + ". " +  error_msg;
        failure_response(ACTION, att);
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

void TemplateDelete::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int  oid = xmlrpc_c::value_int(paramList.getInt(1));
    bool recursive = false;

    VMTemplate *    object;

    string    error_msg;
    set<int>  error_ids;
    set<int>  img_ids;
    ErrorCode ec;

    vector<VectorAttribute *> disks;

    if (paramList.size() > 2)
    {
        recursive = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    ec = delete_authorization(pool, oid, auth_op, att);

    if ( ec != SUCCESS )
    {
        failure_response(ec, att);
        return;
    }

    object = static_cast<VMTemplatePool*>(pool)->get(oid, true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    int rc = pool->drop(object, error_msg);

    if (recursive)
    {
        object->get_disks(disks);
    }

    object->unlock();

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot delete " + object_name(auth_object) + ". " +  error_msg;
        failure_response(ACTION, att);
        return;
    }

    aclm->del_resource_rules(oid, auth_object);

    if (recursive)
    {
        Nebula&   nd     = Nebula::instance();
        ImagePool* ipool = nd.get_ipool();

        ipool->get_image_ids(disks, img_ids, att.uid);

        for (set<int>::iterator it = img_ids.begin(); it != img_ids.end(); it++)
        {
            if ( ImageDelete::delete_img(*it, att) != SUCCESS )
            {
                NebulaLog::log("ReM", Log::ERROR, failure_message(ec, att));

                error_ids.insert(*it);
                rc = -1;
            }
        }

        for (vector<VectorAttribute *>::iterator i = disks.begin() ;
                i != disks.end() ; i++)
        {
            delete *i;
        }
    }

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot delete " + object_name(PoolObjectSQL::IMAGE) +
            ": " + one_util::join<set<int>::iterator>(error_ids.begin(),
            error_ids.end(), ',');

        failure_response(ACTION, att);
        return;
    }

    success_response(oid, att);

    return;
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

void ImageDelete::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int oid = xmlrpc_c::value_int(paramList.getInt(1));

    ErrorCode ec = delete_img(oid, att);

    if ( ec == SUCCESS )
    {
        success_response(oid, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode ImageDelete::delete_img(int oid, RequestAttributes& att)
{
    Image *         object;
    string          error_msg;
    ErrorCode       ec;

    Nebula&        nd     = Nebula::instance();
    ImageManager * imagem = nd.get_imagem();
    AclManager *   aclm   = nd.get_aclm();
    ImagePool *    pool   = nd.get_ipool();

    PoolObjectSQL::ObjectType auth_object = PoolObjectSQL::IMAGE;

    ec = delete_authorization(pool, oid, AuthRequest::MANAGE, att);

    if ( ec != SUCCESS )
    {
        att.resp_obj = auth_object;
        return ec;
    }

    object = pool->get(oid, false);

    if ( object == 0 )
    {
        att.resp_id = oid;
        return NO_EXISTS;
    }

    int rc = imagem->delete_image(oid, error_msg);

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot delete " + object_name(auth_object) + ". " +  error_msg;
        return ACTION;
    }

    aclm->del_resource_rules(oid, auth_object);

    return SUCCESS;
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

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int MarketPlaceAppDelete::drop(int oid, PoolObjectSQL * object, string& emsg)
{
    Nebula& nd = Nebula::instance();

    MarketPlaceManager * marketm = nd.get_marketm();
    MarketPlacePool * marketpool = nd.get_marketpool();

    MarketPlaceApp * app = static_cast<MarketPlaceApp *>(object);

    int mp_id   = app->get_market_id();
    int zone_id = app->get_zone_id();

    app->unlock();

    if ( zone_id != nd.get_zone_id() )
    {
        std::ostringstream oss;

        oss << "Marketapp can only be deleted from zone " << zone_id;
        emsg = oss.str();

        return -1;
    }

    MarketPlace * mp = marketpool->get(mp_id, true);

    if ( mp == 0 )
    {
        emsg = "Cannot find associated MARKETPLACE";
        return -1;
    }

    std::string mp_name = mp->get_name();
    std::string mp_data;

    if ( !mp->is_action_supported(MarketPlaceApp::DELETE) )
    {
        emsg = "Delete disabled for market: " + mp_name;
        mp->unlock();

        return -1;
    }

    mp->to_xml(mp_data);

    mp->unlock();

    return marketm->delete_app(oid, mp_data, emsg);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int MarketPlaceDelete::drop(int oid, PoolObjectSQL * object, string& emsg)
{
    MarketPlace * mp = static_cast<MarketPlace *>(object);
    set<int> apps    = mp->get_marketapp_ids();

    int rc = pool->drop(object, emsg);

    object->unlock();

    if ( rc != 0 || apps.empty() )
    {
        return rc;
    }

    Nebula& nd = Nebula::instance();

    MarketPlaceApp *     app;
    MarketPlaceAppPool * apppool = nd.get_apppool();

    string app_error;

    for ( set<int>::iterator i = apps.begin(); i != apps.end(); ++i )
    {
        app = apppool->get(*i, true);

        if ( app == 0 )
        {
            continue;
        }

       if ( apppool->drop(app, app_error) != 0 )
       {
           ostringstream oss;

           oss << "Cannot remove " << object_name(PoolObjectSQL::MARKETPLACEAPP)
               << " " << *i << ": " << app_error << ". ";

           emsg = emsg + oss.str();

           rc = -1;
       }

       app->unlock();
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

