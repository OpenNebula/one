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

#ifndef HISTORY_H_
#define HISTORY_H_

#include "ObjectSQL.h"
#include "ObjectXML.h"

using namespace std;

/**
 *  The History class, it represents an execution record of a Virtual Machine.
 */

class History:public ObjectSQL, public ObjectXML
{
public:

    enum VMAction
    {                                       //Associated XML-RPC API call
        NONE_ACTION            = 0,         // "one.vm.migrate"
        MIGRATE_ACTION         = 1,         // "one.vm.migrate"
        LIVE_MIGRATE_ACTION    = 2,
        //SHUTDOWN_ACTION        = 3,
        //SHUTDOWN_HARD_ACTION   = 4,
        UNDEPLOY_ACTION        = 5,         // "one.vm.action"
        UNDEPLOY_HARD_ACTION   = 6,         // "one.vm.action"
        HOLD_ACTION            = 7,         // "one.vm.action"
        RELEASE_ACTION         = 8,         // "one.vm.action"
        STOP_ACTION            = 9,         // "one.vm.action"
        SUSPEND_ACTION         = 10,        // "one.vm.action"
        RESUME_ACTION          = 11,        // "one.vm.action"
        //BOOT_ACTION            = 12,
        DELETE_ACTION          = 13,        // "one.vm.recover"
        DELETE_RECREATE_ACTION = 14,        // "one.vm.recover"
        REBOOT_ACTION          = 15,        // "one.vm.action"
        REBOOT_HARD_ACTION     = 16,        // "one.vm.action"
        RESCHED_ACTION         = 17,        // "one.vm.action"
        UNRESCHED_ACTION       = 18,        // "one.vm.action"
        POWEROFF_ACTION        = 19,        // "one.vm.action"
        POWEROFF_HARD_ACTION   = 20,        // "one.vm.action"
        DISK_ATTACH_ACTION     = 21,        // "one.vm.attach"
        DISK_DETACH_ACTION     = 22,        // "one.vm.detach"
        NIC_ATTACH_ACTION      = 23,        // "one.vm.attachnic"
        NIC_DETACH_ACTION      = 24,        // "one.vm.detachnic"
        DISK_SNAPSHOT_CREATE_ACTION = 25,   // "one.vm.disksnapshotcreate"
        DISK_SNAPSHOT_DELETE_ACTION = 26,   // "one.vm.disksnapshotdelete"
        TERMINATE_ACTION       = 27,        // "one.vm.action"
        TERMINATE_HARD_ACTION  = 28,        // "one.vm.action"
        DISK_RESIZE_ACTION     = 29,        // "one.vm.diskresize"
        DEPLOY_ACTION          = 30,        // "one.vm.deploy"
        CHOWN_ACTION           = 31,        // "one.vm.chown"
        CHMOD_ACTION           = 32,        // "one.vm.chmod"
        UPDATECONF_ACTION      = 33,        // "one.vm.updateconf"
        RENAME_ACTION          = 34,        // "one.vm.rename"
        RESIZE_ACTION          = 35,        // "one.vm.resize"
        UPDATE_ACTION          = 36,        // "one.vm.update"
        SNAPSHOT_CREATE_ACTION = 37,        // "one.vm.snapshotcreate"
        SNAPSHOT_DELETE_ACTION = 38,        // "one.vm.snapshotdelete"
        SNAPSHOT_REVERT_ACTION = 39,        // "one.vm.snapshotrevert"
        DISK_SAVEAS_ACTION     = 40,        // "one.vm.disksaveas"
        DISK_SNAPSHOT_REVERT_ACTION = 41,   // "one.vm.disksnapshotrevert"
        RECOVER_ACTION         = 42,        // "one.vm.recover"
        RETRY_ACTION           = 43,        // "one.vm.recover"
        MONITOR_ACTION         = 44,        // internal, monitoring process
        DISK_SNAPSHOT_RENAME_ACTION = 45,   // "one.vm.disksnapshotrename"
        ALIAS_ATTACH_ACTION      = 46,      // "one.vm.attachnic"
        ALIAS_DETACH_ACTION      = 47,      // "one.vm.detachnic"
        POFF_MIGRATE_ACTION      = 48,      // "one.vm.migrate"
        POFF_HARD_MIGRATE_ACTION = 49       // "one.vm.migrate"
    };

    static string action_to_str(VMAction action);

    static int action_from_str(const string& st, VMAction& action);

    History(int oid, int _seq = -1);

    History(
        int oid,
        int seq,
        int hid,
        const string& hostname,
        int cid,
        const string& vmm,
        const string& tmm,
        int           ds_id,
        const string& vm_info);

    ~History(){};

    /**
     *  Function to write the History Record in an output stream
     */
    friend ostream& operator<<(ostream& os, const History& history);

    /**
     * Function to print the History object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     * Function to print the History object into a string in
     * XML format with reduce information
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml_short(string& xml) const;

private:
    friend class VirtualMachine;
    friend class VirtualMachinePool;

    // ----------------------------------------
    // DataBase implementation variables
    // ----------------------------------------
    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    void non_persistent_data();

    // ----------------------------------------
    // History fields
    // ----------------------------------------
    int     oid;
    int     seq;

    int     uid;
    int     gid;
    int     req_id;

    int     hid;
    string  hostname;
    int     cid;

    string  vmm_mad_name;
    string  tm_mad_name;

    int     ds_id;

    time_t  stime;
    time_t  etime;

    time_t  prolog_stime;
    time_t  prolog_etime;

    time_t  running_stime;
    time_t  running_etime;

    time_t  epilog_stime;
    time_t  epilog_etime;

    VMAction action;

    string  vm_info;

    // -------------------------------------------------------------------------
    // Non-persistent history fields
    // -------------------------------------------------------------------------
    // Local paths
    string  transfer_file;
    string  deployment_file;
    string  context_file;
    string  token_file;

    // Remote paths
    string  checkpoint_file;
    string  rdeployment_file;
    string  system_dir;

    /**
     *  Writes the history record in the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int insert(SqlDB * db, string& error_str)
    {
        error_str.clear();

        return insert_replace(db, false);
    }

    /**
     *  Reads the history record from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int select(SqlDB * db);

    /**
     *  Updates the history record
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
     int update(SqlDB * db)
     {
        return insert_replace(db, true);
     }

    /**
     *  Removes the all history records from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int drop(SqlDB * db);

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @return 0 on success
     */
    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Callback function to unmarshall a history object (History::select)
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     * Function to print the History object into a string in
     * XML format, to be stored in the DB. It includes the VM template info
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_db_xml(string& xml) const;

    /**
     * Function to print the History object into a string in
     * XML format. The VM info can be optionally included
     *  @param xml the resulting XML string
     *  @param database If it is true, the TEMPLATE element will be included
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml, bool database) const;

    string& to_json(string& json) const;

    string& to_token(string& text) const;

    /**
     *  Rebuilds the object from an xml node
     *    @param node The xml node pointer
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node)
    {
        ObjectXML::update_from_node(node);

        return rebuild_attributes();
    }

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str)
    {
        ObjectXML::update_from_str(xml_str);

        return rebuild_attributes();
    }

    /**
     *  Rebuilds the internal attributes using xpath
     */
    int rebuild_attributes();
};

#endif /*HISTORY_H_*/

