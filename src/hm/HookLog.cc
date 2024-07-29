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

#include "HookLog.h"
#include "ObjectXML.h"
#include "NebulaLog.h"
#include "SqlDB.h"
#include "Nebula.h"
#include "HookManager.h"
#include "NebulaUtil.h"

#include <sstream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookLog::bootstrap(SqlDB * db)
{
    std::ostringstream oss_hook(one_db::hook_log_db_bootstrap);

    return db->exec_local_wr(oss_hook);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HookLog::HookLog(SqlDB *_db, const VectorAttribute * hl_conf):
    db(_db)
{
    hl_conf->vector_value("LOG_RETENTION", log_retention);
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookLog::_dump_log(int hkid, int exec_id, std::string &xml_log)
{
    std::ostringstream cmd;

    string_cb cb(1);

    cmd << "SELECT body FROM "<< one_db::hook_log_table;

    if ( hkid != -1 )
    {
        cmd << " WHERE hkid = " << hkid;
    }

    if (exec_id != -1)
    {
        cmd << " AND exeid = " << exec_id;
    }

    cmd << " ORDER BY hkid DESC, exeid";

    xml_log.append("<HOOKLOG>");

    cb.set_callback(&xml_log);

    int rc = db->exec_rd(cmd, &cb);

    cb.unset_callback();

    xml_log.append("</HOOKLOG>");

    return rc;
}

int HookLog::dump_log(const std::string &where_clause, std::string &xml_log)
{
    std::ostringstream cmd;

    string_cb cb(1);

    cmd << "SELECT body FROM "<< one_db::hook_log_table;

    if (!where_clause.empty())
    {
        cmd << " WHERE " << where_clause;
    }

    cmd << " ORDER BY hkid DESC";

    xml_log.append("<HOOKLOG>");

    cb.set_callback(&xml_log);

    int rc = db->exec_rd(cmd, &cb);

    cb.unset_callback();

    xml_log.append("</HOOKLOG>");

    return rc;
}

/* -------------------------------------------------------------------------- */

int HookLog::dump_log(int hkid, std::string &xml_log)
{
    return _dump_log(hkid, -1, xml_log);
}

/* -------------------------------------------------------------------------- */

int HookLog::dump_log(std::string &xml_log)
{
    return _dump_log( -1, -1, xml_log);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookLog::drop(SqlDB *db, const int hook_id)
{
    ostringstream oss;

    oss << "DELETE FROM " << one_db::hook_log_table
        << " WHERE hkid =" << hook_id;

    return db->exec_wr(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookLog::add(int hkid, int hkrc, const std::string &xml_result)
{
    std::ostringstream oss;

    multiple_cb<std::vector, int> cb;

    vector<int> query_output;

    char * sql_xml;

    std::string xml_body;

    cb.set_callback(&query_output);

    oss << "SELECT coalesce(MAX(exeid), -1), COUNT(*) FROM " << one_db::hook_log_table << " WHERE hkid = " << hkid;

    int rc = db->exec_rd(oss, &cb);

    if ( rc != 0 )
    {
        return rc;
    }

    int last_exeid = query_output[0] + 1;
    int num_records = query_output[1];

    cb.unset_callback();

    oss.str("");

    time_t the_time = time(0);

    oss << "<HOOK_EXECUTION_RECORD>"
        << "<HOOK_ID>" << hkid << "</HOOK_ID>"
        << "<EXECUTION_ID>" << last_exeid << "</EXECUTION_ID>"
        << "<TIMESTAMP>" << the_time << "</TIMESTAMP>"
        << xml_result
        << "</HOOK_EXECUTION_RECORD>";

    sql_xml = db->escape_str(oss.str());

    if ( sql_xml == 0 )
    {
        return -1;
    }

    if ( ObjectXML::validate_xml(sql_xml) != 0 )
    {
        db->free_str(sql_xml);
        return -1;
    }

    oss.str("");

    oss << "INSERT INTO " << one_db::hook_log_table
        << " (" << one_db::hook_log_db_names << ") VALUES ("
        << hkid       << ","
        << last_exeid << ","
        << the_time   << ","
        << hkrc       << ","
        << "'" << sql_xml << "')";

    rc = db->exec_wr(oss);

    if (num_records >= log_retention)
    {
        oss.str("");

        oss << "DELETE FROM " << one_db::hook_log_table
            << " WHERE hkid = " << hkid
            << " AND exeid <= " << last_exeid - log_retention;

        rc = db->exec_wr(oss);
    }

    db->free_str(sql_xml);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookLog::retry(int hkid, int exeid, std::string& err_msg)
{
    std::string xml, args, host;

    Nebula& nd  = Nebula::instance();

    HookManager * hm = nd.get_hm();

    int rc;

    rc = _dump_log(hkid, exeid, xml);

    ObjectXML obj_xml(xml);


    if (rc != 0)
    {
        err_msg = "Error reading HookLog.";
        return -1;
    }

    rc += obj_xml.xpath(args, "/HOOKLOG/HOOK_EXECUTION_RECORD/ARGUMENTS", "");

    if (rc != 0)
    {
        err_msg = "Invalid HookLog body. Arguments not found.";
        return -1;
    }

    obj_xml.xpath(host, "/HOOKLOG/HOOK_EXECUTION_RECORD/REMOTE_HOST", "");


    std::string args64;
    ssl_util::base64_encode(args, args64);

    string message = HookManager::format_message(args64, host, hkid);

    hm->trigger_retry(message);

    return 0;
}

