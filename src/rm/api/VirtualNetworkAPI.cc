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

#include "VirtualNetworkAPI.h"
#include "IPAMManager.h"
#include "VirtualMachinePool.h"
#include "VirtualRouterPool.h"
#include "LifeCycleManager.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

/**
 *  Set a where filter to get the oids of objects that a user can "USE"
 *    @param att the XML-RPC Attributes with user information
 *    @param auth_object the object type
 *    @param where_string will store the resulting SQL filter
 *    @return true if the use_filter is empty and access to all objects
 *    should be granted.
 */
bool use_filter(RequestAttributes& att,
                PoolObjectSQL::ObjectType aobj,
                bool disable_all_acl,
                bool disable_cluster_acl,
                bool disable_group_acl,
                const string& and_str,
                string& where_str)
{
    bool all;

    string acl_str;

    PoolSQL::acl_filter(att.uid, att.group_ids, aobj, all,
                        disable_all_acl, disable_cluster_acl, disable_group_acl, acl_str);

    PoolSQL::usr_filter(att.uid, att.gid, att.group_ids, PoolSQL::ALL, all, acl_str,
                        where_str);

    if (!and_str.empty())
    {
        ostringstream filter;

        filter << "( " << where_str << " ) AND ( " << and_str << " )";

        where_str = filter.str();
    }

    return all;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::add_ar(int oid,
                                             const std::string& str_tmpl,
                                             RequestAttributes& att)
{
    att.auth_op = AuthRequest::ADMIN;

    VirtualNetworkTemplate tmpl;
    unique_ptr<VirtualNetwork> vn;

    if (auto ec = authorize(oid, str_tmpl, tmpl, vn, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc = vn->add_ar(&tmpl, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    vnpool->update(vn.get());

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::rm_ar(int oid,
                                            int ar_id,
                                            bool force,
                                            RequestAttributes& att)
{
    if (auto ec = basic_authorization(oid, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    string mac;
    int    rsize;

    int parent;
    int parent_ar;

    int uid;
    int gid;

    int rc;

    // -------------------------------------------------------------------------
    // Get VNET and data for reservations
    // -------------------------------------------------------------------------
    if ( auto vn = vnpool->get(oid) )
    {
        if (vn->get_state() != VirtualNetwork::READY &&
            vn->get_state() != VirtualNetwork::UPDATE_FAILURE)
        {
            att.resp_msg = "Could not remove Adress Range, "
                           "Virtual Network is in wrong state: "
                           + vn->state_to_str(vn->get_state());

            return Request::ACTION;
        }

        parent    = vn->get_parent();
        parent_ar = vn->get_ar_parent(ar_id);

        uid = vn->get_uid();
        gid = vn->get_gid();

        rc  = vn->get_template_attribute("SIZE", rsize, ar_id);

        vn->get_template_attribute("MAC", mac, ar_id);

        if (vn->rm_ar(ar_id, force, att.resp_msg) < 0)
        {
            return Request::INTERNAL;
        }

        vnpool->update(vn.get());
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    // -------------------------------------------------------------------------
    // Free addresses in parent VNET for reservations
    // -------------------------------------------------------------------------

    if (parent != -1 && parent_ar != -1 && !mac.empty() && rc == 0)
    {
        if ( auto vn = vnpool->get(parent) )
        {
            int freed = vn->free_addr_by_range((unsigned int) parent_ar,
                                               PoolObjectSQL::NET, oid, mac, rsize);

            vnpool->update(vn.get());

            vn.reset();

            if (freed > 0)
            {
                ostringstream oss;
                Template      tmpl;

                for (int i= 0 ; i < freed ; i++)
                {
                    oss << " NIC = [ NETWORK_ID = " << parent << " ]" << endl;
                }

                tmpl.parse_str_or_xml(oss.str(), att.resp_msg);

                Quotas::quota_del(Quotas::NETWORK, uid, gid, &tmpl);
            }
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::update_ar(int oid,
                                                const std::string& str_tmpl,
                                                RequestAttributes& att)
{
    VirtualNetworkTemplate tmpl;
    unique_ptr<VirtualNetwork> vn;

    if (auto ec = authorize(oid, str_tmpl, tmpl, vn, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc = vn->update_ar(&tmpl, !att.is_admin(), att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    vnpool->update(vn.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::reserve(int oid,
                                              const std::string& str_tmpl,
                                              int& rid,
                                              RequestAttributes& att)
{
    VirtualNetworkTemplate tmpl;

    set<int> cluster_ids;

    unique_ptr<VirtualNetworkTemplate> vtmpl;

    PoolObjectAuth reserv_perms;

    // -------------------------------------------------------------------------
    // Process the Reservation Template
    // -------------------------------------------------------------------------
    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    /* ------------------- Reservation SIZE ---------------- */

    int size;

    if ( !tmpl.get("SIZE", size) || size <= 0 )
    {
        att.resp_msg = "Reservation SIZE must be a greater than 0";

        return Request::ACTION;
    }

    /* ------------------- Target reservation NETWORK_ID ---------------- */

    bool on_exisiting = tmpl.get("NETWORK_ID", rid);

    if ( on_exisiting)
    {
        /* ------------------- Check reservation consistency ---------------- */

        if (rid < 0)
        {
            att.resp_msg = "NETWORK_ID must be equal or greater than 0";

            return Request::ACTION;
        }

        if (rid == oid)
        {
            att.resp_msg = "Cannot add a reservation from the same network";

            return Request::ACTION;
        }

        auto rvn = vnpool->get_ro(rid);

        if (rvn == nullptr)
        {
            att.resp_id = rid;

            return Request::NO_EXISTS;
        }

        int parent = rvn->get_parent();

        if (parent == -1)
        {
            att.resp_msg = "Cannot add reservations to a non-reservation VNET";

            return Request::ACTION;
        }

        if (parent != oid)
        {
            ostringstream oss;

            oss << "New reservations for virtual network " << rid
                << " have to be from network " << parent;

            att.resp_msg = oss.str();

            return Request::ACTION;
        }

        rvn->get_permissions(reserv_perms);
    }

    /* ------------------- Reservation NAME ---------------- */

    string name;

    tmpl.get("NAME", name);

    if (name.empty() && !on_exisiting)
    {
        att.resp_msg = "NAME for reservation has to be set";

        return Request::ACTION;
    }

    /* ------------------- Starting AR_ID, IP & MAC ---------------- */

    int  ar_id;
    bool with_ar_id = tmpl.get("AR_ID", ar_id);

    if ( with_ar_id && (ar_id < 0))
    {
        att.resp_msg = "AR_ID must be equal or greater than 0";

        return Request::ACTION;
    }

    string ip, mac, ip6;

    tmpl.get("IP", ip);

    tmpl.get("IP6", ip6);

    tmpl.get("MAC", mac);

    if (!with_ar_id && (!ip.empty() || !mac.empty() || !ip6.empty()))
    {
        att.resp_msg = "AR_ID must be specified for IP/MAC based reservations";

        return Request::ACTION;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation Parent:USE Reservation:MANAGE
    // -------------------------------------------------------------------------
    PoolObjectAuth parent_perms;
    AuthRequest    ar(att.uid, att.group_ids);

    if ( auto vn = vnpool->get_ro(oid) )
    {
        if (vn->get_parent() != -1)
        {
            att.resp_msg = "Cannot reserve addresses from a reserved VNET";

            return Request::ACTION;
        }

        vn->get_permissions(parent_perms);

        ar.add_auth(AuthRequest::USE, parent_perms);

        if (on_exisiting)
        {
            ar.add_auth(AuthRequest::MANAGE, reserv_perms);
        }
        else
        {
            vtmpl       = vn->clone_template();
            cluster_ids = vn->get_cluster_ids();
        }
    }
    else
    {
        att.resp_msg = oid;

        return Request::NO_EXISTS;
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // -------------------------------------------------------------------------
    // Create a new VNET to place the reservation (if needed)
    // -------------------------------------------------------------------------
    if (!on_exisiting)
    {
        vtmpl->replace("NAME", name);

        rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              oid, std::move(vtmpl), &rid, cluster_ids, att.resp_msg);

        if (rc < 0)
        {
            return Request::INTERNAL;
        }
    }

    int ruid;
    int rgid;

    if (auto rvn = vnpool->get_ro(rid))
    {
        ruid = rvn->get_uid();
        rgid = rvn->get_gid();
    }
    else
    {
        att.resp_id = rid;

        return Request::NO_EXISTS;
    }

    // -------------------------------------------------------------------------
    // Check & update quotas on the target VNET & *reservation owner*
    // -------------------------------------------------------------------------
    ostringstream qtmpl_s;
    Template      qtmpl;

    RequestAttributes reservation_att(ruid, rgid, att);

    for (int i=0; i< size ; i++)
    {
        qtmpl_s << "NIC = [ NETWORK_ID = " << oid << "]" << endl;
    }

    qtmpl.parse_str_or_xml(qtmpl_s.str(), att.resp_msg);

    if ( !quota_authorization(&qtmpl, Quotas::NETWORK, reservation_att, att.resp_msg) )
    {
        if (!on_exisiting)
        {
            if (auto rvn = vnpool->get(rid))
            {
                vnpool->drop(rvn.get(), att.resp_msg);
            }
        }

        return Request::AUTHORIZATION;
    }

    // -------------------------------------------------------------------------
    // Make address reservation and set it
    // -------------------------------------------------------------------------
    if (with_ar_id)
    {
        if (!ip.empty())
        {
            rc = vnpool->reserve_addr_by_ip(oid, rid, size, ar_id, ip,
                                            att.resp_msg);
        }
        else if (!ip6.empty())
        {
            rc = vnpool->reserve_addr_by_ip6(oid, rid, size, ar_id, ip6,
                                             att.resp_msg);
        }
        else if (!mac.empty())
        {
            rc = vnpool->reserve_addr_by_mac(oid, rid, size, ar_id, mac,
                                             att.resp_msg);
        }
        else
        {
            rc = vnpool->reserve_addr(oid, rid, size, ar_id, att.resp_msg);
        }
    }
    else
    {
        rc = vnpool->reserve_addr(oid, rid, size, att.resp_msg);
    }

    if (rc != 0 )
    {
        quota_rollback(&qtmpl, Quotas::NETWORK, reservation_att);

        if (!on_exisiting)
        {
            if (auto rvn = vnpool->get(rid))
            {
                vnpool->drop(rvn.get(), att.resp_msg);
            }
        }

        return Request::ACTION;
    }

    // -------------------------------------------------------------------------
    // Add the reservation to the same clusters as the parent VNET
    // -------------------------------------------------------------------------
    if (!cluster_ids.empty() && !on_exisiting)
    {
        Nebula& nd  = Nebula::instance();

        ClusterPool * clpool = nd.get_clpool();

        for (auto cid : cluster_ids)
        {
            if ( auto cluster = clpool->get(cid) )
            {
                clpool->add_to_cluster(PoolObjectSQL::NET, cluster.get(), rid, att.resp_msg);
            }
        }
    }

    return Request::SUCCESS;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::free_ar(int oid,
                                              int ar_id,
                                              RequestAttributes& att)
{
    return rm_ar(oid, ar_id, false, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::hold(int oid,
                                           const std::string& str_tmpl,
                                           RequestAttributes& att)
{
    VirtualNetworkTemplate tmpl;
    unique_ptr<VirtualNetwork> vn;

    if (auto ec = authorize(oid, str_tmpl, tmpl, vn, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc = vn->hold_leases(&tmpl, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    vnpool->update(vn.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::release(int oid,
                                              const std::string& str_tmpl,
                                              RequestAttributes& att)
{
    VirtualNetworkTemplate tmpl;
    unique_ptr<VirtualNetwork> vn;

    if (auto ec = authorize(oid, str_tmpl, tmpl, vn, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc = vn->free_leases(&tmpl, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    vnpool->update(vn.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::recover(int oid,
                                              int operation,
                                              RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();
    auto ipamm = nd.get_ipamm();

    ostringstream oss;

    if (operation < 0 || operation > 3)
    {
        att.resp_msg = "Wrong recovery operation code";

        return Request::ACTION;
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto vn = vnpool->get(oid);

    if ( vn == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    auto state = vn->get_state();

    switch (operation)
    {
        case 0: //recover-failure
            switch(state)
            {
                case VirtualNetwork::INIT:
                case VirtualNetwork::LOCK_CREATE:
                case VirtualNetwork::LOCK_DELETE:
                    vn->set_state(VirtualNetwork::ERROR);
                    vn->set_template_error_message("Failure forced by user");
                    vnpool->update(vn.get());
                    break;

                case VirtualNetwork::DONE:
                case VirtualNetwork::READY:
                case VirtualNetwork::ERROR:
                case VirtualNetwork::UPDATE_FAILURE:
                    oss << "Could not perform 'recover failure' on VN " << oid
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();

                    return Request::INTERNAL;
            }
            break;

        case 1: //recover-success
            vn->clear_template_error_message();

            switch(state)
            {
                case VirtualNetwork::INIT:
                case VirtualNetwork::LOCK_CREATE:
                case VirtualNetwork::ERROR:
                    vn->set_state(VirtualNetwork::READY);
                    vnpool->update(vn.get());
                    break;

                case VirtualNetwork::LOCK_DELETE:
                    vn->set_state(VirtualNetwork::DONE);
                    vnpool->delete_success(move(vn));
                    break;

                case VirtualNetwork::UPDATE_FAILURE:
                    vn->set_state(VirtualNetwork::READY);

                    int vm_id;
                    while(vn->get_outdated(vm_id) == 0)
                    {
                        vn->add_updated(vm_id);
                    }

                    vnpool->update(vn.get());
                    break;

                case VirtualNetwork::DONE:
                case VirtualNetwork::READY:
                    oss << "Could not perform 'recover success' on VN " << oid
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();

                    return Request::INTERNAL;
            }
            break;

        case 2: //delete
            switch(state)
            {
                case VirtualNetwork::INIT:
                case VirtualNetwork::LOCK_CREATE:
                case VirtualNetwork::LOCK_DELETE:
                case VirtualNetwork::ERROR:
                {
                    string xml64;
                    vn->to_xml64(xml64);

                    vnpool->delete_success(move(vn));

                    ipamm->trigger_vnet_delete(oid, xml64);
                }
                break;

                case VirtualNetwork::DONE:
                case VirtualNetwork::READY:
                case VirtualNetwork::UPDATE_FAILURE:
                    oss << "Could not perform 'recover delete' on VN " << oid
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();

                    return Request::INTERNAL;
            }
            break;

        case 3: //retry
            switch(state)
            {
                case VirtualNetwork::UPDATE_FAILURE:
                {
                    vn->commit(true);

                    vn->set_state(VirtualNetwork::READY);

                    vnpool->update(vn.get());

                    auto lcm = Nebula::instance().get_lcm();

                    lcm->trigger_updatevnet(oid);
                }
                break;

                case VirtualNetwork::INIT:
                case VirtualNetwork::READY:
                case VirtualNetwork::LOCK_CREATE:
                case VirtualNetwork::LOCK_DELETE:
                case VirtualNetwork::ERROR:
                case VirtualNetwork::DONE:
                    oss << "Could not perform 'recover retry' on VN " << oid
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();

                    return Request::INTERNAL;
            }
            break;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                            bool recursive,
                            RequestAttributes& att)
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

    auto ipamm = Nebula::instance().get_ipamm();
    ipamm->trigger_vnet_delete(oid, xml64);

    return rc;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkAPI::to_xml(RequestAttributes& att,
                               PoolObjectSQL * object,
                               std::string& str)
{
    vector<int> vms;
    vector<int> vnets;
    vector<int> vrs;

    string where_vnets;
    string where_vms;
    string where_vrs;

    bool all_reservations;
    bool all_vms;
    bool all_vrs;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    object->get_permissions(perms);

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, perms);

    if (UserPool::authorize(ar) == 0)
    {
        all_reservations = true;
        all_vms = true;
        all_vrs = true;
    }
    else
    {
        all_reservations = use_filter(att, PoolObjectSQL::NET, true, true, false, "(pid != -1)", where_vnets);

        all_vms = use_filter(att, PoolObjectSQL::VM, false, false, false, "", where_vms);

        all_vrs = use_filter(att, PoolObjectSQL::VROUTER, false, false, false, "", where_vrs);
    }

    if ( all_reservations == true )
    {
        vnets.push_back(-1);
    }
    else
    {
        vnpool->search(vnets, where_vnets);
    }

    if ( all_vms == true )
    {
        vms.push_back(-1);
    }
    else
    {
        nd.get_vmpool()->search(vms, where_vms);
    }

    if ( all_vrs == true )
    {
        vrs.push_back(-1);
    }
    else
    {
        nd.get_vrouterpool()->search(vrs, where_vrs);
    }

    static_cast<VirtualNetwork*>(object)->to_xml_extended(str, vms, vnets, vrs);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAPI::authorize(int oid,
                                                const std::string& str_tmpl,
                                                VirtualNetworkTemplate& tmpl,
                                                std::unique_ptr<VirtualNetwork>& vn,
                                                RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    vn = vnpool->get(oid);

    if ( !vn )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (vn->get_state() != VirtualNetwork::READY &&
        vn->get_state() != VirtualNetwork::UPDATE_FAILURE)
    {
        att.resp_msg = "Could not execute " + request.method_name() +
                       "Virtual Network is in wrong state: "
                       + vn->state_to_str(vn->get_state());

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAllocateAPI::allocate(const std::string& str_tmpl,
                                                       int cluster_id,
                                                       int& oid,
                                                       RequestAttributes& att)
{
    if ( cluster_id == ClusterPool::NONE_CLUSTER_ID )
    {
        cluster_id = ClusterPool::DEFAULT_CLUSTER_ID;
    }

    return SharedAPI::allocate(str_tmpl, cluster_id, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode VirtualNetworkAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                            int& id,
                                                            RequestAttributes& att,
                                                            int cluster_id,
                                                            const std::string& cluster_name)
{
    unique_ptr<VirtualNetworkTemplate> vtmpl(
            static_cast<VirtualNetworkTemplate*>(tmpl.release()));

    set<int> cluster_ids;

    if (cluster_id != ClusterPool::NONE_CLUSTER_ID)
    {
        cluster_ids.insert(cluster_id);
    }

    int rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask, -1,
                              std::move(vtmpl), &id, cluster_ids, att.resp_msg);

    if (rc < 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
