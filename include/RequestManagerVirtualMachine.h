/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();

        auth_object = PoolObjectSQL::VM;
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerVirtualMachine(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att) = 0;

    bool vm_authorization(int id,
                          ImageTemplate *         tmpl,
                          VirtualMachineTemplate* vtmpl,
                          RequestAttributes&      att,
                          PoolObjectAuth *        host_perms,
                          PoolObjectAuth *        ds_perm,
                          PoolObjectAuth *        img_perm,
                          AuthRequest::Operation  op);

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
        string& vnm,
        int&    cluster_id,
        string& ds_location,
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
                    const string&    vnm_mad,
                    const string&    tm_mad,
                    const string&    ds_location,
                    int              ds_id,
                    RequestAttributes& att);

    VirtualMachine * get_vm(int id, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAction : public RequestManagerVirtualMachine
{
public:
    //auth_op is MANAGE for all actions but "resched" and "unresched"
    //this is dynamically set for each request in the execute method
    VirtualMachineAction():
        RequestManagerVirtualMachine("VirtualMachineAction",
                                     "Performs an action on a virtual machine",
                                     "A:ssi"){};
    ~VirtualMachineAction(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDeploy : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDeploy():
        RequestManagerVirtualMachine("VirtualMachineDeploy",
                                     "Deploys a virtual machine",
                                     "A:siibi")
    {
         auth_op = AuthRequest::ADMIN;
    };

    ~VirtualMachineDeploy(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineMigrate : public RequestManagerVirtualMachine
{
public:
    VirtualMachineMigrate():
        RequestManagerVirtualMachine("VirtualMachineMigrate",
                                     "Migrates a virtual machine",
                                     "A:siibbi")
    {
         auth_op = AuthRequest::ADMIN;
    };

    ~VirtualMachineMigrate(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDiskSaveas : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSaveas():
        RequestManagerVirtualMachine("VirtualMachineDiskSaveas",
                           "Save a disk from virtual machine as a new image",
                           "A:siissi"){};

    ~VirtualMachineDiskSaveas(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineMonitoring : public RequestManagerVirtualMachine
{
public:

    VirtualMachineMonitoring():
        RequestManagerVirtualMachine("VirtualMachineMonitoring",
                "Returns the virtual machine monitoring records",
                "A:si")
    {
        auth_op = AuthRequest::USE;
    };

    ~VirtualMachineMonitoring(){};

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAttach : public RequestManagerVirtualMachine
{
public:
    VirtualMachineAttach():
        RequestManagerVirtualMachine("VirtualMachineAttach",
                           "Attaches a new disk to the virtual machine",
                           "A:sis"){};

    ~VirtualMachineAttach(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineDetach : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDetach():
        RequestManagerVirtualMachine("VirtualMachineDetach",
                           "Detaches a disk from a virtual machine",
                           "A:sii"){};

    ~VirtualMachineDetach(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineAttachNic : public RequestManagerVirtualMachine
{
public:
    VirtualMachineAttachNic():
        RequestManagerVirtualMachine("VirtualMachineAttachNic",
                           "Attaches a new NIC to the virtual machine",
                           "A:sis"){};

    ~VirtualMachineAttachNic(){};

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& ra);

    /**
     * Process a NIC attahment request to a Virtual Machine
     *   @param id of the VirtualMachine
     *   @param tmpl with the new NIC description
     *   @param att attributes of this request
     *   @return ErroCode as defined in Request
     */
    static ErrorCode attach(int id, VirtualMachineTemplate& tmpl, RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDetachNic : public RequestManagerVirtualMachine
{
public:
    VirtualMachineDetachNic():
        RequestManagerVirtualMachine("VirtualMachineDetachNic",
                           "Detaches a NIC from a virtual machine",
                           "A:sii"){};

    ~VirtualMachineDetachNic(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);

    /**
     * Process a NIC detach request to a Virtual Machine
     *   @param id of the VirtualMachine
     *   @param nic_id id of the NIC
     *   @param att attributes of this request
     *   @return ErroCode as defined in Request
     */
    static ErrorCode detach(int id, int nic_id, RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineResize : public RequestManagerVirtualMachine
{
public:
    VirtualMachineResize():
        RequestManagerVirtualMachine("VirtualMachineResize",
                           "Changes the capacity of the virtual machine",
                           "A:sisb"){};
    ~VirtualMachineResize(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotCreate: public RequestManagerVirtualMachine
{
public:
    VirtualMachineSnapshotCreate():
        RequestManagerVirtualMachine("VirtualMachineSnapshotCreate",
                           "Creates a new virtual machine snapshot",
                           "A:sis"){};

    ~VirtualMachineSnapshotCreate(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotRevert: public RequestManagerVirtualMachine
{
public:
    VirtualMachineSnapshotRevert():
        RequestManagerVirtualMachine("VirtualMachineSnapshotRevert",
                           "Reverts a virtual machine to a snapshot",
                           "A:sii"){};

    ~VirtualMachineSnapshotRevert(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSnapshotDelete: public RequestManagerVirtualMachine
{
public:
    VirtualMachineSnapshotDelete():
        RequestManagerVirtualMachine("VirtualMachineSnapshotDelete",
                           "Deletes a virtual machine snapshot",
                           "A:sii"){};

    ~VirtualMachineSnapshotDelete(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineRecover: public RequestManagerVirtualMachine
{
public:
    VirtualMachineRecover():
        RequestManagerVirtualMachine("VirtualMachineRecover",
                                     "Recovers a virtual machine",
                                     "A:sii")
    {
         auth_op = AuthRequest::ADMIN;
    };

    ~VirtualMachineRecover(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachinePoolCalculateShowback : public RequestManagerVirtualMachine
{
public:

    VirtualMachinePoolCalculateShowback():
        RequestManagerVirtualMachine("VirtualMachinePoolCalculateShowback",
                                     "Processes all the history records, and stores the monthly cost for each VM",
                                     "A:sii")
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmpool();
        auth_object = PoolObjectSQL::VM;
    };

    ~VirtualMachinePoolCalculateShowback(){};

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotCreate: public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSnapshotCreate():
        RequestManagerVirtualMachine("VirtualMachineDiskSnapshotCreate",
                           "Creates a new virtual machine disk snapshot",
                           "A:siis"){
        Nebula& nd  = Nebula::instance();
        ipool       = nd.get_ipool();
    };

    ~VirtualMachineDiskSnapshotCreate(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);

private:
    ImagePool* ipool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotRevert: public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSnapshotRevert():
        RequestManagerVirtualMachine("VirtualMachineDiskSnapshotRevert",
                           "Reverts disk state to a snapshot",
                           "A:siii"){};

    ~VirtualMachineDiskSnapshotRevert(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineDiskSnapshotDelete: public RequestManagerVirtualMachine
{
public:
    VirtualMachineDiskSnapshotDelete():
        RequestManagerVirtualMachine("VirtualMachineDiskSnapshotDelete",
                           "Deletes a disk snapshot",
                           "A:siii"){
        Nebula& nd  = Nebula::instance();
        ipool       = nd.get_ipool();
    };

    ~VirtualMachineDiskSnapshotDelete(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);

private:
    ImagePool* ipool;
};

#endif
