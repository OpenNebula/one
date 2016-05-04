/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
#include "VMTemplatePool.h"
#include "GroupPool.h"

#include "AuthManager.h"

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
            int _port,
            int _max_conn,
            int _max_conn_backlog,
            int _keepalive_timeout,
            int _keepalive_max_conn,
            int _timeout,
            const string _xml_log_file,
            const string call_log_format,
            const string _listen_address,
            int message_size);

    ~RequestManager(){};

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
     *  Port number where the connection will be open
     */
    int port;

    /*
     *  FD for the XML server socket
     */
    int socket_fd;

    /**
     *  Max connections
     */
    int max_conn;

    /*
     *  Max backlog connections
     */
    int max_conn_backlog;

    /*
     *  Keepalive timeout
     */
    int keepalive_timeout;

    /*
     *  Keepalive max conn
     */
    int keepalive_max_conn;

    /*
     *  Timeout
     */
    int timeout;

    /**
     *  Filename for the log of the xmlrpc server that listens
     */
    string xml_log_file;

    /**
     *  Specifies the address xmlrpc server will bind to
     */
    string listen_address;

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

    /**
     *  Register the XML-RPC API Calls
     */
    void register_xml_methods();

    int setup_socket();
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif

