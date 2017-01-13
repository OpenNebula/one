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
/* -------------------------------------------------------------------------*/

#include "VMGroup.h"
#include "VMGroupRole.h"
#include "VMGroupRule.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  VMGroupRule                                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VMGroupRule::compatible(VMGroupRule::rule_set& affined,
        VMGroupRule::rule_set& anti, VMGroupRule& err)
{
    VMGroupRule ta, taa;

    rule_set::iterator it;

    for (it=affined.begin() ; it != affined.end(); ++it)
    {
        ta |= *it;
    }

    for (it=anti.begin() ; it != anti.end(); ++it)
    {
        taa |= *it;
    }

    err = ta & taa;

    return err.none();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  VMGroupRole                                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VMGroupRole::VMGroupRole(VectorAttribute *_va):va(_va)
{
    string vms_str = va->vector_value("VMS");

    if ( !vms_str.empty() )
    {
        one_util::split_unique(vms_str, ',', vms);
    }
}

/* -------------------------------------------------------------------------- */

void VMGroupRole::add_vm(int vm_id)
{
    std::pair<std::set<int>::iterator, bool> rc;

    rc = vms.insert(vm_id);

    if ( rc.second == false )
    {
        return;
    }

    set_vms();
}

void VMGroupRole::del_vm(int vm_id)
{
    size_t rc = vms.erase(vm_id);

    if ( rc == 0 )
    {
        return;
    }

    set_vms();
}

void VMGroupRole::set_vms()
{
    if ( vms.empty() )
    {
        va->remove("VMS");
        return;
    }

    std::string vms_str = one_util::join(vms.begin(), vms.end(), ',');

    va->replace("VMS", vms_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::from_xml_node(const xmlNodePtr node)
{
    std::vector<VectorAttribute *> roles;
    std::vector<VectorAttribute *>::iterator it;

    if ( roles_template.from_xml_node(node) == -1 )
    {
        return -1;
    }

    roles_template.get("ROLE", roles);

    for (it = roles.begin(); it != roles.end(); ++it)
    {
        std::string rname = (*it)->vector_value("NAME");

        int rid;
        int rc = (*it)->vector_value("ID", rid);

        if ( rname.empty() || rc == -1 )
        {
            return -1;
        }

        if ( rid >= next_role )
        {
            next_role = rid + 1;
        }

        VMGroupRole * role = new VMGroupRole((*it));

        if ( by_id.insert(rid, role) == false )
        {
            delete role;
            return -1;
        }

        if ( by_name.insert(rname, role) == false )
        {
            by_id.erase(rid);

            delete role;
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int VMGroupRoles::add_role(VectorAttribute * vrole, string& error)
{
    std::string rname = vrole->vector_value("NAME");

    if ( rname.empty() )
    {
        error = "Missing NAME in VM group role";
        return -1;
    }

    // Remove internal attributes before inserting
    vrole->replace("ID", next_role);

    vrole->remove("VMS");

    VMGroupRole * role = new VMGroupRole(vrole);

    if ( by_id.insert(next_role, role) == false )
    {
        delete role;

        error = "Role ID already exists";
        return -1;
    }

    if ( by_name.insert(rname, role) == false )
    {
        by_id.erase(next_role);

        delete role;

        error = "Role NAME already exists";
        return -1;
    }

    next_role += 1;

    roles_template.set(vrole);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::add_vm(const std::string& role_name, int vmid)
{
    VMGroupRole * role;

    role = by_name.get(role_name);

    if ( role == 0 )
    {
        return -1;
    }

    role->add_vm(vmid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::del_vm(const std::string& role_name, int vmid)
{
    VMGroupRole * role;

    role = by_name.get(role_name);

    if ( role == 0 )
    {
        return -1;
    }

    role->del_vm(vmid);

    return 0;
}

int VMGroupRoles::vm_size()
{
    int total = 0;

    for ( role_iterator it = begin(); it != end() ; ++it )
    {
        total += (*it)->get_vms().size();
    }

    return total;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::names_to_ids(const std::set<std::string> keys,
        std::set<int>&  keyi)
{
    std::set<std::string>::iterator it;

    for ( it = keys.begin(); it != keys.end(); ++it )
    {
        VMGroupRole *r = by_name.get(*it);

        if ( r == 0 )
        {
            keyi.clear();
            return -1;
        }

        keyi.insert(r->id());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*   VMGroup                                                                  */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * VMGroup::table = "vmgroup_pool";

const char * VMGroup::db_names = "oid, name, body, uid, gid, owner_u, group_u, "
    "other_u";

const char * VMGroup::db_bootstrap = "CREATE TABLE IF NOT EXISTS vmgroup_pool "
    "(oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, "
    "uid INTEGER, gid INTEGER, owner_u INTEGER, group_u INTEGER, "
    "other_u INTEGER, UNIQUE(name,uid))";

/* ------------------------------------------------------------------------ */

VMGroup::VMGroup(int _uid, int _gid, const string& _uname, const string& _gname,
        int _umask, Template * group_template):
    PoolObjectSQL(-1, VMGROUP, "", _uid, _gid, _uname, _gname, table)
{
    if (group_template != 0)
    {
        obj_template = group_template;
    }
    else
    {
        obj_template = new Template;
    }

    set_umask(_umask);
}

VMGroup::~VMGroup()
{
    delete obj_template;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VMGroup::to_xml(string& xml) const
{
    ostringstream   oss;
    string template_xml;
    string perms_xml;
    string roles_xml;

    oss <<
    "<VM_GROUP>"    <<
        "<ID>"      << oid      << "</ID>"     <<
        "<UID>"     << uid      << "</UID>"    <<
        "<GID>"     << gid      << "</GID>"    <<
        "<UNAME>"   << uname    << "</UNAME>"  <<
        "<GNAME>"   << gname    << "</GNAME>"  <<
        "<NAME>"    << name     << "</NAME>"   <<
        perms_to_xml(perms_xml)                <<
        roles.to_xml(roles_xml)                <<
        obj_template->to_xml(template_xml)     <<
    "</VM_GROUP>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */

int VMGroup::from_xml(const string &xml_str)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml_str);

    // Get class base attributes
    rc += xpath(oid,    "/VM_GROUP/ID",   -1);
    rc += xpath(uid,    "/VM_GROUP/UID",  -1);
    rc += xpath(gid,    "/VM_GROUP/GID",  -1);
    rc += xpath(uname,  "/VM_GROUP/UNAME","not_found");
    rc += xpath(gname,  "/VM_GROUP/GNAME","not_found");
    rc += xpath(name,   "/VM_GROUP/NAME", "not_found");

    // Permissions
    rc += perms_from_xml();

    // Get associated template
    ObjectXML::get_nodes("/VM_GROUP/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    content.clear();

    // VMGroup roles
    ObjectXML::get_nodes("/VM_GROUP/ROLES", content);

    if (!content.empty())
    {
        rc += roles.from_xml_node(content[0]);
    }

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

int VMGroup::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

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

    if ( replace )
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace
    oss <<" INTO "<<table <<" ("<< db_names <<") VALUES ("
        <<          oid                 << ","
        << "'" <<   sql_name            << "',"
        << "'" <<   sql_xml             << "',"
        <<          uid                 << ","
        <<          gid                 << ","
        <<          owner_u             << ","
        <<          group_u             << ","
        <<          other_u             << ")";


    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the VM group to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting VM group in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::check_rule_names(const std::string& aname, std::string& error_str)
{
    vector<const SingleAttribute *> affined;
    vector<const SingleAttribute *>::const_iterator jt;

    obj_template->get(aname, affined);

    for ( jt = affined.begin() ; jt != affined.end() ; ++jt )
    {
        std::set<std::string> a_set, key_set;
        std::set<std::string>::iterator s_it;

        std::set<int> id_set;

        one_util::split_unique((*jt)->value(), ',', a_set);

        for (s_it = a_set.begin(); s_it != a_set.end() ; ++s_it)
        {
            key_set.insert(one_util::trim(*s_it));
        }

        if ( roles.names_to_ids(key_set, id_set) != 0 )
        {
            std::ostringstream oss;
            oss << "Some roles used in " << aname << " attribute ("
                << (*jt)->value() << ") are not defined";

            error_str = oss.str();
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::get_rules(const std::string& aname, VMGroupRule::Policy policy,
        VMGroupRule::rule_set& rules, std::string& error_str)
{
    vector<const SingleAttribute *> affined;
    vector<const SingleAttribute *>::const_iterator jt;

    obj_template->get(aname, affined);

    for ( jt = affined.begin() ; jt != affined.end() ; ++jt )
    {
        std::set<std::string> a_set, key_set;
        std::set<std::string>::iterator s_it;

        std::set<int> id_set;

        std::pair<std::set<VMGroupRule>::iterator, bool> rc;

        one_util::split_unique((*jt)->value(), ',', a_set);

        for (s_it = a_set.begin(); s_it != a_set.end() ; ++s_it)
        {
            key_set.insert(one_util::trim(*s_it));
        }

        roles.names_to_ids(key_set, id_set);

        VMGroupRule rule(policy, id_set);

        rc = rules.insert(rule);

        if ( rc.second == false )
        {
            error_str = "Duplicated " + aname + " rule (" +
               (*jt)->value() + ") detected.";

            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::check_rule_consistency(std::string& error)
{
    VMGroupRule::rule_set affined, anti;

    VMGroupRule error_rule;

    if ( get_rules("AFFINED", VMGroupRule::AFFINED, affined, error) == -1 )
    {
        return -1;
    }

    if ( get_rules("ANTI_AFFINED", VMGroupRule::ANTI_AFFINED, anti, error) == -1 )
    {
        return -1;
    }

    if ( !VMGroupRule::compatible(affined, anti, error_rule) )
    {
        error = "Some roles are defined in AFFINED and ANTI_AFFINED at the same"
            " time";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::insert(SqlDB *db, string& error_str)
{
    vector<Attribute*> va_roles;
    vector<Attribute*>::iterator it;

    erase_template_attribute("NAME", name);

    if (name.empty())
    {
        error_str = "No NAME in template for VM group.";
        return -1;
    }

    int num_role = obj_template->remove("ROLE", va_roles);

    if ( num_role > VMGroupRoles::MAX_ROLES )
    {
        for ( it = va_roles.begin(); it != va_roles.end(); ++it )
        {
            delete *it;
        }

        error_str = "Maximum number of roles in a VM Group reached";
    }

    bool error = false;

    for ( it = va_roles.begin(); it != va_roles.end(); ++it )
    {
        VectorAttribute * vatt = dynamic_cast<VectorAttribute *>(*it);

        if (vatt == 0 || error)
        {
            delete *it;
            continue;
        }

        if ( roles.add_role(vatt, error_str) == -1 )
        {
            delete *it;
            error = true;
        }
    }

    if ( error )
    {
        return -1;
    }

    if ( check_rule_names("AFFINED", error_str) == -1 )
    {
        return -1;
    }

    if ( check_rule_names("ANTI_AFFINED", error_str) == -1 )
    {
        return -1;
    }

    if ( insert_replace(db, false, error_str) != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::post_update_template(string& error)
{
    int vms = roles.vm_size();

    if ( vms > 0 )
    {
        ostringstream oss;

        oss << "VM Group has " << vms << " VMs";
        error = oss.str();

        return -1;
    }

    obj_template->erase("ROLE");

    if ( check_rule_names("AFFINED", error) == -1 )
    {
        return -1;
    }

    if ( check_rule_names("ANTI_AFFINED", error) == -1 )
    {
        return -1;
    }

    return 0;
}

