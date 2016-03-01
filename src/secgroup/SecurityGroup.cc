/* ------------------------------------------------------------------------ */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems              */
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
#include <arpa/inet.h>

/* ------------------------------------------------------------------------ */

const char * SecurityGroup::table = "secgroup_pool";

const char * SecurityGroup::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * SecurityGroup::db_bootstrap = "CREATE TABLE IF NOT EXISTS secgroup_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name,uid))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SecurityGroup::SecurityGroup(
        int             _uid,
        int             _gid,
        const string&   _uname,
        const string&   _gname,
        int             _umask,
        Template*       sgroup_template):
        PoolObjectSQL(-1, SECGROUP, "", _uid,_gid,_uname,_gname,table),
        updated("UPDATED_VMS"),
        outdated("OUTDATED_VMS"),
        updating("UPDATING_VMS"),
        error("ERROR_VMS")

{
    if (sgroup_template != 0)
    {
        obj_template = sgroup_template;
    }
    else
    {
        obj_template = new Template;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SecurityGroup::~SecurityGroup()
{
    delete obj_template;
};

/* ************************************************************************ */
/* SecurityGroup :: Database Access Functions                               */
/* ************************************************************************ */

int SecurityGroup::insert(SqlDB *db, string& error_str)
{
    vector<const VectorAttribute*>::const_iterator it;
    vector<const VectorAttribute*> rules;

    erase_template_attribute("NAME",name);

    if (name.empty())
    {
        goto error_name;
    }

    get_template_attribute("RULE", rules);

    for ( it = rules.begin(); it != rules.end(); it++ )
    {
        if (!isValidRule(*it, error_str))
        {
            goto error_valid;
        }
    }

    if ( insert_replace(db, false, error_str) != 0 )
    {
        goto error_db;
    }

    return 0;

error_name:
    error_str = "No NAME in template for Security Group.";
    goto error_common;

error_valid:
error_db:
error_common:
    return -1;
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
    rc += xpath(uname,  "/SECURITY_GROUP/UNAME","not_found");
    rc += xpath(gname,  "/SECURITY_GROUP/GNAME","not_found");
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
    content.clear();

    ObjectXML::get_nodes("/SECURITY_GROUP/UPDATED_VMS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += updated.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    ObjectXML::get_nodes("/SECURITY_GROUP/OUTDATED_VMS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += outdated.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    ObjectXML::get_nodes("/SECURITY_GROUP/UPDATING_VMS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += updating.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    ObjectXML::get_nodes("/SECURITY_GROUP/ERROR_VMS", content);

    if (content.empty())
    {
        return -1;
    }

    rc += error.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

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
    vector<const VectorAttribute*>::const_iterator it;
    vector<const VectorAttribute*> rules;

    get_template_attribute("RULE", rules);

    for ( it = rules.begin(); it != rules.end(); it++ )
    {
        VectorAttribute* new_rule = new VectorAttribute(
                                    "SECURITY_GROUP_RULE", (*it)->value());

        new_rule->replace("SECURITY_GROUP_ID", this->get_oid());
        new_rule->replace("SECURITY_GROUP_NAME", this->get_name());

        result.push_back(new_rule);
    }
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool SecurityGroup::isValidRule(const VectorAttribute * rule, string& error) const
{
    string value, ip, proto;

    unsigned int ivalue;

    int id;

    // -------------------------------------------------------------------------
    // Check PROTOCOL and extensions
    //    - RANGE for TCP and UDP
    //    - ICMP_TYPE for ICMP
    // -------------------------------------------------------------------------
    proto = rule->vector_value("PROTOCOL");

    one_util::toupper(proto);

    if ( proto != "TCP" && proto != "UDP" && proto != "ICMP" && proto != "IPSEC"
        && proto != "ALL")
    {
        error = "Wrong PROTOCOL in rule. Valid options: TCP, UDP, ICMP, IPSEC,"
            " ALL.";
        return false;
    }

    value = rule->vector_value("RANGE");

    if (!value.empty() && proto != "TCP" && proto != "UDP")
    {
        error = "RANGE is supported only for TCP and UDP protocols.";
        return false;
    }

    if (!value.empty())
    {
        const char *range_pattern = "^(([[:digit:]]+|[[:digit:]]+:[[:digit:]]+),)*([[:digit:]]+|[[:digit:]]+:[[:digit:]]+)$";
        if (one_util::regex_match(range_pattern, value.c_str()) != 0)
        {
            error = "Invalid RANGE specification.";
            return false;
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

        if (rule->vector_value("ICMP_TYPE", ivalue) != 0)
        {
            error = "Wrong ICMP_TYPE, it must be integer";
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

    ip = rule->vector_value("IP");

    if (!ip.empty()) //Target as IP & SIZE
    {
        struct in_addr ip_addr;

        if (rule->vector_value("SIZE", ivalue) != 0)
        {
            error = "Wrong or empty SIZE.";
            return false;
        }

        if (inet_pton(AF_INET, ip.c_str(), static_cast<void*>(&ip_addr)) != 1)
        {
            error = "Wrong format for IP value.";
            return false;
        }
    }
    else //Target is ANY or NETWORK_ID
    {
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

int SecurityGroup::post_update_template(string& error)
{
    vector<const VectorAttribute*>::const_iterator it;
    vector<const VectorAttribute*> rules;

    get_template_attribute("RULE", rules);

    for ( it = rules.begin(); it != rules.end(); it++ )
    {
        if (!isValidRule(*it, error))
        {
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
