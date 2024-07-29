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

#include "RequestManagerVirtualNetwork.h"
#include "VirtualNetworkTemplate.h"
#include "ClusterPool.h"
#include "IPAMManager.h"
#include "LifeCycleManager.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerVirtualNetwork::
request_execute(xmlrpc_c::paramList const& paramList,
                RequestAttributes& att)
{
    int    id       = xmlrpc_c::value_int    (paramList.getInt(1));
    string str_tmpl = xmlrpc_c::value_string (paramList.getString(2));

    VirtualNetworkTemplate tmpl;

    int rc;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    auto vn = pool->get<VirtualNetwork>(id);

    if ( vn == nullptr )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (vn->get_state() != VirtualNetwork::READY &&
        vn->get_state() != VirtualNetwork::UPDATE_FAILURE)
    {
        att.resp_msg = "Could not execute " + method_name +
                       "Virtual Network is in wrong state: "
                       + vn->state_to_str(vn->get_state());
        failure_response(ACTION, att);
        return;
    }

    rc = leases_action(vn.get(), &tmpl, att, att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, att);

        return;
    }

    pool->update(vn.get());

    success_response(id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkRmAddressRange::
request_execute(xmlrpc_c::paramList const& paramList,
                RequestAttributes& att)
{
    int    id = xmlrpc_c::value_int(paramList.getInt(1));
    int ar_id = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation VNET:MANAGE
    // -------------------------------------------------------------------------
    if (basic_authorization(id, att) == false)
    {
        return;
    }

    bool force = false;
    if (paramList.size() > 3)
    {
        force = xmlrpc_c::value_boolean(paramList.getBoolean(3));
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
    if ( auto vn = pool->get<VirtualNetwork>(id) )
    {
        if (vn->get_state() != VirtualNetwork::READY &&
            vn->get_state() != VirtualNetwork::UPDATE_FAILURE)
        {
            att.resp_msg = "Could not remove Adress Range, "
                           "Virtual Network is in wrong state: "
                           + vn->state_to_str(vn->get_state());
            failure_response(ACTION, att);
            return;
        }

        parent    = vn->get_parent();
        parent_ar = vn->get_ar_parent(ar_id);

        uid = vn->get_uid();
        gid = vn->get_gid();

        rc  = vn->get_template_attribute("SIZE", rsize, ar_id);

        vn->get_template_attribute("MAC", mac, ar_id);

        if (vn->rm_ar(ar_id, force, att.resp_msg) < 0)
        {
            failure_response(INTERNAL, att);

            return;
        }

        pool->update(vn.get());
    }
    else
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Free addresses in parent VNET for reservations
    // -------------------------------------------------------------------------

    if (parent != -1 && parent_ar != -1 && !mac.empty() && rc == 0)
    {
        if ( auto vn = pool->get<VirtualNetwork>(parent) )
        {
            int freed = vn->free_addr_by_range((unsigned int) parent_ar,
                                               PoolObjectSQL::NET, id, mac, rsize);

            pool->update(vn.get());

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

    success_response(id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkReserve::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int    id       = xmlrpc_c::value_int    (paramList.getInt(1));
    string str_tmpl = xmlrpc_c::value_string (paramList.getString(2));

    VirtualNetworkPool *   vnpool = static_cast<VirtualNetworkPool *>(pool);
    VirtualNetworkTemplate tmpl;

    int rc;
    set<int> cluster_ids;

    unique_ptr<VirtualNetworkTemplate> vtmpl;

    PoolObjectAuth reserv_perms;

    // -------------------------------------------------------------------------
    // Process the Reservation Template
    // -------------------------------------------------------------------------
    rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    /* ------------------- Reservation SIZE ---------------- */

    int size;

    if ( !tmpl.get("SIZE", size) || size <= 0 )
    {
        att.resp_msg = "Reservation SIZE must be a greater than 0";
        failure_response(ACTION,  att);
        return;
    }

    /* ------------------- Target reservation NETWORK_ID ---------------- */

    int  rid;
    bool on_exisiting = tmpl.get("NETWORK_ID", rid);

    if ( on_exisiting)
    {
        /* ------------------- Check reservation consistency ---------------- */

        if (rid < 0)
        {
            att.resp_msg = "NETWORK_ID must be equal or greater than 0";
            failure_response(ACTION, att);
            return;
        }

        if (rid == id)
        {
            att.resp_msg = "Cannot add a reservation from the same network";
            failure_response(ACTION, att);
            return;
        }

        auto rvn = vnpool->get_ro(rid);

        if (rvn == nullptr)
        {
            att.resp_id = rid;
            failure_response(NO_EXISTS, att);
            return;
        }

        int parent = rvn->get_parent();

        if (parent == -1)
        {
            att.resp_msg = "Cannot add reservations to a non-reservation VNET";
            failure_response(ACTION, att);

            return;
        }

        if (parent != id)
        {
            ostringstream oss;

            oss << "New reservations for virtual network " << rid
                << " have to be from network " << parent;

            att.resp_msg = oss.str();
            failure_response(ACTION, att);

            return;
        }

        rvn->get_permissions(reserv_perms);
    }

    /* ------------------- Reservation NAME ---------------- */

    string name;

    tmpl.get("NAME", name);

    if (name.empty() && !on_exisiting)
    {
        att.resp_msg = "NAME for reservation has to be set";
        failure_response(ACTION, att);
        return;
    }

    /* ------------------- Starting AR_ID, IP & MAC ---------------- */

    int  ar_id;
    bool with_ar_id = tmpl.get("AR_ID", ar_id);

    if ( with_ar_id && (ar_id < 0))
    {
        att.resp_msg = "AR_ID must be equal or greater than 0";
        failure_response(ACTION, att);
        return;
    }

    string ip, mac, ip6;

    tmpl.get("IP", ip);

    tmpl.get("IP6", ip6);

    tmpl.get("MAC", mac);

    if (!with_ar_id && (!ip.empty() || !mac.empty() || !ip6.empty()))
    {
        att.resp_msg = "AR_ID must be specified for IP/MAC based reservations";
        failure_response(ACTION, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation Parent:USE Reservation:MANAGE
    // -------------------------------------------------------------------------
    PoolObjectAuth parent_perms;
    AuthRequest    ar(att.uid, att.group_ids);

    if ( auto vn = vnpool->get_ro(id) )
    {
        if (vn->get_parent() != -1)
        {
            att.resp_msg = "Cannot reserve addresses from a reserved VNET";
            failure_response(ACTION, att);

            return;
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
        att.resp_msg = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // -------------------------------------------------------------------------
    // Create a new VNET to place the reservation (if needed)
    // -------------------------------------------------------------------------
    if (!on_exisiting)
    {
        vtmpl->replace("NAME", name);

        rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              id, move(vtmpl), &rid, cluster_ids, att.resp_msg);

        if (rc < 0)
        {
            failure_response(INTERNAL, att);
            return;
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
        failure_response(NO_EXISTS, att);

        return;
    }

    // -------------------------------------------------------------------------
    // Check & update quotas on the target VNET & *reservation owner*
    // -------------------------------------------------------------------------
    ostringstream qtmpl_s;
    Template      qtmpl;

    RequestAttributes reservation_att(ruid, rgid, att);

    for (int i=0; i< size ; i++)
    {
        qtmpl_s << "NIC = [ NETWORK_ID = " << id << "]" << endl;
    }

    qtmpl.parse_str_or_xml(qtmpl_s.str(), att.resp_msg);

    if (quota_authorization(&qtmpl, Quotas::NETWORK, reservation_att) == false)
    {
        if (!on_exisiting)
        {
            if (auto rvn = vnpool->get(rid))
            {
                vnpool->drop(rvn.get(), att.resp_msg);
            }
        }
        return;
    }

    // -------------------------------------------------------------------------
    // Make address reservation and set it
    // -------------------------------------------------------------------------
    if (with_ar_id)
    {
        if (!ip.empty())
        {
            rc = vnpool->reserve_addr_by_ip(id, rid, size, ar_id, ip,
                                            att.resp_msg);
        }
        else if (!ip6.empty())
        {
            rc = vnpool->reserve_addr_by_ip6(id, rid, size, ar_id, ip6,
                                             att.resp_msg);
        }
        else if (!mac.empty())
        {
            rc = vnpool->reserve_addr_by_mac(id, rid, size, ar_id, mac,
                                             att.resp_msg);
        }
        else
        {
            rc = vnpool->reserve_addr(id, rid, size, ar_id, att.resp_msg);
        }
    }
    else
    {
        rc = vnpool->reserve_addr(id, rid, size, att.resp_msg);
    }

    if (rc != 0 )
    {
        quota_rollback(&qtmpl, Quotas::NETWORK, reservation_att);

        failure_response(ACTION, att);

        if (!on_exisiting)
        {
            if (auto rvn = vnpool->get(rid))
            {
                vnpool->drop(rvn.get(), att.resp_msg);
            }
        }

        return;
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

    success_response(rid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkRecover::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int id = xmlrpc_c::value_int(paramList.getInt(1));
    int op = xmlrpc_c::value_int(paramList.getInt(2));

    Nebula& nd = Nebula::instance();
    auto ipamm = nd.get_ipamm();
    auto vnpool = static_cast<VirtualNetworkPool*>(pool);

    ostringstream oss;

    if (op < 0 || op > 3)
    {
        att.resp_msg = "Wrong recovery operation code";
        failure_response(ACTION, att);
        return;
    }

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    auto vn = pool->get<VirtualNetwork>(id);

    if ( vn == nullptr )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    auto state = vn->get_state();

    switch (op)
    {
        case 0: //recover-failure
            switch(state)
            {
                case VirtualNetwork::INIT:
                case VirtualNetwork::LOCK_CREATE:
                case VirtualNetwork::LOCK_DELETE:
                    vn->set_state(VirtualNetwork::ERROR);
                    vn->set_template_error_message("Failure forced by user");
                    pool->update(vn.get());
                    break;

                case VirtualNetwork::DONE:
                case VirtualNetwork::READY:
                case VirtualNetwork::ERROR:
                case VirtualNetwork::UPDATE_FAILURE:
                    oss << "Could not perform 'recover failure' on VN " << id
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();
                    failure_response(INTERNAL, att);
                    return;
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
                    pool->update(vn.get());
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

                    pool->update(vn.get());
                    break;

                case VirtualNetwork::DONE:
                case VirtualNetwork::READY:
                    oss << "Could not perform 'recover success' on VN " << id
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();
                    failure_response(INTERNAL, att);
                    return;
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

                    ipamm->trigger_vnet_delete(id, xml64);
                }
                break;

                case VirtualNetwork::DONE:
                case VirtualNetwork::READY:
                case VirtualNetwork::UPDATE_FAILURE:
                    oss << "Could not perform 'recover delete' on VN " << id
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();
                    failure_response(INTERNAL, att);
                    return;
            }
            break;

        case 3: //retry
            switch(state)
            {
                case VirtualNetwork::UPDATE_FAILURE:
                {
                    vn->commit(true);

                    vn->set_state(VirtualNetwork::READY);

                    pool->update(vn.get());

                    auto lcm = Nebula::instance().get_lcm();

                    lcm->trigger_updatevnet(id);
                }
                break;

                case VirtualNetwork::INIT:
                case VirtualNetwork::READY:
                case VirtualNetwork::LOCK_CREATE:
                case VirtualNetwork::LOCK_DELETE:
                case VirtualNetwork::ERROR:
                case VirtualNetwork::DONE:
                    oss << "Could not perform 'recover retry' on VN " << id
                        << ", wrong state " << vn->state_to_str(state) << ".";

                    att.resp_msg = oss.str();
                    failure_response(INTERNAL, att);
                    return;
            }
            break;
    }

    success_response(id, att);

    return;
}
