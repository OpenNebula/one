/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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


#ifndef USER_XML_H_
#define USER_XML_H_

#include "ObjectXML.h"
#include <set>

using namespace std;

class UserXML : public ObjectXML
{
public:
    UserXML(const string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    UserXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    int get_uid()
    {
        return oid;
    };

private:
    int oid;
    int gid;

    set<int> group_ids;

    void init_attributes();
};

#endif /* USER_XML_H_ */
