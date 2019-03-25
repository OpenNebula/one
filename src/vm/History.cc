/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
        uid(-1),
        gid(-1),
        req_id(-1),
        hid(-1),
        hostname(""),
        cid(-1),
        vmm_mad_name(""),
        tm_mad_name(""),
        ds_id(0),
        stime(0),
        etime(0),
        prolog_stime(0),
        prolog_etime(0),
        running_stime(0),
        running_etime(0),
        epilog_stime(0),
        epilog_etime(0),
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
    const string& _tmm,
    int           _ds_id,
    const string& _vm_info):
        oid(_oid),
        seq(_seq),
        uid(-1),
        gid(-1),
        req_id(-1),
        hid(_hid),
        hostname(_hostname),
        cid(_cid),
        vmm_mad_name(_vmm),
        tm_mad_name(_tmm),
        ds_id(_ds_id),
        stime(0),
        etime(0),
        prolog_stime(0),
        prolog_etime(0),
        running_stime(0),
        running_etime(0),
        epilog_stime(0),
        epilog_etime(0),
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
    string ds_location;

    Nebula& nd = Nebula::instance();

    nd.get_ds_location(ds_location);

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

    system_dir = os.str();

    os << "/checkpoint";
    checkpoint_file = os.str();

    os.str("");
    os << system_dir << "/deployment." << seq;

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

    rc = db->exec_wr(oss);

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

    rc = db->exec_rd(oss,this);

    unset_callback();

	if ( hostname.empty() )
	{
		rc = -1;
	}

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

    return db->exec_wr(oss);
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
          "<OID>"        << oid           << "</OID>"   <<
          "<SEQ>"        << seq           << "</SEQ>"   <<
          "<HOSTNAME>"   << hostname      << "</HOSTNAME>"<<
          "<HID>"        << hid           << "</HID>"   <<
          "<CID>"        << cid           << "</CID>"   <<
          "<STIME>"      << stime         << "</STIME>" <<
          "<ETIME>"      << etime         << "</ETIME>" <<
          "<VM_MAD>"     << one_util::escape_xml(vmm_mad_name)<<"</VM_MAD>"<<
          "<TM_MAD>"     << one_util::escape_xml(tm_mad_name) <<"</TM_MAD>" <<
          "<DS_ID>"      << ds_id         << "</DS_ID>" <<
          "<PSTIME>"     << prolog_stime  << "</PSTIME>"<<
          "<PETIME>"     << prolog_etime  << "</PETIME>"<<
          "<RSTIME>"     << running_stime << "</RSTIME>"<<
          "<RETIME>"     << running_etime << "</RETIME>"<<
          "<ESTIME>"     << epilog_stime  << "</ESTIME>"<<
          "<EETIME>"     << epilog_etime  << "</EETIME>"<<
          "<ACTION>"     << action        << "</ACTION>"<<
          "<UID>"        << uid           << "</UID>"<<
          "<GID>"        << gid           << "</GID>"<<
          "<REQUEST_ID>" << req_id        << "</REQUEST_ID>";

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

string& History::to_json(string& json) const
{
    ostringstream oss;

    oss << "\"HISTORY\": {" <<
          "\"OID\": \""      << oid           << "\"," <<
          "\"SEQ\": \""      << seq           << "\"," <<
          "\"HOSTNAME\": \"" << hostname      << "\"," <<
          "\"HID\": \""      << hid           << "\"," <<
          "\"CID\": \""      << cid           << "\"," <<
          "\"STIME\": \""    << stime         << "\"," <<
          "\"ETIME\": \""    << etime         << "\"," <<
          "\"VM_MAD\": \""   << vmm_mad_name  << "\"," <<
          "\"TM_MAD\": \""   << tm_mad_name   << "\"," <<
          "\"DS_ID\": \""    << ds_id         << "\"," <<
          "\"PSTIME\": \""   << prolog_stime  << "\"," <<
          "\"PETIME\": \""   << prolog_etime  << "\"," <<
          "\"RSTIME\": \""   << running_stime << "\"," <<
          "\"RETIME\": \""   << running_etime << "\"," <<
          "\"ESTIME\": \""   << epilog_stime  << "\"," <<
          "\"EETIME\": \""   << epilog_etime  << "\"," <<
          "\"ACTION\": \""   << action        << "\"," <<
          "\"UID\": \""      << uid           << "\"," <<
          "\"GID\": \""      << gid           << "\"," <<
          "\"REQUEST_ID\": \"" << req_id      << "\",";

    oss << "}";

    json = oss.str();

    return json;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& History::to_token(string& text) const
{
    ostringstream oss;

    oss << "HOSTNAME=";
    one_util::escape_token(hostname, oss);
    oss << "\n";

    oss << "HID="   << hid   << "\n" <<
           "CID="   << cid   << "\n" <<
           "DS_ID=" << ds_id << "\n";

    text = oss.str();

    return text;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& History::to_xml_short(string& xml) const
{
    ostringstream oss;

    oss <<
        "<HISTORY>" <<
          "<OID>" << oid << "</OID>" <<
          "<SEQ>" << seq << "</SEQ>" <<
          "<HOSTNAME>" << one_util::escape_xml(hostname) << "</HOSTNAME>" <<
          "<HID>"    << hid   << "</HID>"   <<
          "<CID>"    << cid   << "</CID>"   <<
          "<DS_ID>"  << ds_id << "</DS_ID>" <<
          "<ACTION>" << one_util::escape_xml(action) << "</ACTION>" <<
        "</HISTORY>";

   xml = oss.str();

   return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int History::rebuild_attributes()
{
    vector<xmlNodePtr> content;

    int int_action;
    int rc = 0;

    rc += xpath(seq, "/HISTORY/SEQ", -1);
    rc += xpath(hid, "/HISTORY/HID", -1);
    rc += xpath(cid, "/HISTORY/CID", -1);

    rc += xpath(ds_id, "/HISTORY/DS_ID", 0);

    rc += xpath(hostname, "/HISTORY/HOSTNAME", "not_found");

    rc += xpath<time_t>(stime , "/HISTORY/STIME", 0);
    rc += xpath<time_t>(etime , "/HISTORY/ETIME", 0);

    rc += xpath(vmm_mad_name, "/HISTORY/VM_MAD", "not_found");
    rc += xpath(tm_mad_name , "/HISTORY/TM_MAD", "not_found");

    rc += xpath<time_t>(prolog_stime , "/HISTORY/PSTIME", 0);
    rc += xpath<time_t>(prolog_etime , "/HISTORY/PETIME", 0);
    rc += xpath<time_t>(running_stime, "/HISTORY/RSTIME", 0);
    rc += xpath<time_t>(running_etime, "/HISTORY/RETIME", 0);
    rc += xpath<time_t>(epilog_stime , "/HISTORY/ESTIME", 0);
    rc += xpath<time_t>(epilog_etime , "/HISTORY/EETIME", 0);

    rc += xpath(int_action , "/HISTORY/ACTION", 0);

    rc += xpath(uid, "/HISTORY/UID", -1);
    rc += xpath(gid, "/HISTORY/GID", -1);
    rc += xpath(req_id, "/HISTORY/REQUEST_ID", -1);

    action = static_cast<VMAction>(int_action);

    // -------------------------------------------------------------------------
    ObjectXML::get_nodes("/HISTORY/VM", content);

    if (!content.empty())
    {
        ObjectXML vm_info_xml(content[0]);

        ostringstream oss;

        oss << vm_info_xml;

        vm_info = oss.str();

        ObjectXML::free_nodes(content);

        content.clear();
    }

    non_persistent_data();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string History::action_to_str(VMAction action)
{
    string st;

    switch (action)
    {
        case MIGRATE_ACTION:
            st = "migrate";
        break;
        case POFF_MIGRATE_ACTION:
            st = "poweroff-migrate";
            break;
        case POFF_HARD_MIGRATE_ACTION:
            st = "poweroff-hard-migrate";
            break;
        case LIVE_MIGRATE_ACTION:
            st = "live-migrate";
        break;
        case TERMINATE_ACTION:
            st = "terminate";
        break;
        case TERMINATE_HARD_ACTION:
            st = "terminate-hard";
        break;
        case UNDEPLOY_ACTION:
            st = "undeploy";
        break;
        case UNDEPLOY_HARD_ACTION:
            st = "undeploy-hard";
        break;
        case HOLD_ACTION:
            st = "hold";
        break;
        case RELEASE_ACTION:
            st = "release";
        break;
        case STOP_ACTION:
            st = "stop";
        break;
        case SUSPEND_ACTION:
            st = "suspend";
        break;
        case RESUME_ACTION:
            st = "resume";
        break;
        case DELETE_ACTION:
            st = "delete";
        break;
        case DELETE_RECREATE_ACTION:
            st = "delete-recreate";
        break;
        case REBOOT_ACTION:
            st = "reboot";
        break;
        case REBOOT_HARD_ACTION:
            st = "reboot-hard";
        break;
        case RESCHED_ACTION:
            st = "resched";
        break;
        case UNRESCHED_ACTION:
            st = "unresched";
        break;
        case POWEROFF_ACTION:
            st = "poweroff";
        break;
        case POWEROFF_HARD_ACTION:
            st = "poweroff-hard";
        break;
        case DISK_ATTACH_ACTION:
            st = "disk-attach";
        break;
        case DISK_DETACH_ACTION:
            st = "disk-detach";
        break;
        case NIC_ATTACH_ACTION:
            st = "nic-attach";
        break;
        case NIC_DETACH_ACTION:
            st = "nic-detach";
        break;
        case ALIAS_ATTACH_ACTION:
            st = "alias-attach";
        break;
        case ALIAS_DETACH_ACTION:
            st = "alias-detach";
        break;
        case DISK_SNAPSHOT_CREATE_ACTION:
            st = "disk-snapshot-create";
        break;
        case DISK_SNAPSHOT_DELETE_ACTION:
            st = "disk-snapshot-delete";
        break;
        case DISK_SNAPSHOT_RENAME_ACTION:
            st = "disk-snapshot-rename";
        break;
        case DISK_RESIZE_ACTION:
            st = "disk-resize";
        break;
        case DEPLOY_ACTION:
            st = "deploy";
        break;
        case CHOWN_ACTION:
            st = "chown";
        break;
        case CHMOD_ACTION:
            st = "chmod";
        break;
        case UPDATECONF_ACTION:
            st = "updateconf";
        break;
        case RENAME_ACTION:
            st = "rename";
        break;
        case RESIZE_ACTION:
            st = "resize";
        break;
        case UPDATE_ACTION:
            st = "update";
        break;
        case SNAPSHOT_CREATE_ACTION:
            st = "snapshot-create";
        break;
        case SNAPSHOT_DELETE_ACTION:
            st = "snapshot-delete";
        break;
        case SNAPSHOT_REVERT_ACTION:
            st = "snapshot-revert";
        break;
        case DISK_SAVEAS_ACTION:
            st = "disk-saveas";
        break;
        case DISK_SNAPSHOT_REVERT_ACTION:
            st = "disk-snapshot-revert";
        break;
        case RECOVER_ACTION:
            st = "recover";
        break;
        case RETRY_ACTION:
            st = "retry";
        break;
        case MONITOR_ACTION:
            st = "monitor";
        break;
        case NONE_ACTION:
            st = "none";
        break;
    }

    return st;
};

int History::action_from_str(const string& st, VMAction& action)
{
    if (st == "migrate")
    {
        action = MIGRATE_ACTION;
    }
    else if (st == "live-migrate")
    {
        action = LIVE_MIGRATE_ACTION;
    }
    else if (st == "terminate")
    {
        action = TERMINATE_ACTION;
    }
    else if (st == "terminate-hard")
    {
        action = TERMINATE_HARD_ACTION;
    }
    else if (st == "undeploy")
    {
        action = UNDEPLOY_ACTION;
    }
    else if (st == "undeploy-hard")
    {
        action = UNDEPLOY_HARD_ACTION;
    }
    else if (st == "hold")
    {
        action = HOLD_ACTION;
    }
    else if (st == "release")
    {
        action = RELEASE_ACTION;
    }
    else if (st == "stop")
    {
        action = STOP_ACTION;
    }
    else if (st == "suspend")
    {
        action = SUSPEND_ACTION;
    }
    else if (st == "resume")
    {
        action = RESUME_ACTION;
    }
    else if (st == "delete")
    {
        action = DELETE_ACTION;
    }
    else if (st == "delete-recreate")
    {
        action = DELETE_RECREATE_ACTION;
    }
    else if (st == "reboot")
    {
        action = REBOOT_ACTION;
    }
    else if (st == "reboot-hard")
    {
        action = REBOOT_HARD_ACTION;
    }
    else if (st == "resched")
    {
        action = RESCHED_ACTION;
    }
    else if (st == "unresched")
    {
        action = UNRESCHED_ACTION;
    }
    else if (st == "poweroff")
    {
        action = POWEROFF_ACTION;
    }
    else if (st == "poweroff-hard")
    {
        action = POWEROFF_HARD_ACTION;
    }
    else if (st == "disk-attach")
    {
        action = DISK_ATTACH_ACTION;
    }
    else if (st == "disk-detach")
    {
        action = DISK_DETACH_ACTION;
    }
    else if (st == "nic-attach")
    {
        action = NIC_ATTACH_ACTION;
    }
    else if (st == "nic-detach")
    {
        action = NIC_DETACH_ACTION;
    }
    else if (st == "alias-attach")
    {
        action = ALIAS_ATTACH_ACTION;
    }
    else if (st == "alias-detach")
    {
        action = ALIAS_DETACH_ACTION;
    }
    else if (st == "disk-snapshot-create")
    {
        action = DISK_SNAPSHOT_CREATE_ACTION;
    }
    else if (st == "disk-snapshot-snap-delete")
    {
        action = DISK_SNAPSHOT_DELETE_ACTION;
    }
    else if (st == "disk-snapshot-rename")
    {
        action = DISK_SNAPSHOT_RENAME_ACTION;
    }
    else if (st == "disk-resize")
    {
        action = DISK_RESIZE_ACTION;
    }
    else if ( st == "deploy")
    {
        action = DEPLOY_ACTION;
    }
    else if ( st == "chown")
    {
        action = CHOWN_ACTION;
    }
    else if ( st == "chmod")
    {
        action = CHMOD_ACTION;
    }
    else if ( st == "updateconf")
    {
        action = UPDATECONF_ACTION;
    }
    else if ( st == "rename")
    {
        action = RENAME_ACTION;
    }
    else if ( st == "resize")
    {
        action = RESIZE_ACTION;
    }
    else if ( st == "update")
    {
        action = UPDATE_ACTION;
    }
    else if ( st == "snapshot-create")
    {
        action = SNAPSHOT_CREATE_ACTION;
    }
    else if ( st == "snapshot-delete")
    {
        action = SNAPSHOT_DELETE_ACTION;
    }
    else if ( st == "snapshot-revert")
    {
        action = SNAPSHOT_REVERT_ACTION;
    }
    else if ( st == "disk-saveas")
    {
        action = DISK_SAVEAS_ACTION;
    }
    else if ( st == "disk-snapshot-revert")
    {
        action = DISK_SNAPSHOT_REVERT_ACTION;
    }
    else if ( st == "recover")
    {
        action = RECOVER_ACTION;
    }
    else if ( st == "retry")
    {
        action = RETRY_ACTION;
    }
    else if ( st == "monitor")
    {
        action = MONITOR_ACTION;
    }
    else
    {
        action = NONE_ACTION;
        return -1;
    }

    return 0;
};
