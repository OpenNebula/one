/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#ifndef REQUEST_MANAGER_H_
#define REQUEST_MANAGER_H_

#include "ActionManager.h"
#include "VirtualMachinePool.h"
#include "HostPool.h"
#include "VirtualNetworkPool.h"

#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/registry.hpp>
#include <xmlrpc-c/server_abyss.hpp>

using namespace std;

extern "C" void * rm_action_loop(void *arg);

extern "C" void * rm_xml_server_loop(void *arg);

class RequestManager : public ActionListener
{
public:

    RequestManager(
        VirtualMachinePool *    _vmpool,
        HostPool *              _hpool,
        VirtualNetworkPool *    _vnpool,
        int                     _port,
        string                  _xml_log_file)
            :vmpool(_vmpool),hpool(_hpool),vnpool(_vnpool),port(_port),socket_fd(-1),
            xml_log_file(_xml_log_file)
    {
        am.addListener(this);
    };

    ~RequestManager()
    {}
    ;

    /**
     *  This functions starts the associated listener thread (XML server), and 
     *  creates a new thread for the Request Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return rm_thread;
    };

    /**
     * 
     */
    void finalize()
    {
        am.trigger(ACTION_FINALIZE,0);
    };

private:

    //--------------------------------------------------------------------------
    // Friends, thread functions require C-linkage
    //--------------------------------------------------------------------------

    friend void * rm_xml_server_loop(void *arg);

    friend void * rm_action_loop(void *arg);

    /**
     *  Thread id for the RequestManager
     */
    pthread_t               rm_thread;

    /**
     *  Thread id for the XML Server
     */
    pthread_t               rm_xml_server_thread;

    /**
     *  Pointer to the VM Pool, to access Virtual Machines
     */
    VirtualMachinePool *    vmpool;

    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool;
    
    /**
     *  Pointer to the VN Pool, to access Virtual Netowrks
     */
    VirtualNetworkPool *    vnpool;

    /**
     *  Port number where the connection will be open
     */
    int port;
    
    /*
     *  FD for the XML server socket
     */    
    int socket_fd;

    /**
     *  Filename for the log of the xmlrpc server that listens
     */
    string xml_log_file;

    /**
     *  Action engine for the Manager
     */
    ActionManager   am;

    /**
     *  To register XML-RPC methods
     */
    xmlrpc_c::registry RequestManagerRegistry;

    /**
     *  The XML-RPC server
     */
    xmlrpc_c::serverAbyss *  AbyssServer;

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(const string & action, void * arg);

    void register_xml_methods();
    
    int setup_socket();

    // ----------------------------------------------------------------------
    //                          XML-RPC Methods
    // ----------------------------------------------------------------------

    class VirtualMachineAllocate: public xmlrpc_c::method
    {
    public:
        VirtualMachineAllocate()
        {
            _signature="A:ss";
            _help="Allocates a virtual machine in the pool";
        };

        ~VirtualMachineAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retval);

    };
    
    /* ---------------------------------------------------------------------- */
    
    class VirtualMachineDeploy: public xmlrpc_c::method
    {
    public:
        VirtualMachineDeploy(
            VirtualMachinePool * _vmpool,
            HostPool *           _hpool):
                vmpool(_vmpool),
                hpool(_hpool)
        {
            _signature="A:sii";
            _help="Deploys a virtual machine";
        };

        ~VirtualMachineDeploy(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retval);

    private:
        VirtualMachinePool * vmpool;
        HostPool *           hpool;
    };
    
    /* ---------------------------------------------------------------------- */

    class VirtualMachineAction: public xmlrpc_c::method
    {
    public:
        VirtualMachineAction()
        {
            _signature="A:ssi";
            _help="Performs an action on a virtual machine";
        };

        ~VirtualMachineAction(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retval);

    private:
        VirtualMachinePool * vmpool;
        HostPool *           hpool;
    };

    /* ---------------------------------------------------------------------- */
    
    class VirtualMachineMigrate: public xmlrpc_c::method
    {
    public:
        VirtualMachineMigrate(
            VirtualMachinePool * _vmpool,
            HostPool *           _hpool):
                vmpool(_vmpool),
                hpool(_hpool)
        {
            _signature="A:siib";
            _help="Migrates a virtual machine";
        };

        ~VirtualMachineMigrate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retval);

    private:
        VirtualMachinePool * vmpool;
        HostPool *           hpool;
    }; 
    
    /* ---------------------------------------------------------------------- */
    
    class VirtualMachineInfo: public xmlrpc_c::method
    {
    public:
        VirtualMachineInfo(
            VirtualMachinePool * _vmpool):
                vmpool(_vmpool)
        {
            _signature="A:si";
            _help="Returns virtual machine information";
        };

        ~VirtualMachineInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retval);

    private:
        VirtualMachinePool * vmpool;
    };
    
    /* ---------------------------------------------------------------------- */
    
    class HostAllocate: public xmlrpc_c::method
    {
    public:
        HostAllocate(HostPool * _hpool):hpool(_hpool)
        {
            _signature="A:sssssb";
            _help="Allocates a host in the pool";
        };

        ~HostAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;

    };

    /* ---------------------------------------------------------------------- */
     
    class HostInfo: public xmlrpc_c::method
    {
    public:
        HostInfo(HostPool * _hpool):hpool(_hpool)
        {
            _signature="A:si";
            _help="Returns host information";
        };

        ~HostInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;

    };

    /* ---------------------------------------------------------------------- */
    
    class HostDelete: public xmlrpc_c::method
    {
    public:
        HostDelete(HostPool * _hpool):hpool(_hpool)
        {
            _signature="A:si";
            _help="Deletes a host from the pool";
        };

        ~HostDelete(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;

    };
    
    /* ---------------------------------------------------------------------- */
    
    class HostEnable: public xmlrpc_c::method
    {
    public:
        HostEnable(HostPool * _hpool):hpool(_hpool)
        {
            _signature="A:sib";
            _help="Enables or disables a host";
        };

        ~HostEnable(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;

    };   
    
    /* ---------------------------------------------------------------------- */
    /*                      Virtual Network Interface                         */    
    /* ---------------------------------------------------------------------- */
    
    
    class VirtualNetworkAllocate: public xmlrpc_c::method
    {
    public:
        VirtualNetworkAllocate(VirtualNetworkPool * _vnpool):vnpool(_vnpool)
        {
            _signature="A:ss";
            _help="Creates a virtual network";
        };

        ~VirtualNetworkAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        VirtualNetworkPool * vnpool;
    }; 
    
    /* ---------------------------------------------------------------------- */
    
    class VirtualNetworkInfo: public xmlrpc_c::method
    {
    public:
        VirtualNetworkInfo(VirtualNetworkPool * _vnpool):vnpool(_vnpool)
        {
            _signature="A:si";
            _help="Returns virtual network information";
        };

        ~VirtualNetworkInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        VirtualNetworkPool * vnpool;

    };
    
    /* ---------------------------------------------------------------------- */

    class VirtualNetworkDelete: public xmlrpc_c::method
    {
    public:
        VirtualNetworkDelete(VirtualNetworkPool * _vnpool):vnpool(_vnpool)
        {
            _signature="A:si";
            _help="Deletes a virtual network";
        };

        ~VirtualNetworkDelete(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        VirtualNetworkPool * vnpool;

    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

