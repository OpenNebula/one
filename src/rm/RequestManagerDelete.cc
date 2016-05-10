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

#include "RequestManagerDelete.h"
#include "NebulaUtil.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static Request::ErrorCode delete_authorization(PoolSQL* pool,
        int oid, AuthRequest::Operation auth_op, RequestAttributes& att)
{
    PoolObjectAuth  perms;

    if ( att.uid == 0 )
    {
        return Request::SUCCESS;
    }

    PoolObjectSQL * object = pool->get(oid, true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        return Request::NO_EXISTS;
    }

    object->get_permissions(perms);

    object->unlock();

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(auth_op, perms); // <MANAGE|ADMIN> OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerDelete::request_execute(xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int  oid       = xmlrpc_c::value_int(paramList.getInt(1));
    bool recursive = false;

    if (paramList.size() > 2)
    {
        recursive = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    ErrorCode ec = delete_object(oid, recursive, att);

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

Request::ErrorCode RequestManagerDelete::delete_object(int oid,
	bool recursive, RequestAttributes& att)
{
    string    err;
    ErrorCode ec = delete_authorization(pool, oid, auth_op, att);

    if ( ec != SUCCESS )
    {
        return ec;
    }

    PoolObjectSQL * object = pool->get(oid, true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        return NO_EXISTS;
    }

    int rc = drop(object, recursive, att);

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot delete " + object_name(auth_object) + ". "
			+ att.resp_msg;

        return ACTION;
    }

    aclm->del_resource_rules(oid, auth_object);

    return SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int RequestManagerDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    set<int> cluster_ids = get_cluster_ids(object);

	int oid = object->get_oid();

    int rc  = pool->drop(object, att.resp_msg);

    object->unlock();

	if ( rc != 0 )
    {
		return rc;
    }

	set<int>::iterator it;

	for(it = cluster_ids.begin(); it != cluster_ids.end(); it++)
	{
		Cluster * cluster = clpool->get(*it, true);

		if( cluster != 0 )
		{
			rc = del_from_cluster(cluster, oid, att.resp_msg);

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

int TemplateDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    vector<VectorAttribute *> disks;
    vector<VectorAttribute *>::iterator i;

    if (recursive)
    {
		static_cast<VMTemplate *>(object)->clone_disks(disks);
    }

	int rc = RequestManagerDelete::drop(object, false, att);

	if ( rc != 0 )
	{
		return rc;
	}
    else if ( !recursive )
    {
        return 0;
    }

    set<int> error_ids;
    set<int> img_ids;

    ImagePool* ipool = Nebula::instance().get_ipool();

	ImageDelete img_delete;

    ipool->get_image_ids(disks, img_ids, att.uid);

    for (set<int>::iterator it = img_ids.begin(); it != img_ids.end(); it++)
    {

        if ( img_delete.request_execute(*it, att) != SUCCESS )
        {
            NebulaLog::log("ReM", Log::ERROR, att.resp_msg);

            error_ids.insert(*it);
        }
    }

    for (i = disks.begin(); i != disks.end() ; i++)
    {
        delete *i;
    }

    if ( !error_ids.empty() )
    {
        att.resp_msg = "Cannot delete " + object_name(PoolObjectSQL::IMAGE) +
            ": " + one_util::join<set<int>::iterator>(error_ids.begin(),
            error_ids.end(), ',');

        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int HostDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    InformationManager * im = Nebula::instance().get_im();

    Host* host = static_cast<Host *>(object);

    if ( host->get_share_running_vms() > 0 )
    {
        att.resp_msg = "Can not remove a host with running VMs";

        host->unlock();

        return -1;
    }

    string im_mad = host->get_im_mad();
    string name   = host->get_name();
	int    oid    = host->get_oid();

    RequestManagerDelete::drop(object, false, att);

    im->stop_monitor(oid, name, im_mad);

    return 0;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ImageDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    Nebula&        nd     = Nebula::instance();
    ImageManager * imagem = nd.get_imagem();

	int oid = object->get_oid();

    object->unlock();

    return imagem->delete_image(oid, att.resp_msg);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int GroupDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
	int oid= object->get_oid();
    int rc = RequestManagerDelete::drop(object, false, att);

    if ( rc == 0 )
    {
        aclm->del_gid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ClusterDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
	int oid= object->get_oid();
    int rc = RequestManagerDelete::drop(object, false, att);

    if ( rc == 0 )
    {
        aclm->del_cid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int UserDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    User * user = static_cast<User *>(object);

    set<int> group_set = user->get_groups();
    set<int>::iterator it;

	int oid = user->get_oid();

    if (oid == 0)
    {
        att.resp_msg = "oneadmin cannot be deleted.";

        object->unlock();
        return -1;
    }

    int rc = pool->drop(object, att.resp_msg);

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

int ZoneDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
	int oid= object->get_oid();
    int rc = RequestManagerDelete::drop(object, false, att);

    if ( rc == 0 )
    {
        aclm->del_zid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int VirtualNetworkDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
	int oid= object->get_oid();
    VirtualNetwork * vnet = static_cast<VirtualNetwork *>(object);

    if ( vnet->get_used() > 0 )
    {
        att.resp_msg = "Can not remove a virtual network with leases in use";

        vnet->unlock();

        return -1;
    }

    int pvid = vnet->get_parent();
    int uid  = vnet->get_uid();
    int gid  = vnet->get_gid();

    int rc  = RequestManagerDelete::drop(object, false, att);

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

            tmpl.parse_str_or_xml(oss.str(), att.resp_msg);

            Quotas::quota_del(Quotas::NETWORK, uid, gid, &tmpl);
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int SecurityGroupDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    if (object->get_oid() == 0)
    {
        att.resp_msg  = "The default security group (ID 0) cannot be deleted.";

        object->unlock();

        return -1;
    }

    SecurityGroup * sgroup = static_cast<SecurityGroup *>(object);

    if ( sgroup->get_vms() > 0 )
    {
        att.resp_msg = "The security group has VMs using it";

        sgroup->unlock();

        return -1;
    }

    return RequestManagerDelete::drop(object, false, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int MarketPlaceAppDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    MarketPlaceManager * marketm = nd.get_marketm();
    MarketPlacePool * marketpool = nd.get_marketpool();

    MarketPlaceApp * app = static_cast<MarketPlaceApp *>(object);

    int mp_id   = app->get_market_id();
    int zone_id = app->get_zone_id();
	int oid     = app->get_oid();

    app->unlock();

    if ( zone_id != nd.get_zone_id() )
    {
        std::ostringstream oss;

        oss << "Marketapp can only be deleted from zone " << zone_id;
        att.resp_msg = oss.str();

        return -1;
    }

    MarketPlace * mp = marketpool->get(mp_id, true);

    if ( mp == 0 )
    {
        att.resp_msg = "Cannot find associated MARKETPLACE";
        return -1;
    }

    std::string mp_name = mp->get_name();
    std::string mp_data;

    if ( !mp->is_action_supported(MarketPlaceApp::DELETE) )
    {
        att.resp_msg = "Delete disabled for market: " + mp_name;
        mp->unlock();

        return -1;
    }

    mp->to_xml(mp_data);

    mp->unlock();

    return marketm->delete_app(oid, mp_data, att.resp_msg);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int MarketPlaceDelete::drop(PoolObjectSQL * object, bool recursive,
		RequestAttributes& att)
{
    MarketPlace * mp      = static_cast<MarketPlace *>(object);
    std::set<int> apps    = mp->get_marketapp_ids();
    bool          can_del = mp->is_public() || apps.empty();
    int           mp_id   = mp->get_oid();

    if( !can_del )
    {
        std::ostringstream oss;

        oss << object_name(PoolObjectSQL::MARKETPLACE) << "  "
            << mp->get_oid() << " is not empty.";
        att.resp_msg = oss.str();

        mp->unlock();

        return -1;
    }

    bool old_monitor = mp->disable_monitor();

    mp->unlock();

    int rc = 0;

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

           att.resp_msg = att.resp_msg + oss.str();

           rc = -1;
       }

       app->unlock();
    }

    MarketPlacePool* mppool = static_cast<MarketPlacePool *>(pool);

    mp = mppool->get(mp_id, true);

    if (mp == 0)
    {
        att.resp_msg = "MarketPlace no longer exists";

        return -1;
    }

    if ( rc == 0 )
    {
        mppool->drop(mp, att.resp_msg);
    }
    else if (old_monitor)
    {
        mp->enable_monitor();
    }

    mp->unlock();

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

