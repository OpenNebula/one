/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
                          ImageTemplate *        tmpl,
                          RequestAttributes&     att, 
                          PoolObjectAuth *       host_perms, 
                          PoolObjectAuth *       ds_perm,
                          AuthRequest::Operation op);

    int get_host_information(int hid, string& name, string& vmm, string& vnm,
            RequestAttributes& att, PoolObjectAuth& host_perms);

    int add_history(VirtualMachine * vm,
                    int              hid,
                    const string&    hostname,
                    const string&    vmm_mad,
                    const string&    vnm_mad,
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
                                     "A:sii")
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
                                     "A:siib")
    {
         auth_op = AuthRequest::ADMIN;
    };

    ~VirtualMachineMigrate(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
            RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualMachineSaveDisk : public RequestManagerVirtualMachine
{
public:
    VirtualMachineSaveDisk():
        RequestManagerVirtualMachine("VirtualMachineSaveDisk",
                           "Saves a disk from virtual machine as a new image",
                           "A:siiss"){};

    ~VirtualMachineSaveDisk(){};

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

    /* -------------------------------------------------------------------- */

    void request_execute(
            xmlrpc_c::paramList const& paramList, RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
