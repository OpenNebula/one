/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "ZonePool.h"
#include "ZoneServer.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>

using namespace std;

/* -------------------------------------------------------------------------- */

const int ZonePool::STANDALONE_ZONE_ID = 0;

/* -------------------------------------------------------------------------- */

ZonePool::ZonePool(SqlDB * db, bool is_federation_slave)
    : PoolSQL(db, one_db::zone_table)
{
    string error_str;

    //Federation slaves do not need to init the pool
    if (is_federation_slave)
    {
        return;
    }

    Nebula& nd = Nebula::instance();

    const string& master_oned_xmlrpc = nd.get_master_oned_xmlrpc();
    const string& master_oned_grpc = nd.get_master_oned_grpc();

    ostringstream zone_tmpl;
    zone_tmpl << "NAME=OpenNebula\n";

    if (master_oned_xmlrpc.empty() && master_oned_grpc.empty())
    {
        string xmlrpc_port;
        string grpc_port;

        nd.get_configuration_attribute("PORT", xmlrpc_port);
        nd.get_configuration_attribute("GRPC_PORT", grpc_port);

        zone_tmpl << "ENDPOINT=http://localhost:" << xmlrpc_port << "/RPC2\n";
        zone_tmpl << "ENDPOINT_GRPC=localhost:" << grpc_port << '\n';
    }

    if (!master_oned_xmlrpc.empty())
    {
        zone_tmpl << "ENDPOINT=" << master_oned_xmlrpc << '\n';
    }

    if (!master_oned_grpc.empty())
    {
        zone_tmpl << "ENDPOINT_GRPC=" << master_oned_grpc << '\n';
    }

    //lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        // Build the local zone
        auto tmpl = make_unique<Template>();
        int rc = tmpl->parse_str_or_xml(zone_tmpl.str(), error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        allocate(move(tmpl), &rc, error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        // The first 100 Zone IDs are reserved for system Zones.
        // Regular ones start from ID 100
        set_lastOID(99);
    }

    return;

error_bootstrap:
    ostringstream oss;
    oss << "Error trying to create local zone: " << error_str;
    NebulaLog::log("ZONE", Log::ERROR, oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ZonePool::allocate(
        unique_ptr<Template> zone_template,
        int *       oid,
        string&     error_str)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE", Log::ERROR,
                       "ZonePool::allocate called, but this "
                       "OpenNebula is a federation slave");

        return -1;
    }

    Zone zone {-1, move(zone_template)};

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    string name;
    zone.get_template_attribute("NAME", name);

    *oid = -1;

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        return *oid;
    }

    const auto db_oid = exist(name);

    if( db_oid != -1 )
    {
        ostringstream oss;

        oss << "NAME is already taken by Zone " << db_oid << ".";
        error_str = oss.str();

        return *oid;
    }

    *oid = PoolSQL::allocate(zone, error_str);

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ZonePool::update(PoolObjectSQL * objsql)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE", Log::ERROR,
                       "ZonePool::update called, but this "
                       "OpenNebula is a federation slave");

        return -1;
    }

    return PoolSQL::update(objsql);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ZonePool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE", Log::ERROR,
                       "ZonePool::drop called, but this "
                       "OpenNebula is a federation slave");

        return -1;
    }

    Zone * zone = static_cast<Zone*>(objsql);

    // Return error if the zone is a default one.
    if( zone->get_oid() < 100 )
    {
        error_msg = "System Zones (ID < 100) cannot be deleted.";
        NebulaLog::log("ZONE", Log::ERROR, error_msg);
        return -2;
    }

    return PoolSQL::drop(objsql, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

unsigned int ZonePool::get_zone_servers(int zone_id,
                                        std::map<int, std::pair<std::string, std::string>>& _serv)
{
    unsigned int _num_servers;

    ZoneServers::zone_iterator zit;

    auto zone = get_ro(zone_id);

    if ( zone == nullptr )
    {
        _serv.clear();
        return 0;
    }

    ZoneServers * followers = zone->get_servers();

    for (zit = followers->begin(); zit != followers->end(); ++zit)
    {
        ZoneServer* server = *zit;

        int id = server->get_id();
        const string& edp = server->vector_value("ENDPOINT");
        const string& edp_grpc = server->vector_value("ENDPOINT_GRPC");

        _serv.insert(make_pair(id, make_pair(edp, edp_grpc)));
    }

    _num_servers = zone->servers_size();

    return _num_servers;
}

