/* ------------------------------------------------------------------------ */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems              */
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

#include "SecurityGroup.h"
#include "NebulaUtil.h"
#include "Nebula.h"
#include "LifeCycleManager.h"
#include "OneDB.h"
#include <arpa/inet.h>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SecurityGroup::SecurityGroup(
        int             _uid,
        int             _gid,
        const string&   _uname,
        const string&   _gname,
        int             _umask,
        unique_ptr<Template> sgroup_template):
    PoolObjectSQL(-1, SECGROUP, "", _uid, _gid, _uname, _gname, one_db::sg_table),
    updated("UPDATED_VMS"),
    outdated("OUTDATED_VMS"),
    updating("UPDATING_VMS"),
    error("ERROR_VMS")
{
    if (sgroup_template)
    {
        obj_template = move(sgroup_template);
    }
    else
    {
        obj_template = make_unique<Template>();
    }

    set_umask(_umask);
}

/* ************************************************************************ */
/* SecurityGroup :: Database Access Functions                               */
/* ************************************************************************ */

int SecurityGroup::insert(SqlDB *db, string& error_str)
{
    vector<VectorAttribute*> rules;

    erase_template_attribute("NAME", name);

    if (name.empty())
    {
        error_str = "No NAME in template for Security Group.";
        return -1;
    }

    get_template_attribute("RULE", rules);

    for ( auto rule : rules )
    {
        if (!is_valid(rule, error_str))
        {
            return -1;
        }
    }

    remove_duplicates(rules);

    if ( insert_replace(db, false, error_str) != 0 )
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroup::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the security group

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
        oss << "UPDATE " << one_db::sg_table << " SET "
            << "name = '"    << sql_name << "', "
            << "body = '"    << sql_xml  << "', "
            << "uid = "      <<  uid     << ", "
            << "gid = "      <<  gid     << ", "
            << "owner_u = "  <<  owner_u << ", "
            << "group_u = "  <<  group_u << ", "
            << "other_u = "  <<  other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::sg_table
            << " (" << one_db::sg_db_names << ") VALUES ("
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

    error_str = "Error transforming the Security Group to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Security Group in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroup::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::sg_db_bootstrap);

    return db->exec_local_wr(oss);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& SecurityGroup::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;
    string          perms_xml;
    string          updated_xml;
    string          outdated_xml;
    string          updating_xml;
    string          error_xml;

    oss <<
        "<SECURITY_GROUP>"    <<
        "<ID>"      << oid      << "</ID>"     <<
        "<UID>"     << uid      << "</UID>"    <<
        "<GID>"     << gid      << "</GID>"    <<
        "<UNAME>"   << uname    << "</UNAME>"  <<
        "<GNAME>"   << gname    << "</GNAME>"  <<
        "<NAME>"    << name     << "</NAME>"   <<
        perms_to_xml(perms_xml)                <<
        updated.to_xml(updated_xml)<<
        outdated.to_xml(outdated_xml)      <<
        updating.to_xml(updating_xml)      <<
        error.to_xml(error_xml)      <<
        obj_template->to_xml(template_xml)     <<
        "</SECURITY_GROUP>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int SecurityGroup::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,    "/SECURITY_GROUP/ID",   -1);
    rc += xpath(uid,    "/SECURITY_GROUP/UID",  -1);
    rc += xpath(gid,    "/SECURITY_GROUP/GID",  -1);
    rc += xpath(uname,  "/SECURITY_GROUP/UNAME", "not_found");
    rc += xpath(gname,  "/SECURITY_GROUP/GNAME", "not_found");
    rc += xpath(name,   "/SECURITY_GROUP/NAME", "not_found");

    // Permissions
    rc += perms_from_xml();

    // Get associated classes
    ObjectXML::get_nodes("/SECURITY_GROUP/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    rc += updated.from_xml(this, "/SECURITY_GROUP/");
    rc += outdated.from_xml(this, "/SECURITY_GROUP/");
    rc += updating.from_xml(this, "/SECURITY_GROUP/");
    rc += error.from_xml(this, "/SECURITY_GROUP/");

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void SecurityGroup::get_rules(vector<VectorAttribute*>& result) const
{
    vector<const VectorAttribute*> rules;

    get_template_attribute("RULE", rules);

    for ( auto rule : rules )
    {
        VectorAttribute* new_rule = new VectorAttribute(
                "SECURITY_GROUP_RULE", rule->value());

        new_rule->replace("SECURITY_GROUP_ID", this->get_oid());
        new_rule->replace("SECURITY_GROUP_NAME", this->get_name());

        result.push_back(new_rule);
    }
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SecurityGroup::is_valid(const VectorAttribute * rule, string& error) const
{
    // -------------------------------------------------------------------------
    // Check PROTOCOL and extensions
    //    - RANGE for TCP and UDP
    //    - ICMP_TYPE for ICMP
    // -------------------------------------------------------------------------
    auto proto = rule->vector_value("PROTOCOL");

    one_util::toupper(proto);

    if ( proto != "TCP" && proto != "UDP" && proto != "ICMP" && proto != "ICMPV6"
         && proto != "IPSEC" && proto != "ALL")
    {
        error = "Wrong PROTOCOL in rule. Valid options: TCP, UDP, ICMP, ICMPV6,"
                " IPSEC, ALL.";
        return false;
    }

    auto value = rule->vector_value("RANGE");

    if (!value.empty() && proto != "TCP" && proto != "UDP")
    {
        error = "RANGE is supported only for TCP and UDP protocols.";
        return false;
    }

    if (!value.empty())
    {
        constexpr auto ports_list_pattern =
                "^(([[:digit:]]+|[[:digit:]]+:[[:digit:]]+),)*([[:digit:]]+|[[:digit:]]+:[[:digit:]]+)$";

        if (one_util::regex_match(ports_list_pattern, value.c_str()) != 0)
        {
            error = "Invalid RANGE specification.";
            return false;
        }

        std::size_t port_counter = 0;

        const auto port_rules = one_util::split(value, ',');

        for (const auto& port_rule : port_rules)
        {
            constexpr auto range_pattern = "([[:digit:]]+:[[:digit:]]+)";

            if (one_util::regex_match(range_pattern, port_rule.c_str()) == 0)
            {
                const auto port_values = one_util::split(port_rule, ':');
                if (port_values.size() != 2)
                {
                    error = "Invalid RANGE specification.";
                    return false;
                }

                const auto end_value = one_util::string_to_unsigned<std::uint32_t>(port_values[1]);

                if (end_value > 65535)
                {
                    error = "RANGE out of bounds 0-65536.";
                    return false;
                }

                if (end_value < one_util::string_to_unsigned<std::uint32_t>(port_values[0]))
                {
                    error = "RANGE BEGIN value is greater than RANGE END value";
                    return false;
                }

                port_counter += 2;
            }
            else
            {
                if (one_util::string_to_unsigned<std::uint32_t>(port_rule) > 65535)
                {
                    error = "RANGE out of bounds 0-65536.";
                    return false;
                }

                ++port_counter;
            }

            if (port_counter > 15)
            {
                error = "Not more than 15 ports can be specified in a RULE";
                return false;
            }
        }
    }

    value = rule->vector_value("ICMP_TYPE");

    if (!value.empty())
    {
        if (proto != "ICMP")
        {
            error = "ICMP_TYPE is supported only for ICMP protocol.";
            return false;
        }

        unsigned int ivalue = 0;
        if (rule->vector_value("ICMP_TYPE", ivalue) != 0)
        {
            error = "Wrong ICMP_TYPE, it must be integer";
            return false;
        }
    }

    value = rule->vector_value("ICMPV6_TYPE");

    if (!value.empty())
    {
        if (proto != "ICMPV6")
        {
            error = "ICMPV6_TYPE is supported only for ICMPV6 protocol.";
            return false;
        }

        unsigned int ivalue = 0;
        if (rule->vector_value("ICMPV6_TYPE", ivalue) != 0)
        {
            error = "Wrong ICMPV6_TYPE, it must be integer";
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // RULE_TYPE
    // -------------------------------------------------------------------------

    value = rule->vector_value("RULE_TYPE");

    one_util::toupper(value);

    if ( value != "INBOUND" && value != "OUTBOUND" )
    {
        error = "Wrong RULE_TYPE in rule. Valid options: INBOUND, OUTBOUND.";
        return false;
    }

    // -------------------------------------------------------------------------
    // Check IP, SIZE and NETWORK_ID
    // -------------------------------------------------------------------------

    const auto ip = rule->vector_value("IP");

    if (!ip.empty()) //Target as IP & SIZE
    {
        struct in6_addr ip_addr;

        unsigned int ivalue = 0;
        if (rule->vector_value("SIZE", ivalue) != 0)
        {
            error = "Wrong or empty SIZE.";
            return false;
        }

        if (inet_pton(AF_INET6, ip.c_str(), static_cast<void*>(&ip_addr)) != 1)
        {
            if (inet_pton(AF_INET, ip.c_str(), static_cast<void*>(&ip_addr)) != 1)
            {
                error = "Wrong format for IP value.";
                return false;
            }
        }
    }
    else //Target is ANY or NETWORK_ID
    {
        int id = 0;
        if (rule->vector_value("NETWORK_ID", value) == 0 &&
            rule->vector_value("NETWORK_ID", id) != 0)
        {
            error = "Wrong NETWORK_ID.";
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SecurityGroup::remove_duplicates(vector<VectorAttribute*>& rules)
{
    for (auto rule : rules)
    {
        rule->replace("HASH", one_util::sha1_digest(rule->marshall()));
    }

    // Sort to get duplicates next to each other
    sort(rules.begin(), rules.end(),
         [](const VectorAttribute* va1, const VectorAttribute* va2)
    {
        return va1->vector_value("HASH") < va2->vector_value("HASH");
    });

    string prev_value;

    for (auto rule : rules)
    {
        string value = rule->vector_value("HASH");

        if (value == prev_value)
        {
            auto r = obj_template->remove(rule);

            delete r;
        }
        else
        {
            rule->remove("HASH");
        }

        prev_value = std::move(value);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroup::post_update_template(string& error, Template *_old_tmpl)
{
    vector<VectorAttribute*> rules;

    obj_template->get("RULE", rules);

    for ( auto rule : rules )
    {
        if (!is_valid(rule, error))
        {
            return -1;
        }
    }

    remove_duplicates(rules);

    commit(false);

    Nebula::instance().get_lcm()->trigger_updatesg(oid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
