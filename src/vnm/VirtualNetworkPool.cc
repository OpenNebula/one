/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "VirtualNetworkPool.h"
#include "NebulaLog.h"

#include <sstream>
#include <ctype.h>


VirtualNetworkPool::VirtualNetworkPool(SqlDB * db,
    const string&   prefix,
    int             _default_size):
    PoolSQL(db,VirtualNetwork::table),
    mac_prefix(0),
    default_size(_default_size)
{
    istringstream iss;
    size_t        pos   = 0;
    int           count = 0;
    unsigned int  tmp;

    string mac = prefix;

    while ( (pos = mac.find(':')) !=  string::npos )
    {
        mac.replace(pos,1," ");
        count++;
    }

    if (count != 1)
    {
        NebulaLog::log("VNM",Log::ERROR,
                       "Wrong MAC prefix format, using default");
        mac_prefix = 1; //"00:01"

        return;
    }

    iss.str(mac);

    iss >> hex >> mac_prefix >> ws >> hex >> tmp >> ws;
    mac_prefix <<= 8;
    mac_prefix += tmp;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::allocate (
    int            uid,
    const  string& stemplate,
    int *          oid)
{
    VirtualNetwork *    vn;
    char *              error_msg;
    int                 rc;
    ostringstream       oss;

    string              name;
    string              bridge;
    string              public_attr;

    string              s_type;

    // Build a new Virtual Network object
    vn = new VirtualNetwork(mac_prefix, default_size);

    vn->uid	= uid;

    rc = vn->vn_template.parse(stemplate,&error_msg);

    if ( rc != 0 )
    {
        oss << error_msg;
        NebulaLog::log("VNM", Log::ERROR, oss);
        free(error_msg);

        delete vn;

        return -2;
    }
    
    // Information about the VN needs to be extracted from the template
    vn->get_template_attribute("TYPE",s_type);

    transform(s_type.begin(),s_type.end(),s_type.begin(),(int(*)(int))toupper);

    if (s_type == "RANGED")
    {
        vn->type = VirtualNetwork::RANGED;
    }
    else if ( s_type == "FIXED")
    {
        vn->type = VirtualNetwork::FIXED;
    }
    else
    {
        NebulaLog::log("VNM", Log::ERROR, "Wrong type for VirtualNetwork "
                       "template");
        delete vn;

        return -3;
    }

    vn->get_template_attribute("NAME",name);
    vn->name = name;

    vn->get_template_attribute("BRIDGE",bridge);
    vn->bridge = bridge;
    
    // ------------ PUBLIC --------------------

    vn->get_template_attribute("PUBLIC", public_attr);

    transform (public_attr.begin(), public_attr.end(), public_attr.begin(),
        (int(*)(int))toupper);

    vn->public_vnet = (public_attr == "YES");  
    vn->vn_template.erase("PUBLIC");  

    // Insert the VN in the pool so we have a valid OID

    *oid = PoolSQL::allocate(vn);

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::get_cb(void * _oid, int num, char **values,char **names)
{
    int * oid;

    oid = static_cast<int *>(_oid);

    if ( oid == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    *oid = atoi(values[0]);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualNetwork * VirtualNetworkPool::get(const string& name, bool lock)
{
    ostringstream   oss;

    int oid = -1;
    int rc;

    char * sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        return 0;
    }

    set_callback(
        static_cast<Callbackable::Callback>(&VirtualNetworkPool::get_cb),
        static_cast<void *>(&oid));

    oss << "SELECT oid FROM " << VirtualNetwork::table << " WHERE name = '"
        << sql_name << "'";

    rc = db->exec(oss, this);

    unset_callback();

    db->free_str(sql_name);

    if (rc != 0 || oid == -1)
    {
        return 0;
    }

    return get(oid,lock);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::dump_cb(void * _oss,
                                int     num,
                                char ** values,
                                char ** names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    return VirtualNetwork::dump(*oss, num, values, names);
}

/* -------------------------------------------------------------------------- */

int VirtualNetworkPool::dump(ostringstream& oss, const string& where)
{
    int             rc;
    ostringstream   cmd;

    oss << "<VNET_POOL>";

    set_callback(
        static_cast<Callbackable::Callback>(&VirtualNetworkPool::dump_cb),
        static_cast<void *>(&oss));

    cmd << "SELECT " << VirtualNetwork::table << ".*,COUNT("
        << Leases::table << ".used), user_pool.user_name FROM "
        << VirtualNetwork::table
        << " LEFT OUTER JOIN " << Leases::table << " ON "
        << VirtualNetwork::table << ".oid = " <<  Leases::table << ".oid"
        << " AND " << Leases::table << ".used = 1"
        << " LEFT OUTER JOIN (SELECT oid,user_name FROM user_pool) "
        << " AS user_pool ON "<< VirtualNetwork::table
        << ".uid = user_pool.oid";

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    cmd << " GROUP BY " << VirtualNetwork::table << ".oid";

    rc = db->exec(cmd,this);

    oss << "</VNET_POOL>";

    unset_callback();

    return rc;
}
