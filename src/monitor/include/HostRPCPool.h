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
#ifndef HOST_RPC_POOL_H_
#define HOST_RPC_POOL_H_

#include "HostBase.h"
#include "HostMonitoringTemplate.h"
#include "RPCPool.h"

// Provides list of HostBase objects
class HostRPCPool : public RPCPool
{
public:
    using HostBaseLock = BaseObjectLock<HostBase>;

    HostRPCPool(SqlDB* db, time_t expire_time)
        : RPCPool(db)
        , monitor_expiration(expire_time)
    {
        if (monitor_expiration <=0)
        {
            clean_all_monitoring();
        }
    }


    HostBaseLock get(int oid) const
    {
        return RPCPool::get<HostBase>(oid);
    }

    void add_object(const std::string& xml_string)
    {
        // todo Handle error state, when the object can't be constructed from xml
        RPCPool::add_object(std::unique_ptr<HostBase>(new HostBase(xml_string)));
    }

    /**
     *  Write monitoring data to DB
     */
    int update_monitoring(const HostMonitoringTemplate& h);

    /**
     * Deletes the expired monitoring entries for all hosts
     *
     * @return 0 on success
     */
    int clean_expired_monitoring();

    /**
     * Get the least monitored hosts
     *   @param discovered hosts
     *   @param target_time Filters hosts with last_mon_time <= target_time
     */
    void discover(std::set<int> * discovered_hosts, time_t target_time);

protected:
    void add_object(xmlNodePtr node) override
    {
        RPCPool::add_object<HostBase>(node);
    }

    /**
     * Deletes all monitoring entries for all hosts
     *
     * @return 0 on success
     */
    void clean_all_monitoring();

private:
    time_t monitor_expiration;
};

#endif // HOST_RPC_POOL_H_
