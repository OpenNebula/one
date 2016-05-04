/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

using namespace std;

/**
 *  The History class, it represents an execution record of a Virtual Machine.
 */

class History:public ObjectSQL, public ObjectXML
{
public:
    enum EndReason
    {
        NONE   = 0, /** < History record is not closed yet */
        ERROR  = 1, /** < History record was closed because of an error */
        USER   = 2  /** < History record was closed because of a user action */
    };

    enum VMAction
    {
        NONE_ACTION            = 0,
        MIGRATE_ACTION         = 1,
        LIVE_MIGRATE_ACTION    = 2,
        //SHUTDOWN_ACTION        = 3,
        //SHUTDOWN_HARD_ACTION   = 4,
        UNDEPLOY_ACTION        = 5,
        UNDEPLOY_HARD_ACTION   = 6,
        HOLD_ACTION            = 7,
        RELEASE_ACTION         = 8,
        STOP_ACTION            = 9,
        SUSPEND_ACTION         = 10,
        RESUME_ACTION          = 11,
        //BOOT_ACTION            = 12,
        DELETE_ACTION          = 13,
        DELETE_RECREATE_ACTION = 14,
        REBOOT_ACTION          = 15,
        REBOOT_HARD_ACTION     = 16,
        RESCHED_ACTION         = 17,
        UNRESCHED_ACTION       = 18,
        POWEROFF_ACTION        = 19,
        POWEROFF_HARD_ACTION   = 20,
        DISK_ATTACH_ACTION     = 21,
        DISK_DETACH_ACTION     = 22,
        NIC_ATTACH_ACTION      = 23,
        NIC_DETACH_ACTION      = 24,
        DISK_SNAPSHOT_CREATE_ACTION = 25,
        DISK_SNAPSHOT_DELETE_ACTION = 26,
        TERMINATE_ACTION       = 27,
        TERMINATE_HARD_ACTION  = 28
    };

    static string action_to_str(VMAction action)
    {
        string st;

        switch (action)
        {
            case MIGRATE_ACTION:
                st = "migrate";
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
            case DISK_SNAPSHOT_CREATE_ACTION:
                st = "snap-create";
            break;
            case DISK_SNAPSHOT_DELETE_ACTION:
                st = "snap-delete";
            break;
            case NONE_ACTION:
                st = "none";
            break;
        }

        return st;
    };

    static int action_from_str(string& st, VMAction& action)
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
        else if (st == "snap-create")
        {
            action = DISK_SNAPSHOT_CREATE_ACTION;
        }
        else if (st == "snap-delete")
        {
            action = DISK_SNAPSHOT_DELETE_ACTION;
        }
        else
        {
            action = NONE_ACTION;
            return -1;
        }

        return 0;
    };

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

    EndReason reason;

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

