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

#include "DefaultQuotas.h"
#include "ObjectXML.h"

#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& DefaultQuotas::to_xml(string& xml) const
{
    ostringstream oss;

    string aux_xml;

    oss << "<" << root_elem << ">"
        << Quotas::to_xml(aux_xml)
        << "</" << root_elem << ">";

    xml = oss.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::from_xml(const string& xml)
{
    ObjectXML *object_xml = new ObjectXML(xml);

    int rc = Quotas::from_xml(object_xml);

    delete object_xml;

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::select()
{
    string  xml_body;
    Nebula& nd  = Nebula::instance();

    if ( nd.select_sys_attribute(root_elem, xml_body) != 0 )
    {
        return -1;
    }

    return from_xml(xml_body);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::insert()
{
    string  xml_body;
    string  error;
    Nebula& nd  = Nebula::instance();

    return nd.insert_sys_attribute(root_elem, to_xml(xml_body), error);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DefaultQuotas::update()
{
    string  xml_body;
    string  error;
    Nebula& nd  = Nebula::instance();

    return nd.update_sys_attribute(root_elem, to_xml(xml_body), error);
}
