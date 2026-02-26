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

#ifndef VIRTUAL_MACHINE_API_H
#define VIRTUAL_MACHINE_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "VirtualMachinePool.h"
#include "VMActions.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAPI : public SharedAPI
{
public:
    VirtualMachineAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::VM);
        request.auth_op(AuthRequest::MANAGE);

        vmpool = Nebula::instance().get_vmpool();
        pool = vmpool;
    }

    Request::ErrorCode deploy(int oid,
                              int hid,
                              bool enforce,
                              int ds_id,
                              const std::string& str_tmpl,
                              RequestAttributes& att);

    Request::ErrorCode action(int oid,
                              const std::string& action_str,
                              RequestAttributes& att);

    Request::ErrorCode migrate(int vid,
                               int hid,
                               bool live,
                               bool enforce,
                               int ds_id,
                               int poweroff,
                               RequestAttributes& att);

    Request::ErrorCode disk_snapshot_create(int vid,
                                            int disk_id,
                                            const std::string& name,
                                            int& snap_id,
                                            RequestAttributes& att);

    Request::ErrorCode disk_snapshot_delete(int vid,
                                            int disk_id,
                                            int snap_id,
                                            RequestAttributes& att);

    Request::ErrorCode disk_snapshot_revert(int vid,
                                            int disk_id,
                                            int snap_id,
                                            RequestAttributes& att);

    Request::ErrorCode nic_attach(int vid,
                                  VirtualMachineTemplate& tmpl,
                                  RequestAttributes& att);

    Request::ErrorCode snapshot_create(int vid,
                                       std::string name,
                                       int& snap_id,
                                       RequestAttributes& att);

    Request::ErrorCode snapshot_delete(int vid,
                                       int snap_id,
                                       RequestAttributes& att);

    Request::ErrorCode snapshot_revert(int vid,
                                       int snap_id,
                                       RequestAttributes& att);

    Request::ErrorCode backup(int vid,
                              int backup_ds_id,
                              bool reset,
                              int bj_id, // backup job ID, use -1 for individual backup
                              RequestAttributes& att);

    Request::ErrorCode nic_detach_helper(int vid,
                                         int nic_id,
                                         RequestAttributes& att);

protected:
    /* API calls */
    Request::ErrorCode update(int oid,
                              const std::string& tmpl,
                              int update_type,
                              RequestAttributes& att) override;

    Request::ErrorCode rename(int oid,
                              const std::string& new_name,
                              RequestAttributes& att);

    Request::ErrorCode disk_save_as(int vid,
                                    int disk_id,
                                    const std::string& img_name,
                                    const std::string& img_type,
                                    int snap_id,
                                    int& image_id,
                                    RequestAttributes& att);

    Request::ErrorCode disk_snapshot_rename(int vid,
                                            int disk_id,
                                            int snap_id,
                                            const std::string& new_name,
                                            RequestAttributes& att);

    Request::ErrorCode disk_attach(int vid,
                                   const std::string& str_tmpl,
                                   RequestAttributes& att);

    Request::ErrorCode disk_detach(int vid,
                                   int disk_id,
                                   RequestAttributes& att);

    Request::ErrorCode disk_resize(int vid,
                                   int disk_id,
                                   const std::string& size_str,
                                   RequestAttributes& att);

    Request::ErrorCode nic_attach(int vid,
                                  const std::string& str_tmpl,
                                  RequestAttributes& att);

    Request::ErrorCode nic_detach(int vid,
                                  int nic_id,
                                  RequestAttributes& att);

    Request::ErrorCode nic_update(int vid,
                                  int nic_id,
                                  const std::string& str_tmpl,
                                  int append,
                                  RequestAttributes& att);

    Request::ErrorCode sg_attach(int vid,
                                 int nic_id,
                                 int sg_id,
                                 RequestAttributes& att);

    Request::ErrorCode sg_detach(int vid,
                                 int nic_id,
                                 int sg_id,
                                 RequestAttributes& att);

    Request::ErrorCode resize(int vid,
                              const std::string& str_tmpl,
                              bool enforce,
                              RequestAttributes& att);

    Request::ErrorCode update_conf(int vid,
                                   const std::string& str_tmpl,
                                   int update_type,
                                   RequestAttributes& att);

    Request::ErrorCode recover(int vid,
                               int operation,
                               RequestAttributes& att);

    Request::ErrorCode monitoring(int vid,
                                  std::string& xml,
                                  RequestAttributes& att);

    Request::ErrorCode sched_add(int vid,
                                 const std::string& str_tmpl,
                                 int& sched_id,
                                 RequestAttributes& att);

    Request::ErrorCode sched_update(int vid,
                                    int sched_id,
                                    const std::string& str_tmpl,
                                    RequestAttributes& att);

    Request::ErrorCode sched_delete(int vid,
                                    int sched_id,
                                    RequestAttributes& att);

    Request::ErrorCode backup_cancel(int vid,
                                     RequestAttributes& att);

    Request::ErrorCode restore(int vid,
                               int image_id,
                               int increment_id,
                               int disk_id,
                               RequestAttributes& att);

    Request::ErrorCode pci_attach(int vid,
                                  const std::string& str_tmpl,
                                  RequestAttributes& att);

    Request::ErrorCode pci_detach(int vid,
                                  int pci_id,
                                  RequestAttributes& att);

    Request::ErrorCode exec(int vid,
                            const std::string& cmd,
                            const std::string& cmd_stdin,
                            RequestAttributes& att);

    Request::ErrorCode exec_retry(int vid,
                                  RequestAttributes& att);

    Request::ErrorCode exec_cancel(int vid,
                                   RequestAttributes& att);

    /* Helpers */
    int exist(const std::string& name, int uid) override
    {
        return -1;
    }

    Request::ErrorCode check_name_unique(int oid, int noid, RequestAttributes& att) override
    {
        return Request::SUCCESS;
    }

    // Authorize the request, set failure_response message
    Request::ErrorCode vm_authorization(int id,
                                        ImageTemplate *         tmpl,
                                        VirtualMachineTemplate* vtmpl,
                                        RequestAttributes&      att,
                                        PoolObjectAuth *        host_perms,
                                        PoolObjectAuth *        ds_perm,
                                        PoolObjectAuth *        img_perm);

    // Check user and group quotas. Do not set failure_response on failure
    bool quota_resize_authorization(
            Template *          deltas,
            RequestAttributes&  att,
            PoolObjectAuth&     vm_perms);

    Request::ErrorCode get_host_information(
            int                hid,
            std::string&       name,
            std::string&       vmm,
            int&               cluster_id,
            PoolObjectAuth&    host_perms,
            RequestAttributes& att);

    Request::ErrorCode get_ds_information(
            int ds_id,
            std::set<int>& ds_cluster_ids,
            std::string& tm_mad,
            RequestAttributes& att,
            bool& ds_migr,
            bool& ds_live_migr,
            bool& ds_migr_snap);

    Request::ErrorCode get_default_ds_information(
            int cluster_id,
            int& ds_id,
            std::string& tm_mad,
            RequestAttributes& att);

    bool check_host(int hid,
                    bool enforce,
                    VirtualMachine* vm,
                    std::string& error);

    int add_history(VirtualMachine *   vm,
                    int                hid,
                    int                cid,
                    const std::string& hostname,
                    const std::string& vmm_mad,
                    const std::string& tm_mad,
                    int                ds_id,
                    RequestAttributes& att);

    VirtualMachinePool* vmpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineAllocateAPI : public VirtualMachineAPI
{
protected:
    VirtualMachineAllocateAPI(Request &r)
        : VirtualMachineAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& str_tmpl,
                                bool hold,
                                int& oid,
                                RequestAttributes& att);

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualMachineTemplate>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;

    Request::ErrorCode allocate_authorization(Template *tmpl,
                                              RequestAttributes&  att,
                                              PoolObjectAuth *cluster_perms) override;

private:
    bool on_hold = false;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineInfoAPI : public VirtualMachineAPI
{
protected:
    VirtualMachineInfoAPI(Request &r)
        : VirtualMachineAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }

    void to_xml(RequestAttributes& att,
                PoolObjectSQL* object,
                std::string& str) override
    {
        static_cast<VirtualMachine *>(object)->to_xml_extended(str);
    }

    void load_extended_data(PoolObjectSQL* obj) const override
    {
        static_cast<VirtualMachine*>(obj)->load_monitoring();
    }
};


#endif
