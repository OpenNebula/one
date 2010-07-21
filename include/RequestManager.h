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

#ifndef REQUEST_MANAGER_H_
#define REQUEST_MANAGER_H_

#include "ActionManager.h"
#include "VirtualMachinePool.h"
#include "HostPool.h"
#include "UserPool.h"
#include "VirtualNetworkPool.h"
#include "ImagePool.h"

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
        UserPool           *    _upool,
        ImagePool          *    _ipool,
        int                     _port,
        string                  _xml_log_file)
            :vmpool(_vmpool),hpool(_hpool),vnpool(_vnpool),upool(_upool),
            ipool(_ipool),port(_port),socket_fd(-1),xml_log_file(_xml_log_file)
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
    HostPool           *    hpool;
    
    /**
     *  Pointer to the VN Pool, to access Virtual Netowrks
     */
    VirtualNetworkPool *    vnpool;
    
    /**
     *  Pointer to the User Pool, to access users
     */
    UserPool           *    upool;
    
    /**
     *  Pointer to the Image Pool, to access images
     */
    ImagePool          *    ipool;

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
    // ----------------------------------------------------------------------
    //                          Error Messages
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------   
    
    
    /**
     *  Logs authorization errors
     *    @param method name of the RM method where the error arose
     *    @param action authorization action
     *    @param object object that needs to be authorized
     *    @param uid user that is authorized
     *    @param id id of the object, -1 for Pool
     *    @returns string for logging
     */
    static string authorization_error (const string& method, 
                                       const string &action, 
                                       const string &object, 
                                       int   uid,
                                       int   id)
    {
        ostringstream oss;
        oss << "[" << method << "]" << " User [" << uid << "] not authorized"               
            << " to perform " << action << " on " << object; 
            
        
        if ( id != -1 )
        {
            oss << " [" << id << "].";
        }
        else
        {
            oss << " Pool";
        }
        
        return oss.str();
    }
    
    /**
     *  Logs authenticate errors
     *    @param method name of the RM method where the error arose
     *    @returns string for logging
     */   
    static string authenticate_error (const string& method)
    {
        ostringstream oss;
        
        oss << "[" << method << "]" << " User couldn't be authenticated," <<
               " aborting call.";
      
        return oss.str();
    }
    
    /**
     *  Logs get object errors
     *    @param method name of the RM method where the error arose
     *    @param object over which the get failed
     *    @param id of the object over which the get failed
     *    @returns string for logging
     */
    static string get_error (const string& method, 
                             const string &object, 
                             int id)
    {
        ostringstream oss;
        
        oss << "[" << method << "]" << " Error getting " << 
               object;
               
       if ( id != -1 )
       {
           oss << " [" << id << "].";
       }
       else
       {
          oss << " Pool."; 
       }
        
       return oss.str();
    }
    
    /**
     *  Logs action errors
     *    @param method name of the RM method where the error arose
     *    @param action that triggered the error
     *    @param object over which the action was applied
     *    @param id id of the object, -1 for Pool, -2 for no-id objects   
     *              (allocate error, parse error)
     *    @param rc returned error code (NULL to ignore)
     *    @returns string for logging
     */
    static string action_error (const string& method,
                                const string &action, 
                                const string &object, 
                                int id,
                                int rc)
    {
        ostringstream oss;
        
        oss << "[" << method << "]" << " Error trying to " << action << " "
            << object;
            
        switch(id)
        {
            case -2:
                break; 
            case -1:
                oss << "Pool.";
                break;
            default:
                oss << " [" << id << "].";
                break;
        }
                
        if ( rc != (int)NULL )
        {
            oss << " Returned error code [" << rc << "].";       
        }
        
        return oss.str();
    }
    
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------
    //                          XML-RPC Methods
    // ----------------------------------------------------------------------
    // ----------------------------------------------------------------------

    /* ---------------------------------------------------------------------- */
    /*                     Virtual Machine Interface                          */    
    /* ---------------------------------------------------------------------- */
    class VirtualMachineAllocate: public xmlrpc_c::method
    {
    public:
        VirtualMachineAllocate(
            VirtualMachinePool * _vmpool,
            VirtualNetworkPool * _vnpool,
            ImagePool          * _ipool,
            UserPool           * _upool):
        vmpool(_vmpool),
        vnpool(_vnpool),
        ipool(_ipool),
        upool(_upool)
        {
            _signature="A:ss";
            _help="Allocates a virtual machine in the pool";
        };

        ~VirtualMachineAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retval);
    private:
        VirtualMachinePool * vmpool;
        VirtualNetworkPool * vnpool;
        ImagePool          * ipool;
        UserPool           * upool;
    };
    
    /* ---------------------------------------------------------------------- */
    
    class VirtualMachineDeploy: public xmlrpc_c::method
    {
    public:
        VirtualMachineDeploy(
            VirtualMachinePool * _vmpool,
            HostPool           * _hpool,
            UserPool           * _upool):
                vmpool(_vmpool),
                hpool(_hpool),
                upool(_upool)
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
        HostPool           * hpool;
        UserPool           * upool;
    };
    
    /* ---------------------------------------------------------------------- */

    class VirtualMachineAction: public xmlrpc_c::method
    {
    public:
        VirtualMachineAction(
            VirtualMachinePool * _vmpool,
            UserPool * _upool):
                vmpool(_vmpool),
                upool(_upool)
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
        UserPool *           upool;
    };

    /* ---------------------------------------------------------------------- */
    
    class VirtualMachineMigrate: public xmlrpc_c::method
    {
    public:
        VirtualMachineMigrate(
            VirtualMachinePool * _vmpool,
            HostPool *           _hpool,
            UserPool *           _upool):
                vmpool(_vmpool),
                hpool(_hpool),
                upool(_upool)
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
        UserPool *           upool;
    }; 
    
    /* ---------------------------------------------------------------------- */
    
    class VirtualMachineInfo: public xmlrpc_c::method
    {
    public:
        VirtualMachineInfo(
            VirtualMachinePool * _vmpool,
            UserPool           * _upool):
                vmpool(_vmpool),
                upool(_upool)
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
        UserPool           * upool;
    };


    /* ---------------------------------------------------------------------- */

    class VirtualMachinePoolInfo: public xmlrpc_c::method
    {
    public:
        VirtualMachinePoolInfo(
            VirtualMachinePool * _vmpool,
            UserPool           * _upool):
                vmpool(_vmpool),
                upool(_upool)
        {
            _signature="A:si";
            _help="Returns the virtual machine pool";
        };

        ~VirtualMachinePoolInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retval);

    private:
        VirtualMachinePool * vmpool;
        UserPool           *  upool;
    };    
    
    /* ---------------------------------------------------------------------- */
    /*                            Host Interface                              */    
    /* ---------------------------------------------------------------------- */

    class HostAllocate: public xmlrpc_c::method
    {
    public:
        HostAllocate(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
        {
            _signature="A:sssss";
            _help="Allocates a host in the pool";
        };

        ~HostAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */
     
    class HostInfo: public xmlrpc_c::method
    {
    public:
        HostInfo(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
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
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */
     
    class HostPoolInfo: public xmlrpc_c::method
    {
    public:
        HostPoolInfo(HostPool * _hpool,
                     UserPool * _upool):
            hpool(_hpool),
            upool(_upool)
        {
            _signature="A:s";
            _help="Returns the host pool information";
        };

        ~HostPoolInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */
    
    class HostDelete: public xmlrpc_c::method
    {
    public:
        HostDelete(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
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
        UserPool * upool;
    };
    
    /* ---------------------------------------------------------------------- */
    
    class HostEnable: public xmlrpc_c::method
    {
    public:
        HostEnable(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
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
        UserPool * upool;
    };   

    /* ---------------------------------------------------------------------- */
    /*                      Cluster Interface                                 */
    /* ---------------------------------------------------------------------- */

    class ClusterAllocate: public xmlrpc_c::method
    {
    public:
        ClusterAllocate(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
        {
            _signature="A:ss";
            _help="Allocates a cluster in the pool";
        };

        ~ClusterAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class ClusterInfo: public xmlrpc_c::method
    {
    public:
        ClusterInfo(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
        {
            _signature="A:si";
            _help="Returns cluster information";
        };

        ~ClusterInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class ClusterDelete: public xmlrpc_c::method
    {
    public:
        ClusterDelete(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
        {
            _signature="A:si";
            _help="Deletes a cluster from the pool";
        };

        ~ClusterDelete(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class ClusterAdd: public xmlrpc_c::method
    {
    public:
        ClusterAdd(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
        {
            _signature="A:sii";
            _help="Adds a host to a cluster";
        };

        ~ClusterAdd(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class ClusterRemove: public xmlrpc_c::method
    {
    public:
        ClusterRemove(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
        {
            _signature="A:si";
            _help="Removes a host from its cluster";
        };

        ~ClusterRemove(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class ClusterPoolInfo: public xmlrpc_c::method
    {
    public:
        ClusterPoolInfo(
            HostPool * _hpool,
            UserPool * _upool):
                hpool(_hpool),
                upool(_upool)
        {
            _signature="A:s";
            _help="Returns the cluster pool information";
        };

        ~ClusterPoolInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        HostPool * hpool;
        UserPool * upool;
    };


    /* ---------------------------------------------------------------------- */
    /*                      Virtual Network Interface                         */    
    /* ---------------------------------------------------------------------- */
    
    
    class VirtualNetworkAllocate: public xmlrpc_c::method
    {
    public:
        VirtualNetworkAllocate(
            VirtualNetworkPool * _vnpool,
            UserPool *           _upool):
                vnpool(_vnpool),
                upool(_upool)
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
        UserPool           * upool;
    }; 
    
    /* ---------------------------------------------------------------------- */
    
    class VirtualNetworkInfo: public xmlrpc_c::method
    {
    public:
        VirtualNetworkInfo(
            VirtualNetworkPool * _vnpool,
            UserPool           * _upool):
                 vnpool(_vnpool),
                 upool(_upool)
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
        UserPool           * upool;
    };
    
    /* ---------------------------------------------------------------------- */
     
    class VirtualNetworkPoolInfo: public xmlrpc_c::method
    {
    public:
        VirtualNetworkPoolInfo(VirtualNetworkPool * _vnpool,
                               UserPool           * _upool):
            vnpool(_vnpool),
            upool(_upool)
        {
            _signature="A:si";
            _help="Returns the virtual network pool information";
        };

        ~VirtualNetworkPoolInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        VirtualNetworkPool * vnpool;
        UserPool           * upool;
    };
    
    /* ---------------------------------------------------------------------- */

    class VirtualNetworkPublish: public xmlrpc_c::method
    {
    public:
        VirtualNetworkPublish(
            VirtualNetworkPool * _vnpool,
            UserPool           * _upool):
                vnpool(_vnpool),
                upool(_upool)
        {
            _signature="A:sib";
            _help="Enables/Disables a virtual network";
        };

        ~VirtualNetworkPublish(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        VirtualNetworkPool * vnpool;
        UserPool           * upool;
    };

    /* ---------------------------------------------------------------------- */

    class VirtualNetworkDelete: public xmlrpc_c::method
    {
    public:
        VirtualNetworkDelete(
            VirtualNetworkPool * _vnpool,
            UserPool           * _upool):
                vnpool(_vnpool),
                upool(_upool)
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
        UserPool           * upool;
    };

    /* ---------------------------------------------------------------------- */
    /*                      User Management Interface                         */    
    /* ---------------------------------------------------------------------- */
    
    
    class UserAllocate: public xmlrpc_c::method
    {
    public:
        UserAllocate(UserPool * _upool):upool(_upool)
        {
            _signature="A:sss";
            _help="Creates a new user";
        };

        ~UserAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class UserDelete: public xmlrpc_c::method
    {
    public:
        UserDelete(UserPool * _upool):upool(_upool)
        {
            _signature="A:si";
            _help="Deletes a user account";
        };

        ~UserDelete(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class UserChangePassword: public xmlrpc_c::method
    {
    public:
        UserChangePassword(UserPool * _upool):upool(_upool)
        {
            _signature="A:sis";
            _help="Changes the password for the given user.";
        };

        ~UserChangePassword(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        UserPool * upool;
    };

    /* ---------------------------------------------------------------------- */

    class UserPoolInfo: public xmlrpc_c::method
    {
    public:
        UserPoolInfo(UserPool * _upool):upool(_upool)
        {
            _signature="A:s";
            _help="Returns content of the user pool";
        };

        ~UserPoolInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        UserPool * upool;
    };
    
    /* ---------------------------------------------------------------------- */
    /*                      Image Pool Interface                              */
    /* ---------------------------------------------------------------------- */

    class ImageAllocate: public xmlrpc_c::method
    {
    public:
        ImageAllocate(ImagePool * _ipool,
                      UserPool * _upool):
                            ipool(_ipool),
                            upool(_upool)
        {
            _signature="A:ss";
            _help="Creates a new image";
        };

        ~ImageAllocate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    };  
    
    /* ---------------------------------------------------------------------- */
    
    class ImageDelete: public xmlrpc_c::method
    {
    public:
        ImageDelete(ImagePool * _ipool,
                      UserPool * _upool):
                            ipool(_ipool),
                            upool(_upool)
        {
            _signature="A:si";
            _help="Deletes an image";
        };

        ~ImageDelete(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    };  
    
    /* ---------------------------------------------------------------------- */

    class ImageInfo: public xmlrpc_c::method
    {
    public:
        ImageInfo(ImagePool * _ipool,
                  UserPool  * _upool):
                      ipool(_ipool),
                      upool(_upool)
        {
            _signature="A:si";
            _help="Returns information for an image";
        };

        ~ImageInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    }; 
    
    /* ---------------------------------------------------------------------- */

    class ImageUpdate: public xmlrpc_c::method
    {
    public:
        ImageUpdate(ImagePool * _ipool,
                    UserPool  * _upool):
                        ipool(_ipool),
                        upool(_upool)
        {
            _signature="A:siss";
            _help="Modifies image attribute";
        };

        ~ImageUpdate(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    };
    
    /* ---------------------------------------------------------------------- */

    class ImageRemoveAttribute: public xmlrpc_c::method
    {
    public:
        ImageRemoveAttribute(ImagePool * _ipool,
                             UserPool  * _upool):
                        ipool(_ipool),
                        upool(_upool)
        {
            _signature="A:sis";
            _help="Removes image attribute";
        };

        ~ImageRemoveAttribute(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    };
    
    /* ---------------------------------------------------------------------- */

    class ImagePublish: public xmlrpc_c::method
    {
    public:
        ImagePublish(ImagePool * _ipool,
                     UserPool  * _upool):
                        ipool(_ipool),
                        upool(_upool)
        {
            _signature="A:sib";
            _help="Publish/Unpublish the Image";
        };

        ~ImagePublish(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    };
    
    /* ---------------------------------------------------------------------- */

    class ImageEnable: public xmlrpc_c::method
    {
    public:
        ImageEnable(ImagePool * _ipool,
                     UserPool  * _upool):
                        ipool(_ipool),
                        upool(_upool)
        {
            _signature="A:sib";
            _help="Enables/Disables the Image";
        };

        ~ImageEnable(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    };
    
    /* ---------------------------------------------------------------------- */

    class ImagePoolInfo: public xmlrpc_c::method
    {
    public:
        ImagePoolInfo(ImagePool * _ipool,
                      UserPool  * _upool):
                            ipool(_ipool),
                            upool(_upool)
        {
            _signature="A:si";
            _help="Returns content of image pool attending to the filter flag";
        };

        ~ImagePoolInfo(){};

        void execute(
            xmlrpc_c::paramList const& paramList,
            xmlrpc_c::value *   const  retvalP);

    private:
        ImagePool * ipool;
        UserPool  * upool;
    };

};
    

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

