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

#ifndef SCHEDULER_MANAGER_MATCH_H_
#define SCHEDULER_MANAGER_MATCH_H_

#include "VirtualMachinePool.h"
#include "DatastorePool.h"
#include "HostPool.h"
#include "VirtualNetworkPool.h"
#include "UserPool.h"
#include "ClusterPool.h"

#include <vector>
#include <map>
#include <memory>
#include <sstream>

/**
 *  This class represents a generic OpenNebula pool for structuring scheduling
 *  data
 */
template <typename P, typename O>
class SchedPool
{
public:
    SchedPool(P * p, const std::string& n):pool(p), name(n){};

    ~SchedPool() = default;

    //List of relevant ids in the pool
    std::vector<int> ids;

    //Simpe cache to store object references
    std::map<int, std::unique_ptr<O>> objects;

    //Reference to the OpenNebula pool
    P * pool;

    //Pool name
    std::string name;

    /**
     *  Gets and object from the pool. It loads the object from DB and stores
     *  the reference in the cache if not found.
     */
    O * get(int id)
    {
        O * object;

        auto it = objects.find(id);

        if ( it == objects.end() )
        {
            if (std::unique_ptr<O> pobj = pool->get_ro(id))
            {
                object = pobj.get();

                if constexpr (std::is_same_v<O, VirtualMachine> ||
                        std::is_same_v<O, Host>)
                {
                    pobj->load_monitoring();
                }

                objects.insert({id, std::move(pobj)});
            }
            else
            {
                return nullptr;
            }
        }
        else
        {
            object = it->second.get();
        }

        return object;
    }

    /**
     *  executes callable on each object ID
     */
    void each_id(const std::function<void(int)>& func)
    {
        for (auto i: ids)
        {
            func(i);
        }
    }

    /**
     * Sets an object in the pool
     */
    void set(int id, std::unique_ptr<O> object)
    {
        objects[id] = std::move(object);
    }

    /**
     * Deletes an object from the Pool if condition is true
     */
    void delete_if(const std::function<bool(int)>& test)
    {
        for(auto it = ids.begin(); it != ids.end(); )
        {
            if (test(*it))
            {
                objects.erase(*it);

                it = ids.erase(it);
            }
            else
            {
                ++it;
            }
        }
    }

    /**
     *  Dumps all objects included in the dump_ids set into the given stream.
     */
    void to_xml(std::ostringstream& oss)
    {
        to_xml(oss, ids);
    }

    template <typename C>
    void to_xml(std::ostringstream& oss, const C& dump_ids)
    {
        std::string tmp;

        oss << "<" << name << ">";

        for (int id: dump_ids)
        {
            O * obj = get(id);

            if ( obj != nullptr )
            {
                oss << obj->to_xml(tmp);
            }
        }

        oss << "</" << name << ">";
    }
};

/**
 *  This class represents a the set of resource matches for scheduling VMs.
 *  A match consists of:
 *    - Hosts
 *    - Datastores
 *    - Vnets per NIC using NETWORK_MODE auto
 *
 *  The class stores also a union of all sets to conform SCHEDULER_DRIVER_MESSAGES
 *  with relevant objects.
 */
struct SchedMatch
{
    // The struct represents the ID of the objects that matches the requirements
    // of a VM
    struct match
    {
        std::set<int> host_ids;
        std::set<int> ds_ids;
        std::map<int, std::set<int>> vnet_ids;
    };

    // Match pool, contains matches for all VMs
    std::map<int, match> requirements;

    // All VMs needed to do the match
    std::set<int> vms;

    // ID set of matched resources for any VM
    std::set<int> match_host;

    std::set<int> match_ds;

    std::set<int> match_net;

    std::set<int> match_vmgroups;

    /**
     *  Add a host ID to the list of matching hosts for this VM
     */
    void add_host(int vmid, int hostid)
    {
        auto it = requirements.find(vmid);

        if ( it == requirements.end() )
        {
            requirements[vmid] = { {hostid}, {} };
        }
        else
        {
            it->second.host_ids.insert(hostid);
        }

        match_host.insert(hostid);
    }

    /**
     *  Add a datastore ID to the list of matching system datastore for this VM
     */
    void add_ds(int vmid, int dsid)
    {
        auto it = requirements.find(vmid);

        if ( it == requirements.end() )
        {
            //Discard DS match without a previous Host match
            return;
        }

        it->second.ds_ids.insert(dsid);

        match_ds.insert(dsid);
    }

    /**
     *  Initialize the VM vnet match map
     */
    void init_net(int vm_id, std::set<int>& nic_ids)
    {
        auto it = requirements.find(vm_id);

        if ( it == requirements.end() )
        {
            return;
        }

        for (int nic_id : nic_ids)
        {
            it->second.vnet_ids[nic_id] = {};
        }
    }

    /**
     *  Add a vnet ID to the list of matching vnets for this VM NIC
     */
    void add_net(int vm_id, int nic_id, int net_id)
    {
        auto it = requirements.find(vm_id);

        if ( it == requirements.end() )
        {
            return;
        }

        auto jt = it->second.vnet_ids.find(nic_id);

        if ( jt == it->second.vnet_ids.end() )
        {
            it->second.vnet_ids[nic_id] = { net_id };
        }
        else
        {
           jt->second.insert(net_id);
        }

        match_net.insert(net_id);
    }

    // -------------------------------------------------------------------------
    // Functions to check VM matches
    // -------------------------------------------------------------------------
    bool is_host_matched(int id)
    {
        auto it = requirements.find(id);

        return it != requirements.end() && !it->second.host_ids.empty();
    }

    bool is_ds_matched(int id)
    {
        auto it = requirements.find(id);

        return it != requirements.end() && !it->second.ds_ids.empty();
    }

    bool is_net_matched(int id)
    {
        auto it = requirements.find(id);

        if (it == requirements.end())
        {
            return false;
        }

        if ( it->second.vnet_ids.empty() )
        {
            //empty map means VM has not auto nics
            return true;
        }

        for (const auto& kv : it->second.vnet_ids )
        {
            if (kv.second.empty())
            {
                return false;
            }
        }

        return true;
    }

    /**
     *  Render VM requirements as an XML document
     */
    void to_xml(std::ostringstream& oss)
    {
        oss << "<REQUIREMENTS>";

        for (const auto& pair : requirements)
        {
            oss << "<VM>";

            oss << "<ID>" << pair.first << "</ID>";

            oss << "<HOSTS>";
            for (int hid : pair.second.host_ids)
            {
                oss << "<ID>" << hid << "</ID>";
            }
            oss << "</HOSTS>";

            oss << "<DATASTORES>";
            for (int did : pair.second.ds_ids)
            {
                oss << "<ID>" << did << "</ID>";
            }
            oss << "</DATASTORES>";

            for (const auto& vpair: pair.second.vnet_ids)
            {
                oss << "<NIC>";
                oss << "<ID>" << vpair.first << "</ID>";
                oss << "<VNETS>";
                for (int vid : vpair.second)
                {
                    oss << "<ID>" << vid << "</ID>";
                }
                oss << "</VNETS>";
                oss << "</NIC>";
            }

            oss << "</VM>";
        }

        oss << "</REQUIREMENTS>";
    }
};

/**
 *  This class is used to build a Scheduler driver request message. It includes
 *  the relevant pool objects and the matchmaking results for each VM.
 */
struct SchedRequest
{
    SchedRequest(VirtualMachinePool * vmp,
                 HostPool * hp,
                 DatastorePool *dp,
                 VirtualNetworkPool *vn,
                 UserPool * up,
                 ClusterPool *cp):
        vmpool(vmp, "VM_POOL"),
        hpool(hp, "HOST_POOL"),
        dspool(dp, "DATASTORE_POOL"),
        vnpool(vn, "VNET_POOL"),
        upool(up, "USER_POOL"),
        clpool(cp, "CLUSTER_POOL")
    {};

    SchedPool<VirtualMachinePool, VirtualMachine> vmpool;
    SchedPool<HostPool, Host> hpool;
    SchedPool<DatastorePool, Datastore> dspool;
    SchedPool<VirtualNetworkPool, VirtualNetwork> vnpool;

    SchedPool<UserPool, User> upool;
    SchedPool<ClusterPool, Cluster> clpool;

    SchedMatch match;

    void merge_cluster_to_host()
    {
        std::map<int, std::string> cluster_templates;

        for (auto hid : hpool.ids)
        {
            auto host = hpool.get(hid);

            if (!host)
            {
                continue;
            }

            int cid = host->get_cluster_id();

            std::string& extra = cluster_templates[cid];

            if (extra.empty())
            {
                auto cluster = clpool.get(cid);

                if (!cluster)
                {
                    continue;
                }

                cluster->template_xml(extra);
            }

            host->extra_template(extra);
        }
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*SCHEDULER_MANAGER_MATCH_H_*/
