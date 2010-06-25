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


#include "VirtualNetwork.h"
#include "NebulaLog.h"
#include "RangedLeases.h"
#include "FixedLeases.h"

/* ************************************************************************** */
/* Virtual Network :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualNetwork::VirtualNetwork(unsigned int  mp, int ds):
                PoolObjectSQL(-1),
                name(""),
                uid(-1),
                bridge(""),
                type(UNINITIALIZED),
                leases(0),
                mac_prefix(mp),
                default_size(ds){};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualNetwork::~VirtualNetwork()
{
    if (leases != 0)
    {
        delete leases;
    }
}

/* ************************************************************************** */
/* Virtual Network :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualNetwork::table        = "network_pool";

const char * VirtualNetwork::db_names     = "(oid,uid,name,type,bridge,public)";

const char * VirtualNetwork::db_bootstrap = "CREATE TABLE IF NOT EXISTS"
    " network_pool ("
     "oid INTEGER PRIMARY KEY, uid INTEGER, name VARCHAR(256), type INTEGER, "
     "bridge TEXT, public INTEGER, UNIQUE(name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::select_cb(void * nil, int num, char **values, char **names)
{
    if ((!values[OID])  ||
        (!values[UID])  ||
        (!values[NAME]) ||
        (!values[TYPE]) ||
        (!values[BRIDGE]) ||
        (!values[PUBLIC]) ||
        (num != LIMIT ))
    {
        return -1;
    }

    oid         = atoi(values[OID]);
    uid         = atoi(values[UID]);

    name        = values[NAME];

    type        = (NetworkType)atoi(values[TYPE]);

    bridge      = values[BRIDGE];

    public_vnet = atoi(values[PUBLIC]);

    // Virtual Network template ID is the Network ID
    vn_template.id = oid;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::select(SqlDB * db)
{
    ostringstream   oss;
    ostringstream   ose;

    int             rc;
    int             boid;

    string          network_address;

    set_callback(
        static_cast<Callbackable::Callback>(&VirtualNetwork::select_cb));

    oss << "SELECT * FROM " << table << " WHERE oid = " << oid;

    boid = oid;
    oid  = -1;

    rc = db->exec(oss, this);

    unset_callback();

    if ((rc != 0) || (oid != boid ))
    {
        goto error_id;
    }

    //Get the template
    rc = vn_template.select(db);

    if (rc != 0)
    {
        goto error_template;
    }

    //Get the leases
    if (type == RANGED)
    {
        string  nclass = "";
        int     size = 0;

        // retrieve specific information from template
        get_template_attribute("NETWORK_ADDRESS",network_address);

        if (network_address.empty())
        {
            goto error_addr;
        }

        get_template_attribute("NETWORK_SIZE",nclass);

        if ( nclass == "B" || nclass == "b" )
        {
            size = 65534;
        }
        else if ( nclass == "C" || nclass == "c" )
        {
            size = 254;
        }
        else if (!nclass.empty()) //Assume its a number
        {
            istringstream iss(nclass);
            iss >> size;
        }

        if (size == 0)
        {
            size = default_size;
        }

        leases = new RangedLeases(db,
                                  oid,
                                  size,
                                  mac_prefix,
                                  network_address);
    }
    else if(type == FIXED)
    {
        leases = new  FixedLeases(db,
                                  oid,
                                  mac_prefix);
    }
    else
    {
        goto error_type;
    }

    if (leases == 0)
    {
        goto error_leases;
    }

    return leases->select(db);

error_id:
    ose << "Error getting Virtual Network nid: " << oid;
    goto error_common;

error_template:
    ose << "Can not get template for Virtual Network nid: " << oid;
    goto error_common;

error_leases:
    ose << "Error getting Virtual Network leases nid: " << oid;
    goto error_common;

error_type:
    ose << "Wrong type of Virtual Network: " << type;
    goto error_common;

error_addr:
    ose << "Network address is not defined nid: " << oid;

error_common:
    NebulaLog::log("VNM", Log::ERROR, ose);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::dump(ostringstream& oss,
                         int            num,
                         char **        values,
                         char **        names)
{
    if ((!values[OID])   ||
        (!values[UID])   ||
        (!values[NAME])  ||
        (!values[TYPE])  ||
        (!values[BRIDGE])||
        (!values[PUBLIC])||
        (!values[LIMIT]) ||
        (num != LIMIT + 2 ))
    {
        return -1;
    }

    oss <<
        "<VNET>" <<
            "<ID>"       << values[OID]     << "</ID>"        <<
            "<UID>"      << values[UID]     << "</UID>"       <<
            "<USERNAME>" << values[LIMIT+1]  << "</USERNAME>" <<
            "<NAME>"     << values[NAME]    << "</NAME>"      <<
            "<TYPE>"     << values[TYPE]    << "</TYPE>"      <<
            "<BRIDGE>"   << values[BRIDGE]  << "</BRIDGE>"    <<
            "<PUBLIC>"   << values[PUBLIC]  << "</PUBLIC>"    <<
            "<TOTAL_LEASES>" << values[LIMIT]<< "</TOTAL_LEASES>" <<
        "</VNET>";

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::insert(SqlDB * db)
{
    ostringstream   ose;
    int             rc;

    if ( vn_template.id == -1 )
    {
        vn_template.id = oid;
    }

    // Insert the template first
    rc = vn_template.insert(db);

    if ( rc != 0 )
    {
    	goto error_template;
    }

    // Insert the Virtual Network
    rc = insert_replace(db, false);

    if ( rc != 0 )
    {
        goto error_update;
    }

    //Get the leases
    if (type == VirtualNetwork::RANGED)
    {
        string nclass = "";
        string naddr  = "";
        int    size   = 0;

        // retrieve specific information from template
        get_template_attribute("NETWORK_ADDRESS",naddr);

        if (naddr.empty())
        {
            goto error_addr;
        }

        get_template_attribute("NETWORK_SIZE",nclass);

        if ( nclass == "B" || nclass == "b"  )
        {
            size = 65534;
        }
        else if ( nclass == "C" || nclass == "c"  )
        {
            size = 254;
        }
        else if (!nclass.empty())//Assume its a number
        {
            istringstream iss(nclass);

            iss >> size;
        }

        if (size == 0)
        {
            size = default_size;
        }

        leases = new RangedLeases(db,
                                  oid,
                                  size,
                                  mac_prefix,
                                  naddr);
    }
    else if(type == VirtualNetwork::FIXED)
    {
        vector<const Attribute *>   vector_leases;

        get_template_attribute("LEASES",vector_leases);

        leases = new FixedLeases(db,
                                 oid,
                                 mac_prefix,
                                 vector_leases);
    }
    else
    {
        goto error_type;
    }

    if (leases == 0)
    {
        goto error_null_leases;
    }

    return 0;

error_template:
    ose << "Can not insert in DB template for Virtual Network id " << oid;
    goto error_common;

error_update:
    ose << "Can not update Virtual Network id " << oid;
    vn_template.drop(db);
    goto error_common;

error_type:
    ose << "Wrong type of Virtual Network: " << type;
    goto error_leases;

error_addr:
    ose << "Network address is not defined nid: " << oid;
    goto error_leases;

error_null_leases:
    ose << "Error getting Virtual Network leases nid: " << oid;

error_leases:
    vn_drop(db);

error_common:
    NebulaLog::log("VNM", Log::ERROR, ose);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


int VirtualNetwork::update(SqlDB * db)
{
    int rc;

    // Update the template first
    rc = vn_template.update(db);

    if ( rc == 0 )
    {
        rc = insert_replace(db, true);
    }

    return rc;
}

int VirtualNetwork::insert_replace(SqlDB *db, bool replace)
{
    ostringstream   oss;
    int             rc;

    char * sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        return -1;
    }

    char * sql_bridge = db->escape_str(bridge.c_str());

    if ( sql_bridge == 0 )
    {
        db->free_str(sql_name);
        return -1;
    }

    // Construct the SQL statement to Insert or Replace
    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " "<< db_names <<" VALUES ("
        <<          oid         << ","
        <<          uid         << ","
        << "'" <<   sql_name    << "',"
        <<          type        << ","
        << "'" <<   sql_bridge  << "',"
        <<          public_vnet << ")";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_bridge);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::vn_drop(SqlDB * db)
{
    ostringstream   oss;
    int             rc;

    vn_template.drop(db);

    if ( leases != 0 )
    {
        leases->drop(db);
    }

    oss << "DELETE FROM " << table << " WHERE OID=" << oid;

    rc = db->exec(oss);

    if ( rc == 0 )
    {
        set_valid(false);
    }

    return rc;
}



/* ************************************************************************** */
/* Virtual Network :: Misc                                                    */
/* ************************************************************************** */

ostream& operator<<(ostream& os, VirtualNetwork& vn)
{
    string vnet_xml;

    os << vn.to_xml(vnet_xml);

    return os;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml(string& xml) const
{
    ostringstream os;

    string template_xml;
    string leases_xml;

    os <<
        "<VNET>" <<
            "<ID>"      << oid          << "</ID>"   <<
            "<UID>"     << uid          << "</UID>"  <<
            "<NAME>"    << name         << "</NAME>" <<
            "<TYPE>"    << type         << "</TYPE>" <<
            "<BRIDGE>"  << bridge       << "</BRIDGE>" <<
            "<PUBLIC>"  << public_vnet  << "</PUBLIC>" <<
            vn_template.to_xml(template_xml);
    if (leases)
    {
        os << leases->to_xml(leases_xml);
    }
    os << "</VNET>";

    xml = os.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_str(string& str) const
{
    ostringstream os;

    string template_str;
    string leases_str;

    os << "ID                : " << oid << endl;
    os << "UID               : " << uid << endl;
    os << "NAME              : " << name << endl;
    os << "Type              : ";
    if ( type==VirtualNetwork::RANGED )
    {
        os << "Ranged" << endl;
    }
    else
    {
       os << "Fixed" << endl;
    }

    os << "Bridge            : " << bridge      << endl;
    os << "Public            : " << public_vnet << endl << endl;

    os << "....: Template :...." << vn_template.to_str(template_str) << endl << endl;

    if (leases)
    {
        os << "....: Leases :...." << endl << leases->to_str(leases_str) << endl;
    }

    str = os.str();

    return str;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::nic_attribute(VectorAttribute *nic, int vid)
{
    int rc;

    string  network;
    string  model;
    string  ip;
    string  mac;

    ostringstream  vnid;

    map<string,string> new_nic;

    network = nic->vector_value("NETWORK");
    model   = nic->vector_value("MODEL");
    ip      = nic->vector_value("IP");
    vnid   << oid;

    //--------------------------------------------------------------------------
    //                       GET NETWORK LEASE
    //--------------------------------------------------------------------------

    if (ip.empty())
    {
        rc = leases->get(vid,ip,mac);
    }
    else
    {
        rc = leases->set(vid,ip,mac);
    }

    if ( rc != 0 )
    {
        return -1;
    }

    //--------------------------------------------------------------------------
    //                       NEW NIC ATTRIBUTES
    //--------------------------------------------------------------------------

    new_nic.insert(make_pair("NETWORK",network));
    new_nic.insert(make_pair("MAC"    ,mac));
    new_nic.insert(make_pair("BRIDGE" ,bridge));
    new_nic.insert(make_pair("VNID"   ,vnid.str()));
    new_nic.insert(make_pair("IP"     ,ip));

    if (!model.empty())
    {
        new_nic.insert(make_pair("MODEL",model));
    }

    nic->replace(new_nic);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
