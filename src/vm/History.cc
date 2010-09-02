/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "VirtualMachine.h"
#include "Nebula.h"

#include <iostream>
#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * History::table = "history";

const char * History::db_names = "(vid,seq,host_name,vm_dir,hid,vm_mad,tm_mad,stime,"
    "etime,pstime,petime,rstime,retime,estime,eetime,reason)";

const char * History::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "history (vid INTEGER,"
    "seq INTEGER,host_name TEXT,vm_dir TEXT,hid INTEGER,vm_mad TEXT,tm_mad TEXT,"
    "stime INTEGER,etime INTEGER,pstime INTEGER,petime INTEGER,rstime INTEGER,"
    "retime INTEGER,estime INTEGER,eetime INTEGER,reason INTEGER,"
    "PRIMARY KEY(vid,seq))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

History::History(
    int _oid,
    int _seq):
        oid(_oid),
        seq(_seq),
        hostname(""),
        vm_dir(""),
        hid(-1),
        vmm_mad_name(""),
        tm_mad_name(""),
        stime(0),
        etime(0),
        prolog_stime(0),
        prolog_etime(0),
        running_stime(0),
        running_etime(0),
        epilog_stime(0),
        epilog_etime(0),
        reason(NONE){};

/* -------------------------------------------------------------------------- */

History::History(
    int     		_oid,
    int     		_seq,
    int     		_hid,
    string& 		_hostname,
    string& 		_vm_dir,
    string& 		_vmm,
    string& 		_tm):
        oid(_oid),
        seq(_seq),
        hostname(_hostname),
        vm_dir(_vm_dir),
        hid(_hid),
        vmm_mad_name(_vmm),
        tm_mad_name(_tm),
        stime(0),
        etime(0),
        prolog_stime(0),
        prolog_etime(0),
        running_stime(0),
        running_etime(0),
        epilog_stime(0),
        epilog_etime(0),
        reason(NONE)
{
    non_persistent_data();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void History::non_persistent_data()
{
    ostringstream   os;
    Nebula& 		nd = Nebula::instance();

    // ----------- Local Locations ------------
    os.str("");
    os << nd.get_var_location() << oid;

    vm_lhome = os.str();

    os << "/deployment." << seq;

    deployment_file = os.str();

    os.str("");
    os << vm_lhome << "/transfer." << seq;

    transfer_file = os.str();

    os.str("");
    os << vm_lhome << "/context.sh";

    context_file = os.str();

    // ----------- Remote Locations ------------
    os.str("");
    os << vm_dir << "/" << oid << "/images";

    vm_rhome = os.str();

    os << "/checkpoint";

    checkpoint_file = os.str();

    os.str("");
    os << vm_rhome << "/deployment." << seq;

    rdeployment_file = os.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::insert(SqlDB * db, string& error_str)
{
    int             rc;

    rc = insert_replace(db, false);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::update(SqlDB * db)
{
    int             rc;

    rc = insert_replace(db, true);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    int    rc;

    char * sql_hostname;
    char * sql_vm_dir;
    char * sql_vmm_mad_name;
    char * sql_tm_mad_name;

    if (seq == -1)
    {
        return 0;
    }

    sql_hostname = db->escape_str(hostname.c_str());

    if ( sql_hostname == 0 )
    {
        goto error_hostname;
    }

    sql_vm_dir = db->escape_str(vm_dir.c_str());

    if ( sql_vm_dir == 0 )
    {
        goto error_vm_dir;
    }

    sql_vmm_mad_name = db->escape_str(vmm_mad_name.c_str());

    if ( sql_vmm_mad_name == 0 )
    {
        goto error_vmm;
    }

    sql_tm_mad_name = db->escape_str(tm_mad_name.c_str());

    if ( sql_tm_mad_name == 0 )
    {
        goto error_tm;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " "<< db_names <<" VALUES ("<<
        oid << "," <<
        seq << "," <<
        "'" << sql_hostname << "',"<<
        "'" << sql_vm_dir << "'," <<
        hid << "," <<
        "'" << sql_vmm_mad_name << "'," <<
        "'" << sql_tm_mad_name  << "'," <<
        stime << "," <<
        etime << "," <<
        prolog_stime  << "," <<
        prolog_etime  << "," <<
        running_stime << "," <<
        running_etime << "," <<
        epilog_stime  << "," <<
        epilog_etime  << "," <<
        reason << ")";

    rc = db->exec(oss);

    db->free_str(sql_hostname);
    db->free_str(sql_vm_dir);
    db->free_str(sql_vmm_mad_name);
    db->free_str(sql_tm_mad_name);

    return rc;

error_tm:
    db->free_str(sql_vmm_mad_name);
error_vmm:
    db->free_str(sql_vm_dir);
error_vm_dir:
    db->free_str(sql_hostname);
error_hostname:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::select_cb(void *nil, int num, char **values, char **names)
{
    if ((!values[VID]) ||
        (!values[SEQ]) ||
        (!values[HOSTNAME]) ||
        (!values[VM_DIR]) ||
        (!values[HID]) ||
        (!values[VMMMAD]) ||
        (!values[TMMAD]) ||
        (!values[STIME]) ||
        (!values[ETIME]) ||
        (!values[PROLOG_STIME]) ||
        (!values[PROLOG_ETIME]) ||
        (!values[RUNNING_STIME]) ||
        (!values[RUNNING_ETIME]) ||
        (!values[EPILOG_STIME]) ||
        (!values[EPILOG_ETIME]) ||
        (!values[REASON]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid      = atoi(values[VID]);
    seq      = atoi(values[SEQ]);

    hostname = values[HOSTNAME];
    vm_dir   = values[VM_DIR];

    hid      = atoi(values[HID]);

    vmm_mad_name = values[VMMMAD];
    tm_mad_name  = values[TMMAD];

    stime = static_cast<time_t>(atoi(values[STIME]));
    etime = static_cast<time_t>(atoi(values[ETIME]));

    prolog_stime = static_cast<time_t>(atoi(values[PROLOG_STIME]));
    prolog_etime = static_cast<time_t>(atoi(values[PROLOG_ETIME]));

    running_stime = static_cast<time_t>(atoi(values[RUNNING_STIME]));
    running_etime = static_cast<time_t>(atoi(values[RUNNING_ETIME]));

    epilog_stime = static_cast<time_t>(atoi(values[EPILOG_STIME]));
    epilog_etime = static_cast<time_t>(atoi(values[EPILOG_ETIME]));

    reason = static_cast<MigrationReason>(atoi(values[REASON]));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::dump(ostringstream& oss, int num, char **values, char **names)
{
    if ((!values[VID])||
        (!values[SEQ])||
        (!values[HOSTNAME])||
        (!values[HID])||
        (!values[STIME])||
        (!values[ETIME])||
        (!values[PROLOG_STIME])||
        (!values[PROLOG_ETIME])||
        (!values[RUNNING_STIME])||
        (!values[RUNNING_ETIME])||
        (!values[EPILOG_STIME])||
        (!values[EPILOG_ETIME])||
        (!values[REASON])||
        (num != LIMIT))
    {
        return -1;
    }

    oss <<
        "<HISTORY>" <<
          "<SEQ>"     << values[SEQ]           << "</SEQ>"     <<
          "<HOSTNAME>"<< values[HOSTNAME]      << "</HOSTNAME>"<<
          "<HID>"     << values[HID]           << "</HID>"     <<
          "<STIME>"   << values[STIME]         << "</STIME>"   <<
          "<ETIME>"   << values[ETIME]         << "</ETIME>"   <<
          "<PSTIME>"  << values[PROLOG_STIME]  << "</PSTIME>"  <<
          "<PETIME>"  << values[PROLOG_ETIME]  << "</PETIME>"  <<
          "<RSTIME>"  << values[RUNNING_STIME] << "</RSTIME>"  <<
          "<RETIME>"  << values[RUNNING_ETIME] << "</RETIME>"  <<
          "<ESTIME>"  << values[EPILOG_STIME]  << "</ESTIME>"  <<
          "<EETIME>"  << values[EPILOG_ETIME]  << "</EETIME>"  <<
          "<REASON>"  << values[REASON]        << "</REASON>"  <<
        "</HISTORY>";

    return 0;
}

/* -------------------------------------------------------------------------- */

int History::select(SqlDB * db)
{
    ostringstream   oss;
    int             rc;

    if (oid == -1)
    {
        return -1;
    }

    if ( seq == -1)
    {
        oss << "SELECT * FROM history WHERE vid = "<< oid <<
            " AND seq=(SELECT MAX(seq) FROM history WHERE vid = " << oid << ")";
    }
    else
    {
        oss << "SELECT * FROM history WHERE vid = "<< oid <<" AND seq = "<< seq;
    }

    set_callback(static_cast<Callbackable::Callback>(&History::select_cb));

    rc = db->exec(oss,this);

    unset_callback();

    if ( rc == 0 ) // Regenerate non-persistent data
    {
        non_persistent_data();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::drop(SqlDB * db)
{
    ostringstream   oss;

    oss << "DELETE FROM " << table << " WHERE vid= "<< oid;

    return db->exec(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, const History& history)
{
    string history_str;

    os << history.to_xml(history_str);

    return os;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


string& History::to_str(string& str) const
{
    ostringstream oss;

    oss<< "\tSEQ      = " << seq           << endl
       << "\tHOSTNAME = " << hostname      << endl
       << "\tHID      = " << hid           << endl
       << "\tSTIME    = " << stime         << endl
       << "\tETIME    = " << etime         << endl
       << "\tPSTIME   = " << prolog_stime  << endl
       << "\tPETIME   = " << prolog_etime  << endl
       << "\tRSTIME   = " << running_stime << endl
       << "\tRETIME   = " << running_etime << endl
       << "\tESTIME   = " << epilog_stime  << endl
       << "\tEETIME   = " << epilog_etime  << endl
       << "\tREASON   = " << reason;

   str = oss.str();

   return str;

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& History::to_xml(string& xml) const
{
    ostringstream oss;

    oss <<
        "<HISTORY>" <<
          "<SEQ>"     << seq           << "</SEQ>"   <<
          "<HOSTNAME>"<< hostname      << "</HOSTNAME>"<<
          "<HID>"     << hid           << "</HID>"   <<
          "<STIME>"   << stime         << "</STIME>" <<
          "<ETIME>"   << etime         << "</ETIME>" <<
          "<PSTIME>"  << prolog_stime  << "</PSTIME>"<<
          "<PETIME>"  << prolog_etime  << "</PETIME>"<<
          "<RSTIME>"  << running_stime << "</RSTIME>"<<
          "<RETIME>"  << running_etime << "</RETIME>"<<
          "<ESTIME>"  << epilog_stime  << "</ESTIME>"<<
          "<EETIME>"  << epilog_etime  << "</EETIME>"<<
          "<REASON>"  << reason        << "</REASON>"<<
        "</HISTORY>";

   xml = oss.str();

   return xml;
}
