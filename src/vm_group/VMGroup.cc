/* ------------------------------------------------------------------------ */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems              */
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
#include "OneDB.h"
#include "Nebula.h"
#include "VirtualMachinePool.h"
#include "VirtualMachine.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*   VMGroup                                                                  */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VMGroup::VMGroup(int _uid, int _gid, const string& _uname, const string& _gname,
                 int _umask, unique_ptr<Template> group_template):
    PoolObjectSQL(-1, VMGROUP, "", _uid, _gid, _uname, _gname, one_db::vm_group_table)
{
    if (group_template)
    {
        obj_template = move(group_template);
    }
    else
    {
        obj_template = make_unique<Template>();
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
        _roles.to_xml(roles_xml)               <<
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
    rc += xpath(uname,  "/VM_GROUP/UNAME", "not_found");
    rc += xpath(gname,  "/VM_GROUP/GNAME", "not_found");
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

    // VMGroup roles
    ObjectXML::get_nodes("/VM_GROUP/ROLES", content);

    if (!content.empty())
    {
        rc += _roles.from_xml_node(content[0]);
    }

    ObjectXML::free_nodes(content);

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
        oss << "UPDATE " << one_db::vm_group_table << " SET "
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
        oss << "INSERT INTO " << one_db::vm_group_table
            << " (" << one_db::vm_group_db_names << ") VALUES ("
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

int VMGroup::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::vm_group_db_bootstrap);

    return db->exec_local_wr(oss);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::check_rule_names(VMGroupPolicy policy, std::string& error)
{
    vector<const SingleAttribute *> affined;

    std::ostringstream oss;
    oss << policy;

    std::string aname = oss.str();

    obj_template->get(aname, affined);

    for ( auto sattr : affined )
    {
        std::set<int> id_set;

        if ( _roles.names_to_ids(sattr->value(), id_set) != 0 )
        {
            oss.str("");

            oss << "Some roles used in " << aname << " attribute ("
                << sattr->value() << ") are not defined";

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

    std::ostringstream oss;
    oss << policy;

    std::string aname = oss.str();

    obj_template->get(aname, affined);

    for ( auto sattr : affined )
    {
        std::set<int> id_set;

        _roles.names_to_ids(sattr->value(), id_set);

        VMGroupRule rule(policy, id_set);

        auto rc = rules.insert(rule);

        if ( rc.second == false )
        {
            oss.str("");

            oss << "Duplicated " << aname << " rule (" << sattr->value()
                << ") detected.";

            error_str = oss.str();

            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::add_role(VectorAttribute * vrole, std::string& error)
{
    if (_roles.add_role(vrole, error) != 0)
    {
        return -1;
    }

    return check_consistency(error);
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::del_role(int role_id, std::string& error)
{
    auto role = _roles.get(role_id);

    if ( !role )
    {
        ostringstream oss;
        oss << "Unable to delete role " << role_id << ", the role doesn't exists";

        error = oss.str();

        return -1;
    }

    if (role->size_vms() > 0)
    {
        ostringstream oss;
        oss << "Unable to delete role " << role_id << ", the role has assigned VMs ";

        error = oss.str();

        return -1;
    }

    _roles.del_role(role_id);

    return check_consistency(error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::update_role(int role_id, VectorAttribute * vrole, std::string& error)
{
    // Create method VMGroup::role_update and do all checks there
    auto role = _roles.get(role_id);

    if (!role)
    {
        ostringstream oss;
        oss << "VMGroup " << oid << " doesn't have role " << role_id;

        error = oss.str();

        return -1;
    }

    if (role->size_vms() > 0)
    {
        ostringstream oss;
        oss << "VMGroup " << oid << " Role " << role_id
            << " has VMs, unable to update";

        error = oss.str();

        return -1;
    }

    string new_name = vrole->vector_value("NAME");
    if (!new_name.empty() && new_name != role->name())
    {
        if (_roles.rename_role(role, new_name) != 0)
        {
            ostringstream oss;
            oss << "VMGroup " << oid << " Role " << role_id
                << " can not update name, role with name " << new_name
                << " already exists";

            error = oss.str();

            return -1;
        }
    }

    role->update(vrole);

    return check_consistency(error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::check_consistency(std::string& error_str)
{
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

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::check_rule_consistency(std::string& error)
{
    VMGroupRule::rule_set affined, anti;

    VMGroupRule error_rule;

    if ( get_rules(VMGroupPolicy::AFFINED, affined, error) == -1 )
    {
        return -1;
    }

    for (const auto& rule : affined)
    {
        const VMGroupRule::role_bitset rs = rule.get_roles();

        for (int i = 0; i < VMGroupRoles::MAX_ROLES; ++i)
        {
            if ( rs[i] == 1 )
            {
                VMGroupRole * role = _roles.get(i);

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
                VMGroupRole * role = _roles.get(i);

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

    erase_template_attribute("NAME", name);

    if (name.empty())
    {
        error_str = "No NAME in template for VM group.";
        return -1;
    }

    int num_role = obj_template->remove("ROLE", va_roles);

    if ( num_role > VMGroupRoles::MAX_ROLES )
    {
        for ( auto attr : va_roles )
        {
            delete attr;
        }

        error_str = "Maximum number of roles in a VM Group reached";
    }

    bool error = false;

    for ( auto attr : va_roles )
    {
        VectorAttribute * vatt = dynamic_cast<VectorAttribute *>(attr);

        if (vatt == 0 || error)
        {
            delete attr;
            continue;
        }

        if ( _roles.add_role(vatt, error_str) == -1 )
        {
            delete attr;
            error = true;
        }
    }

    if ( error )
    {
        return -1;
    }

    if ( check_consistency(error_str) != 0)
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

int VMGroup::post_update_template(string& error, Template *_old_tmpl)
{
    int vms = _roles.vm_size();

    if ( vms > 0 )
    {
        ostringstream oss;

        oss << "VM Group has " << vms << " VMs";
        error = oss.str();

        return -1;
    }

    obj_template->erase("ROLE");

    if ( check_consistency(error) != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroup::check_affinity(int vmid, int my_hid, const string& role_name,
                            string& error)
{
    auto role = _roles.get(role_name);

    if ( !role )
    {
        error = "Role does not exist in VM Group";
        return -1;
    }

    VirtualMachinePool * vmpool = Nebula::instance().get_vmpool();

    // 1. Intra-role check
    const set<int>& role_vms = role->get_vms();
    VMGroupPolicy pol        = role->policy();

    for ( auto other_vmid : role_vms )
    {
        if ( other_vmid == vmid )
        {
            continue;
        }

        if ( auto other_vm = vmpool->get_ro(other_vmid) )
        {
            if ( other_vm->get_state() != VirtualMachine::ACTIVE )
            {
                continue;
            }

            int other_hid = other_vm->get_hid();

            if ( other_hid == -1 )
            {
                continue;
            }

            if ( pol == VMGroupPolicy::AFFINED && my_hid != other_hid )
            {
                ostringstream oss;
                oss << "VM " << vmid << " is on host " << my_hid
                    << " but role " << role_name << " is AFFINED and VM "
                    << other_vmid << " is on host " << other_hid;

                error = oss.str();
                return -1;
            }

            if ( pol == VMGroupPolicy::ANTI_AFFINED && my_hid == other_hid )
            {
                ostringstream oss;
                oss << "VM " << vmid << " is on host " << my_hid
                    << " but role " << role_name << " is ANTI_AFFINED and VM "
                    << other_vmid << " is on the same host";

                error = oss.str();
                return -1;
            }
        }
    }

    // 2. Inter-role check
    VMGroupRule::rule_set affined, anti;

    get_rules(VMGroupPolicy::AFFINED, affined, error);
    get_rules(VMGroupPolicy::ANTI_AFFINED, anti, error);

    int my_role_id = role->id();

    // Check AFFINED rules
    for ( const auto& rule : affined )
    {
        const VMGroupRule::role_bitset& rs = rule.get_roles();

        if ( !rs.test(my_role_id) )
        {
            continue;
        }
        for ( int i = 0; i < VMGroupRoles::MAX_ROLES; ++i )
        {
            if ( !rs.test(i) || i == my_role_id )
            {
                continue;
            }

            if ( auto other_role = _roles.get(i) )
            {
                for ( auto other_vmid : other_role->get_vms() )
                {
                    if ( auto other_vm = vmpool->get_ro(other_vmid) )
                    {
                        if ( other_vm->get_state() != VirtualMachine::ACTIVE )
                        {
                            continue;
                        }

                        int other_hid = other_vm->get_hid();

                        if ( other_hid != -1 && my_hid != other_hid )
                        {
                            ostringstream oss;
                            oss << "VM " << vmid << " is on host " << my_hid
                                << " but it is AFFINED with role "
                                << other_role->name() << " and VM " << other_vmid
                                << " is on host " << other_hid;

                            error = oss.str();
                            return -1;
                        }
                    }
                }
            }
        }
    }

    // Check ANTI_AFFINED rules
    for ( const auto& rule : anti )
    {
        const VMGroupRule::role_bitset& rs = rule.get_roles();

        if ( !rs.test(my_role_id) )
        {
            continue;
        }

        for ( int i = 0; i < VMGroupRoles::MAX_ROLES; ++i )
        {
            if ( !rs.test(i) || i == my_role_id )
            {
                continue;
            }

            if ( auto other_role = _roles.get(i) )
            {
                for ( auto other_vmid : other_role->get_vms() )
                {
                    if ( auto other_vm = vmpool->get_ro(other_vmid) )
                    {
                        if ( other_vm->get_state() != VirtualMachine::ACTIVE )
                        {
                            continue;
                        }

                        int other_hid = other_vm->get_hid();

                        if ( other_hid != -1 && my_hid == other_hid )
                        {
                            ostringstream oss;
                            oss << "VM " << vmid << " is on host " << my_hid
                                << " but it is ANTI_AFFINED with role "
                                << other_role->name() << " and VM " << other_vmid
                                << " is on the same host";

                            error = oss.str();
                            return -1;
                        }
                    }
                }
            }
        }
    }

    // 3. Host affinity check
    if ( !role->check_host_affinity(my_hid) )
    {
        ostringstream oss;
        oss << "VM " << vmid << " is on host " << my_hid
            << " but role " << role_name << " has HOST_AFFINED/HOST_ANTI_AFFINED "
            << "rules that are violated by this host";

        error = oss.str();
        return -1;
    }

    return 0;
}
