/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "RequestManagerInfo.h"
#include "RequestManagerPoolInfoFilter.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
    PoolObjectSQL * object;
    string          str;

    if ( oid == -1 )
    {
        if ( auth_object == PoolObjectSQL::USER )
        {
            oid = att.uid;
        }
        else if ( auth_object == PoolObjectSQL::GROUP )
        {
            oid = att.gid;
        }
    }

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),oid),
                att);
        return;
    }

    to_xml(att, object, str);

    object->unlock();

    success_response(str, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkInfo::to_xml(RequestAttributes& att, PoolObjectSQL * object,
    string& str)
{
    vector<int> vms;
    vector<int> vnets;

    string where_vnets;
    string where_vms;

    bool all_reservations = RequestManagerPoolInfoFilter::use_filter(att,
            PoolObjectSQL::NET, true, true, false, "(pid != -1)", where_vnets);

    bool all_vms = RequestManagerPoolInfoFilter::use_filter(att,
            PoolObjectSQL::VM, false, false, false, "", where_vms);

    if ( all_reservations == true )
    {
        vnets.push_back(-1);
    }
    else
    {
        Nebula::instance().get_vnpool()->search(vnets, where_vnets);
    }

    if ( all_vms == true )
    {
        vms.push_back(-1);
    }
    else
    {
        Nebula::instance().get_vmpool()->search(vms, where_vms);
    }

    static_cast<VirtualNetwork*>(object)->to_xml_extended(str, vms, vnets);
};
