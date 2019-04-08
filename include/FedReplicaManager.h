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

#ifndef FED_REPLICA_MANAGER_H_
#define FED_REPLICA_MANAGER_H_

#include <string>
#include <map>
#include <vector>

#include "ReplicaManager.h"
#include "ActionManager.h"

extern "C" void * frm_loop(void *arg);

class LogDB;
class LogDBRecord;

class FedReplicaManager : public ReplicaManager, ActionListener
{
public:

    /**
     *  @param d pointer to underlying DB (LogDB)
     */
    FedReplicaManager(LogDB * d);

    virtual ~FedReplicaManager();

    /**
     *  Sends the replication event to the replica threads. [MASTER]
     */
    void replicate(const std::string& sql)
    {
        ReplicaManager::replicate();
    }

    /**
     *  Updates the current index in the server and applies the command to the
     *  server. It also stores the record in the zone log [SLAVE]
     *    @param index of the record
     *    @param prev of index preceding this one
     *    @param sql command to apply to DB
     *    @return 0 on success, last_index if missing records, -1 on DB error
     */
    uint64_t apply_log_record(uint64_t index, uint64_t prev, const std::string& sql);

    /**
     *  Record was successfully replicated on zone, increase next index and
     *  send any pending records.
     *    @param zone_id
     */
    void replicate_success(int zone_id);

    /**
     *  Record could not be replicated on zone, decrease next index and
     *  send any pending records.
     *    @param zone_id
     */
    void replicate_failure(int zone_id, uint64_t zone_last);

    /**
     *  XML-RPC API call to replicate a log entry on slaves
     *     @param zone_id
     *     @param success status of API call
     *     @param last index replicate in zone slave
     *     @param error description if any
     *     @return 0 on success -1 if a xml-rpc/network error occurred
     */
    int xmlrpc_replicate_log(int zone_id, bool& success, uint64_t& last,
            std::string& err);

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
     *  Start the replication threads, and updates the server list of the zone
     */
    void start_replica_threads()
    {
        std::vector<int> zids;

        update_zones(zids);

        ReplicaManager::start_replica_threads(zids);
    }

    /**
     *  Updates the list of zones and servers in the zone. This function is
     *  invoked when a server becomes leader, or whenever a server is +
     *  added/removed to the zone
     *    @param zids ids of zones
     */
    void update_zones(std::vector<int>& zids);

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
     *  @return the id of fed. replica thread
     */
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

    // -------------------------------------------------------------------------
    // Synchronization variables
    //   - xmlrpc_timeout. To timeout xml-rpc api calls to replicate log
    //   - zones list of zones in the federation with:
    //     - list of servers <id, xmlrpc endpoint>
    //     - next index to send to this zone
    // -------------------------------------------------------------------------
    static const time_t xmlrpc_timeout_ms;

    struct ZoneServers
    {
        ZoneServers(int z, uint64_t l, const std::string& s):
            zone_id(z), endpoint(s), next(l), last(UINT64_MAX){};

        ~ZoneServers(){};

        int zone_id;

        std::string  endpoint;

        uint64_t next;

        uint64_t last;
    };

    std::map<int, ZoneServers *> zones;

    LogDB * logdb;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    ActionManager am;

    /**
     *  Termination function
     */
    void finalize_action(const ActionRequest& ar);

    /**
     *  Get the nerxt record to replicate in a zone
     *    @param zone_id of the zone
     *    @param zedp zone endpoint
     *    @param lr log record
     *    @param error description if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int get_next_record(int zone_id, std::string& zedp, LogDBRecord& lr,
            std::string& error);

};

#endif /*FED_REPLICA_MANAGER_H_*/

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
