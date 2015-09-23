/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

const char * History::db_names = "vid, seq, body, stime, etime";

const char * History::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
    "history (vid INTEGER, seq INTEGER, body MEDIUMTEXT, "
    "stime INTEGER, etime INTEGER,PRIMARY KEY(vid,seq))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

History::History(
    int _oid,
    int _seq):
        ObjectXML(),
        oid(_oid),
        seq(_seq),
        hid(-1),
        hostname(""),
        cid(-1),
        vmm_mad_name(""),
        vnm_mad_name(""),
        tm_mad_name(""),
        ds_location(""),
        ds_id(0),
        stime(0),
        etime(0),
        prolog_stime(0),
        prolog_etime(0),
        running_stime(0),
        running_etime(0),
        epilog_stime(0),
        epilog_etime(0),
        reason(NONE),
        action(NONE_ACTION),
        vm_info("<VM/>"){};

/* -------------------------------------------------------------------------- */

History::History(
    int _oid,
    int _seq,
    int _hid,
    const string& _hostname,
    int _cid,
    const string& _vmm,
    const string& _vnm,
    const string& _tmm,
    const string& _ds_location,
    int           _ds_id,
    const string& _vm_info):
        oid(_oid),
        seq(_seq),
        hid(_hid),
        hostname(_hostname),
        cid(_cid),
        vmm_mad_name(_vmm),
        vnm_mad_name(_vnm),
        tm_mad_name(_tmm),
        ds_location(_ds_location),
        ds_id(_ds_id),
        stime(0),
        etime(0),
        prolog_stime(0),
        prolog_etime(0),
        running_stime(0),
        running_etime(0),
        epilog_stime(0),
        epilog_etime(0),
        reason(NONE),
        action(NONE_ACTION),
        vm_info(_vm_info)
{
    non_persistent_data();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void History::non_persistent_data()
{
    ostringstream os;

    string vm_lhome;

    Nebula& nd = Nebula::instance();

    // ----------- Local Locations ------------
    os.str("");
    os << nd.get_vms_location() << oid;

    vm_lhome = os.str();

    os << "/deployment." << seq;

    deployment_file = os.str();

    os.str("");
    os << vm_lhome << "/transfer." << seq;

    transfer_file = os.str();

    os.str("");
    os << vm_lhome << "/context.sh";

    context_file = os.str();

    os.str("");
    os << vm_lhome << "/token.txt";

    token_file = os.str();

    // ----------- Remote Locations ------------

    os.str("");

    os << ds_location << "/" << ds_id << "/" << oid;

    rsystem_dir = os.str();

    os << "/checkpoint";
    checkpoint_file = os.str();

    os.str("");
    os << rsystem_dir << "/deployment." << seq;

    rdeployment_file = os.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    string xml_body;
    char * sql_xml;

    int    rc;

    if (seq == -1)
    {
        return 0;
    }

    sql_xml = db->escape_str(to_db_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " ("<< db_names <<") VALUES ("
        <<          oid             << ","
        <<          seq             << ","
        << "'" <<   sql_xml         << "',"
        <<          stime           << ","
        <<          etime           << ")";

    rc = db->exec(oss);

    db->free_str(sql_xml);

    return rc;

error_body:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::select_cb(void *nil, int num, char **values, char **names)
{
    if ( (!values[0]) || (num != 1) )
    {
        return -1;
    }

    return from_xml(values[0]);
}

/* -------------------------------------------------------------------------- */
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
        oss << "SELECT body FROM history WHERE vid = "<< oid <<
            " AND seq=(SELECT MAX(seq) FROM history WHERE vid = " << oid << ")";
    }
    else
    {
        oss << "SELECT body FROM history WHERE vid = " << oid
            << " AND seq = " << seq;
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

string& History::to_xml(string& xml) const
{
    return to_xml(xml, false);
}

/* -------------------------------------------------------------------------- */

string& History::to_db_xml(string& xml) const
{
    return to_xml(xml, true);
}

/* -------------------------------------------------------------------------- */

string& History::to_xml(string& xml, bool database) const
{
    ostringstream oss;

    oss <<
        "<HISTORY>" <<
          "<OID>"               << oid               << "</OID>"   <<
          "<SEQ>"               << seq               << "</SEQ>"   <<
          "<HOSTNAME>"          << hostname          << "</HOSTNAME>"<<
          "<HID>"               << hid               << "</HID>"   <<
          "<CID>"               << cid               << "</CID>"   <<
          "<STIME>"             << stime             << "</STIME>" <<
          "<ETIME>"             << etime             << "</ETIME>" <<
          "<VMMMAD>"            << vmm_mad_name      << "</VMMMAD>"<<
          "<VNMMAD>"            << vnm_mad_name      << "</VNMMAD>"<<
          "<TMMAD>"             << tm_mad_name       << "</TMMAD>" <<
          "<DS_LOCATION>"       << ds_location       << "</DS_LOCATION>" <<
          "<DS_ID>"             << ds_id             << "</DS_ID>" <<
          "<PSTIME>"            << prolog_stime      << "</PSTIME>"<<
          "<PETIME>"            << prolog_etime      << "</PETIME>"<<
          "<RSTIME>"            << running_stime     << "</RSTIME>"<<
          "<RETIME>"            << running_etime     << "</RETIME>"<<
          "<ESTIME>"            << epilog_stime      << "</ESTIME>"<<
          "<EETIME>"            << epilog_etime      << "</EETIME>"<<
          "<REASON>"            << reason            << "</REASON>"<<
          "<ACTION>"            << action            << "</ACTION>";

    if ( database )
    {
        oss << vm_info;
    }

    oss <<
        "</HISTORY>";

   xml = oss.str();

   return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::rebuild_attributes()
{
    int int_reason, int_action;
    int rc = 0;

    rc += xpath(seq              , "/HISTORY/SEQ",         -1);
    rc += xpath(hostname         , "/HISTORY/HOSTNAME",    "not_found");
    rc += xpath(hid              , "/HISTORY/HID",         -1);
    rc += xpath(cid              , "/HISTORY/CID",         -1);
    rc += xpath(stime            , "/HISTORY/STIME",       0);
    rc += xpath(etime            , "/HISTORY/ETIME",       0);
    rc += xpath(vmm_mad_name     , "/HISTORY/VMMMAD",      "not_found");
          xpath(vnm_mad_name     , "/HISTORY/VNMMAD",      "dummy");
    rc += xpath(tm_mad_name      , "/HISTORY/TMMAD",       "not_found");
    rc += xpath(ds_location      , "/HISTORY/DS_LOCATION", "not_found");
    rc += xpath(ds_id            , "/HISTORY/DS_ID",       0);
    rc += xpath(prolog_stime     , "/HISTORY/PSTIME",      0);
    rc += xpath(prolog_etime     , "/HISTORY/PETIME",      0);
    rc += xpath(running_stime    , "/HISTORY/RSTIME",      0);
    rc += xpath(running_etime    , "/HISTORY/RETIME",      0);
    rc += xpath(epilog_stime     , "/HISTORY/ESTIME",      0);
    rc += xpath(epilog_etime     , "/HISTORY/EETIME",      0);
    rc += xpath(int_reason       , "/HISTORY/REASON",      0);
    rc += xpath(int_action       , "/HISTORY/ACTION",      0);

    reason = static_cast<EndReason>(int_reason);
    action = static_cast<VMAction>(int_action);

    non_persistent_data();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
