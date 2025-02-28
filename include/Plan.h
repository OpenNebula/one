/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef PLAN_H_
#define PLAN_H_

#include "ObjectSQL.h"
#include "ObjectXML.h"

// State of the plan and also state of individual action
enum PlanState
{
    NONE     = -1,
    READY    = 0,
    APPLYING = 1,
    DONE     = 2,
    ERROR    = 3,
    TIMEOUT  = 4
};

class PlanAction
{
public:
    std::string to_xml() const;

    int from_xml_node(const xmlNodePtr node);

    PlanState state() const
    {
        return _state;
    }

    void state(PlanState state)
    {
        _state = state;
    }

    int vm_id() const
    {
        return _vm_id;
    }

    int host_id() const
    {
        return _host_id;
    }

    int ds_id() const
    {
        return _ds_id;
    }

    const std::string& operation() const
    {
        return _operation;
    }

    const std::vector<std::pair<int, int>>& nics() const
    {
        return _nics;
    }

    time_t timestamp() const
    {
        return _timestamp;
    }

    void timestamp(time_t t)
    {
        _timestamp = t;
    }

private:
    std::string _operation;

    PlanState _state = PlanState::READY;

    int _vm_id   = -1;
    int _host_id = -1;
    int _ds_id   = -1;

    time_t _timestamp = 0;

    // Nics in the format <nic_id, network_id>
    std::vector<std::pair<int, int>> _nics;
};

/**
 *  The Plan class,
 *  It represents planned VM deployment or optimization actions
 */
class Plan : public ObjectSQL, public ObjectXML
{
public:
    Plan() = default;

    /**
     * Constructor for the Plan.
     * @param cid Cluster ID of associated cluster. -1 for global plan
     */
    Plan(int cid):_cid(cid) {};

    ~Plan()
    {
        if (!ro && _mutex != nullptr)
        {
            _mutex->unlock();
        }
    };

    /**
     * Print the Plan into a string in XML format.
     *  @return generated string
     */
    std::string to_xml() const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string& xml);

    int cid() const
    {
        return _cid;
    }

    PlanState state() const
    {
        return _state;
    }

    void state(PlanState state)
    {
        _state = state;
    }

    void clear()
    {
        _state = PlanState::NONE;
        _actions.clear();
    }

    /**
     * Check if plan is completed and set appropriate state:
     * DONE, TIMEOUT or ERROR depending on the state of the actions
     */
    void check_completed();

    // -------------------------------------------------------------------------
    // Plan Actions
    // -------------------------------------------------------------------------

    const std::vector<PlanAction>& actions() const
    {
        return _actions;
    }

    PlanAction* get_next_action();

    /**
     * Mark action as finished, return false if the action is not in the plan
     */
    bool action_finished(int vid, PlanState state);

    /**
     * Set the state of actions to TIMEOUT if they exceed the specified timeout.
     *
     * @param timeout The timeout value in seconds.
     */
    void timeout_actions(int timeout);

    /**
     * Count the number of actions per host and cluster
     *
     * @param cluster_actions Number of actions in the cluster
     * @param host_actions Map of host_id to number of actions
     */
    void count_actions(int &cluster_actions, std::map<int, int>& host_actions);

private:
    friend class PlanPool;

    /**
     * ID of the Plan, same as the associated Cluster ID. -1 is for placement
     * plans
     */
    int _cid = -1;

    /**
     *  Plan state
     */
    PlanState _state = PlanState::NONE;

    /**
     * List of actions which should be exectuted
    */
    std::vector<PlanAction> _actions;

    /**
     * The mutex for the PoolObject. This implementation assumes that the mutex
     * IS LOCKED when the class destructor is called.
     */
    std::mutex * _mutex = nullptr;

    /**
     * Attribute for check if is a read only object
     */
    bool  ro = false;

    /**
     *  Rebuilds the internal attributes using xpath
     */
    int rebuild_attributes();

    // -------------------------------------------------------------------------
    // Database Interface
    // -------------------------------------------------------------------------

    /**
     *  Bootstraps the database table(s) associated to the Cluster
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);


    /**
     *  Callback function to unmarshall a Plan object
     *    @param num the number of columns read from the DB
     *    @para names the column names
     *    @para vaues the column values
     *    @return 0 on success
     */
    int select_cb(void *nil, int num, char **values, char **names);

    /**
     *  Reads the Plan (identified with its _cid) from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int select(SqlDB * db) override;

    /**
     *  Writes the Plan in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db, std::string& error_str) override
    {
        error_str.clear();

        return insert_replace(db, false);
    }

    /**
     *  Updates the Plan in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db) override
    {
        return insert_replace(db, true);
    }

    int insert_replace(SqlDB *db, bool replace);

    /**
     *  Removes the Plan from the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB * db) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*PLAN_H_*/

