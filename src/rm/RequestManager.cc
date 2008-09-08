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

#include "RequestManager.h"
#include "Nebula.h"
#include <cerrno>

#include <sys/signal.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <unistd.h>
#include <fcntl.h>
   
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * rm_action_loop(void *arg)
{
    RequestManager *  rm;

    if ( arg == 0 )
    {
        return 0;
    }

    Nebula::log("ReM",Log::INFO,"Request Manager started.");

    rm = static_cast<RequestManager *>(arg);
    
    rm->am.loop(0,0);

    Nebula::log("ReM",Log::INFO,"Request Manager stopped.");
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
    
extern "C" void * rm_xml_server_loop(void *arg)
{
    RequestManager *    rm;
    ostringstream       oss;
        
    if ( arg == 0 )
    {
        return 0;
    }

    rm = static_cast<RequestManager *>(arg);
 
    // Set cancel state for the thread
    
    pthread_setcancelstate(PTHREAD_CANCEL_ENABLE,0);

    pthread_setcanceltype(PTHREAD_CANCEL_ASYNCHRONOUS,0);
      
    //Start the server
    
    oss << "Starting XML-RPC server, port " << rm->port << " ...";
    Nebula::log("ReM",Log::INFO,oss);
        
    rm->AbyssServer = new xmlrpc_c::serverAbyss(xmlrpc_c::serverAbyss::constrOpt()
        .registryP(&rm->RequestManagerRegistry)
        .logFileName(rm->xml_log_file)
        .socketFd(rm->socket_fd));
        
    rm->AbyssServer->run();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManager::setup_socket()
{
    int                 rc;
    int                 yes = 1;
    struct sockaddr_in  rm_addr;
    
    socket_fd = socket(AF_INET, SOCK_STREAM, 0);
    
    if ( socket_fd == -1 )
    {
        ostringstream oss;

        oss << "Can not open server socket: " << strerror(errno);
        Nebula::log("ReM",Log::ERROR,oss);
       
        return -1; 
    }
  
    rc = setsockopt(socket_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int)); 

    if ( rc == -1 )
    {
        ostringstream oss;

        oss << "Can not set socket options: " << strerror(errno);
        Nebula::log("ReM",Log::ERROR,oss);
        
        close(socket_fd);
               
        return -1;        
    }
    
    fcntl(socket_fd,F_SETFD,FD_CLOEXEC); // Close socket in MADs
    
    rm_addr.sin_family      = AF_INET;
    rm_addr.sin_port        = htons(port);
    rm_addr.sin_addr.s_addr = INADDR_ANY;

    rc = bind(socket_fd,(struct sockaddr *) &(rm_addr),sizeof(struct sockaddr));

    if ( rc == -1) 
    {
        ostringstream oss;

        oss << "Can not bind to port " << port << " : " << strerror(errno);
        Nebula::log("ReM",Log::ERROR,oss);
       
        close(socket_fd);
            
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManager::start()
{
    pthread_attr_t  pattr;
    
    Nebula::log("ReM",Log::INFO,"Starting Request Manager...");
    
    int rc = setup_socket();
    
    if ( rc != 0 )
    {
        return -1;
    }
    
    register_xml_methods();
    
    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);
    
    pthread_create(&rm_thread,&pattr,rm_action_loop,(void *)this);
    
    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);
    
    pthread_create(&rm_xml_server_thread,&pattr,rm_xml_server_loop,(void *)this);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
  
void RequestManager::do_action(
        const string &  action,
        void *          arg)
{
    if (action == ACTION_FINALIZE)
    {
        Nebula::log("ReM",Log::INFO,"Stopping Request Manager...");
        
        pthread_cancel(rm_xml_server_thread); 

        pthread_join(rm_xml_server_thread,0);

        Nebula::log("ReM",Log::INFO,"XML-RPC server stopped.");

        delete AbyssServer;
        
        if ( socket_fd != -1 )
        {
            close(socket_fd);
        }
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;
        
        Nebula::log("ReM", Log::ERROR, oss);        
    }    
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
        
void RequestManager::register_xml_methods()
{
    xmlrpc_c::methodPtr vm_allocate(new 
        RequestManager::VirtualMachineAllocate);
        
    xmlrpc_c::methodPtr vm_deploy(new 
        RequestManager::VirtualMachineDeploy(vmpool,hpool));
        
    xmlrpc_c::methodPtr vm_migrate(new 
        RequestManager::VirtualMachineMigrate(vmpool,hpool));
        
    xmlrpc_c::methodPtr vm_action(new 
        RequestManager::VirtualMachineAction);

    xmlrpc_c::methodPtr vm_cancel(new 
        RequestManager::VirtualMachineCancel(vmpool));
        
    xmlrpc_c::methodPtr vm_info(new 
        RequestManager::VirtualMachineInfo(vmpool));
        
    xmlrpc_c::methodPtr host_allocate(new 
        RequestManager::HostAllocate(hpool));
        
    xmlrpc_c::methodPtr host_info(new 
        RequestManager::HostInfo(hpool));
        
    xmlrpc_c::methodPtr host_delete(new 
        RequestManager::HostDelete(hpool));

    xmlrpc_c::methodPtr host_enable(new 
        RequestManager::HostEnable(hpool));

    /* VM related methods  */    
        
    RequestManagerRegistry.addMethod("one.vmallocate", vm_allocate);
    RequestManagerRegistry.addMethod("one.vmdeploy", vm_deploy);
    RequestManagerRegistry.addMethod("one.vmaction", vm_action);
    RequestManagerRegistry.addMethod("one.vmmigrate", vm_migrate);
    RequestManagerRegistry.addMethod("one.vmcancel", vm_cancel);
    RequestManagerRegistry.addMethod("one.vmget_info", vm_info);
     
    /* Host related methods*/
     
    RequestManagerRegistry.addMethod("one.hostallocate", host_allocate);   
    RequestManagerRegistry.addMethod("one.hostinfo", host_info); 
    RequestManagerRegistry.addMethod("one.hostdelete", host_delete);
    RequestManagerRegistry.addMethod("one.hostenable", host_enable);
    
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
        
