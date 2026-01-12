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

#include "HostAPI.h"
#include "InformationManager.h"
#include "VdcPool.h"
#include "VirtualMachinePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode HostAPI::status(int oid, int status, RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto host = hpool->get(oid);

    if ( !host )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    switch (status)
    {
        case ENABLED:
            host->enable();
            break;
        case DISABLED:
            host->disable();
            break;
        case OFFLINE:
            host->offline();
            break;
        default:
            att.resp_msg = "Wrong status code";

            return Request::INTERNAL;
    }

    hpool->update(host.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                  bool recursive,
                  RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();
    InformationManager * im = nd.get_im();

    std::string error;

    Host* host = static_cast<Host *>(object.get());

    if ( host->get_share_running_vms() > 0 )
    {
        att.resp_msg = "Can not remove a host with running VMs";

        return -1;
    }

    string im_mad = host->get_im_mad();
    string name   = host->get_name();
    int    oid    = host->get_oid();

    int rc = SharedAPI::drop(std::move(object), false, att);

    im->stop_monitor(oid, name, im_mad);
    im->delete_host(oid);

    if (rc != 0)
    {
        return rc;
    }

    // Remove host from VDC
    int       zone_id = nd.get_zone_id();
    VdcPool * vdcpool = nd.get_vdcpool();

    std::vector<int> vdcs;

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_host(zone_id, oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode HostAllocateAPI::allocate(const std::string& name,
                                             const std::string& im_mad,
                                             const std::string& vmm_mad,
                                             int cluster_id,
                                             int& oid,
                                             RequestAttributes& att)
{
    _host_name = name;
    _im_mad = im_mad;
    _vmm_mad = vmm_mad;

    if ( cluster_id == ClusterPool::NONE_CLUSTER_ID )
    {
        cluster_id = ClusterPool::DEFAULT_CLUSTER_ID;
    }

    return SharedAPI::allocate("", cluster_id, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode HostAllocateAPI::pool_allocate(
        unique_ptr<Template>   tmpl,
        int&                   id,
        RequestAttributes&     att,
        int                    cluster_id,
        const string&          cluster_name)
{
    int rc = hpool->allocate(&id,
                             _host_name,
                             _im_mad,
                             _vmm_mad,
                             cluster_id,
                             cluster_name,
                             att.resp_msg);

    return rc < 0 ? Request::ALLOCATE : Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void HostAPI::batch_rename(int oid)
{
    set<int> vms;
    string host_name;

    if ( auto host = hpool->get_ro(oid) )
    {
        vms = host->get_vm_ids();

        host_name = host->get_name();
    }
    else
    {
        return;
    }

    VirtualMachinePool * vmpool = Nebula::instance().get_vmpool();

    for (auto vid : vms)
    {
        if (auto vm = vmpool->get(vid))
        {
            if (vm->hasHistory() && vm->get_hid() == oid)
            {
                vm->set_hostname(host_name);

                vmpool->update_history(vm.get());
                vmpool->update_search(vm.get());
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode HostMonitoringAPI::monitoring(int oid,
                                                 string& xml,
                                                 RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = hpool->dump_monitoring(xml, oid);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
