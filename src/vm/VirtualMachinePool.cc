/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include "VirtualMachineHook.h"

#include "NebulaLog.h"
#include "Nebula.h"

#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

time_t VirtualMachinePool::_monitor_expiration;
bool   VirtualMachinePool::_submit_on_hold;
float VirtualMachinePool::_default_cpu_cost;
float VirtualMachinePool::_default_mem_cost;


const char * VirtualMachinePool::import_table = "vm_import";

const char * VirtualMachinePool::import_db_names = "deploy_id, vmid";

const char * VirtualMachinePool::import_db_bootstrap =
    "CREATE TABLE IF NOT EXISTS vm_import "
    "(deploy_id VARCHAR(128), vmid INTEGER, PRIMARY KEY(deploy_id))";


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachinePool::VirtualMachinePool(
        SqlDB *                     db,
        vector<const Attribute *>   hook_mads,
        const string&               hook_location,
        const string&               remotes_location,
        vector<const Attribute *>&  restricted_attrs,
        time_t                      expire_time,
        bool                        on_hold,
        float                       default_cpu_cost,
        float                       default_mem_cost)
    : PoolSQL(db, VirtualMachine::table, true, false)
{
    const VectorAttribute * vattr;

    string name;
    string on;
    string cmd;
    string arg;
    bool   remote;

    _monitor_expiration = expire_time;
    _submit_on_hold = on_hold;
    _default_cpu_cost = default_cpu_cost;
    _default_mem_cost = default_mem_cost;

    if ( _monitor_expiration == 0 )
    {
        clean_all_monitoring();
    }

    for (unsigned int i = 0 ; i < hook_mads.size() ; i++ )
    {
        vattr = static_cast<const VectorAttribute *>(hook_mads[i]);

        name = vattr->vector_value("NAME");
        on   = vattr->vector_value("ON");
        cmd  = vattr->vector_value("COMMAND");
        arg  = vattr->vector_value("ARGUMENTS");
        vattr->vector_value("REMOTE", remote);

        transform (on.begin(),on.end(),on.begin(),(int(*)(int))toupper);

        if ( on.empty() || cmd.empty() )
        {
            ostringstream oss;

            oss << "Empty ON or COMMAND attribute in VM_HOOK. Hook "
                << "not registered!";
            NebulaLog::log("VM",Log::WARNING,oss);

            continue;
        }

        if ( name.empty() )
        {
            name = cmd;
        }

        if (cmd[0] != '/')
        {
            ostringstream cmd_os;

            if ( remote )
            {
                cmd_os << hook_location << "/" << cmd;
            }
            else
            {
                cmd_os << remotes_location << "/hooks/" << cmd;
            }

            cmd = cmd_os.str();
        }

        if ( on == "CREATE" )
        {
            AllocateHook * hook;

            hook = new AllocateHook(name, cmd, arg, false);

            add_hook(hook);
        }
        else if ( on == "PROLOG" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                           VirtualMachine::PROLOG, VirtualMachine::ACTIVE);
            add_hook(hook);
        }
        else if ( on == "RUNNING" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                           VirtualMachine::RUNNING, VirtualMachine::ACTIVE);
            add_hook(hook);
        }
        else if ( on == "SHUTDOWN" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::EPILOG, VirtualMachine::ACTIVE);
            add_hook(hook);
        }
        else if ( on == "STOP" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::LCM_INIT, VirtualMachine::STOPPED);
            add_hook(hook);
        }
        else if ( on == "DONE" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::LCM_INIT, VirtualMachine::DONE);
            add_hook(hook);
        }
        else if ( on == "FAILED" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::LCM_INIT, VirtualMachine::FAILED);
            add_hook(hook);
        }
        else if ( on == "UNKNOWN" )
        {
            VirtualMachineStateHook * hook;

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                            VirtualMachine::UNKNOWN, VirtualMachine::ACTIVE);
            add_hook(hook);
        }
        else if ( on == "CUSTOM" )
        {
            VirtualMachineStateHook * hook;

            string lcm_str = vattr->vector_value("LCM_STATE");
            string vm_str  = vattr->vector_value("STATE");

            VirtualMachine::LcmState lcm_state;
            VirtualMachine::VmState vm_state;

            if ( VirtualMachine::lcm_state_from_str(lcm_str, lcm_state) != 0 )
            {
                ostringstream oss;
                oss << "Wrong LCM_STATE: "<< lcm_str <<". Hook not registered!";

                NebulaLog::log("VM",Log::WARNING,oss);
                continue;
            }

            if ( VirtualMachine::vm_state_from_str(vm_str, vm_state) != 0 )
            {
                ostringstream oss;
                oss << "Wrong STATE: "<< vm_str <<". Hook not registered!";

                NebulaLog::log("VM",Log::WARNING,oss);
                continue;
            }

            hook = new VirtualMachineStateHook(name, cmd, arg, remote,
                    lcm_state, vm_state);

            add_hook(hook);
        }
        else
        {
            ostringstream oss;

            oss << "Unknown VM_HOOK " << on << ". Hook not registered!";
            NebulaLog::log("VM",Log::WARNING,oss);
        }
    }

    // Set restricted attributes
    VirtualMachineTemplate::set_restricted_attributes(restricted_attrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::insert_index(const string& deploy_id, int vmid, 
    bool replace)
{
    ostringstream oss;
    char *        deploy_name = db->escape_str(deploy_id.c_str());

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

    oss << "INTO " << import_table << " ("<< import_db_names <<") "
        << " VALUES ('" << deploy_name << "'," << vmid << ")";

    db->free_str(deploy_name);

    return db->exec(oss);
};

/* -------------------------------------------------------------------------- */

void VirtualMachinePool::drop_index(const string& deploy_id)
{
    ostringstream oss;
    char *        deploy_name = db->escape_str(deploy_id.c_str());

    if (deploy_name == 0)
    {
        return;
    }

    oss << "DELETE FROM " << import_table << " WHERE deploy_id='" 
        << deploy_name << "'";

    db->exec(oss);
}

/* -------------------------------------------------------------------------- */

int VirtualMachinePool::allocate (
    int            uid,
    int            gid,
    const string&  uname,
    const string&  gname,
    int            umask,
    VirtualMachineTemplate * vm_template,
    int *          oid,
    string&        error_str,
    bool           on_hold)
{
    VirtualMachine * vm;
    
    string deploy_id;

    // ------------------------------------------------------------------------
    // Build a new Virtual Machine object
    // ------------------------------------------------------------------------
    vm = new VirtualMachine(-1, uid, gid, uname, gname, umask, vm_template);
    
    if ( _submit_on_hold == true || on_hold )
    {
        vm->state = VirtualMachine::HOLD;
    }
    else
    {
        vm->state = VirtualMachine::PENDING;
    }

    vm->user_obj_template->get("IMPORT_VM_ID", deploy_id);
    
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
       << " ORDER BY last_poll ASC LIMIT " << vm_limit;

    where = os.str();

    return PoolSQL::search(oids,VirtualMachine::table,where);
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

    return PoolSQL::search(oids,VirtualMachine::table,where);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_acct(ostringstream& oss,
                                  const string&  where,
                                  int            time_start,
                                  int            time_end)
{
    ostringstream cmd;

    cmd << "SELECT " << History::table << ".body FROM " << History::table
        << " INNER JOIN " << VirtualMachine::table
        << " WHERE vid=oid";

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
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_showback(ostringstream& oss,
                                      const string&  where,
                                      int            start_month,
                                      int            start_year,
                                      int            end_month,
                                      int            end_year)
{
    ostringstream cmd;

    cmd << "SELECT " << VirtualMachine::showback_table << ".body FROM "
        << VirtualMachine::showback_table
        << " INNER JOIN " << VirtualMachine::table
        << " WHERE vmid=oid";

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

int VirtualMachinePool::clean_expired_monitoring()
{
    if ( _monitor_expiration == 0 )
    {
        return 0;
    }

    time_t          max_last_poll;
    int             rc;
    ostringstream   oss;

    max_last_poll = time(0) - _monitor_expiration;

    oss << "DELETE FROM " << VirtualMachine::monit_table
        << " WHERE last_poll < " << max_last_poll;

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::clean_all_monitoring()
{
    ostringstream   oss;
    int             rc;

    oss << "DELETE FROM " << VirtualMachine::monit_table;

    rc = db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::dump_monitoring(
        ostringstream& oss,
        const string&  where)
{
    ostringstream cmd;

    cmd << "SELECT " << VirtualMachine::monit_table << ".body FROM "
        << VirtualMachine::monit_table
        << " INNER JOIN " << VirtualMachine::table
        << " WHERE vmid = oid";

    if ( !where.empty() )
    {
        cmd << " AND " << where;
    }

    cmd << " ORDER BY vmid, " << VirtualMachine::monit_table << ".last_poll;";

    return PoolSQL::dump(oss, "MONITORING_DATA", cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::db_int_cb(void * _int_output, int num, char **values, char **names)
{
    if ( num == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    *static_cast<int*>(_int_output) = atoi(values[0]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePool::get_vmid (const string& deploy_id)
{
    int rc;
    int vmid = -1; 
    ostringstream oss;

    set_callback(static_cast<Callbackable::Callback>(&VirtualMachinePool::db_int_cb),
                 static_cast<void *>(&vmid));

    oss << "SELECT vmid FROM " << import_table 
        << " WHERE deploy_id = '" << db->escape_str(deploy_id.c_str()) << "'";

    rc = db->exec(oss, this);

    unset_callback();

    if (rc != 0 )
    {
        return -1;
    }

    return vmid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#ifdef SBDEBUG
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

    SBRecord(float c, float m, float h): cpu_cost(c), mem_cost(m), hours(h){};
    SBRecord(): cpu_cost(0), mem_cost(0), hours(0){};

    ostringstream& to_xml(ostringstream &oss)
    {
        string cpuc_s = one_util::float_to_str(cpu_cost);
        string memc_s = one_util::float_to_str(mem_cost);
        string hour_s = one_util::float_to_str(hours);
        string cost_s = one_util::float_to_str(cpu_cost + mem_cost);

        oss << "<CPU_COST>"  << cpuc_s << "</CPU_COST>"
            << "<MEMORY_COST>"<< memc_s << "</MEMORY_COST>"
            << "<TOTAL_COST>" << cost_s << "</TOTAL_COST>"
            << "<HOURS>"     << hour_s << "</HOURS>";

        return oss;
    };

    void clear()
    {
        cpu_cost = 0;
        mem_cost = 0;
        hours    = 0;
    };

    float cpu_cost;
    float mem_cost;
    float hours;
};

int VirtualMachinePool::calculate_showback(
        int start_month,
        int start_year,
        int end_month,
        int end_year,
        string &error_str)
{
    vector<xmlNodePtr>              nodes;
    vector<xmlNodePtr>::iterator    node_it;

    vector<time_t>                  showback_slots;
    vector<time_t>::iterator        slot_it;

    
    map<int, map<time_t, SBRecord> >           vm_cost;
    map<int, map<time_t, SBRecord> >::iterator vm_it;

    map<time_t, SBRecord>::iterator vm_month_it;

    VirtualMachine* vm;

    int             rc;
    ostringstream   oss;
    ostringstream   body;
    char *          sql_body;
    string          sql_cmd_start;
    string          sql_cmd_separator;
    string          sql_cmd_end;

    tm      tmp_tm;
    int     vid;
    int     h_stime;
    int     h_etime;
    float   cpu_cost;
    float   mem_cost;
    float   cpu;
    int     mem;

#ifdef SBDEBUG
    ostringstream debug;
    time_t debug_t_0 = time(0);
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

        set_callback(static_cast<Callbackable::Callback>(&VirtualMachinePool::db_int_cb),
                     static_cast<void *>(&start_time));

        oss << "SELECT MIN(stime) FROM " << History::table;

        rc = db->exec(oss, this);

        unset_callback();
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
    // Get accounting history records
    //--------------------------------------------------------------------------

    oss.str("");
    rc = dump_acct(oss, "", start_time, end_time);

    ObjectXML xml(oss.str());

#ifdef SBDEBUG
    time_t debug_t_1 = time(0);
#endif

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
    for ( slot_it = showback_slots.begin(); slot_it != showback_slots.end(); slot_it++ )
    {
        debug.str("");
        debug << "Slot: " << put_time(*slot_it);
        NebulaLog::log("SHOWBACK", Log::DEBUG, debug);
    }
#endif

    //--------------------------------------------------------------------------
    // Process the history records
    //--------------------------------------------------------------------------

    rc = xml.get_nodes("/HISTORY_RECORDS/HISTORY", nodes);

    for ( node_it = nodes.begin(); node_it != nodes.end(); node_it++ )
    {
        ObjectXML history(*node_it);

        history.xpath(vid,      "/HISTORY/OID", -1);

        history.xpath(h_stime,  "/HISTORY/STIME", 0);
        history.xpath(h_etime,  "/HISTORY/ETIME", 0);

        history.xpath(cpu,      "/HISTORY/VM/TEMPLATE/CPU", 0);
        history.xpath(mem,      "/HISTORY/VM/TEMPLATE/MEMORY", 0);

        history.xpath(cpu_cost, "/HISTORY/VM/TEMPLATE/CPU_COST", _default_cpu_cost);
        history.xpath(mem_cost, "/HISTORY/VM/TEMPLATE/MEMORY_COST", _default_mem_cost);

#ifdef SBDDEBUG
        int seq;
        history.xpath(seq, "/HISTORY/SEQ", -1);

        debug.str("");
        debug << "VM " << vid << " SEQ " << seq << endl
            << "h_stime   " << h_stime << endl
            << "h_etime   " << h_etime << endl
            << "cpu_cost  " << cpu_cost << endl
            << "mem_cost  " << mem_cost << endl
            << "cpu       " << cpu << endl
            << "mem       " << mem;

        NebulaLog::log("SHOWBACK", Log::DEBUG, debug);
#endif

        for ( slot_it = showback_slots.begin(); slot_it != showback_slots.end()-1; slot_it++ )
        {
            time_t t      = *slot_it;
            time_t t_next = *(slot_it+1);

            if( (h_etime > t || h_etime == 0) &&
                (h_stime != 0 && h_stime <= t_next) ) {

                time_t stime = t;
                if(h_stime != 0){
                    stime = (t < h_stime) ? h_stime : t; //max(t, h_stime);
                }

                time_t etime = t_next;
                if(h_etime != 0){
                    etime = (t_next < h_etime) ? t_next : h_etime; //min(t_next, h_etime);
                }

                float n_hours = difftime(etime, stime) / 60 / 60;

                // Add to vm time slot.
                map<time_t, SBRecord>& totals = vm_cost[vid];

                if(totals.count(t) == 0)
                {
                    totals[t].clear();
                }

                totals[t].cpu_cost += cpu_cost * cpu * n_hours;
                totals[t].mem_cost += mem_cost * mem * n_hours;
                totals[t].hours    += n_hours;
            }
        }
    }

    xml.free_nodes(nodes);

#ifdef SBDEBUG
    time_t debug_t_2 = time(0);
#endif

    // Write to DB

    if (db->multiple_values_support())
    {
        oss.str("");

        oss << "REPLACE INTO " << VirtualMachine::showback_table
            << " ("<< VirtualMachine::showback_db_names <<") VALUES ";

        sql_cmd_start = oss.str();

        sql_cmd_separator = ",";

        sql_cmd_end = "";
    }
    else
    {
        oss.str("");
        oss << "BEGIN TRANSACTION; "
            << "REPLACE INTO " << VirtualMachine::showback_table
            << " ("<< VirtualMachine::showback_db_names <<") VALUES ";

        sql_cmd_start = oss.str();

        oss.str("");
        oss << "; REPLACE INTO " << VirtualMachine::showback_table
            << " ("<< VirtualMachine::showback_db_names <<") VALUES ";

        sql_cmd_separator = oss.str();

        sql_cmd_end = "; COMMIT";
    }

    oss.str("");

    int n_entries = 0;

    for ( vm_it = vm_cost.begin(); vm_it != vm_cost.end(); vm_it++ )
    {
        map<time_t, SBRecord>& totals = vm_it->second;

        for ( vm_month_it = totals.begin(); vm_month_it != totals.end(); vm_month_it++ )
        {
            int vmid = vm_it->first;

            vm = get(vmid, true);

            int uid = 0;
            int gid = 0;
            string uname = "";
            string gname = "";
            string vmname = "";

            if (vm != 0)
            {
                uid = vm->get_uid();
                gid = vm->get_gid();

                uname = vm->get_uname();
                gname = vm->get_gname();

                vmname = vm->get_name();

                vm->unlock();
            }

            localtime_r(&vm_month_it->first, &tmp_tm);

            body.str("");

            body << "<SHOWBACK>"
                    << "<VMID>"     << vmid                     << "</VMID>"
                    << "<VMNAME>"   << vmname                   << "</VMNAME>"
                    << "<UID>"      << uid                      << "</UID>"
                    << "<GID>"      << gid                      << "</GID>"
                    << "<UNAME>"    << uname                    << "</UNAME>"
                    << "<GNAME>"    << gname                    << "</GNAME>"
                    << "<YEAR>"     << tmp_tm.tm_year + 1900    << "</YEAR>"
                    << "<MONTH>"    << tmp_tm.tm_mon + 1        << "</MONTH>";

            vm_month_it->second.to_xml(body) << "</SHOWBACK>";

            sql_body =  db->escape_str(body.str().c_str());

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

            oss << " (" <<  vm_it->first            << ","
                <<          tmp_tm.tm_year + 1900   << ","
                <<          tmp_tm.tm_mon + 1       << ","
                << "'"  <<  sql_body                << "')";

            db->free_str(sql_body);

            n_entries++;

            // To avoid the oss to grow indefinitely, flush contents
            if (n_entries == 1000)
            {
                oss << sql_cmd_end;

                rc = db->exec(oss);

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

        rc = db->exec(oss);

        if (rc != 0)
        {
            error_str = "Error writing to DB.";
            return -1;
        }
    }

#ifdef SBDEBUG
    time_t debug_t_3 = time(0);

    debug.str("");
    debug << "Time to dump acct to mem: " << debug_t_1 - debug_t_0;
    NebulaLog::log("SHOWBACK", Log::DEBUG, debug);

    debug.str("");
    debug << "Time to process numbers:  " << debug_t_2 - debug_t_1;
    NebulaLog::log("SHOWBACK", Log::DEBUG, debug);

    debug.str("");
    debug << "Time to write to db:      " << debug_t_3 - debug_t_2;
    NebulaLog::log("SHOWBACK", Log::DEBUG, debug);
#endif

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
