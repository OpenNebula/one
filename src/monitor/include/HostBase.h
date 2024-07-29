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
#ifndef HOST_BASE_H_
#define HOST_BASE_H_

#include <set>
#include "BaseObject.h"
#include "Host.h"   // For HostState, can we moved it to reduce dependencies?

class HostBase : public BaseObject, public ClusterableSingle
{
public:
    explicit HostBase(const std::string &xml_string)
        : BaseObject(xml_string)
        , ClusterableSingle(-1, "")
    {
        init_attributes();
    }

    explicit HostBase(const xmlNodePtr node)
        : BaseObject(node)
        , ClusterableSingle(-1, "")
    {
        init_attributes();
    }

    /**
     * Rebuilds the object from an xml formatted string
     * @param xml_str The xml-formatted string
     * @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     * Print object to xml string
     *  @return xml formatted string
     */
    std::string to_xml() const override;

    int cluster_id() const
    {
        return ClusterableSingle::cluster_id;
    };

    Host::HostState state() const
    {
        return _state;
    }

    Host::HostState prev_state() const
    {
        return _prev_state;
    }

    /**
     * Retrieves VMM mad name
     *    @return string vmm mad name
     */
    const std::string& vmm_mad() const
    {
        return _vmm_mad;
    };

    /**
     * Retrieves IM mad name
     *    @return string im mad name
     */
    const std::string& im_mad() const
    {
        return _im_mad;
    };

    time_t last_monitored() const { return _last_monitored; }
    void last_monitored(time_t lm) { _last_monitored = lm; }

    bool monitor_in_progress() const { return _monitor_in_progress; }
    void monitor_in_progress(bool mip) { _monitor_in_progress = mip; }

    time_t last_state_vm() const { return _last_state_vm; }
    void last_state_vm(time_t lsv) { _last_state_vm = lsv; }

    time_t last_monitor_vm() const { return _last_monitor_vm; }
    void last_monitor_vm(time_t lmv) { _last_monitor_vm = lmv; }

    time_t last_monitor_host() const { return _last_monitor_host; }
    void last_monitor_host(time_t lmh) { _last_monitor_host = lmh; }

    time_t last_system_host() const { return _last_system_host; }
    void last_system_host(time_t lsh) { _last_system_host = lsh; }

    /**
     *  Prints the Host information to an output stream. This function is used
     *  for logging purposes.
     */
    friend std::ostream& operator<<(std::ostream& o, const HostBase& host);

protected:
    int init_attributes();

private:
    Host::HostState _state      = Host::INIT;
    Host::HostState _prev_state = Host::INIT;

    std::string _vmm_mad;
    std::string _im_mad;

    Template _obj_template;

    time_t _last_monitored  = 0;
    bool   _monitor_in_progress = false;

    time_t _last_state_vm     = 0;
    time_t _last_monitor_vm   = 0;

    time_t _last_monitor_host = 0;
    time_t _last_system_host  = 0;
};

#endif // HOST_BASE_H_
