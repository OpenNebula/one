/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
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

#ifndef HISTORY_H_
#define HISTORY_H_

#include <sqlite3.h>
#include "ObjectSQL.h"

using namespace std;

extern "C" int history_select_cb (
        void *                  _history,
        int                     num,
        char **                 values,
        char **                 names);

/**
 *  The History class, it represents an execution record of a Virtual Machine.
 */

class History:public ObjectSQL
{
public:
    enum MigrationReason
    {
        NONE, 		/** < Normal termination in host */
        ERROR,		/** < The VM was migrated because of an error */
        STOP_RESUME,/** < The VM was migrated because of a stop/resume request*/
        USER,		/** < The VM was migrated because of an explicit request */
        CANCEL		/** < The VM was migrated because of an explicit cancel */
    };

    History(int oid, int _seq = -1);

    History(
        int     		oid,
        int     		seq,
        int     		hid,
        string& 		hostname,
        string& 		vm_dir,
        string& 		vmm,
        string& 		tm);

    ~History(){};

private:
    friend class VirtualMachine;

    // ----------------------------------------
    // DataBase implementation variables
    // ----------------------------------------
    enum ColNames
    {
        VID             = 0,
        SEQ             = 1,
        HOSTNAME        = 2,
        VM_DIR          = 3,
        HID             = 4,
        VMMMAD          = 5,
        TMMAD           = 6,
        STIME           = 7,
        ETIME           = 8,
        PROLOG_STIME    = 9,
        PROLOG_ETIME    = 10,
        RUNNING_STIME   = 11,
        RUNNING_ETIME   = 12,
        EPILOG_STIME    = 13,
        EPILOG_ETIME    = 14,
        REASON          = 15,
        LIMIT           = 16
    };

    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    void non_persistent_data();

    static string column_name(const ColNames column)
    {
        switch (column)
        {
        case HID:
            return "hid";
        case ETIME:
            return "etime";
        case RUNNING_ETIME:
            return "retime";
        default:
            return "";
        }
    }

    // ----------------------------------------
    // History fields
    // ----------------------------------------
    int     oid;
    int     seq;

    string  hostname;
    string  vm_dir;

    int     hid;

    string  vmm_mad_name;
    string  tm_mad_name;

    time_t  stime;
    time_t  etime;

    time_t  prolog_stime;
    time_t  prolog_etime;

    time_t  running_stime;
    time_t  running_etime;

    time_t  epilog_stime;
    time_t  epilog_etime;

    MigrationReason reason;

    //Non-persistent history fields
    string  vm_lhome;
    string  transfer_file;
    string  deployment_file;
    string  context_file;

    string  vm_rhome;
    string  checkpoint_file;
    string  rdeployment_file;

    friend int history_select_cb (
        void *                  _history,
        int                     num,
        char **                 values,
        char **                 names);

    /**
     *  Writes the history record in the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int insert(SqliteDB * db);

    /**
     *  Reads the history record from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int select(SqliteDB * db);

    /**
     *  Removes the all history records from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.

     */
    int drop(SqliteDB * db);

    /**
     *  Updates the history record
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int update(SqliteDB * db)
    {
    	return insert(db);
	}

	/**
     *  Gets the value of a column in the pool for a given object
     *    @param db pointer to Database
     *    @param column to be selected
     *    @param where contidtion to select the column
     *    @param value of the column
     *    @return 0 on success
     */
    int select_column(
        SqliteDB *      db,
        const string&   column,
        const string&   where,
        string *        value)
    {
    	return ObjectSQL::select_column(db,table,column,where,value);
    }

    /**
     *  Function to unmarshall a history object
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int unmarshall(int num, char **names, char ** values);
};

#endif /*HISTORY_H_*/
