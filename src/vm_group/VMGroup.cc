/* ------------------------------------------------------------------------ */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems              */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VMGroup::to_xml(string& xml) const
{
    ostringstream   oss;
    string template_xml;
    string perms_xml;
    string roles_xml;
    string lock_str;

    oss <<
    "<VM_GROUP>"    <<
        "<ID>"      << oid      << "</ID>"     <<
        "<UID>"     << uid      << "</UID>"    <<
        "<GID>"     << gid      << "</GID>"    <<
        "<UNAME>"   << uname    << "</UNAME>"  <<
        "<GNAME>"   << gname    << "</GNAME>"  <<
        "<NAME>"    << name     << "</NAME>"   <<
        perms_to_xml(perms_xml)                <<
        lock_db_to_xml(lock_str)               <<
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

    // Lock
    rc += lock_db_from_xml();

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

    if ( replace )
    {
        oss << "UPDATE " << table << " SET "
            << "name = '"    <<  sql_name  << "', "
            << "body = '"    <<  sql_xml   << "', "
            << "uid = "      <<  uid       << ", "
            << "gid = "      <<  gid       << ", "
            << "owner_u = "  <<  owner_u   << ", "
            << "group_u = "  <<  group_u   << ", "
            << "other_u = "  <<  other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << table << " (" << db_names << ") VALUES ("
            <<          oid                 << ","
            << "'" <<   sql_name            << "',"
            << "'" <<   sql_xml             << "',"
            <<          uid                 << ","
            <<          gid                 << ","
            <<          owner_u             << ","
            <<          group_u             << ","
            <<          other_u             << ")";
    }

    rc = db->exec_wr(oss);

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

int VMGroup::check_rule_names(VMGroupPolicy policy, std::string& error)
{
    vector<const SingleAttribute *> affined;
    vector<const SingleAttribute *>::const_iterator jt;

    std::ostringstream oss;
    oss << policy;

    std::string aname = oss.str();

    obj_template->get(aname, affined);

    for ( jt = affined.begin() ; jt != affined.end() ; ++jt )
    {
        std::set<int> id_set;

        if ( roles.names_to_ids((*jt)->value(), id_set) != 0 )
        {
            std::ostringstream oss;

            oss << "Some roles used in " << aname << " attribute ("
                << (*jt)->value() << ") are not defined";

            error = oss.str();

            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::get_rules(VMGroupPolicy policy, VMGroupRule::rule_set& rules,
        std::string& error_str)
{
    vector<const SingleAttribute *> affined;
    vector<const SingleAttribute *>::const_iterator jt;

    std::ostringstream oss;
    oss << policy;

    std::string aname = oss.str();

    obj_template->get(aname, affined);

    for ( jt = affined.begin() ; jt != affined.end() ; ++jt )
    {
        std::set<int> id_set;

        std::pair<std::set<VMGroupRule>::iterator, bool> rc;

        roles.names_to_ids((*jt)->value(), id_set);

        VMGroupRule rule(policy, id_set);

        rc = rules.insert(rule);

        if ( rc.second == false )
        {
            std::ostringstream oss;

            oss << "Duplicated " << aname << " rule (" << (*jt)->value()
                << ") detected.";

            error_str = oss.str();

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

    VMGroupRule::rule_set::iterator it;

    VMGroupRule error_rule;

    if ( get_rules(VMGroupPolicy::AFFINED, affined, error) == -1 )
    {
        return -1;
    }

    for (it=affined.begin() ; it != affined.end(); ++it)
    {
        const VMGroupRule::role_bitset rs = (*it).get_roles();

        for (int i = 0; i < VMGroupRoles::MAX_ROLES; ++i)
        {
            if ( rs[i] == 1 )
            {
                VMGroupRole * role = roles.get(i);

                if ( role != 0 && role->policy() == VMGroupPolicy::ANTI_AFFINED )
                {
                    error = "Role " + role->name() + " is in an AFFINED rule "
                        "but the role policy is ANTI_AFFINED";

                    return -1;
                }
            }
        }
    }

    if ( get_rules(VMGroupPolicy::ANTI_AFFINED, anti, error) == -1 )
    {
        return -1;
    }

    if ( !VMGroupRule::compatible(affined, anti, error_rule) )
    {
        ostringstream oss;
        const VMGroupRule::role_bitset rs = error_rule.get_roles();

        oss << "Roles defined in AFFINED and ANTI_AFFINED rules:";

        for (int i = 0; i < VMGroupRoles::MAX_ROLES; ++i)
        {
            if ( rs[i] == 1 )
            {
                VMGroupRole * role = roles.get(i);

                if ( role != 0 )
                {
                    oss << " " << role->name();
                }
            }
        }

        error = oss.str();
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

    if ( check_rule_names(VMGroupPolicy::AFFINED, error_str) == -1 )
    {
        return -1;
    }

    if ( check_rule_names(VMGroupPolicy::ANTI_AFFINED, error_str) == -1 )
    {
        return -1;
    }

    if ( check_rule_consistency(error_str) == -1 )
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

    if ( check_rule_names(VMGroupPolicy::AFFINED, error) == -1 )
    {
        return -1;
    }

    if ( check_rule_names(VMGroupPolicy::ANTI_AFFINED, error) == -1 )
    {
        return -1;
    }

    if ( check_rule_consistency(error) == -1 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
