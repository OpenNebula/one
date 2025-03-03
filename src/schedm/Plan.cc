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

#include "Plan.h"
#include "NebulaLog.h"
#include "OneDB.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PlanAction::from_xml_node(const xmlNodePtr node)
{
    Template tmpl;
    int tmp_int;

    tmpl.from_xml_node(node);

    auto rc = tmpl.get("VM_ID", _vm_id);

    rc &= tmpl.get("OPERATION", _operation);
    rc &= tmpl.get("HOST_ID", _host_id);
    rc &= tmpl.get("DS_ID", _ds_id);

    tmpl.get("TIMESTAMP", _timestamp);

    tmpl.get("STATE", tmp_int);
    _state = static_cast<PlanState>(tmp_int);

    vector<VectorAttribute *> nics;
    tmpl.get("NIC", nics);

    for (auto nic : nics)
    {
        int nic_id     = -1;
        int network_id = -1;

        nic->vector_value("NIC_ID", nic_id);
        nic->vector_value("NETWORK_ID", network_id);

        _nics.emplace_back(nic_id, network_id);
    }

    if (!rc)
    {
        NebulaLog::error("PLM", "Unable to create PlanAction from xml");
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string PlanAction::to_xml() const
{
    ostringstream oss;

    oss << "<ACTION>"
        << "<VM_ID>"      << _vm_id      << "</VM_ID>"
        << "<STATE>"      << _state      << "</STATE>"
        << "<OPERATION>"  << _operation  << "</OPERATION>"
        << "<HOST_ID>"    << _host_id    << "</HOST_ID>"
        << "<DS_ID>"      << _ds_id      << "</DS_ID>"
        << "<TIMESTAMP>"  << _timestamp  << "</TIMESTAMP>";

    for (const auto& nic : _nics)
    {
        oss << "<NIC>"
            << "<NIC_ID>"     << nic.first  << "</NIC_ID>"
            << "<NETWORK_ID>" << nic.second << "</NETWORK_ID>"
            << "</NIC>";
    }

    oss << "</ACTION>";

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PlanAction* Plan::get_next_action()
{
    for (auto& action : _actions)
    {
        if (action.state() == PlanState::READY)
        {
            return &action;
        }
    }

    return nullptr;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Plan::action_finished(int vid, PlanState state)
{
    for (auto& action : _actions)
    {
        if (action.vm_id() == vid && ( action.state() == PlanState::APPLYING ||
                action.state() == PlanState::TIMEOUT))
        {
            action.state(state);

            return true;
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Plan::to_xml() const
{
    ostringstream oss;

    oss << "<PLAN>"
        << "<ID>"    << _cid << "</ID>"
        << "<STATE>" << _state << "</STATE>";

    for (const auto& action : _actions)
    {
        oss << action.to_xml();
    }

    oss << "</PLAN>";

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Plan::from_xml(const std::string& xml)
{
    if (update_from_str(xml) != 0)
    {
        return -1;
    }

    return rebuild_attributes();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Plan::check_completed()
{
    auto new_state = PlanState::DONE;

    for (const auto& a : _actions)
    {
        if (a.state() == PlanState::READY ||
            a.state() == PlanState::APPLYING)
        {
            return;
        }

        if (new_state == PlanState::ERROR)
        {
            continue;
        }

        if (a.state() == PlanState::ERROR)
        {
            new_state = PlanState::ERROR;
        }
        else if (a.state() == PlanState::TIMEOUT)
        {
            new_state = PlanState::TIMEOUT;
        }
    }

    // Plan is completed, set new state
    _state = new_state;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Plan::timeout_actions(int timeout)
{
    auto now = time(nullptr);

    for (auto& a : _actions)
    {
        if (a.state() == PlanState::APPLYING &&
            a.timestamp() + timeout < now)
        {
            a.state(PlanState::TIMEOUT);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Plan::count_actions(int &cluster_actions, std::map<int, int>& host_actions)
{
    for (const auto& a : _actions)
    {
        if (a.state() == PlanState::APPLYING)
        {
            host_actions[a.host_id()]++;
            cluster_actions++;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Plan::rebuild_attributes()
{
    int tmp_int;
    int rc = 0;

    rc += xpath(_cid, "/PLAN/ID", -1);
    xpath(tmp_int, "/PLAN/STATE", -1); // State can be empty

    _state = static_cast<PlanState>(tmp_int);

    vector<xmlNodePtr> action_nodes;

    ObjectXML::get_nodes("/PLAN/ACTION", action_nodes);

    for (auto node : action_nodes)
    {
        PlanAction action;
        rc += action.from_xml_node(node);

        if (rc != 0)
        {
            break;
        }

        _actions.emplace_back(action);
    }

    if (rc != 0)
    {
        NebulaLog::error("PLM", "Unable to create Plan from xml");

        _state = PlanState::ERROR;

        return -1;
    }

    return 0;
}

int Plan::bootstrap(SqlDB * db)
{
    std::ostringstream oss;

    oss.str(one_db::plan_db_bootstrap);

    return db->exec_local_wr(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Plan::select_cb(void *nil, int num, char **values, char **names)
{
    if ( (!values[0]) || (num != 1) )
    {
        return -1;
    }

    return from_xml(values[0]);
}

/* -------------------------------------------------------------------------- */

int Plan::select(SqlDB * db)
{
    ostringstream oss;

    set_callback(static_cast<Callbackable::Callback>(&Plan::select_cb));

    oss << "SELECT body FROM " << one_db::plan_table
        << " WHERE cid = " << _cid;

    // Store id to check if the object is in the DB
    int tmp_id = _cid;
    _cid = -2;

    int rc = db->exec_rd(oss, this);

    unset_callback();

    if ((rc != 0) || (_cid != tmp_id ))
    {
        return -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Plan::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;

    char * sql_body = db->escape_str(to_xml());

    if (!sql_body)
    {
        return -1;
    }

    if(replace)
    {
        oss << "UPDATE " << one_db::plan_table << " SET "
            << "cid = "       << _cid      << ", "
            << "state = "     << _state    << ", "
            << "body =  '"    << sql_body << "' "
            << "WHERE cid = " << _cid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::plan_table
            << " (" << one_db::plan_db_names << ") VALUES ("
            <<        _cid     << ","
            <<        _state   << ","
            << "'" << sql_body << "')";
    }

    int rc = db->exec_wr(oss);

    db->free_str(sql_body);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Plan::drop(SqlDB * db)
{
    ostringstream   oss;
    oss << "DELETE FROM " << one_db::plan_table << " WHERE cid=" << _cid;
    return db->exec_wr(oss);
}

