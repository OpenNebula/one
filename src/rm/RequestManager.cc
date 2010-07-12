/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "NebulaLog.h"
#include <cerrno>

#include <sys/signal.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <unistd.h>
#include <fcntl.h>
#include <string.h> 
#include <cstring>
   
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * rm_action_loop(void *arg)
{
    RequestManager *  rm;

    if ( arg == 0 )
    {
        return 0;
    }

    NebulaLog::log("ReM",Log::INFO,"Request Manager started.");

    rm = static_cast<RequestManager *>(arg);
    
    rm->am.loop(0,0);

    NebulaLog::log("ReM",Log::INFO,"Request Manager stopped.");
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
    
extern "C" void * rm_xml_server_loop(void *arg)
{
    RequestManager *    rm;
        
    if ( arg == 0 )
    {
        return 0;
    }

    rm = static_cast<RequestManager *>(arg);
 
    // Set cancel state for the thread
    
    pthread_setcancelstate(PTHREAD_CANCEL_ENABLE,0);

    pthread_setcanceltype(PTHREAD_CANCEL_ASYNCHRONOUS,0);
      
    //Start the server
            
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
        NebulaLog::log("ReM",Log::ERROR,oss);
       
        return -1; 
    }
  
    rc = setsockopt(socket_fd, SOL_SOCKET, SO_REUSEADDR, &yes, sizeof(int)); 

    if ( rc == -1 )
    {
        ostringstream oss;

        oss << "Can not set socket options: " << strerror(errno);
        NebulaLog::log("ReM",Log::ERROR,oss);
        
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
        NebulaLog::log("ReM",Log::ERROR,oss);
       
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
    ostringstream   oss;
    
    NebulaLog::log("ReM",Log::INFO,"Starting Request Manager...");
    
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
    
    oss << "Starting XML-RPC server, port " << port << " ...";
    NebulaLog::log("ReM",Log::INFO,oss);
    
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
        NebulaLog::log("ReM",Log::INFO,"Stopping Request Manager...");
        
        pthread_cancel(rm_xml_server_thread); 

        pthread_join(rm_xml_server_thread,0);

        NebulaLog::log("ReM",Log::INFO,"XML-RPC server stopped.");

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
        
        NebulaLog::log("ReM", Log::ERROR, oss);
    }    
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
        
void RequestManager::register_xml_methods()
{
    xmlrpc_c::methodPtr vm_allocate(new 
        RequestManager::VirtualMachineAllocate(upool));
        
    xmlrpc_c::methodPtr vm_deploy(new 
        RequestManager::VirtualMachineDeploy(vmpool,hpool,upool));
        
    xmlrpc_c::methodPtr vm_migrate(new 
        RequestManager::VirtualMachineMigrate(vmpool,hpool,upool));
        
    xmlrpc_c::methodPtr vm_action(new 
        RequestManager::VirtualMachineAction(vmpool,upool));
        
    xmlrpc_c::methodPtr vm_info(new 
        RequestManager::VirtualMachineInfo(vmpool,upool));

    xmlrpc_c::methodPtr vm_pool_info(new
        RequestManager::VirtualMachinePoolInfo(vmpool,upool));
        
    xmlrpc_c::methodPtr host_allocate(new 
        RequestManager::HostAllocate(hpool,upool));
        
    xmlrpc_c::methodPtr host_info(new 
        RequestManager::HostInfo(hpool, upool));

    xmlrpc_c::methodPtr hostpool_info(new 
        RequestManager::HostPoolInfo(hpool,upool));
        
    xmlrpc_c::methodPtr host_delete(new 
        RequestManager::HostDelete(hpool,upool));

    xmlrpc_c::methodPtr host_enable(new 
        RequestManager::HostEnable(hpool,upool));
        
    xmlrpc_c::methodPtr vn_allocate(new 
        RequestManager::VirtualNetworkAllocate(vnpool,upool));
        
    xmlrpc_c::methodPtr vn_info(new 
        RequestManager::VirtualNetworkInfo(vnpool,upool));
        
    xmlrpc_c::methodPtr vnpool_info(new 
        RequestManager::VirtualNetworkPoolInfo(vnpool,upool));
        
    xmlrpc_c::methodPtr vn_publish(new    
        RequestManager::VirtualNetworkPublish(vnpool, upool));

    xmlrpc_c::methodPtr vn_delete(new 
        RequestManager::VirtualNetworkDelete(vnpool, upool));

    xmlrpc_c::methodPtr user_allocate(new    
        RequestManager::UserAllocate(upool));

    xmlrpc_c::methodPtr user_delete(new    
        RequestManager::UserDelete(upool));
    
    xmlrpc_c::methodPtr userpool_info(new    
        RequestManager::UserPoolInfo(upool));
        
    xmlrpc_c::methodPtr image_allocate(new    
        RequestManager::ImageAllocate(ipool, upool));
        
    xmlrpc_c::methodPtr image_delete(new    
        RequestManager::ImageDelete(ipool, upool));
        
    xmlrpc_c::methodPtr image_info(new    
        RequestManager::ImageInfo(ipool, upool));
        
    xmlrpc_c::methodPtr image_update(new    
        RequestManager::ImageUpdate(ipool, upool));
    
    xmlrpc_c::methodPtr image_rm_attribute(new    
        RequestManager::ImageRemoveAttribute(ipool, upool));
        
    xmlrpc_c::methodPtr image_publish(new    
        RequestManager::ImagePublish(ipool, upool));
        
    xmlrpc_c::methodPtr image_enable(new    
        RequestManager::ImageEnable(ipool, upool));
        
    xmlrpc_c::methodPtr imagepool_info(new    
        RequestManager::ImagePoolInfo(ipool, upool));

    /* VM related methods  */    
        
    RequestManagerRegistry.addMethod("one.vm.allocate",vm_allocate);
    RequestManagerRegistry.addMethod("one.vm.deploy",  vm_deploy);
    RequestManagerRegistry.addMethod("one.vm.action",  vm_action);
    RequestManagerRegistry.addMethod("one.vm.migrate", vm_migrate);
    RequestManagerRegistry.addMethod("one.vm.info",    vm_info);

    RequestManagerRegistry.addMethod("one.vmpool.info", vm_pool_info);
     
    /* Host related methods*/
     
    RequestManagerRegistry.addMethod("one.host.allocate", host_allocate);   
    RequestManagerRegistry.addMethod("one.host.info",     host_info);
    RequestManagerRegistry.addMethod("one.host.delete",   host_delete);
    RequestManagerRegistry.addMethod("one.host.enable",   host_enable);
    
    RequestManagerRegistry.addMethod("one.hostpool.info", hostpool_info); 
	    
    /* Network related methods*/
     
    RequestManagerRegistry.addMethod("one.vn.allocate", vn_allocate);   
    RequestManagerRegistry.addMethod("one.vn.info",     vn_info); 
    RequestManagerRegistry.addMethod("one.vn.publish",  vn_publish);
    RequestManagerRegistry.addMethod("one.vn.delete",   vn_delete);

    RequestManagerRegistry.addMethod("one.vnpool.info", vnpool_info); 
    
    
    /* User related methods*/
        
    RequestManagerRegistry.addMethod("one.user.allocate", user_allocate);
    RequestManagerRegistry.addMethod("one.user.delete",   user_delete);

    RequestManagerRegistry.addMethod("one.userpool.info", userpool_info);
    
    /* Image related methods*/
    
    RequestManagerRegistry.addMethod("one.image.allocate",image_allocate);
    RequestManagerRegistry.addMethod("one.image.delete",  image_delete);
    RequestManagerRegistry.addMethod("one.image.info",    image_info);
    RequestManagerRegistry.addMethod("one.image.update",  image_update);     
    RequestManagerRegistry.addMethod("one.image.rmattr",  image_rm_attribute);   
    RequestManagerRegistry.addMethod("one.image.publish", image_publish);  
    RequestManagerRegistry.addMethod("one.image.enable",  image_enable);    

    RequestManagerRegistry.addMethod("one.imagepool.info", imagepool_info);
    
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
        
