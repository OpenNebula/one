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

#include "RequestManagerVirtualNetwork.h"
#include "VirtualNetworkTemplate.h"

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
    VirtualNetwork *       vn;

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

    vn = static_cast<VirtualNetwork *>(pool->get(id,true));

    if ( vn == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = leases_action(vn, &tmpl, att, att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, att);

        vn->unlock();
        return;
    }

    pool->update(vn);

    vn->unlock();

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

    VirtualNetwork * vn;

    // -------------------------------------------------------------------------
    // Authorize the operation VNET:MANAGE
    // -------------------------------------------------------------------------
    if (basic_authorization(id, att) == false)
    {
        return;
    }

    // -------------------------------------------------------------------------
    // Get VNET and data for reservations
    // -------------------------------------------------------------------------
    vn = static_cast<VirtualNetwork *>(pool->get(id,true));

    if ( vn == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    string mac;
    int    rsize;

    int parent    = vn->get_parent();
    int parent_ar = vn->get_ar_parent(ar_id);

    int uid = vn->get_uid();
    int gid = vn->get_gid();

    int rc  = vn->get_template_attribute("SIZE", rsize, ar_id);

    vn->get_template_attribute("MAC" , mac  , ar_id);

    if ( vn->rm_ar(ar_id, att.resp_msg) < 0 )
    {
        failure_response(INTERNAL, att);

        vn->unlock();

        return;
    }

    pool->update(vn);

    vn->unlock();

    // -------------------------------------------------------------------------
    // Free addresses in parent VNET for reservations
    // -------------------------------------------------------------------------

    if (parent != -1 && parent_ar != -1 && !mac.empty() && rc == 0)
    {
        vn = static_cast<VirtualNetwork *>(pool->get(parent, true));

        if ( vn != 0 )
        {
            int freed = vn->free_addr_by_range((unsigned int) parent_ar,
                PoolObjectSQL::NET, id, mac, rsize);

            pool->update(vn);

            vn->unlock();

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

    VirtualNetwork * vn  = 0;
    VirtualNetwork * rvn = 0;

    int rc;
    int cluster_id;

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

        rvn = vnpool->get(rid,true);

        if (rvn == 0)
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

            rvn->unlock();

            return;
        }

        if (parent != id)
        {
            ostringstream oss;

            oss << "New reservations for virtual network " << rid
                << " have to be from network " << parent;

            att.resp_msg = oss.str();
            failure_response(ACTION, att);

            rvn->unlock();

            return;
        }

        rvn->get_permissions(reserv_perms);

        rvn->unlock();
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

    string ip, mac;

    tmpl.get("IP", ip);

    tmpl.get("MAC", mac);

    if (!with_ar_id && (!ip.empty()||!mac.empty()))
    {
        att.resp_msg = "AR_ID must be specified for IP/MAC based reservations";
        failure_response(ACTION, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation Parent:USE Reservation:MANAGE
    // -------------------------------------------------------------------------
    vn = vnpool->get(id,true);

    if ( vn == 0 )
    {
        att.resp_msg = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (vn->get_parent() != -1)
    {
        att.resp_msg = "Cannot reserve addresses from a reserved VNET";
        failure_response(ACTION, att);

        vn->unlock();

        return;
    }

    PoolObjectAuth parent_perms;
    AuthRequest    ar(att.uid, att.group_ids);

    vn->get_permissions(parent_perms);

    ar.add_auth(AuthRequest::USE, parent_perms);

    if (on_exisiting)
    {
        ar.add_auth(AuthRequest::MANAGE, reserv_perms);
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        vn->unlock();

        return;
    }

    // -------------------------------------------------------------------------
    // Create a new VNET to place the reservation (if needed)
    // -------------------------------------------------------------------------
    if (!on_exisiting)
    {
        VirtualNetworkTemplate * vtmpl = vn->clone_template();

        vtmpl->replace("NAME", name);

        cluster_id = vn->get_cluster_id();

        rc = vnpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                id, vtmpl, &rid, cluster_id, vn->get_cluster_name(), att.resp_msg);

        if (rc < 0)
        {
            failure_response(INTERNAL, att);

            vn->unlock();

            return;
        }
    }

    rvn = vnpool->get(rid, true);

    if (rvn == 0)
    {
        att.resp_id = rid;
        failure_response(NO_EXISTS, att);
        vn->unlock();

        return;
    }

    // -------------------------------------------------------------------------
    // Check & update quotas on the target VNET & *reservation owner*
    // -------------------------------------------------------------------------
    ostringstream qtmpl_s;
    Template      qtmpl;

    RequestAttributes reservation_att(rvn->get_uid(), rvn->get_gid(), att);

    for (int i=0; i< size ; i++)
    {
        qtmpl_s << "NIC = [ NETWORK_ID = " << id << "]" << endl;
    }

    qtmpl.parse_str_or_xml(qtmpl_s.str(), att.resp_msg);

    if (quota_authorization(&qtmpl, Quotas::NETWORK, reservation_att) == false)
    {
        rvn->unlock();

        vn->unlock();

        return;
    }

    // -------------------------------------------------------------------------
    // Make address reservation and set it
    // -------------------------------------------------------------------------
    if (with_ar_id)
    {
        if (!ip.empty())
        {
            rc = vn->reserve_addr_by_ip(rvn, size, ar_id, ip, att.resp_msg);
        }
        else if (!mac.empty())
        {
            rc = vn->reserve_addr_by_mac(rvn, size, ar_id, mac, att.resp_msg);
        }
        else
        {
            rc = vn->reserve_addr(rvn, size, ar_id, att.resp_msg);
        }
    }
    else
    {
        rc = vn->reserve_addr(rvn, size, att.resp_msg);
    }

    if (rc != 0 )
    {
        quota_rollback(&qtmpl, Quotas::NETWORK, reservation_att);

        failure_response(ACTION, att);

        if (!on_exisiting)
        {
            pool->drop(rvn, att.resp_msg);
        }

        rvn->unlock();

        vn->unlock();

        return;
    }

    pool->update(rvn);

    pool->update(vn);

    rvn->unlock();

    vn->unlock();

    // -------------------------------------------------------------------------
    // Add the reservation to the same cluster as the parent VNET
    // -------------------------------------------------------------------------
    if ((cluster_id != ClusterPool::NONE_CLUSTER_ID) && (!on_exisiting))
    {
        Nebula& nd  = Nebula::instance();

        ClusterPool * clpool = nd.get_clpool();
        Cluster * cluster    = clpool->get(cluster_id, true);

        if ( cluster != 0 )
        {
            cluster->add_vnet(rid, att.resp_msg);

            clpool->update(cluster);

            cluster->unlock();
        }
    }

    success_response(rid, att);
}
