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

#ifndef ACL_XML_H_
#define ACL_XML_H_

#include "AclManager.h"
#include "Client.h"

/**
 *  This class manages the ACL rules and the authorization engine
 */
class AclXML : public AclManager
{
public:
    AclXML(Client * _client, int zone_id):AclManager(zone_id), client(_client)
    {};

    virtual ~AclXML() {};

    /**
     *  Loads the ACL rule set from the DB
     *    @return 0 on success.
     */
    int set_up();

private:
    /* ---------------------------------------------------------------------- */
    /* Disable public methods not used in scheduler                */
    /* ---------------------------------------------------------------------- */
    int start() = delete;

    int add_rule(long long user,
                 long long resource,
                 long long rights,
                 std::string&   error_str) = delete;

    int del_rule(int oid, std::string& error_str) = delete;

    int dump(std::ostringstream& oss) = delete;

    Client * client;

    /**
     *  Loads the ACL rule set from its XML representation:
     *  as obtained by a dump call
     *
     *    @param xml_str string with the XML document for the ACL
     *    @return 0 on success.
     */
    int load_rules(const std::string& xml_str);

    void flush_rules();
};

#endif /*ACL_XML_H*/

