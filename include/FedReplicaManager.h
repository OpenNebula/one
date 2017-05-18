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

#ifndef FED_REPLICA_MANAGER_H_
#define FED_REPLICA_MANAGER_H_

#include <string>
#include <map>
#include <vector>

#include "ReplicaManager.h"
#include "ActionManager.h"

extern "C" void * frm_loop(void *arg);

class SqlDB;

class FedReplicaManager : public ReplicaManager, ActionListener
{
public:

    /**
     *  @param _t timer for periofic actions (sec)
     *  @param _p purge timeout for log
     *  @param d pointer to underlying DB (LogDB)
     *  @param l log_retention length (num records)
     *  @param s true if operating in solo mode
     */
    FedReplicaManager(time_t _t, time_t _p, SqlDB * d, const std::string& l,
            bool s);

    virtual ~FedReplicaManager();

    /**
     *  Creates a new record in the federation log and sends the replication
     *  event to the replica threads. [MASTER]
     *    @param sql db command to replicate
     *    @return 0 on success -1 otherwise
     */
    int replicate(const std::string& sql);

    /**
     *  Updates the current index in the server and applies the command to the
     *  server. It also stores the record in the zone log [SLAVE]
     *    @param index of the record
     *    @param sql command to apply to DB
     *    @return 0 on success, last_index if missing records, -1 on DB error
     */
    int apply_log_record(int index, const std::string& sql);

    /**
     *  Finalizes the Federation Replica Manager
     */
    void finalize()
    {
        am.finalize();
    }

    /**
     *  Starts the Federation Replica Manager
     */
    int start();

    /**
     *  Adds a new zone to the replication list and starts the associated
     *  replica thread
     *    @param zone_id of the new zone
     */
    void add_zone(int zone_id);

    /**
     *  Deletes zone from the replication list and stops the associated
     *  replica thread
     *    @param zone_id of the zone
     */
    void delete_zone(int zone_id);

    /**
     *  Bootstrap federated log
     */
    static int bootstrap(SqlDB *_db);

    pthread_t get_thread_id() const
    {
        return frm_thread;
    };

private:
    friend void * frm_loop(void *arg);

    /**
     *  Creates federation replica thread objects
     */
    ReplicaThread * thread_factory(int follower_id);

    /**
     *  Thread id of the main event loop
     */
    pthread_t frm_thread;

    /**
     *  Controls access to the zone list and server data
     */
    pthread_mutex_t mutex;

    //--------------------------------------------------------------------------
    //  Timers
    //    - timer_period. Base timer to wake up the manager
    //    - purge_period. How often the replicated log is purged (600s)
    //    - xmlrpc_timeout. To timeout xml-rpc api calls to replicate log
    //--------------------------------------------------------------------------
    time_t timer_period;

    time_t purge_period;

    static const time_t xmlrpc_timeout_ms;

    // -------------------------------------------------------------------------
    // Synchronization variables
    //   - last_index in the replication log
    //   - zones list of zones in the federation with:
    //     - list of servers
    //     - next index to send to this zone
    // -------------------------------------------------------------------------
    struct ZoneServers
    {
        ZoneServers(int z, const std::map<int,std::string>& s):zone_id(z),
            servers(s), next(0){};

        ~ZoneServers(){};

        int zone_id;

        std::map<int, std::string> servers;

        unsigned int next;
    };

    std::map<int, ZoneServers *> zones;

    unsigned int last_index;

    SqlDB * logdb;

    std::string log_retention;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    ActionManager am;

    /**
     *  Termination function
     */
    void finalize_action(const ActionRequest& ar);

    /**
     *  This function is executed periodically to purge the state log
     */
    void timer_action(const ActionRequest& ar);

    // -------------------------------------------------------------------------
    // Database Implementation
    // Store log records to replicate on federation slaves
    // -------------------------------------------------------------------------
    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    /**
     *  Gets a record from the log
     *    @param index of the record
     *    @param sql command of the record
     *    @return 0 in case of success -1 otherwise
     */
    int get_log_record(int index, std::string& sql);


    /**
     *  Inserts a new record in the log ans updates the last_index variable
     *  (memory and db)
     *    @param index of new record
     *    @param sql of DB command to execute
     *    @return 0 on success
     */
    int insert_log_record(int index, const std::string& sql);

    /**
     *  Reads the last index from DB for initialization
     *    @param index
     *    @return 0 on success
     */
    int get_last_index(unsigned int& index);
};

#endif /*FED_REPLICA_MANAGER_H_*/

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
