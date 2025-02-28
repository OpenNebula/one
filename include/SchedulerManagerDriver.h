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

#ifndef SCHEDULER_MANAGER_DRIVER_H_
#define SCHEDULER_MANAGER_DRIVER_H_

#include "ProtocolMessages.h"
#include "Driver.h"

#include "NebulaLog.h"

struct SchedRequest;

class VirtualMachinePool;
class HostPool;
class DatastorePool;
class VirtualNetworkPool;
class UserPool;
class ClusterPool;
class VMGroupPool;

/**
 *  SchedulerManagerDriver provides a base class to implement Scheduler drivers
 *  This class implements the protocol and reconnect functions from the Driver
 *  interface.
 *
 *  This class also includes the logic to generate scheduler inputs (object pools)
 *  and SCHED_REQUIREMENTS filtering.
 *
 *  This class can be used as base to implement the interface of specific scheculers
 *  that needs to adapt the default logic.
 */
class SchedulerManagerDriver : public Driver<scheduler_msg_t>
{
public:
    SchedulerManagerDriver(const std::string& c, const std::string& a, int ct);

    virtual ~SchedulerManagerDriver() = default;

    void place() const;

    void optimize(int cluster_id) const;

    void log_vm(int id, const std::string& msg) const;

    void log_cluster(int cluster_id, const std::string& msg) const;

protected:
    friend class SchedulerManager;

    /**
     *  Renders a scheduler request in the provided stream to send it to the
     *  scheduler.
     *    @return 0 on success
     */
    int scheduler_message(SchedRequest& sr, std::ostringstream& oss) const;

    /* ---------------------------------------------------------------------- */
    /* Match-making functions                                                 */
    /* ---------------------------------------------------------------------- */

    int setup_place_pools(SchedRequest& sr) const;

    int setup_optimize_pools(int cluster_id, SchedRequest& sr) const;

    /**
     *  Creates a match-making request.
     *    @param sr, includes the set of VMs and resources to generate the match-making
     */
    void match(SchedRequest& sr, const std::string& ebase) const;

    /* ---------------------------------------------------------------------- */
    /* Driver Interface                                                       */
    /* ---------------------------------------------------------------------- */
    /**
     *  TODO Sends a deploy request to the MAD: "DEPLOY ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void place(const std::ostringstream& msg) const
    {
        write_drv(SchedulerManagerMessages::PLACE, -1, msg);
    }

    /**
     *  TODO Sends a shutdown request to the MAD: "SHUTDOWN ID XML_DRV_MSG"
     *    @param oid the virtual machine id.
     *    @param drv_msg xml data for the mad operation
     */
    void optimize(const int cluster_id, const std::ostringstream& msg) const
    {
        write_drv(SchedulerManagerMessages::OPTIMIZE, cluster_id, msg);
    }

    /**
     *  TODO
     */
    void write_drv(SchedulerManagerMessages type,
                   const int id,
                   const std::ostringstream& msg) const
    {
        scheduler_msg_t drv_msg(type, "", id, msg.str());
        write(drv_msg);
    }

private:
    //Internal reference to OpenNebula pools
    VirtualMachinePool * vmpool;

    HostPool *hpool;

    DatastorePool *dspool;

    VirtualNetworkPool *vnpool;

    UserPool *upool;

    ClusterPool *clpool;

    VMGroupPool *vmgpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*SCHEDULER_MANAGER_DRIVER_H_*/
