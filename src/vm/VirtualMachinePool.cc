/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachinePool.h"

#include "NebulaLog.h"
#include "Nebula.h"
#include "HookStateVM.h"
#include "HookManager.h"
#include "ImageManager.h"
#include "HostPool.h"

#include <sstream>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachinePool::VirtualMachinePool(
        SqlDB * db,
        const vector<const SingleAttribute *>& restricted_attrs,
        const vector<const SingleAttribute *>& encrypted_attrs,
        bool    on_hold,
        float   default_cpu_cost,
        float   default_mem_cost,
        float   default_disk_cost,
        bool    showback_only_running)
    : PoolSQL(db, one_db::vm_table),
    _submit_on_hold(on_hold),
    _default_cpu_cost(default_cpu_cost), _default_mem_cost(default_mem_cost),
    _default_disk_cost(default_disk_cost),
    _showback_only_running(showback_only_running)
{
    // Set restricted attributes
    VirtualMachineTemplate::parse_restricted(restricted_attrs);

    // Set encrypted attributes
    VirtualMachineTemplate::parse_encrypted(encrypted_attrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::update(PoolObjectSQL * objsql)
{
    VirtualMachine * vm = dynamic_cast<VirtualMachine *>(objsql);

    if ( vm == 0 )
    {
        return -1;
    }

    if ( HookStateVM::trigger(vm) )
    {
        std::string event = HookStateVM::format_message(vm);

        Nebula::instance().get_hm()->trigger_send_event(event);
    }

    vm->set_prev_state();

    return vm->update(db);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::insert_index(const string& deploy_id, int vmid,
    bool replace)
{
    ostringstream oss;
    char *        deploy_name = db->escape_str(deploy_id);

    if (deploy_name == 0)
    {
        return -1;
    }

    if (replace)
    {
        oss << "REPLACE ";
    }
    else
    {
        oss << "INSERT ";
    }

    oss << "INTO " << one_db::vm_import_table
        << " (" << one_db::vm_import_db_names << ") "
        << " VALUES ('" << deploy_name << "'," << vmid << ")";

    db->free_str(deploy_name);

    return db->exec_wr(oss);
};

/* -------------------------------------------------------------------------- */

void VirtualMachinePool::drop_index(const string& deploy_id)
{
    ostringstream oss;
    char *        deploy_name = db->escape_str(deploy_id);

    if (deploy_name == 0)
    {
        return;
    }

    oss << "DELETE FROM " << one_db::vm_import_table << " WHERE deploy_id='"
        << deploy_name << "'";

    db->exec_wr(oss);
}

/* -------------------------------------------------------------------------- */

int VirtualMachinePool::allocate(
    int            uid,
    int            gid,
    const string&  uname,
    const string&  gname,
    int            umask,
    unique_ptr<VirtualMachineTemplate> vm_template,
    int *          oid,
    string&        error_str,
    bool           on_hold)
{
    string deploy_id;

    // ------------------------------------------------------------------------
    // Build a new Virtual Machine object
    // ------------------------------------------------------------------------
    auto vm = new VirtualMachine(-1, uid, gid, uname, gname, umask, move(vm_template));

    if ( _submit_on_hold == true || on_hold )
    {
        vm->state = VirtualMachine::HOLD;

        vm->user_obj_template->replace("SUBMIT_ON_HOLD", true);
    }
    else
    {
        vm->state = VirtualMachine::PENDING;
    }

    vm->prev_state = vm->state;

    vm->user_obj_template->get("DEPLOY_ID", deploy_id);

    if (!deploy_id.empty())
    {
        vm->state = VirtualMachine::HOLD;

        if (insert_index(deploy_id, -1, false) == -1) //Set import in progress
        {
            delete vm;

            error_str = "Virtual Machine " + deploy_id + " already imported.";
            return -1;
        }
    }

    // ------------------------------------------------------------------------
    // Insert the Object in the pool
    // ------------------------------------------------------------------------

    *oid = PoolSQL::allocate(vm, error_str);

    // ------------------------------------------------------------------------
    // Insert the deploy_id - vmid index for imported VMs
    // ------------------------------------------------------------------------

    if (!deploy_id.empty())
    {
        if (*oid >= 0)
        {
            insert_index(deploy_id, *oid, true);
        }
        else
        {
            drop_index(deploy_id);
        }
    }

    if (*oid >= 0)
    {
        if (auto vm2 = get_ro(*oid))
        {
            std::string event = HookStateVM::format_message(vm2.get());

            Nebula::instance().get_hm()->trigger_send_event(event);
        }
    }

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_running(
    vector<int>&    oids,
    int             vm_limit,
    time_t          last_poll)
{
    ostringstream   os;
    string          where;

    os << "last_poll <= " << last_poll << " and"
       << " state = " << VirtualMachine::ACTIVE
       << " and ( lcm_state = " << VirtualMachine::RUNNING
       << " or lcm_state = " << VirtualMachine::UNKNOWN << " )"
       << " ORDER BY last_poll ASC " << db->limit_string(vm_limit);

    where = os.str();

    return PoolSQL::search(oids, one_db::vm_table, where);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_pending(
    vector<int>&    oids)
{
    ostringstream   os;
    string          where;

    os << "state = " << VirtualMachine::PENDING;

    where = os.str();

    return PoolSQL::search(oids, one_db::vm_table, where);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_backup(vector<int>& oids)
{
    ostringstream   os;

    os << "state = " << VirtualMachine::ACTIVE
       << " and ( lcm_state = " << VirtualMachine::BACKUP
       << " or lcm_state = " << VirtualMachine::BACKUP_POWEROFF << " )";

    return PoolSQL::search(oids, one_db::vm_table, os.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_acct(string& oss, const string&  where,
    int time_start, int time_end)
{
    ostringstream cmd;

    cmd << "SELECT " << one_db::history_table << ".body FROM "
        << one_db::history_table
        << " INNER JOIN " << one_db::vm_table << " ON vid=oid";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    if ( time_start != -1 || time_end != -1 )
    {
        if ( time_start != -1 )
        {
            cmd << " AND (etime > " << time_start << " OR  etime = 0)";
        }

        if ( time_end != -1 )
        {
            cmd << " AND stime < " << time_end;
        }
    }

    cmd << " ORDER BY vid,seq";

    return PoolSQL::dump(oss, "HISTORY_RECORDS", cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_acct(string& oss,
    int time_start, int time_end, int sid, int rows)
{
    ostringstream cmd;

    cmd << "SELECT " << "body FROM " << one_db::history_table;

    if ( time_start != -1 || time_end != -1 )
    {
        string next = " WHERE ";

        if ( time_start != -1 )
        {
            cmd << " WHERE (etime > " << time_start << " OR  etime = 0)";
            next = " AND ";
        }

        if ( time_end != -1 )
        {
            cmd << next << "stime < " << time_end;
        }
    }

    cmd << " ORDER BY vid,seq";

    if (rows != -1)
    {
        cmd << " " << db->limit_string(sid, rows);
    }

    return PoolSQL::dump(oss, "HISTORY_RECORDS", cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_showback(string& oss,
                                      const string&  where,
                                      int            start_month,
                                      int            start_year,
                                      int            end_month,
                                      int            end_year)
{
    ostringstream cmd;

    cmd << "SELECT " << one_db::vm_showback_table << ".body FROM "
        << one_db::vm_showback_table
        << " INNER JOIN " << one_db::vm_table << " ON vmid=oid";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    if ( (start_month != -1 && start_year != -1) ||
         (end_month != -1 && end_year != -1) )
    {
        if (start_month != -1 && start_year != -1)
        {
            cmd << " AND (year > " << start_year <<
                   " OR  (year = " << start_year << " AND month >= " << start_month << ") )";
        }

        if (end_month != -1 && end_year != -1)
        {
            cmd << " AND (year < " << end_year <<
                   " OR  (year = " << end_year << " AND month <= " << end_month << ") )";
        }
    }

    cmd << " ORDER BY year,month,vmid";

    return PoolSQL::dump(oss, "SHOWBACK_RECORDS", cmd);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_monitoring(
        string& oss,
        const string&  where,
        const int seconds)
{
    ostringstream cmd;

    switch (seconds)
    {
        case 0: //Get last monitor value
            /*
            * SELECT vm_monitoring.body
            * FROM vm_monitoring
            *     INNER JOIN (
            *         SELECT vmid, MAX(last_poll) as last_poll
            *             FROM vm_monitoring
            *             GROUP BY vmid
            *     ) lpt on lpt.vmid = vm_monitoring.vmid AND lpt.last_poll = vm_monitoring.last_poll
            *     INNER JOIN vm_pool ON vm_monitoring.vmid = oid
            * ORDER BY oid;
            */
            cmd << "SELECT " << one_db::vm_monitor_table << ".body "
                << "FROM " << one_db::vm_monitor_table << " INNER JOIN ("
                << "SELECT vmid, MAX(last_poll) as last_poll FROM "
                << one_db::vm_monitor_table << " GROUP BY vmid) as lpt "
                << "ON lpt.vmid = " << one_db::vm_monitor_table << ".vmid "
                << "AND lpt.last_poll = " << one_db::vm_monitor_table
                << ".last_poll INNER JOIN " << one_db::vm_table
                << " ON " << one_db::vm_monitor_table << ".vmid = oid";

            if ( !where.empty() )
            {
                cmd << " WHERE " << where;
            }

            cmd << " ORDER BY oid";

            break;

        case -1: //Get all monitoring
            cmd << "SELECT " << one_db::vm_monitor_table << ".body FROM "
                << one_db::vm_monitor_table << " INNER JOIN " << one_db::vm_table
                << " ON vmid = oid";

            if ( !where.empty() )
            {
                cmd << " WHERE " << where;
            }

            cmd << " ORDER BY vmid, " << one_db::vm_monitor_table << ".last_poll;";

            break;

        default: //Get monitor in last s seconds
            cmd << "SELECT " << one_db::vm_monitor_table << ".body FROM "
                << one_db::vm_monitor_table << " INNER JOIN " << one_db::vm_table
                << " ON vmid = oid WHERE " << one_db::vm_monitor_table
                << ".last_poll > " << time(nullptr) - seconds;

            if ( !where.empty() )
            {
                cmd << " AND " << where;
            }

            cmd << " ORDER BY vmid, " << one_db::vm_monitor_table << ".last_poll;";

            break;
    }

    return PoolSQL::dump(oss, "MONITORING_DATA", cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineMonitorInfo VirtualMachinePool::get_monitoring(int vmid)
{
    ostringstream cmd;
    string monitor_str;

    cmd << "SELECT " << one_db::vm_monitor_table << ".body FROM "
        << one_db::vm_monitor_table
        << " WHERE vmid = " << vmid
        << " AND last_poll=(SELECT MAX(last_poll) FROM "
        << one_db::vm_monitor_table
        << " WHERE vmid = " << vmid << ")";

    VirtualMachineMonitorInfo info(vmid, 0);

    if (PoolSQL::dump(monitor_str, "", cmd) == 0 && !monitor_str.empty())
    {
        info.from_xml(monitor_str);
    }

    return info;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_vmid(const string& deploy_id)
{
    int rc;
    int vmid = -1;
    ostringstream oss;

    auto sql_id = db->escape_str(deploy_id);

    single_cb<int> cb;

    cb.set_callback(&vmid);

    oss << "SELECT vmid FROM " << one_db::vm_import_table
        << " WHERE deploy_id = '" << sql_id << "'";

    rc = db->exec_rd(oss, &cb);

    cb.unset_callback();

    db->free_str(sql_id);

    if (rc != 0 )
    {
        return -1;
    }

    return vmid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#ifdef SBDEBUG
#include <chrono>

static string put_time(tm tmp_tm)
{
    ostringstream oss;

    oss << tmp_tm.tm_mday << "/" << tmp_tm.tm_mon+1 << "/" << tmp_tm.tm_year+1900
        << " " << tmp_tm.tm_hour << ":" << tmp_tm.tm_min << ":" << tmp_tm.tm_sec;

    return oss.str();
}

static string put_time(time_t t)
{
    tm tmp_tm = *localtime(&t);
    return put_time(tmp_tm);
}
#endif

/* -------------------------------------------------------------------------- */

/**
 *  SBrecord is an implementation structure to aggregate metric costs. It
 *  includes a method to write the showback record to an xml stream
 */
struct SBRecord {
    ostringstream& to_xml(ostringstream &oss)
    {
        string cpuc_s = one_util::float_to_str(cpu_cost);
        string memc_s = one_util::float_to_str(mem_cost);
        string diskc_s= one_util::float_to_str(disk_cost);
        string hour_s = one_util::float_to_str(hours);
        string rhour_s= one_util::float_to_str(rhours);
        string cost_s = one_util::float_to_str(cpu_cost + mem_cost + disk_cost);

        oss << "<CPU_COST>"   << cpuc_s << "</CPU_COST>"
            << "<MEMORY_COST>"<< memc_s << "</MEMORY_COST>"
            << "<DISK_COST>"  << diskc_s<< "</DISK_COST>"
            << "<TOTAL_COST>" << cost_s << "</TOTAL_COST>"
            << "<HOURS>"      << hour_s << "</HOURS>"
            << "<RHOURS>"     << rhour_s << "</RHOURS>";

        return oss;
    };

    float cpu_cost = 0;
    float mem_cost = 0;
    float disk_cost = 0;
    float hours = 0;
    float rhours = 0;
};

struct VMCost {
    int uid = -1;
    int gid = -1;

    string uname;
    string gname;

    string vmname;

    map<time_t, SBRecord> totals;
};

int VirtualMachinePool::calculate_showback(
        int start_month,
        int start_year,
        int end_month,
        int end_year,
        string &error_str)
{
    vector<xmlNodePtr> nodes;
    vector<time_t>     showback_slots;
    map<int, VMCost>   vm_costs;

    int             rc;
    ostringstream   oss;
    ostringstream   body;
    char *          sql_body;
    string          sql_cmd_start;
    string          sql_cmd_separator;
    string          sql_cmd_end;

    tm    tmp_tm;
    int   vid;
    time_t   h_stime, h_rstime;
    time_t   h_etime, h_retime;
    float cpu_cost;
    float mem_cost;
    float disk_cost;
    float cpu;
    float disk;
    int   mem;

#ifdef SBDEBUG
    ostringstream debug;
    auto debug_t_0 = std::chrono::high_resolution_clock::now();
#endif

    //--------------------------------------------------------------------------
    // Set start and end times for the window to process
    //--------------------------------------------------------------------------

    tzset();

    time_t start_time = time(0);
    time_t end_time   = time(0);

    if (start_month != -1 && start_year != -1)
    {
        // First day of the given month
        tmp_tm.tm_sec  = 0;
        tmp_tm.tm_min  = 0;
        tmp_tm.tm_hour = 0;
        tmp_tm.tm_mday = 1;
        tmp_tm.tm_mon  = start_month - 1;
        tmp_tm.tm_year = start_year - 1900;
        tmp_tm.tm_isdst = -1;

        start_time = mktime(&tmp_tm);
    }
    else
    {
        // Set start time to the lowest stime from the history records
        single_cb<time_t> cb;

        cb.set_callback(&start_time);

        oss << "SELECT MIN(stime) FROM " << one_db::history_table;

        rc = db->exec_rd(oss, &cb);

        cb.unset_callback();
    }

    if (end_month != -1 && end_year != -1)
    {
        // First day of the next month
        tmp_tm.tm_sec  = 0;
        tmp_tm.tm_min  = 0;
        tmp_tm.tm_hour = 0;
        tmp_tm.tm_mday = 1;
        tmp_tm.tm_mon  = end_month;
        tmp_tm.tm_year = end_year - 1900;
        tmp_tm.tm_isdst = -1;

        time_t end_time_tmp = mktime(&tmp_tm);

        if (end_time_tmp < end_time)
        {
            end_time = end_time_tmp;
        }
    }

    //--------------------------------------------------------------------------
    // Create the monthly time slots
    //--------------------------------------------------------------------------

    // Reset stime to 1st of month, 00:00
    localtime_r(&start_time, &tmp_tm);

    tmp_tm.tm_sec  = 0;
    tmp_tm.tm_min  = 0;
    tmp_tm.tm_hour = 0;
    tmp_tm.tm_mday = 1;
    tmp_tm.tm_isdst = -1;

    time_t tmp_t = mktime(&tmp_tm);

    while(tmp_t < end_time)
    {
        showback_slots.push_back(tmp_t);

        tmp_tm.tm_sec  = 0;
        tmp_tm.tm_min  = 0;
        tmp_tm.tm_hour = 0;
        tmp_tm.tm_mday = 1;
        tmp_tm.tm_mon++;
        tmp_tm.tm_isdst = -1;

        tmp_t = mktime(&tmp_tm);
    }

    // Extra slot that won't be used. Is needed only to calculate the time
    // for the second-to-last slot
    showback_slots.push_back(end_time);

#ifdef SBDDEBUG
    for ( auto slot_it = showback_slots.begin(); slot_it != showback_slots.end(); slot_it++ )
    {
        debug.str("");
        debug << "Slot: " << put_time(*slot_it);
        NebulaLog::log("SHOWBACK", Log::DEBUG, debug);
    }
#endif

#ifdef SBDEBUG
    auto debug_t_1 = std::chrono::high_resolution_clock::now();
#endif

    int start_index = 0;
    const int chunk_size = 10000;

    do
    {
        //--------------------------------------------------------------------------
        // Get accounting history records
        //--------------------------------------------------------------------------

        std::string acct_str;

        dump_acct(acct_str, start_time, end_time, start_index, chunk_size);
        start_index += chunk_size;

        ObjectXML xml(acct_str);

        //--------------------------------------------------------------------------
        // Process the history records
        //--------------------------------------------------------------------------

        nodes.clear();
        xml.get_nodes("/HISTORY_RECORDS/HISTORY", nodes);

        for ( auto node : nodes )
        {
            ObjectXML history(node);

            history.xpath(vid,      "/HISTORY/OID", -1);

            history.xpath(h_stime,  "/HISTORY/STIME", (time_t)0);
            history.xpath(h_etime,  "/HISTORY/ETIME", (time_t)0);

            history.xpath(h_rstime,  "/HISTORY/RSTIME", (time_t)0);
            history.xpath(h_retime,  "/HISTORY/RETIME", (time_t)0);

            history.xpath<float>(cpu,  "/HISTORY/VM/TEMPLATE/CPU", 0.0);
            history.xpath(mem,  "/HISTORY/VM/TEMPLATE/MEMORY", 0);
            history.xpath<float>(disk, "sum(/HISTORY/VM/TEMPLATE/DISK/SIZE | "
                "/HISTORY/VM/TEMPLATE/DISK/DISK_SNAPSHOT_TOTAL_SIZE)", 0.0);

            history.xpath(cpu_cost, "/HISTORY/VM/TEMPLATE/CPU_COST", _default_cpu_cost);
            history.xpath(mem_cost, "/HISTORY/VM/TEMPLATE/MEMORY_COST", _default_mem_cost);
            history.xpath(disk_cost,"/HISTORY/VM/TEMPLATE/DISK_COST", _default_disk_cost);

            auto& vm_cost = vm_costs[vid];
            history.xpath(vm_cost.vmname, "/HISTORY/VM/NAME", "");
            history.xpath(vm_cost.uid, "/HISTORY/VM/UID", -1);
            history.xpath(vm_cost.uname, "/HISTORY/VM/UNAME", "");
            history.xpath(vm_cost.gid, "/HISTORY/VM/GID", -1);
            history.xpath(vm_cost.gname, "/HISTORY/VM/GNAME", "");

    #ifdef SBDDEBUG
            int seq;
            history.xpath(seq, "/HISTORY/SEQ", -1);

            debug.str("");
            debug << "VM " << vid << " SEQ " << seq << endl
                << "h_stime   " << h_stime << endl
                << "h_etime   " << h_etime << endl
                << "cpu_cost  " << cpu_cost << endl
                << "mem_cost  " << mem_cost << endl
                << "disk_cost " << disk_cost << endl
                << "cpu       " << cpu << endl
                << "mem       " << mem << endl
                << "disk      " << disk;

            NebulaLog::log("SHOWBACK", Log::DEBUG, debug);
    #endif

            for ( auto slot_it = showback_slots.begin(); slot_it != showback_slots.end()-1; slot_it++ )
            {
                time_t t      = *slot_it;
                time_t t_next = *(slot_it+1);

                auto count_sb_record = [&](time_t st, time_t et, bool cpu_mem, bool disk_total, bool running_hours)
                {
                    if( (et > t || et == 0) &&
                        (st != 0 && st <= t_next) ) {

                        time_t stime = max(t, st);

                        time_t etime = t_next;
                        if(et != 0){
                            etime = min(t_next, et);
                        }

                        float n_hours = difftime(etime, stime) / 60 / 60;

                        // Add to vm time slot.
                        SBRecord& totals = vm_cost.totals[t];

                        if (cpu_mem)
                        {
                            totals.cpu_cost += cpu_cost * cpu * n_hours;
                            totals.mem_cost += mem_cost * mem * n_hours;
                        }
                        if (disk_total)
                        {
                            totals.disk_cost+= disk_cost* disk* n_hours;
                            totals.hours    += n_hours;
                        }
                        if (running_hours)
                        {
                            totals.rhours   += n_hours;
                        }
                    }
                };

                if (_showback_only_running)
                {
                    count_sb_record(h_stime, h_etime, false, true, false);
                    count_sb_record(h_rstime, h_retime, true, false, true);
                }
                else
                {
                    count_sb_record(h_stime, h_etime, true, true, false);
                    count_sb_record(h_rstime, h_retime, false, false, true);
                }
            }
        }

        xml.free_nodes(nodes);
    }
    while (!nodes.empty());

#ifdef SBDEBUG
    auto debug_t_2 = std::chrono::high_resolution_clock::now();
#endif

    // Write to DB

    if (db->supports(SqlDB::SqlFeature::MULTIPLE_VALUE))
    {
        oss.str("");

        oss << "REPLACE INTO " << one_db::vm_showback_table
            << " ("<< one_db::vm_showback_db_names <<") VALUES ";

        sql_cmd_start = oss.str();

        sql_cmd_separator = ",";

        sql_cmd_end = "";
    }
    else
    {
        oss.str("");
        oss << "BEGIN TRANSACTION; "
            << "REPLACE INTO " << one_db::vm_showback_table
            << " ("<< one_db::vm_showback_db_names <<") VALUES ";

        sql_cmd_start = oss.str();

        oss.str("");
        oss << "; REPLACE INTO " << one_db::vm_showback_table
            << " ("<< one_db::vm_showback_db_names <<") VALUES ";

        sql_cmd_separator = oss.str();

        sql_cmd_end = "; COMMIT";
    }

    oss.str("");

    int n_entries = 0;

    for ( auto vm_it = vm_costs.begin(); vm_it != vm_costs.end(); vm_it++ )
    {
        int vmid = vm_it->first;
        auto& vm_cost = vm_it->second;
        map<time_t, SBRecord>& totals = vm_cost.totals;

        for ( auto vm_month_it = totals.begin(); vm_month_it != totals.end(); vm_month_it++ )
        {
            localtime_r(&vm_month_it->first, &tmp_tm);

            body.str("");

            body << "<SHOWBACK>"
                    << "<VMID>"     << vmid                     << "</VMID>"
                    << "<VMNAME>"   << vm_cost.vmname           << "</VMNAME>"
                    << "<UID>"      << vm_cost.uid              << "</UID>"
                    << "<GID>"      << vm_cost.gid              << "</GID>"
                    << "<UNAME>"    << vm_cost.uname            << "</UNAME>"
                    << "<GNAME>"    << vm_cost.gname            << "</GNAME>"
                    << "<YEAR>"     << tmp_tm.tm_year + 1900    << "</YEAR>"
                    << "<MONTH>"    << tmp_tm.tm_mon + 1        << "</MONTH>";

            vm_month_it->second.to_xml(body) << "</SHOWBACK>";

            sql_body =  db->escape_str(body.str());

            if ( sql_body == 0 )
            {
                error_str = "Error creating XML body.";
                return -1;
            }

            if (n_entries == 0)
            {
                oss.str("");
                oss << sql_cmd_start;
            }
            else
            {
                oss << sql_cmd_separator;
            }

            oss << " (" <<  vmid                    << ","
                <<          tmp_tm.tm_year + 1900   << ","
                <<          tmp_tm.tm_mon + 1       << ","
                << "'"  <<  sql_body                << "')";

            db->free_str(sql_body);

            n_entries++;

            // To avoid the oss to grow indefinitely, flush contents
            if (n_entries == 1000)
            {
                oss << sql_cmd_end;

                rc = db->exec_wr(oss);

                if (rc != 0)
                {
                    error_str = "Error writing to DB.";
                    return -1;
                }

                n_entries = 0;
            }

#ifdef SBDDEBUG
            debug.str("");

            debug << "VM " << vm_it->first
                << " cost for Y " << tmp_tm.tm_year + 1900
                << " M " << tmp_tm.tm_mon + 1
                << " COST " << one_util::float_to_str(
                        vm_month_it->second.cpu_cost +
                        vm_month_it->second.mem_cost) << " €"
                << " HOURS " << vm_month_it->second.hours;

            NebulaLog::log("SHOWBACK", Log::DEBUG, debug);
#endif
        }
    }

    if (n_entries > 0)
    {
        oss << sql_cmd_end;

        rc = db->exec_wr(oss);

        if (rc != 0)
        {
            error_str = "Error writing to DB.";
            return -1;
        }
    }

#ifdef SBDEBUG
    auto debug_t_3 = std::chrono::high_resolution_clock::now();

    debug.str("");
    debug << "Preparation time:        " << std::chrono::duration_cast<std::chrono::duration<double>>(debug_t_1 - debug_t_0).count();
    NebulaLog::log("SHOWBACK", Log::DEBUG, debug);

    debug.str("");
    debug << "Time to process numbers: " << std::chrono::duration_cast<std::chrono::duration<double>>(debug_t_2 - debug_t_1).count();
    NebulaLog::log("SHOWBACK", Log::DEBUG, debug);

    debug.str("");
    debug << "Time to write to db:     " << std::chrono::duration_cast<std::chrono::duration<double>>(debug_t_3 - debug_t_2).count();
    NebulaLog::log("SHOWBACK", Log::DEBUG, debug);
#endif

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePool::delete_attach_disk(std::unique_ptr<VirtualMachine> vm)
{
    int uid;
    int gid;
    int oid;

    VirtualMachineDisk * disk = nullptr;

    disk = vm->delete_attach_disk();

    uid  = vm->get_uid();
    gid  = vm->get_gid();
    oid  = vm->get_oid();

    update(vm.get());

    if ( disk == nullptr )
    {
        return;
    }

    // skip image release if there is other disk using the same image
    int      image_id;
    set<int> image_ids;

    disk->vector_value("IMAGE_ID", image_id);

    vm->get_disks().get_image_ids(image_ids, uid);

    bool do_image_release = image_ids.count(image_id) == 0;

    vm.reset();

    Nebula&       nd     = Nebula::instance();
    ImageManager* imagem = nd.get_imagem();

    Template tmpl;

    tmpl.set(disk->vector_attribute());
    tmpl.add("VMS", 0);

    if (disk->is_volatile())
    {
        Quotas::quota_del(Quotas::VM, uid, gid, &tmpl);
    }
    else
    {
        Quotas::quota_del(Quotas::IMAGE, uid, gid, &tmpl);

        if (!disk->is_persistent())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &tmpl);
        }

        const Snapshots * snaps = disk->get_snapshots();

        if (snaps != nullptr)
        {
            imagem->set_image_snapshots(image_id, *snaps);
        }
        else
        {
            imagem->clear_image_snapshots(image_id);
        }

        if (do_image_release)
        {
            imagem->release_image(oid, image_id, false);
        }
    }

    delete disk;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePool::delete_attach_nic(std::unique_ptr<VirtualMachine> vm)
{
    set<int> pre, post;

    Template tmpl;

    vm->get_security_groups(pre);

    VirtualMachineNic * nic = vm->delete_attach_nic();

    if ( nic == nullptr )
    {
        update(vm.get());

        return;
    }

    int hid  = vm->get_hid();
    int vmid = vm->get_oid();

    int nic_id  = nic->get_nic_id();

    if (!nic->is_alias())
    {
        vm->clear_nic_context(nic_id);
    }
    else
    {
        int parent_id, alias_id;

        nic->vector_value("PARENT_ID", parent_id);
        nic->vector_value("ALIAS_ID", alias_id);

        vm->clear_nic_alias_context(parent_id, alias_id);

        VirtualMachineNic * p_nic = vm->get_nic(parent_id);

        // As NIC is an alias, parent ALIAS_IDS array should be updated
        // to remove the alias_id
        std::set<int> p_a_ids;

        one_util::split_unique(p_nic->vector_value("ALIAS_IDS"), ',', p_a_ids);

        p_a_ids.erase(nic_id);

        p_nic->replace("ALIAS_IDS", one_util::join(p_a_ids, ','));
    }

    int uid = vm->get_uid();
    int gid = vm->get_gid();
    int oid = vm->get_oid();

    vm->get_security_groups(post);

    for (auto sg :pre)
    {
        if ( post.find(sg) == post.end() )
        {
            vm->remove_security_group(sg);
        }
    }

    std::set<int> a_ids;

    one_util::split_unique(nic->vector_value("ALIAS_IDS"), ',', a_ids);

    for (auto a_id : a_ids)
    {
        int alias_id;

        auto nic_a = vm->get_nic(a_id);

        nic_a->vector_value("ALIAS_ID", alias_id);

        tmpl.set(nic_a->vector_attribute()->clone());

        nic_a->release_network_leases(oid);

        vm->clear_nic_alias_context(nic_id, alias_id);
    }

    nic->release_network_leases(oid);

    vm->delete_attach_alias(nic);

    update(vm.get());

    vm.reset();

    //Check if PCI and delete capacity from host
    if (nic->is_pci() && hid != -1)
    {
        HostPool * hpool = Nebula::instance().get_hpool();

        HostShareCapacity sr;

        sr.vmid = vmid;
        sr.pci.push_back(nic->vector_attribute());

        if (auto host = hpool->get(hid))
        {
            host->del_pci(sr);
            hpool->update(host.get());
        }
    }

    //Adjust quotas
    tmpl.set(nic->vector_attribute());

    Quotas::quota_del(Quotas::NETWORK, uid, gid, &tmpl);

    delete nic;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

