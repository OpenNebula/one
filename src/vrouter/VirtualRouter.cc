/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#include "VirtualRouter.h"
#include "VirtualNetworkPool.h"
#include "Nebula.h"
#include "VirtualMachine.h"
#include "Request.h"
#include "VirtualMachineTemplate.h"
#include "DispatchManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */

static void vrouter_prefix(VectorAttribute* nic, const string& attr)
{
    string val;

    if (nic->vector_value(attr, val) == 0)
    {
        nic->remove(attr);
        nic->replace("VROUTER_"+attr, val);
    }
}

/* -------------------------------------------------------------------------- */

static void prepare_nic_vm(VectorAttribute * nic)
{
    bool floating = false;
    nic->vector_value("FLOATING_IP", floating);

    if (floating)
    {
        vrouter_prefix(nic, "MAC");
        vrouter_prefix(nic, "IP");
        vrouter_prefix(nic, "IP6_LINK");
        vrouter_prefix(nic, "IP6_ULA");
        vrouter_prefix(nic, "IP6_GLOBAL");
        vrouter_prefix(nic, "VLAN_ID");

        std::set<std::string> restricted;

        VirtualMachineTemplate::restricted_nic(restricted);

        for (const auto& restr : restricted)
        {
            nic->remove(restr);
        }
    }
}

/* -------------------------------------------------------------------------- */

/* ************************************************************************ */
/* VirtualRouter :: Constructor/Destructor                                  */
/* ************************************************************************ */

VirtualRouter::VirtualRouter(   int             id,
                                int             _uid,
                                int             _gid,
                                const string&   _uname,
                                const string&   _gname,
                                int             _umask,
                                unique_ptr<Template> _template_contents):
    PoolObjectSQL(id, VROUTER, "", _uid, _gid, _uname, _gname, one_db::vr_table),
    vms("VMS")
{
    if (_template_contents)
    {
        obj_template = move(_template_contents);
    }
    else
    {
        obj_template = make_unique<Template>();
    }

    set_umask(_umask);
}

/* ************************************************************************ */
/* VirtualRouter :: Database Access Functions                               */
/* ************************************************************************ */

int VirtualRouter::insert(SqlDB *db, string& error_str)
{
    int             rc;

    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    // ------------------------------------------------------------------------
    // Get network leases
    // ------------------------------------------------------------------------

    rc = get_network_leases(error_str);

    if ( rc != 0 )
    {
        goto error_leases_rollback;
    }

    // ------------------------------------------------------------------------
    // Insert the VirtualRouter
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_leases_rollback:
    release_network_leases();
    goto error_common;

error_name:
error_common:
    //NebulaLog::log("ONE",Log::ERROR, error_str);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::drop(SqlDB * db)
{
    int rc;

    rc = PoolObjectSQL::drop(db);

    if ( rc == 0 )
    {
        release_network_leases();

        Quotas::quota_del(Quotas::VIRTUALROUTER, uid, gid, obj_template.get());
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::shutdown_vms(const set<int>& _vms, const RequestAttributes& ra)
{
    DispatchManager * dm = Nebula::instance().get_dm();

    string error;

    int rc;
    int result = 0;

    for (auto vm_id : _vms)
    {
        rc = dm->terminate(vm_id, true, ra, error);

        if (rc != 0)
        {
            result = -1;

            if (rc == -2)
            {
                dm->delete_vm(vm_id, ra, error);
            }
        }
    }

    return result;
}

int VirtualRouter::get_network_leases(string& estr) const
{
    vector<VectorAttribute  *> nics;
    VirtualNetworkPool *  vnpool;

    Nebula& nd = Nebula::instance();
    vnpool     = nd.get_vnpool();

    int num_nics = obj_template->get("NIC", nics);

    for (int i=0; i<num_nics; i++)
    {
        VirtualMachineNic nic(nics[i], i);

        std::string net_mode = nic.vector_value("NETWORK_MODE");
        one_util::toupper(net_mode);

        if (net_mode == "AUTO")
        {
            estr = "Virtual Router is incompatible with auto mode";
            return -1;
        }

        if (vnpool->nic_attribute(PoolObjectSQL::VROUTER, &nic, i, uid, oid,
                                  estr) == -1)
        {
            return -1;
        }

        prepare_nic_vm(nics[i]);

    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the Object

    sql_name = db->escape_str(name);

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body));

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if (replace)
    {
        oss << "UPDATE " << one_db::vr_table << " SET "
            << "name = '"    << sql_name   << "', "
            << "body = '"    << sql_xml    << "', "
            << "uid = "      << uid        << ", "
            << "gid = "      << gid        << ", "
            << "owner_u = "  << owner_u    << ", "
            << "group_u = "  << group_u    << ", "
            << "other_u = "  << other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::vr_table
            << " (" << one_db::vr_db_names << ") VALUES ("
            <<            oid        << ","
            << "'"     << sql_name   << "',"
            << "'"     << sql_xml    << "',"
            <<            uid        << ","
            <<            gid        << ","
            <<            owner_u    << ","
            <<            group_u    << ","
            <<            other_u    << ")";
    }

    rc = db->exec_wr(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the VirtualRouter to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting VirtualRouter in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::vr_db_bootstrap);

    return db->exec_local_wr(oss);
};

/* ************************************************************************ */
/* VirtualRouter :: Misc                                                         */
/* ************************************************************************ */

string& VirtualRouter::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;
    string          vm_collection_xml;
    string          perm_str;
    string          lock_str;

    oss << "<VROUTER>"
        << "<ID>"       << oid        << "</ID>"
        << "<UID>"      << uid        << "</UID>"
        << "<GID>"      << gid        << "</GID>"
        << "<UNAME>"    << uname      << "</UNAME>"
        << "<GNAME>"    << gname      << "</GNAME>"
        << "<NAME>"     << name       << "</NAME>"
        << perms_to_xml(perm_str)
        << lock_db_to_xml(lock_str)
        << vms.to_xml(vm_collection_xml)
        << obj_template->to_xml(template_xml)
        << "</VROUTER>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/VROUTER/ID",      -1);
    rc += xpath(uid,        "/VROUTER/UID",     -1);
    rc += xpath(gid,        "/VROUTER/GID",     -1);
    rc += xpath(uname,      "/VROUTER/UNAME",   "not_found");
    rc += xpath(gname,      "/VROUTER/GNAME",   "not_found");
    rc += xpath(name,       "/VROUTER/NAME",    "not_found");

    // Permissions
    rc += perms_from_xml();

    // Lock
    rc += lock_db_from_xml();

    // Get associated classes
    rc += vms.from_xml(this, "/VROUTER/");

    ObjectXML::get_nodes("/VROUTER/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouter::release_network_leases()
{
    vector<VectorAttribute const *> nics;

    int num_nics = get_template_attribute("NIC", nics);

    for (int i=0; i<num_nics; i++)
    {
        release_network_leases(nics[i]);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::release_network_leases(const VectorAttribute * nic)
{
    VirtualNetworkPool* vnpool = Nebula::instance().get_vnpool();

    int     vnid;
    int     ar_id;

    if (nic == nullptr)
    {
        return -1;
    }

    if (nic->vector_value("NETWORK_ID", vnid) != 0)
    {
        return -1;
    }

    const string& mac = nic->vector_value("VROUTER_MAC");

    auto vn = vnpool->get(vnid);

    if (vn == nullptr)
    {
        return -1;
    }

    if (nic->vector_value("AR_ID", ar_id) == 0)
    {
        vn->free_addr(ar_id, PoolObjectSQL::VROUTER, oid, mac);
    }
    else
    {
        vn->free_addr(PoolObjectSQL::VROUTER, oid, mac);
    }

    vnpool->update(vn.get());

    return 0;
}

/* -------------------------------------------------------------------------- */

Template * VirtualRouter::get_vm_template() const
{
    Template * tmpl = new Template();

    vector<const VectorAttribute  *> nics;
    VectorAttribute * nic;

    int    keepalived_id;
    string st;

    int num_nics = obj_template->get("NIC", nics);

    for (int i=0; i<num_nics; i++)
    {
        nic = nics[i]->clone();

        prepare_nic_vm(nic);

        tmpl->set(nic);
    }

    tmpl->replace("VROUTER_ID", oid);

    if (!obj_template->get("KEEPALIVED_ID", keepalived_id))
    {
        // Keep Alive should be arbitrary unique number from 1 to 255
        keepalived_id = (oid % 255) + 1;
    }

    tmpl->replace("VROUTER_KEEPALIVED_ID", keepalived_id);

    obj_template->get("KEEPALIVED_PASSWORD", st);

    if (!st.empty())
    {
        tmpl->replace("VROUTER_KEEPALIVED_PASSWORD", st);
    }

    return tmpl;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::replace_template(const string &tmpl_str, bool keep_restricted,
                                    string& error)
{
    auto       new_tmpl = get_new_template();
    string     new_str;

    if ( !new_tmpl )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        return -1;
    }

    new_tmpl->erase("NIC");

    vector<const VectorAttribute*> nics;

    get_template_attribute("NIC", nics);

    for (auto nic : nics)
    {
        new_tmpl->set(nic->clone());
    }

    new_tmpl->to_xml(new_str);

    return PoolObjectSQL::replace_template(new_str, keep_restricted, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::append_template(const string& tmpl_str, bool keep_restricted,
                                   string& error)
{
    auto       new_tmpl = get_new_template();
    string     new_str;

    if ( !new_tmpl )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        return -1;
    }

    new_tmpl->erase("NIC");

    new_tmpl->to_xml(new_str);

    return PoolObjectSQL::append_template(new_str, keep_restricted, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * VirtualRouter::attach_nic(
        VirtualMachineTemplate * tmpl, string& error_str)
{
    VirtualNetworkPool *        vnpool;
    vector<VectorAttribute *>   nics;

    int rc;
    int nic_id;

    vnpool = Nebula::instance().get_vnpool();

    // -------------------------------------------------------------------------
    // Get the highest NIC_ID
    // -------------------------------------------------------------------------

    int max_nic_id = -1;

    obj_template->get("NIC", nics);

    for (auto nic : nics)
    {
        nic->vector_value("NIC_ID", nic_id);

        if ( nic_id > max_nic_id )
        {
            max_nic_id = nic_id;
        }
    }

    nic_id = max_nic_id+1;

    // -------------------------------------------------------------------------
    // Get the new NIC attribute from the template
    // -------------------------------------------------------------------------

    nics.clear();

    if ( tmpl->get("NIC_ALIAS") != 0 )
    {
        error_str = "Alias can't be attached to virtual router.";
        return 0;
    }

    if ( tmpl->get("NIC", nics) != 1 )
    {
        error_str = "The template must contain one NIC attribute";
        return 0;
    }

    VirtualMachineNic nic(nics[0], nic_id);

    rc = vnpool->nic_attribute(PoolObjectSQL::VROUTER, &nic, nic_id, uid, oid,
                               error_str);

    if (rc == -1)
    {
        return 0;
    }

    VectorAttribute * new_nic = nic.vector_attribute()->clone();

    prepare_nic_vm(new_nic);

    obj_template->set(new_nic);

    return new_nic;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::detach_nic(int nic_id)
{
    Template tmpl;

    VectorAttribute * nic = get_nic(nic_id);

    if (nic == 0)
    {
        return -1;
    }

    release_network_leases(nic);

    obj_template->remove(nic);

    // Update quotas
    tmpl.set(nic);

    Quotas::quota_del(Quotas::VIRTUALROUTER, uid, gid, &tmpl);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute* VirtualRouter::get_nic(int nic_id) const
{
    int tnic_id;

    vector<VectorAttribute  *> nics;

    obj_template->get("NIC", nics);

    for (auto nic : nics)
    {
        nic->vector_value("NIC_ID", tnic_id);

        if ( tnic_id == nic_id )
        {
            return nic;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouter::set_auth_request(int uid, AuthRequest& ar, Template *tmpl,
                                     bool check_lock)
{
    VirtualMachineNics tnics(tmpl);

    for (auto nic : tnics)
    {
        nic->authorize_vrouter(uid, &ar, check_lock);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouter::set_template_id(int tmpl_id)
{
    replace_template_attribute("TEMPLATE_ID", tmpl_id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::get_template_id() const
{
    int tmpl_id;

    if (get_template_attribute("TEMPLATE_ID", tmpl_id))
    {
        return tmpl_id;
    }
    else
    {
        return -1;
    }
}
