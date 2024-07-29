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
#ifndef VM_RPC_POOL_H_
#define VM_RPC_POOL_H_

#include "VirtualMachineBase.h"
#include "VirtualMachineMonitorInfo.h"
#include "RPCPool.h"

// Provides list of HostBase objects
class VMRPCPool : public RPCPool
{
public:
    using VirtualMachineBaseLock = BaseObjectLock<VirtualMachineBase>;

    VMRPCPool(SqlDB* db, time_t expire_time)
        : RPCPool(db)
        , monitor_expiration(expire_time)
    {
        if (monitor_expiration <=0)
        {
            clean_all_monitoring();
        }
    }

    VirtualMachineBaseLock get(int oid) const
    {
        return RPCPool::get<VirtualMachineBase>(oid);
    }

    /**
     * Deletes the expired monitoring entries for all VMs
     *
     * @return 0 on success
     */
    int clean_expired_monitoring();

    /**
     *  Write monitoring data to DB
     */
    int update_monitoring(const VirtualMachineMonitorInfo& vm);

    /**
     *  Read last monitoring from DB
     */
    bool get_monitoring(int vmid, VirtualMachineMonitorInfo& vm);

    /**
     *  Gets a VM ID by its deploy_id
     *    @param deploy_id to search the id for
     *    @return -1 if not found or VMID
     */
    int get_vmid(const std::string& deploy_id);

protected:
    void add_object(xmlNodePtr node) override
    {
        RPCPool::add_object<VirtualMachineBase>(node);
    }

    /**
     * Deletes all monitoring entries for all VMs
     *
     * @return 0 on success
     */
    void clean_all_monitoring();

private:
    time_t monitor_expiration;
};

#endif // VM_RPC_POOL_H_
