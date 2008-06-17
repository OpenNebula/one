/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#include <iostream>
#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * History::table = "history";

const char * History::db_names = "(oid,seq,hostname,vm_dir,hid,vmmad,tmmad,stime,"
    "etime,pstime,petime,rstime,retime,estime,eetime,reason)";

const char * History::db_bootstrap = "CREATE TABLE history (oid INTEGER,"
    "seq INTEGER,hostname TEXT,vm_dir TEXT,hid INTEGER,vmmad TEXT,tmmad TEXT,"
    "stime INTEGER,etime INTEGER,pstime INTEGER,petime INTEGER,rstime INTEGER,"
    "retime INTEGER,estime INTEGER,eetime INTEGER,reason INTEGER,"
	"PRIMARY KEY(oid,seq))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

History::History(
    int _oid):
        oid(_oid),
        seq(-1),
        hostname(""),
        vm_rdir(""),
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
    int     _oid,
    int     _seq,
    int     _hid,
    string& _hostname,
    string& _vm_rdir,
    string& _vmm,
    string& _tm):
        oid(_oid),
        seq(_seq),
        hostname(_hostname),
        vm_rdir(_vm_rdir),
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
    const char * nl = getenv("ONE_LOCATION");

    if (nl == 0)
    {
       nl = "/var/tmp";
    }

    // ----------- Local Locations ------------

    os << nl << "/var/" << oid;
    vm_lhome = os.str();
    
    os.str("");
    os << vm_lhome << "/deployment." << seq;

    deployment_lfile = os.str();
    
    
    // ----------- Remote Locations ------------
    
    os.str("");
    os << vm_rdir;
    
    os << "/" << oid;
    
    vm_rhome = os.str();
    
    os << "/" << "checkpoint";
    
    checkpoint_file = os.str();
    
    os.str("");
    os << vm_rhome << "/deployment." << seq;

    deployment_rfile = os.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::insert(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;

    if (seq == -1)
    {
        return 0;
    }

    oss << "INSERT OR REPLACE INTO " << table << " "<< db_names <<" VALUES ("<<
        oid << "," <<
        seq << "," <<
        "'" << hostname << "',"<<
        "'" << vm_rdir << "'," <<
        hid << "," <<
        "'" << vmm_mad_name << "'," <<
        "'" << tm_mad_name  << "'," <<
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

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::unmarshall(int num, char **names, char ** values)
{
    if ((values[OID] == 0) ||
            (values[SEQ] == 0) ||
            (values[HOSTNAME] == 0) ||
            (values[VM_DIR] == 0) ||
            (values[HID] == 0) ||
            (values[VMMMAD] == 0) ||
            (values[TMMAD] == 0) ||
            (values[STIME] == 0) ||
            (values[ETIME] == 0) ||
            (values[PROLOG_STIME] == 0) ||
            (values[PROLOG_ETIME] == 0) ||
            (values[RUNNING_STIME] == 0) ||
            (values[RUNNING_ETIME] == 0) ||
            (values[EPILOG_STIME] == 0) ||
            (values[EPILOG_ETIME] == 0) ||
            (values[REASON] == 0) ||
            (num != LIMIT ))
    {
        return -1;
    }

    oid           = atoi(values[OID]);
    seq           = atoi(values[SEQ]);

    hostname      = values[HOSTNAME];
    vm_rdir       = values[VM_DIR];
    
    hid           = atoi(values[HID]);

    vmm_mad_name  = values[VMMMAD];
    tm_mad_name   = values[TMMAD];

    stime         = static_cast<time_t>(atoi(values[STIME]));
    etime         = static_cast<time_t>(atoi(values[ETIME]));

    prolog_stime  = static_cast<time_t>(atoi(values[PROLOG_STIME]));
    prolog_etime  = static_cast<time_t>(atoi(values[PROLOG_ETIME]));

    running_stime = static_cast<time_t>(atoi(values[RUNNING_STIME]));
    running_etime = static_cast<time_t>(atoi(values[RUNNING_ETIME]));

    epilog_stime  = static_cast<time_t>(atoi(values[EPILOG_STIME]));
    epilog_etime  = static_cast<time_t>(atoi(values[EPILOG_ETIME]));

    reason        = static_cast<MigrationReason>(atoi(values[REASON]));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" int history_select_cb (
        void *                  _history,
        int                     num,
        char **                 values,
        char **                 names)
{
    History *    history;

    history = static_cast<History *>(_history);

    if (history == 0)
    {
        return -1;
    }

    return history->unmarshall(num,names,values);
};

/* -------------------------------------------------------------------------- */

int History::select(SqliteDB * db)
{
    ostringstream   oss;
    int             rc;

    if (oid == -1)
    {
        return -1;
    }

    oss << "SELECT * FROM history WHERE oid = "<< oid <<
        " AND seq=(SELECT MAX(seq) FROM history WHERE oid = " << oid << ")";

    rc = db->exec(oss,history_select_cb,(void *) this);

    if ( rc == 0 ) // Regenerate non-persistent data
    {
        non_persistent_data();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::drop(SqliteDB * db)
{
    ostringstream   oss;

    oss << "DELETE FROM " << table << " WHERE oid= "<< oid; 
    // <<" AND seq= "<<seq;

    return db->exec(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
