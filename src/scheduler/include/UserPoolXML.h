/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project Leads (OpenNebula.org)             */
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


#ifndef USER_POOL_XML_H_
#define USER_POOL_XML_H_

#include <vector>

#include "PoolXML.h"
#include "UserXML.h"

class UserPoolXML : public PoolXML
{
public:

    UserPoolXML(Client* client):PoolXML(client) {};

    ~UserPoolXML() {};

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    UserXML * get(int oid) const
    {
        return static_cast<UserXML *>(PoolXML::get(oid));
    };

protected:

    int get_suitable_nodes(std::vector<xmlNodePtr>& content) const override
    {
        return get_nodes("/USER_POOL/USER", content);
    };

    void add_object(xmlNodePtr node) override;

    int load_info(xmlrpc_c::value &result) override;
};

#endif /* USER_POOL_XML_H_ */
