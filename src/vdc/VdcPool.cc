/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "VdcPool.h"
#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */

const string VdcPool::DEFAULT_NAME = "default";
const int    VdcPool::DEFAULT_ID   = 0;

/* -------------------------------------------------------------------------- */

VdcPool::VdcPool(SqlDB * db, bool is_federation_slave)
    :PoolSQL(db, Vdc::table, !is_federation_slave, true)
{
    string error_str;

    //Federation slaves do not need to init the pool
    if (is_federation_slave)
    {
        return;
    }

    //lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        ostringstream vdc_tmpl;
        Template *    tmpl = new Template;

        // Build the default vdc
        vdc_tmpl << "NAME=" << DEFAULT_NAME << endl
                 << "DESCRIPTION=\"Every new group is added to this VDC. "
                 << "Use it to store default access rules for your groups. "
                 << "NOTE: You may need to remove a group from the default "
                 << "VDC before assigning it to other VDC.\"\n";
        int rc = tmpl->parse_str_or_xml(vdc_tmpl.str(), error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        allocate(tmpl, &rc, error_str);

        if( rc < 0 )
        {
            goto error_bootstrap;
        }

        Vdc* vdc = get(rc, true);

        vdc->add_group(GroupPool::USERS_ID, error_str);
        vdc->add_cluster(Nebula::instance().get_zone_id(), Vdc::ALL_RESOURCES, error_str);

        update(vdc);

        vdc->unlock();

        // The first 100 Vdc IDs are reserved for system Vdcs.
        // Regular ones start from ID 100

        set_update_lastOID(99);
    }

    return;

error_bootstrap:
    ostringstream oss;
    oss << "Error trying to create default vdc: " << error_str;
    NebulaLog::log("VDC",Log::ERROR,oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcPool::allocate(
        Template *  vdc_template,
        int *       oid,
        string&     error_str)
{
    Vdc * vdc;
    Vdc * vdc_aux = 0;

    string name;

    ostringstream oss;

    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "VdcPool::allocate called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    vdc = new Vdc(-1, vdc_template);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    vdc->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    vdc_aux = get(name,false);

    if( vdc_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(vdc, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by Vdc " << vdc_aux->get_oid() << ".";
    error_str = oss.str();

error_name:
    delete vdc;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcPool::update(Vdc * vdc)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "VdcPool::update called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    return vdc->update(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VdcPool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "VdcPool::drop called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    Vdc * vdc = static_cast<Vdc*>(objsql);

    // Return error if the vdc is a default one.
    if( vdc->get_oid() < 100 )
    {
        error_msg = "System VDCs (ID < 100) cannot be deleted.";
        NebulaLog::log("VDC", Log::ERROR, error_msg);
        return -2;
    }

    return PoolSQL::drop(objsql, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
