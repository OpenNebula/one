/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_VIRTUAL_MACHINE_H_
#define REQUEST_MANAGER_VIRTUAL_MACHINE_H

#include "Request.h"
#include "Nebula.h"
#include "VirtualMachinePool.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerVirtualMachine: public Request
{
protected:
    RequestManagerVirtualMachine(const string& method_name,
                       const string& help,
                       const string& params)
        :Request(method_name, params, help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();

        auth_object = PoolObjectSQL::VM;
        auth_op     = AuthRequest::MANAGE;
    }

    ~RequestManagerVirtualMachine() = default;

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) = 0;

    bool vm_authorization(int id,
                          ImageTemplate *         tmpl,
                          VirtualMachineTemplate* vtmpl,
                          RequestAttributes&      att,
                          PoolObjectAuth *        host_perms,
                          PoolObjectAuth *        ds_perm,
                          PoolObjectAuth *        img_perm);

    bool quota_resize_authorization(
            Template *          deltas,
            RequestAttributes&  att,
            PoolObjectAuth&     vm_perms);

    bool quota_resize_authorization(
            int                 oid,
            Template *          deltas,
            RequestAttributes&  att);

    int get_host_information(
        int     hid,
        string& name,
        string& vmm,
        int&    cluster_id,
        bool&   is_public_cloud,
        PoolObjectAuth&    host_perms,
        RequestAttributes& att);

    int get_ds_information(
        int ds_id,
        set<int>& ds_cluster_ids,
        string& tm_mad,
        RequestAttributes& att,
        bool& ds_migr);

    int get_default_ds_information(
        int cluster_id,
        int& ds_id,
        string& tm_mad,
        RequestAttributes& att);

    bool check_host(int hid,
                    bool enforce,
                    VirtualMachine* vm,
                    string& error);

    int add_history(VirtualMachine * vm,
                    int              hid,
                    int              cid,
                    const string&    hostname,
                    const string&    vmm_mad,
                    const string&    tm_mad,
                    int              ds_id,
                    RequestAttributes& att);

    VirtualMachine * get_vm(int id, RequestAttributes& att);

    VirtualMachine * get_vm_ro(int id, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAction : public RequestManagerVirtualMachine
{
public:
    VirtualMachineAction():
        RequestManagerVirtualMachine("one.vm.action",
                                     "Performs an action on a virtual machine",
                                     "A:ssi") {}
    ~VirtualMachineAction() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDeploy : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDeploy():
        RequestManagerVirtualMachine("one.vm.deploy",
                                     "Deploys a virtual machine",
                                     "A:siibis")
    {
        vm_action = VMActions::DEPLOY_ACTION;
    }

    ~VirtualMachineDeploy() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineMigrate : public RequestManagerVirtualMachine
{
public:
    VirtualMachineMigrate():
        RequestManagerVirtualMachine("one.vm.migrate",
                                     "Migrates a virtual machine",
                                     "A:siibbii")
    {
        vm_action = VMActions::MIGRATE_ACTION;
    }

    ~VirtualMachineMigrate() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSaveas : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSaveas():
        RequestManagerVirtualMachine("one.vm.disksaveas",
                           "Save a disk from virtual machine as a new image",
                           "A:siissi")
    {
        vm_action = VMActions::DISK_SAVEAS_ACTION;
    }

    ~VirtualMachineDiskSaveas() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineMonitoring : public RequestManagerVirtualMachine
{
public:
    VirtualMachineMonitoring():
        RequestManagerVirtualMachine("one.vm.monitoring",
                "Returns the virtual machine monitoring records",
                "A:si")
    {
        auth_op   = AuthRequest::USE_NO_LCK;
        vm_action = VMActions::MONITOR_ACTION;
    }

    ~VirtualMachineMonitoring() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAttach : public RequestManagerVirtualMachine
{
public:
    VirtualMachineAttach():
        RequestManagerVirtualMachine("one.vm.attach",
                           "Attaches a new disk to the virtual machine",
                           "A:sis")
    {
        auth_op   = AuthRequest::USE_NO_LCK;
        vm_action = VMActions::DISK_ATTACH_ACTION;
    }

    ~VirtualMachineAttach() = default;

    /**
     * Process a DISK attahment request to a Virtual Machine
     *   @param id of the VirtualMachine
     *   @param tl with the new DISK description
     *   @param att attributes of this request
     *   @return ErroCode as defined in Request
     */
    ErrorCode request_execute(int id, VirtualMachineTemplate& tl,
        RequestAttributes& att);

protected:

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDetach : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDetach():
        RequestManagerVirtualMachine("one.vm.detach",
                           "Detaches a disk from a virtual machine",
                           "A:sii")
    {
        auth_op   = AuthRequest::USE_NO_LCK;
        vm_action = VMActions::DISK_DETACH_ACTION;
    }

    ~VirtualMachineDetach() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAttachNic : public RequestManagerVirtualMachine
{
public:
    VirtualMachineAttachNic():
        RequestManagerVirtualMachine("one.vm.attachnic",
                           "Attaches a new NIC to the virtual machine",
                           "A:sis")
    {
        vm_action = VMActions::NIC_ATTACH_ACTION;
    }

    ~VirtualMachineAttachNic() = default;

    /**
     * Process a NIC attahment request to a Virtual Machine
     *   @param id of the VirtualMachine
     *   @param tl with the new NIC description
     *   @param att attributes of this request
     *   @return ErroCode as defined in Request
     */
    ErrorCode request_execute(int id, VirtualMachineTemplate& tl,
        RequestAttributes& att);

protected:
    void request_execute(xmlrpc_c::paramList const& pl,
            RequestAttributes& ra) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDetachNic : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDetachNic():
        RequestManagerVirtualMachine("one.vm.detachnic",
                           "Detaches a NIC from a virtual machine",
                           "A:sii")
    {
        vm_action = VMActions::NIC_DETACH_ACTION;
    }

    ~VirtualMachineDetachNic() = default;

    /**
     * Process a NIC detach request to a Virtual Machine
     *   @param id of the VirtualMachine
     *   @param nic_id id of the NIC
     *   @param att attributes of this request
     *   @return ErroCode as defined in Request
     */
    ErrorCode request_execute(int id, int nic_id, RequestAttributes& att);

protected:
    void request_execute(xmlrpc_c::paramList const& pl,
            RequestAttributes& ra) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineResize : public RequestManagerVirtualMachine
{
public:
    VirtualMachineResize():
        RequestManagerVirtualMachine("one.vm.resize",
                           "Changes the capacity of the virtual machine",
                           "A:sisb")
    {
        vm_action = VMActions::RESIZE_ACTION;
    }

    ~VirtualMachineResize() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotCreate: public RequestManagerVirtualMachine
{
public:
    VirtualMachineSnapshotCreate():
        RequestManagerVirtualMachine("one.vm.snapshotcreate",
                           "Creates a new virtual machine snapshot",
                           "A:sis")
    {
        vm_action = VMActions::SNAPSHOT_CREATE_ACTION;
    }

    ~VirtualMachineSnapshotCreate() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotRevert: public RequestManagerVirtualMachine
{
public:
    VirtualMachineSnapshotRevert():
        RequestManagerVirtualMachine("one.vm.snapshotrevert",
                           "Reverts a virtual machine to a snapshot",
                           "A:sii")
    {
        vm_action = VMActions::SNAPSHOT_REVERT_ACTION;
    }

    ~VirtualMachineSnapshotRevert() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotDelete: public RequestManagerVirtualMachine
{
public:
    VirtualMachineSnapshotDelete():
        RequestManagerVirtualMachine("one.vm.snapshotdelete",
                           "Deletes a virtual machine snapshot",
                           "A:sii")
    {
        vm_action = VMActions::SNAPSHOT_DELETE_ACTION;
    }

    ~VirtualMachineSnapshotDelete() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineRecover: public RequestManagerVirtualMachine
{
public:
    VirtualMachineRecover():
        RequestManagerVirtualMachine("one.vm.recover",
                                     "Recovers a virtual machine",
                                     "A:sii")
    {
        vm_action = VMActions::RECOVER_ACTION;
    }

    ~VirtualMachineRecover() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachinePoolCalculateShowback : public RequestManagerVirtualMachine
{
public:
    VirtualMachinePoolCalculateShowback():
        RequestManagerVirtualMachine("one.vmpool.calculateshowback",
            "Processes all the history records, and stores the monthly cost"
            " for each VM", "A:sii")
    {
        auth_object = PoolObjectSQL::VM;
    }

    ~VirtualMachinePoolCalculateShowback() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& paramList,
            RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotCreate: public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSnapshotCreate():
        RequestManagerVirtualMachine("one.vm.disksnapshotcreate",
                           "Creates a new virtual machine disk snapshot",
                           "A:siis")
    {
        Nebula& nd  = Nebula::instance();
        ipool       = nd.get_ipool();

        vm_action   = VMActions::DISK_SNAPSHOT_CREATE_ACTION;
    }

    ~VirtualMachineDiskSnapshotCreate() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;

private:
    ImagePool* ipool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotRevert: public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSnapshotRevert():
        RequestManagerVirtualMachine("one.vm.disksnapshotrevert",
                           "Reverts disk state to a snapshot",
                           "A:siii")
    {
        vm_action = VMActions::DISK_SNAPSHOT_REVERT_ACTION;
    }

    ~VirtualMachineDiskSnapshotRevert() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotDelete: public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSnapshotDelete():
        RequestManagerVirtualMachine("one.vm.disksnapshotdelete",
                           "Deletes a disk snapshot",
                           "A:siii")
    {
        Nebula& nd  = Nebula::instance();
        ipool       = nd.get_ipool();

        vm_action = VMActions::DISK_SNAPSHOT_DELETE_ACTION;
    }

    ~VirtualMachineDiskSnapshotDelete() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;

private:
    ImagePool* ipool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotRename: public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSnapshotRename():
        RequestManagerVirtualMachine("one.vm.disksnapshotrename",
                           "Rename a disk snapshot",
                           "A:siiis")
    {
        vm_action = VMActions::DISK_SNAPSHOT_RENAME_ACTION;
    }

    ~VirtualMachineDiskSnapshotRename() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineUpdateConf: public RequestManagerVirtualMachine
{
public:
    VirtualMachineUpdateConf():
        RequestManagerVirtualMachine("one.vm.updateconf",
                           "Updates several configuration attributes of a VM",
                           "A:sis")
    {
        vm_action = VMActions::UPDATECONF_ACTION;
    }

    ~VirtualMachineUpdateConf() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskResize : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskResize():
        RequestManagerVirtualMachine("one.vm.diskresize",
                           "Resizes a disk from a virtual machine",
                           "A:siis")
    {
        Nebula& nd = Nebula::instance();
        ipool      = nd.get_ipool();

        vm_action  = VMActions::DISK_RESIZE_ACTION;
    }

    ~VirtualMachineDiskResize() = default;

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) override;

private:
    ImagePool* ipool;
};

#endif
