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


#ifndef CLUSTER_XML_H_
#define CLUSTER_XML_H_

#include "ObjectXML.h"


class ClusterXML : public ObjectXML
{
public:
    ClusterXML(const std::string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    ClusterXML(const xmlNodePtr node):ObjectXML(node)
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
        xpath(oid, "/CLUSTER/ID", -1);
    };
};

#endif /* CLUSTER_XML_H_ */
