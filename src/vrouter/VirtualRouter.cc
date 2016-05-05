/* ------------------------------------------------------------------------ */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems              */
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

static const History::VMAction action[11] = {
    History::MIGRATE_ACTION,
    History::LIVE_MIGRATE_ACTION,
    History::HOLD_ACTION,
    History::RELEASE_ACTION,
    History::RESUME_ACTION,
    History::REBOOT_ACTION,
    History::REBOOT_HARD_ACTION,
    History::RESCHED_ACTION,
    History::UNRESCHED_ACTION,
    History::DISK_SNAPSHOT_CREATE_ACTION,
    History::DISK_SNAPSHOT_DELETE_ACTION
};

const ActionSet<History::VMAction> VirtualRouter::SUPPORTED_ACTIONS(action, 11);

/* ************************************************************************ */
/* VirtualRouter :: Constructor/Destructor                                  */
/* ************************************************************************ */

VirtualRouter::VirtualRouter(   int             id,
                                int             _uid,
                                int             _gid,
                                const string&   _uname,
                                const string&   _gname,
                                int             _umask,
                                Template * _template_contents):
        PoolObjectSQL(id,VROUTER,"",_uid,_gid,_uname,_gname,table),
        vms("VMS")
{
    if (_template_contents != 0)
    {
        obj_template = _template_contents;
    }
    else
    {
        obj_template = new Template;
    }

    set_umask(_umask);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

VirtualRouter::~VirtualRouter()
{
    delete obj_template;
}

/* ************************************************************************ */
/* VirtualRouter :: Database Access Functions                                    */
/* ************************************************************************ */

const char * VirtualRouter::table = "vrouter_pool";

const char * VirtualRouter::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * VirtualRouter::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS vrouter_pool (oid INTEGER PRIMARY KEY, "
    "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::insert(SqlDB *db, string& error_str)
{
    int             rc;
    ostringstream   oss;

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

        shutdown_vms();

        Quotas::quota_del(Quotas::VIRTUALROUTER, uid, gid, obj_template);
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::shutdown_vms()
{
    DispatchManager * dm = Nebula::instance().get_dm();

    set<int> _vms;
    set<int>::iterator  it;

    string error;
    int rc;
    int result = 0;

    _vms = vms.get_collection();

    for (it = _vms.begin(); it != _vms.end(); it++)
    {
        rc = dm->terminate(*it, true, error);

        if (rc != 0)
        {
            result = -1;

            if (rc == -2)
            {
                dm->delete_vm(*it, error);
            }
        }
    }

    return result;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::get_network_leases(string& estr)
{
    vector<VectorAttribute  *> nics;
    VirtualNetworkPool *  vnpool;

    Nebula& nd = Nebula::instance();
    vnpool     = nd.get_vnpool();

    int num_nics = obj_template->get("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        if (vnpool->nic_attribute(PoolObjectSQL::VROUTER, nics[i], i, uid, oid,
                estr) == -1)
        {
            return -1;
        }
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

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO " << table <<" ("<< db_names <<") VALUES ("
        <<            oid        << ","
        << "'"     << sql_name   << "',"
        << "'"     << sql_xml    << "',"
        <<            uid        << ","
        <<            gid        << ","
        <<            owner_u    << ","
        <<            group_u    << ","
        <<            other_u    << ")";

    rc = db->exec(oss);

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

/* ************************************************************************ */
/* VirtualRouter :: Misc                                                         */
/* ************************************************************************ */

string& VirtualRouter::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;
    string          vm_collection_xml;
    string          perm_str;

    oss << "<VROUTER>"
            << "<ID>"       << oid        << "</ID>"
            << "<UID>"      << uid        << "</UID>"
            << "<GID>"      << gid        << "</GID>"
            << "<UNAME>"    << uname      << "</UNAME>"
            << "<GNAME>"    << gname      << "</GNAME>"
            << "<NAME>"     << name       << "</NAME>"
            << perms_to_xml(perm_str)
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
    content.clear();

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

    int num_nics = get_template_attribute("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        release_network_leases(nics[i]);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::release_network_leases(const VectorAttribute * nic)
{
    VirtualNetworkPool* vnpool = Nebula::instance().get_vnpool();
    VirtualNetwork*     vn;

    int     vnid;
    int     ar_id;
    string  mac;
    string  error_msg;

    if ( nic == 0 )
    {
        return -1;
    }

    if (nic->vector_value("NETWORK_ID", vnid) != 0)
    {
        return -1;
    }

    mac = nic->vector_value("MAC");

    vn = vnpool->get(vnid, true);

    if ( vn == 0 )
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

    vnpool->update(vn);

    vn->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void vrouter_prefix(VectorAttribute* nic, const string& attr)
{
    string val;

    if (nic->vector_value(attr.c_str(), val) == 0)
    {
        nic->remove(attr);
        nic->replace("VROUTER_"+attr, val);
    }
}

/* -------------------------------------------------------------------------- */

void prepare_nic_vm(VectorAttribute* nic)
{
    bool floating = false;
    nic->vector_value("FLOATING_IP", floating);

    if (floating)
    {
        nic->remove("MAC");

        vrouter_prefix(nic, "IP");
        vrouter_prefix(nic, "IP6_LINK");
        vrouter_prefix(nic, "IP6_ULA");
        vrouter_prefix(nic, "IP6_GLOBAL");

        // TODO: remove all other attrs, such as AR, BRIDGE, etc?
    }
}

/* -------------------------------------------------------------------------- */

Template * VirtualRouter::get_vm_template() const
{
    Template * tmpl = new Template();

    vector<const VectorAttribute  *> nics;
    VectorAttribute * nic;

    int    keepalived_id;
    string st;

    int num_nics = obj_template->get("NIC",nics);

    for(int i=0; i<num_nics; i++)
    {
        nic = nics[i]->clone();

        prepare_nic_vm(nic);

        tmpl->set(nic);
    }

    tmpl->replace("VROUTER_ID", oid);

    if (!obj_template->get("KEEPALIVED_ID", keepalived_id))
    {
        keepalived_id = (oid & 0xFF);
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

int VirtualRouter::replace_template(const string &tmpl_str,bool keep_restricted,
		string& error)
{
    Template * new_tmpl = get_new_template();
    string     new_str;

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    new_tmpl->erase("NIC");

    vector<const VectorAttribute*> nics;
	vector<const VectorAttribute*>::const_iterator it;

    get_template_attribute("NIC", nics);

    for (it = nics.begin(); it != nics.end(); it++)
    {
        new_tmpl->set((*it)->clone());
    }

    new_tmpl->to_xml(new_str);
    delete new_tmpl;

    return PoolObjectSQL::replace_template(new_str, keep_restricted, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouter::append_template(const string& tmpl_str, bool keep_restricted,
	   	string& error)
{
    Template * new_tmpl = get_new_template();
    string     new_str;

    if ( new_tmpl == 0 )
    {
        error = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    new_tmpl->erase("NIC");

    new_tmpl->to_xml(new_str);
    delete new_tmpl;

    return PoolObjectSQL::append_template(new_str, keep_restricted, error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * VirtualRouter::attach_nic(
        VirtualMachineTemplate * tmpl, string& error_str)
{
    VirtualNetworkPool *        vnpool;
    vector<VectorAttribute *>   nics;

    vector<VectorAttribute *>::const_iterator it;
    VectorAttribute *           nic;

    int rc;
    int nic_id;

    vnpool = Nebula::instance().get_vnpool();

    // -------------------------------------------------------------------------
    // Get the highest NIC_ID
    // -------------------------------------------------------------------------

    int max_nic_id = -1;

    obj_template->get("NIC", nics);

    for(it = nics.begin(); it != nics.end(); it++)
    {
        (*it)->vector_value("NIC_ID", nic_id);

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

    if ( tmpl->get("NIC", nics) != 1 )
    {
        error_str = "The template must contain one NIC attribute";
        return 0;
    }

    nic = nics[0];

    rc = vnpool->nic_attribute(PoolObjectSQL::VROUTER,
                        nic, nic_id, uid, oid, error_str);

    if (rc == -1)
    {
        return 0;
    }

    obj_template->set(nic->clone());

    nic = nic->clone();

    prepare_nic_vm(nic);

    return nic;
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

    obj_template->remove(nic);

    release_network_leases(nic);

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
    vector<VectorAttribute *>::iterator nic_it;

    obj_template->get("NIC", nics);

    for(nic_it = nics.begin(); nic_it != nics.end(); nic_it++)
    {
        (*nic_it)->vector_value("NIC_ID", tnic_id);

        if ( tnic_id == nic_id )
        {
            return (*nic_it);
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouter::set_auth_request(int uid,
                                     AuthRequest& ar,
                                     Template *tmpl)
{
    vector<VectorAttribute* > nics;
    vector<VectorAttribute* >::const_iterator nics_it;

    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();

    tmpl->get("NIC", nics);

    for (nics_it = nics.begin(); nics_it != nics.end(); nics_it++)
    {
        vnpool->authorize_nic(PoolObjectSQL::VROUTER, *nics_it, uid, &ar);
    }
}

