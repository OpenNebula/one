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

#include "VMRPCPool.h"
#include "OneDB.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMRPCPool::update_monitoring(const VirtualMachineMonitorInfo& monitoring)
{
    if (monitor_expiration <= 0)
    {
        return 0;
    }

    auto sql_xml = db->escape_str(monitoring.to_xml());

    if (sql_xml == 0)
    {
        NebulaLog::log("VMP", Log::WARNING,
                       "Could not transform VM monitoring to XML");

        return -1;
    }

    if (ObjectXML::validate_xml(sql_xml) != 0)
    {
        NebulaLog::log("VMP", Log::WARNING,
                       "Could not transform VM monitoring to XML" + string(sql_xml));

        db->free_str(sql_xml);
        return -1;
    }

    ostringstream oss;

    oss << "REPLACE INTO " << one_db::vm_monitor_table
        << " (" << one_db::vm_monitor_db_names << ") VALUES ("
        << monitoring.oid() << ","
        << monitoring.timestamp() << ","
        << "'" << sql_xml << "')";

    db->free_str(sql_xml);

    return db->exec_local_wr(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VMRPCPool::get_monitoring(int vmid, VirtualMachineMonitorInfo& vm)
{
    if (monitor_expiration <= 0)
    {
        return false;
    }

    ostringstream cmd;
    string monitor_str;

    cmd << "SELECT " << one_db::vm_monitor_table << ".body FROM "
        << one_db::vm_monitor_table
        << " WHERE vmid = " << vmid
        << " AND last_poll=(SELECT MAX(last_poll) FROM "
        << one_db::vm_monitor_table
        << " WHERE vmid = " << vmid << ")";

    string_cb cb(1);

    cb.set_callback(&monitor_str);

    int rc = db->exec_rd(cmd, &cb);

    cb.unset_callback();

    if (rc == 0 && !monitor_str.empty())
    {
        vm.from_xml(monitor_str);
        return true;
    }

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMRPCPool::get_vmid(const string& deploy_id)
{
    int rc;
    int vmid = -1;
    ostringstream oss;

    single_cb<int> cb;

    cb.set_callback(&vmid);

    oss << "SELECT vmid FROM " << one_db::vm_import_table
        << " WHERE deploy_id = '" << db->escape_str(deploy_id) << "'";

    rc = db->exec_rd(oss, &cb);

    cb.unset_callback();

    if (rc != 0 )
    {
        return -1;
    }

    return vmid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMRPCPool::clean_expired_monitoring()
{
    if (monitor_expiration <= 0)
    {
        return 0;
    }

    time_t max_mon_time = time(nullptr) - monitor_expiration;

    ostringstream   oss;
    oss << "DELETE FROM " << one_db::vm_monitor_table
        << " WHERE last_poll < " << max_mon_time;

    return db->exec_local_wr(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMRPCPool::clean_all_monitoring()
{
    ostringstream   oss;

    oss << "DELETE FROM " << one_db::vm_monitor_table;

    db->exec_local_wr(oss);
}
