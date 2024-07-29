/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "VMActions.h"


/**
 *  The History class, it represents an execution record of a Virtual Machine.
 */

class History:public ObjectSQL, public ObjectXML
{
public:
    History(int oid, int _seq = -1);

    History(
            int oid,
            int seq,
            int hid,
            const std::string& hostname,
            int cid,
            const std::string& vmm,
            const std::string& tmm,
            int           ds_id,
            const std::string& vm_info);

    ~History() {};

    /**
     *  Function to write the History Record in an output stream
     */
    friend std::ostream& operator<<(std::ostream& os, const History& history);

    /**
     * Function to print the History object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const;

    /**
     * Function to print the History object into a string in
     * XML format with reduce information
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml_short(std::string& xml) const;

private:
    friend class VirtualMachine;
    friend class VirtualMachinePool;

    void non_persistent_data();

    // ----------------------------------------
    // History fields
    // ----------------------------------------
    int          oid;
    int          seq;

    int          uid;
    int          gid;
    int          req_id;

    int          hid;
    std::string  hostname;
    int          cid;

    std::string  vmm_mad_name;
    std::string  tm_mad_name;

    int          ds_id;

    time_t       stime;
    time_t       etime;

    time_t       prolog_stime;
    time_t       prolog_etime;

    time_t       running_stime;
    time_t       running_etime;

    time_t       epilog_stime;
    time_t       epilog_etime;

    VMActions::Action action;

    std::string  vm_info;

    // -------------------------------------------------------------------------
    // Non-persistent history fields
    // -------------------------------------------------------------------------
    // Local paths
    std::string  transfer_file;
    std::string  deployment_file;
    std::string  context_file;
    std::string  token_file;

    // Remote paths
    std::string  checkpoint_file;
    std::string  rdeployment_file;
    std::string  system_dir;

    /**
     *  Writes the history record in the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int insert(SqlDB * db, std::string& error_str) override
    {
        error_str.clear();

        return insert_replace(db, false);
    }

    /**
     *  Reads the history record from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int select(SqlDB * db) override;

    /**
     *  Updates the history record
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int update(SqlDB * db) override
    {
        return insert_replace(db, true);
    }

    /**
     *  Removes the all history records from the DB
     *    @param db pointer to the database.
     *    @return 0 on success.
     */
    int drop(SqlDB * db) override;

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
    std::string& to_db_xml(std::string& xml) const;

    /**
     * Function to print the History object into a string in
     * XML format. The VM info can be optionally included
     *  @param xml the resulting XML string
     *  @param database If it is true, the TEMPLATE element will be included
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml, bool database) const;

    std::string& to_json(std::string& json) const;

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
    int from_xml(const std::string &xml_str)
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

