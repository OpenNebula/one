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

#include "Hook.h"
#include "Nebula.h"
#include "HookAPI.h"
#include "HookImplementation.h"
#include "HookStateHost.h"
#include "HookStateVM.h"
#include "HookStateImage.h"
#include "HookStateVirtualNetwork.h"
#include "HookLog.h"
#include "OneDB.h"

#include <string>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Hook::Hook(unique_ptr<Template> tmpl):
    PoolObjectSQL(-1, HOOK, "", -1, -1, "", "", one_db::hook_table),
    type(HookType::UNDEFINED), cmd(""), remote(false), _hook(0)
{
    if (tmpl)
    {
        obj_template = move(tmpl);
    }
    else
    {
        obj_template = make_unique<Template>();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Hook::~Hook()
{
    delete _hook;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Hook::_to_xml(string& xml, bool log) const
{
    std::string template_xml, lock_str, log_xml;

    ostringstream oss;


    oss << "<HOOK>" <<
        "<ID>"   << oid  << "</ID>"   <<
        "<NAME>" << name << "</NAME>" <<
        "<TYPE>" << Hook::hook_type_to_str(type) << "</TYPE>" <<
        lock_db_to_xml(lock_str) <<
        obj_template->to_xml(template_xml);

    if (log )
    {
        Nebula& nd  = Nebula::instance();
        HookLog* hl = nd.get_hl();

        if ( hl->dump_log(oid, log_xml) == 0 )
        {
            oss << log_xml;
        }
    }

    oss << "</HOOK>";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Hook::from_xml(const std::string& xml)
{
    vector<xmlNodePtr> content;
    std::string type_str;
    std::string error_msg;

    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,  "/HOOK/ID", -1);
    rc += xpath(name, "/HOOK/NAME", "not_found");
    rc += xpath(type_str, "/HOOK/TYPE", "");

    type = str_to_hook_type(type_str);

    rc += lock_db_from_xml();

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

    // ------------ Template ---------------

    ObjectXML::get_nodes("/HOOK/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node( content[0] );

    if ( set_hook(type, error_msg) == -1 )
    {
        return -1;
    }

    rc += _hook->from_template(obj_template.get(), error_msg);

    get_template_attribute("COMMAND", cmd);
    get_template_attribute("REMOTE",  remote);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Hook::post_update_template(string& error)
{
    std::string new_cmd;
    bool new_remote;

    get_template_attribute("COMMAND", new_cmd);

    if (new_cmd != "")
    {
        cmd = new_cmd;

        replace_template_attribute("COMMAND", cmd);
    }
    else
    {
        error = "The COMMAND attribute is not defined.";
        return -1;
    }

    if ( get_template_attribute("REMOTE", new_remote) )
    {
        remote = new_remote;

        replace_template_attribute("REMOTE", remote);
    }

    return _hook->post_update_template(obj_template.get(), error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Hook::bootstrap(SqlDB * db)
{
    std::ostringstream oss_hook(one_db::hook_db_bootstrap);

    return db->exec_local_wr(oss_hook);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Hook::insert(SqlDB *db, std::string& error_str)
{
    std::string type_str;

    int rc;

    obj_template->get("NAME", name);
    obj_template->erase("NAME");

    if (name.empty())
    {
        goto error_name;
    }

    erase_template_attribute("COMMAND", cmd);

    if (cmd.empty())
    {
        goto error_cmd;
    }

    add_template_attribute("COMMAND", cmd);

    erase_template_attribute("REMOTE", remote);

    add_template_attribute("REMOTE", remote);

    erase_template_attribute("TYPE", type_str);

    type = Hook::str_to_hook_type(type_str);

    if (type == Hook::UNDEFINED)
    {
        goto error_type;
    }

    if (set_hook(type, error_str) == -1)
    {
        goto error_common;
    }

    rc = _hook->parse_template(obj_template.get(), error_str);

    if (rc == -1)
    {
        goto error_common;
    }

    return insert_replace(db, false, error_str);

error_type:
    error_str = "No TYPE or invalid one in template for Hook.";
    goto error_common;
error_cmd:
    error_str = "No COMMAND in template for Hook.";
    goto error_common;
error_name:
    error_str = "No NAME in template for Hook.";
error_common:
    NebulaLog::log("HKM", Log::ERROR, error_str);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Hook::insert_replace(SqlDB *db, bool replace, std::string& error_str)
{
    ostringstream oss;

    int rc;
    std::string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

    // Update the Hook
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

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace
    oss <<" INTO "<<one_db::hook_table
        << " (" <<  one_db::hook_db_names << ") VALUES ("
        <<          oid            << ","
        << "'" <<   sql_name       << "',"
        << "'" <<   sql_xml        << "',"
        <<          uid            << ","
        <<          gid            << ","
        <<          owner_u        << ","
        <<          group_u        << ","
        <<          other_u        << ","
        <<          type           << ")";

    rc = db->exec_wr(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Hook to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Hook in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Hook::set_hook(HookType hook_type, string& error)
{
    std::string resource;

    if (hook_type == UNDEFINED)
    {
        return -1;
    }

    switch (hook_type)
    {
        case STATE:
            if (obj_template == 0)
            {
                return -1;
            }

            get_template_attribute("RESOURCE", resource);

            if (resource.empty())
            {
                error = "RESOURCE attribute is required for STATE hooks.";
                return -1;
            }

            switch(PoolObjectSQL::str_to_type(resource))
            {
                case PoolObjectSQL::VM:
                    _hook = new HookStateVM();
                    break;

                case PoolObjectSQL::HOST:
                    _hook = new HookStateHost();
                    break;

                case PoolObjectSQL::IMAGE:
                    _hook = new HookStateImage();
                    break;

                case PoolObjectSQL::NET:
                    _hook = new HookStateVirtualNetwork();
                    break;

                default:
                    error = "Invalid resource type: " + resource;
                    return -1;
            }

            break;

        case API:
            _hook = new HookAPI();
            break;

        case UNDEFINED:
            error = "Invalid hook type.";
            return -1;
    };

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Hook::drop(SqlDB *db)
{
    ostringstream oss;
    int rc;

    oss << "DELETE FROM " << one_db::hook_table << " WHERE oid=" << oid;

    rc = db->exec_wr(oss);

    if (rc != 0)
    {
        return rc;
    }

    Nebula& nd  = Nebula::instance();
    HookLog* hl = nd.get_hl();

    return hl->drop(db, oid);
}
