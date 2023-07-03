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

#include "RequestManagerDelete.h"
#include "Nebula.h"
#include "NebulaUtil.h"
#include "VirtualMachineDisk.h"
#include "AclManager.h"
#include "AuthManager.h"
#include "FedReplicaManager.h"
#include "ImageManager.h"
#include "InformationManager.h"
#include "IPAMManager.h"
#include "MarketPlaceManager.h"

#include "BackupJobPool.h"
#include "ClusterPool.h"
#include "DatastorePool.h"
#include "DocumentPool.h"
#include "HookPool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "SecurityGroupPool.h"
#include "VdcPool.h"
#include "VirtualNetworkPool.h"
#include "VirtualRouterPool.h"
#include "VMGroupPool.h"
#include "VMTemplatePool.h"
#include "VNTemplatePool.h"
#include "ZonePool.h"
#include "ScheduledActionPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
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
/* -------------------------------------------------------------------------- */

RequestManagerDelete::RequestManagerDelete(const string& method_name,
                                           const string& params,
                                           const string& help)
    : Request(method_name, params, help)
{
    auth_op = AuthRequest::MANAGE;

    Nebula& nd  = Nebula::instance();
    clpool      = nd.get_clpool();
    aclm        = nd.get_aclm();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManagerDelete::RequestManagerDelete(const string& method_name,
                                           const string& help)
    : Request(method_name, "A:si", help)
{
    auth_op = AuthRequest::MANAGE;

    Nebula& nd  = Nebula::instance();
    clpool      = nd.get_clpool();
    aclm        = nd.get_aclm();
};

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

    // Save body before deleting it for hooks
    if (auto obj = pool->get_ro<PoolObjectSQL>(oid))
    {
        obj->to_xml(att.extra_xml);
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

Request::ErrorCode RequestManagerDelete::delete_object(int oid, bool recursive,
        RequestAttributes& att)
{
    string    err;
    ErrorCode ec;

    ec = delete_authorization(pool, oid, att);

    if ( ec != SUCCESS )
    {
        return ec;
    }

    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;
        return NO_EXISTS;
    }

    int rc = drop(std::move(object), recursive, att);

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

int RequestManagerDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool recursive,
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

TemplateDelete::TemplateDelete()
    : RequestManagerDelete("one.template.delete",
                           "A:sib"
                           "Deletes a virtual machine template")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_tpool();
    auth_object = PoolObjectSQL::TEMPLATE;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int TemplateDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool recursive,
        RequestAttributes& att)
{
    vector<VectorAttribute *> vdisks;

    VirtualMachineDisks disks(true);

    int tid = object->get_oid();

    if (recursive)
    {
        static_cast<VMTemplate *>(object.get())->clone_disks(vdisks);

        disks.init(vdisks, false);
    }

    int rc = RequestManagerDelete::drop(std::move(object), false, att);

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

    ImageDelete img_delete;

    disks.get_image_ids(img_ids, att.uid);

    for (auto iid : img_ids)
    {
        if ( img_delete.request_execute(iid, att) != SUCCESS )
        {
            NebulaLog::warn("ReM", att.resp_msg);

            error_ids.insert(iid);
        }
    }

    if ( !error_ids.empty() )
    {
        att.resp_msg = "Template " + to_string(tid) +
            " deleted, unable to recursively delete " +
            object_name(PoolObjectSQL::IMAGE) +
            ": " + one_util::join(error_ids.begin(), error_ids.end(), ',');

        NebulaLog::warn("ReM", att.resp_msg);
    }

    return 0;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualNetworkTemplateDelete::VirtualNetworkTemplateDelete()
    : RequestManagerDelete("one.vntemplate.delete",
                            "A:si",
                            "Deletes a virtual network template")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vntpool();
    auth_object = PoolObjectSQL::VNTEMPLATE;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualNetworkDelete::VirtualNetworkDelete()
    : RequestManagerDelete("one.vn.delete",
                           "Deletes a virtual network")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vnpool();
    auth_object = PoolObjectSQL::NET;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int VirtualNetworkDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    int oid = object->get_oid();
    VirtualNetwork * vnet = static_cast<VirtualNetwork *>(object.get());

    if ( vnet->get_used() > 0 )
    {
        att.resp_msg = "Can not remove a virtual network with leases in use";

        return -1;
    }

    switch(vnet->get_state())
    {
        case VirtualNetwork::LOCK_CREATE:
        case VirtualNetwork::LOCK_DELETE:
        case VirtualNetwork::DONE:
            att.resp_msg = "Can not remove a Virtual Network, wrong state "
                + vnet->state_to_str(vnet->get_state());
            return -1;
        case VirtualNetwork::INIT:
        case VirtualNetwork::READY:
        case VirtualNetwork::ERROR:
        case VirtualNetwork::UPDATE_FAILURE:
            break;
    }

    Nebula& nd  = Nebula::instance();
    VirtualNetworkPool * vnpool = nd.get_vnpool();

    // Delete all address ranges to call IPAM if needed
    string error_msg;

    int rc = vnet->rm_ars(error_msg);

    if (rc != 0)
    {
        vnpool->update(vnet);

        return rc;
    }

    vnet->set_state(VirtualNetwork::LOCK_DELETE);

    vnpool->update(vnet);

    string xml64;
    vnet->to_xml64(xml64);

    auto ipamm = nd.get_ipamm();
    ipamm->trigger_vnet_delete(oid, xml64);

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ImageDelete::ImageDelete()
    : RequestManagerDelete("one.image.delete", "A:sib", "Deletes an image")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_ipool();
    auth_object = PoolObjectSQL::IMAGE;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageDelete::request_execute(xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int  oid = paramList.getInt(1);
    bool force = false;

    if (paramList.size() > 2)
    {
        force = paramList.getBoolean(2);
    }

    auto img = pool->get<Image>(oid);

    if (img == nullptr)
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (img->is_locked())
    {
        att.auth_op = AuthRequest::ADMIN;

        if (!force)
        {
            att.resp_id = oid;
            att.resp_msg = "Image locked, use --force flag to remove the image. "
                "Force delete may leave some files on Datastore";
            failure_response(INTERNAL, att);
            return;
        }
    }

    if (force)
    {
        img->replace_template_attribute("FORCE_DELETE", true);

        pool->update(img.get());
    }

    //Save body before deleting for hooks.
    img->to_xml(att.extra_xml);

    img.reset();

    ErrorCode ec = delete_object(oid, false, att);

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

int ImageDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    Nebula&        nd     = Nebula::instance();
    ImageManager * imagem = nd.get_imagem();

    int oid = object->get_oid();

    object.reset();

    return imagem->delete_image(oid, att.resp_msg);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

HostDelete::HostDelete()
    : RequestManagerDelete("one.host.delete", "Deletes a host")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_hpool();
    auth_object = PoolObjectSQL::HOST;
    auth_op     = AuthRequest::ADMIN;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int HostDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();
    InformationManager * im = nd.get_im();

    std::string error;

    Host* host = static_cast<Host *>(object.get());

    if ( host->get_share_running_vms() > 0 )
    {
        att.resp_msg = "Can not remove a host with running VMs";

        return -1;
    }

    string im_mad = host->get_im_mad();
    string name   = host->get_name();
    int    oid    = host->get_oid();

    int rc = RequestManagerDelete::drop(std::move(object), false, att);

    im->stop_monitor(oid, name, im_mad);
    im->delete_host(oid);

    if (rc != 0)
    {
        return rc;
    }

    // Remove host from VDC
    int       zone_id = nd.get_zone_id();
    VdcPool * vdcpool = nd.get_vdcpool();

    std::vector<int> vdcs;

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_host(zone_id, oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

GroupDelete::GroupDelete()
    : RequestManagerDelete("one.group.delete", "Deletes a group")
{
    Nebula& nd = Nebula::instance();
    pool       = nd.get_gpool();

    auth_object = PoolObjectSQL::GROUP;
    auth_op     = AuthRequest::ADMIN;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int GroupDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    int oid = object->get_oid();
    int rc  = RequestManagerDelete::drop(std::move(object), false, att);

    if ( rc != 0 )
    {
        return rc;
    }

    aclm->del_gid_rules(oid);

    Nebula&        nd = Nebula::instance();
    VdcPool * vdcpool = nd.get_vdcpool();

    std::string error;
    std::vector<int> vdcs;

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_group(oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

UserDelete::UserDelete()
    : RequestManagerDelete("one.user.delete", "Deletes a user")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_upool();
    gpool       = nd.get_gpool();

    auth_object = PoolObjectSQL::USER;
    auth_op     = AuthRequest::ADMIN;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int UserDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    User * user = static_cast<User *>(object.get());

    set<int> group_set = user->get_groups();

    int oid = user->get_oid();

    if (oid == 0)
    {
        att.resp_msg = "oneadmin cannot be deleted.";

        return -1;
    }

    int rc = pool->drop(object.get(), att.resp_msg);

    object.reset();

    if ( rc == 0 )
    {
        for (auto gid : group_set)
        {
            if ( auto group = gpool->get(gid) )
            {
                group->del_user(oid);
                gpool->update(group.get());
            }
        }

        aclm->del_uid_rules(oid);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

DatastoreDelete::DatastoreDelete()
    : RequestManagerDelete("one.datastore.delete", "Deletes a datastore")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_dspool();
    auth_object = PoolObjectSQL::DATASTORE;
    auth_op     = AuthRequest::ADMIN;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int DatastoreDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    int oid = object->get_oid();

    int rc = RequestManagerDelete::drop(std::move(object), r, att);

    if (rc != 0)
    {
        return rc;
    }

    // Remove datastore from vdc
    Nebula& nd  = Nebula::instance();
    int zone_id = nd.get_zone_id();

    VdcPool * vdcpool = nd.get_vdcpool();

    std::string error;
    std::vector<int> vdcs;

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_datastore(zone_id, oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ClusterDelete::ClusterDelete()
    : RequestManagerDelete("one.cluster.delete", "Deletes a cluster")
{
    Nebula& nd = Nebula::instance();
    pool       = nd.get_clpool();

    auth_object = PoolObjectSQL::CLUSTER;
    auth_op     = AuthRequest::ADMIN;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ClusterDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    int oid = object->get_oid();
    int rc = RequestManagerDelete::drop(std::move(object), false, att);

    if (rc != 0)
    {
        return rc;
    }

    aclm->del_cid_rules(oid);

    // Remove cluster from VDC
    Nebula& nd  = Nebula::instance();
    int zone_id = nd.get_zone_id();

    VdcPool * vdcpool = nd.get_vdcpool();

    std::string error;
    std::vector<int> vdcs;

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_cluster(zone_id, oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

DocumentDelete::DocumentDelete()
    : RequestManagerDelete("one.document.delete",
                           "Deletes a generic document")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_docpool();
    auth_object = PoolObjectSQL::DOCUMENT;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ZoneDelete::ZoneDelete()
    : RequestManagerDelete("one.zone.delete", "Deletes a zone")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_zonepool();
    auth_object = PoolObjectSQL::ZONE;
    auth_op     = AuthRequest::ADMIN;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ZoneDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    int oid= object->get_oid();
    int rc = RequestManagerDelete::drop(std::move(object), false, att);

    if ( rc == 0 )
    {
        aclm->del_zid_rules(oid);
    }

    Nebula::instance().get_frm()->delete_zone(oid);

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

SecurityGroupDelete::SecurityGroupDelete():
    RequestManagerDelete("one.secgroup.delete",
                            "Deletes a security group")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_secgrouppool();
    auth_object = PoolObjectSQL::SECGROUP;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int SecurityGroupDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    if (object->get_oid() == 0)
    {
        att.resp_msg  = "The default security group (ID 0) cannot be deleted.";

        return -1;
    }

    SecurityGroup * sgroup = static_cast<SecurityGroup *>(object.get());

    if ( sgroup->get_vms() > 0 )
    {
        att.resp_msg = "The security group has VMs using it";

        return -1;
    }

    return RequestManagerDelete::drop(std::move(object), false, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VdcDelete::VdcDelete()
    : RequestManagerDelete("one.vdc.delete", "Deletes a VDC")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vdcpool();
    auth_object = PoolObjectSQL::VDC;
    auth_op     = AuthRequest::ADMIN;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VirtualRouterDelete::VirtualRouterDelete()
    : RequestManagerDelete("one.vrouter.delete",
                           "Deletes a virtual router")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vrouterpool();
    auth_object = PoolObjectSQL::VROUTER;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int VirtualRouterDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    VirtualRouter * vr = static_cast<VirtualRouter *>(object.get());

    set<int> vms = vr->get_vms();

    int rc  = RequestManagerDelete::drop(std::move(object), false, att);

    if ( rc == 0 && !vms.empty())
    {
        VirtualRouter::shutdown_vms(vms, att);
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

MarketPlaceDelete::MarketPlaceDelete()
    : RequestManagerDelete("one.market.delete",
                           "Deletes a marketplace")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_marketpool();
    auth_object = PoolObjectSQL::MARKETPLACE;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int MarketPlaceDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    std::set<int> apps;
    int           mp_id;
    bool          old_monitor;

    {
        unique_ptr<MarketPlace> mp(static_cast<MarketPlace *>(object.release()));

        apps  = mp->get_marketapp_ids();
        mp_id = mp->get_oid();

        bool can_del = mp->is_public() || apps.empty();

        if (!can_del)
        {
            std::ostringstream oss;

            oss << object_name(PoolObjectSQL::MARKETPLACE) << "  "
                << mp->get_oid() << " is not empty.";
            att.resp_msg = oss.str();

            return -1;
        }

        old_monitor = mp->disable_monitor();
    }

    int rc = 0;

    Nebula& nd = Nebula::instance();

    MarketPlaceAppPool * apppool = nd.get_apppool();

    string app_error;

    for (auto app_id : apps)
    {
        auto app = apppool->get(app_id);

        if ( app == nullptr )
        {
            continue;
        }

       if ( apppool->drop(app.get(), app_error) != 0 )
       {
           ostringstream oss;

           oss << "Cannot remove " << object_name(PoolObjectSQL::MARKETPLACEAPP)
               << " " << app_id << ": " << app_error << ". ";

           att.resp_msg = att.resp_msg + oss.str();

           rc = -1;
       }
    }

    MarketPlacePool* mppool = static_cast<MarketPlacePool *>(pool);

    auto mp = mppool->get(mp_id);

    if (mp == nullptr)
    {
        att.resp_msg = "MarketPlace no longer exists";

        return -1;
    }

    if ( rc == 0 )
    {
        mppool->drop(mp.get(), att.resp_msg);
    }
    else if (old_monitor)
    {
        mp->enable_monitor();
    }

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

MarketPlaceAppDelete::MarketPlaceAppDelete()
    : RequestManagerDelete("one.marketapp.delete",
                           "Deletes a marketplace app")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_apppool();
    auth_object = PoolObjectSQL::MARKETPLACEAPP;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int MarketPlaceAppDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    MarketPlaceManager * marketm = nd.get_marketm();
    MarketPlacePool * marketpool = nd.get_marketpool();

    MarketPlaceApp * app = static_cast<MarketPlaceApp *>(object.get());

    int mp_id   = app->get_market_id();
    int zone_id = app->get_zone_id();
    int oid     = app->get_oid();

    object.reset();

    if ( zone_id != nd.get_zone_id() )
    {
        std::ostringstream oss;

        oss << "Marketapp can only be deleted from zone " << zone_id;
        att.resp_msg = oss.str();

        return -1;
    }

    std::string mp_name;
    std::string mp_data;

    if ( auto mp = marketpool->get_ro(mp_id) )
    {
        mp_name = mp->get_name();

        if ( !mp->is_action_supported(MarketPlaceApp::DELETE) )
        {
            att.resp_msg = "Delete disabled for market: " + mp_name;

            return -1;
        }

        mp->to_xml(mp_data);
    }
    else
    {
        att.resp_msg = "Cannot find associated MARKETPLACE";
        return -1;
    }

    return marketm->delete_app(oid, mp_data, att.resp_msg);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

VMGroupDelete::VMGroupDelete()
    : RequestManagerDelete("one.vmgroup.delete",
                           "Deletes a vm group")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vmgrouppool();
    auth_object = PoolObjectSQL::VMGROUP;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

HookDelete::HookDelete():
    RequestManagerDelete("one.hook.delete",
                            "Deletes a hook")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_hkpool();
    auth_object = PoolObjectSQL::HOOK;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

BackupJobDelete::BackupJobDelete():
    RequestManagerDelete("one.backupjob.delete",
                         "Deletes a Backup Job")
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_bjpool();
    auth_object = PoolObjectSQL::BACKUPJOB;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int BackupJobDelete::drop(std::unique_ptr<PoolObjectSQL> object, bool r, RequestAttributes& att)
{
    BackupJob * bj = static_cast<BackupJob *>(object.get());

    std::set<int> sa_ids(bj->sched_actions().get_collection());

    int rc = RequestManagerDelete::drop(std::move(object), false, att);

    if (rc != 0)
    {
        return rc;
    }

    auto sapool = Nebula::instance().get_sapool();

    string error;
    rc = 0;

    for (const auto& id: sa_ids)
    {
        if (auto sa = sapool->get(id))
        {
            rc += sapool->drop(sa.get(), error);
        }
    }

    if ( rc != 0 )
    {
        att.resp_msg = "BackupJob deleted, but some associated schedules could not be removed";
        return -1;
    }

    return rc;
}

