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

#include "RequestManagerVirtualNetwork.h"
#include "VirtualNetworkTemplate.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string RequestManagerVirtualNetwork::leases_error (const string& error)
{
    return request_error("Error modifying network leases", error);
}

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

    string error_str;
    int    rc;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = tmpl.parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, leases_error(error_str), att);
        return;
    }

    vn = static_cast<VirtualNetwork *>(pool->get(id,true));

    if ( vn == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(auth_object),id),att);
        return;
    }

    rc = leases_action(vn, &tmpl, att, error_str);

    if ( rc < 0 )
    {
        failure_response(INTERNAL,
                request_error("Error modifying network leases",error_str),
                att);

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

    string error_str;

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
        failure_response(NO_EXISTS, get_error(object_name(auth_object),id),att);
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

    if ( vn->rm_ar(ar_id, error_str) < 0 )
    {
        failure_response(INTERNAL,
                request_error("Error removing address range",error_str),
                att);

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

                tmpl.parse_str_or_xml(oss.str(), error_str);

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

    string error_str;
    int    rc;
    int    cluster_id;

    PoolObjectAuth reserv_perms;

    // -------------------------------------------------------------------------
    // Process the Reservation Template
    // -------------------------------------------------------------------------
    rc = tmpl.parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
            request_error("Error in reservation request", error_str), att);
        return;
    }

    /* ------------------- Reservation SIZE ---------------- */

    int size;

    if ( !tmpl.get("SIZE", size) || size <= 0 )
    {
        failure_response(ACTION, request_error("Error in reservation request",
                "Reservation SIZE must be a greater than 0"), att);
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
            failure_response(ACTION, request_error("Error in reservation request",
                "NETWORK_ID must be equal or greater than 0"), att);
            return;
        }

        if (rid == id)
        {
            failure_response(ACTION, request_error("Error in reservation request",
                "Cannot add a reservation from the same network"), att);
            return;
        }

        rvn = vnpool->get(rid,true);

        if (rvn == 0)
        {
            failure_response(NO_EXISTS, get_error(object_name(auth_object),rid),
                att);

            return;
        }

        int parent = rvn->get_parent();

        if (parent == -1)
        {
            failure_response(ACTION, request_error("Error in reservation request",
                "Cannot add reservations to a non-reservation VNET"), att);

            rvn->unlock();

            return;
        }

        if (parent != id)
        {
            ostringstream oss;

            oss << "New reservations for virtual network " << rid
                << " have to be from network " << parent;

            failure_response(ACTION, request_error("Error in reservation request",
                oss.str()), att);

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
        failure_response(ACTION, request_error("Error in reservation request",
            "NAME for reservation has to be set"), att);
        return;
    }

    /* ------------------- Starting AR_ID, IP & MAC ---------------- */

    int  ar_id;
    bool with_ar_id = tmpl.get("AR_ID", ar_id);

    if ( with_ar_id && (ar_id < 0))
    {
        failure_response(ACTION, request_error("Error in reservation request",
            "AR_ID must be equal or greater than 0"), att);
        return;
    }

    string ip, mac;

    tmpl.get("IP", ip);

    tmpl.get("MAC", mac);

    if (!with_ar_id && (!ip.empty()||!mac.empty()))
    {
        failure_response(ACTION, request_error("Error in reservation request",
            "AR_ID must be specified for IP/MAC based reservations"), att);
        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation Parent:USE Reservation:MANAGE
    // -------------------------------------------------------------------------
    vn = vnpool->get(id,true);

    if ( vn == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(auth_object),id),att);
        return;
    }

    if (vn->get_parent() != -1)
    {
        failure_response(ACTION, request_error("Error in reservation request",
            "Cannot reserve addresses from a reserved VNET"), att);

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
        failure_response(AUTHORIZATION, authorization_error(ar.message, att),
            att);

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
                id, vtmpl, &rid, cluster_id, vn->get_cluster_name(), error_str);

        if (rc < 0)
        {
            failure_response(INTERNAL,
                request_error("Cannot create a reservation VNET",error_str),att);

            vn->unlock();

            return;
        }
    }

    rvn = vnpool->get(rid, true);

    if (rvn == 0)
    {
        failure_response(NO_EXISTS, get_error(object_name(auth_object),rid),
            att);

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

    qtmpl.parse_str_or_xml(qtmpl_s.str(), error_str);

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
            rc = vn->reserve_addr_by_ip(rvn, size, ar_id, ip, error_str);
        }
        else if (!mac.empty())
        {
            rc = vn->reserve_addr_by_mac(rvn, size, ar_id, mac, error_str);
        }
        else
        {
            rc = vn->reserve_addr(rvn, size, ar_id, error_str);
        }
    }
    else
    {
        rc = vn->reserve_addr(rvn, size, error_str);
    }

    if (rc != 0 )
    {
        quota_rollback(&qtmpl, Quotas::NETWORK, reservation_att);

        failure_response(ACTION, request_error(error_str,""), att);

        if (!on_exisiting)
        {
            pool->drop(rvn, error_str);
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
            cluster->add_vnet(rid, error_str);

            clpool->update(cluster);

            cluster->unlock();
        }
    }

    success_response(rid, att);
}
