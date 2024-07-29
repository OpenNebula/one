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

#ifndef MONITOR_XML_H_
#define MONITOR_XML_H_

#include <vector>
#include "PoolXML.h"

class MonitorXML : public ObjectXML
{
public:
    MonitorXML(const std::string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    MonitorXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    int get_oid() const
    {
        return oid;
    };

private:
    int oid;

    void init_attributes()
    {
        xpath(oid, "/MONITORING/ID", -1);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MonitorPoolXML : public PoolXML
{
public:

    MonitorPoolXML (Client* client):PoolXML(client) {};

    ~MonitorPoolXML() = default;

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    MonitorXML * get(int oid) const
    {
        return static_cast<MonitorXML *>(PoolXML::get(oid));
    };

protected:

    int get_suitable_nodes(std::vector<xmlNodePtr>& content) const override
    {
        return get_nodes("/MONITORING_DATA/MONITORING", content);
    };

    void add_object(xmlNodePtr node) override
    {
        if ( node == 0 || node->children == 0 )
        {
            NebulaLog::log("MONITOR", Log::ERROR,
                           "XML Node is not a valid MONITORING record");
            return;
        }

        MonitorXML* monitor = new MonitorXML(node);

        objects.insert(std::pair<int, ObjectXML*>(monitor->get_oid(), monitor));
    }

    int load_info(xmlrpc_c::value &result) override
    {
        try
        {
            client->call("one.hostpool.monitoring", "i", &result, 0);

            return 0;
        }
        catch (std::exception const& e)
        {
            std::ostringstream   oss;
            oss << "Exception raised: " << e.what();

            NebulaLog::log("MONITOR", Log::ERROR, oss);

            return -1;
        }
    }
};

#endif /* MONITOR_XML_H_ */
