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

#include "HostBase.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

using namespace std;

#define xml_print(name, value) "<"#name">" << value << "</"#name">"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostBase::from_xml(const std::string &xml_str)
{
    int rc = update_from_str(xml_str);

    if (rc != 0)
    {
        return rc;
    }

    return init_attributes();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string HostBase::to_xml() const
{
    ostringstream oss;

    oss << "<HOST>";

    oss << xml_print(ID, _oid);
    oss << xml_print(NAME, _name);
    oss << xml_print(STATE, _state);
    oss << xml_print(PREV_STATE, _prev_state);
    oss << xml_print(IM_MAD, one_util::escape_xml(_im_mad));
    oss << xml_print(VM_MAD, one_util::escape_xml(_vmm_mad));
    oss << xml_print(CLUSTER_ID, ClusterableSingle::cluster_id);
    oss << xml_print(CLUSTER, cluster);

    oss << "</HOST>";

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostBase::init_attributes()
{
    int int_state;
    int int_prev_state;
    int rc = 0;

    // Get class base attributes
    rc += xpath(_oid, "/HOST/ID", -1);
    rc += xpath(_name, "/HOST/NAME", "not_found");
    rc += xpath(int_state, "/HOST/STATE", 0);
    rc += xpath(int_prev_state, "/HOST/PREV_STATE", 0);

    rc += xpath(_im_mad, "/HOST/IM_MAD", "not_found");
    rc += xpath(_vmm_mad, "/HOST/VM_MAD", "not_found");

    rc += xpath(ClusterableSingle::cluster_id, "/HOST/CLUSTER_ID", -1);
    rc += xpath(cluster, "/HOST/CLUSTER", "not_found");

    _state = static_cast<Host::HostState>( int_state );
    _prev_state = static_cast<Host::HostState>( int_prev_state );

    _last_monitored  = time(nullptr);

    // ------------ Host Template ---------------
    vector<xmlNodePtr> content;

    ObjectXML::get_nodes("/HOST/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += _obj_template.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& o, const HostBase& host)
{
    o << "ID         : " << host._oid          << endl;
    o << "CLUSTER_ID : " << host.cluster_id()  << endl;
    // todo print whatever debug info you need

    return o;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
