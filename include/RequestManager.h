/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/registry.hpp>
#include <xmlrpc-c/server_abyss.hpp>

#include <set>
#include <thread>
#include <atomic>
#include <mutex>

class ConnectionManager;

class RequestManager
{
public:

    RequestManager(
            const std::string& _port,
            int _max_conn,
            int _max_conn_backlog,
            int _keepalive_timeout,
            int _keepalive_max_conn,
            int _timeout,
            const std::string& _xml_log_file,
            const std::string& call_log_format,
            const std::string& _listen_address,
            int message_size);

    ~RequestManager();

    /**
     *  This functions starts the associated listener thread (XML server), and
     *  creates a new thread for the Request Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    void finalize();

    /**
     *  @return an AbyssServer to run xmlrpc connections
     */
    xmlrpc_c::serverAbyss * create_abyss();

    bool exist_method(const std::string& call)
    {
        return RequestManagerRegistry.exist(call);
    }

private:

    struct NebulaRegistry
    {
        std::set<std::string> registered_methods;
        xmlrpc_c::registry registry;

        void addMethod(const std::string& name, const xmlrpc_c::methodPtr& methodP)
        {
            registered_methods.insert(name);
            registry.addMethod(name, methodP);
        };

        bool exist(const std::string& call)
        {
            return registered_methods.find(call) != registered_methods.end();
        }
    };

    /**
     *  XML Server main thread loop. Waits for client connections and starts
     *  a new thread to handle the request.
     */
    void xml_server_loop();

    /**
     *  Thread id for the XML Server
     */
    std::thread xml_server_thread;

    /**
     *  Manage the number of connections to the RM
     */
    std::unique_ptr<ConnectionManager> cm;

    /**
     *  Flag to end the main server loop
     */
    std::mutex end_lock;

    std::atomic<bool> end;

    /**
     *  Port number where the connection will be open
     */
    std::string port;

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
    std::string xml_log_file;

    /**
     *  Specifies the address xmlrpc server will bind to
     */
    std::string listen_address;

    /**
     *  To register XML-RPC methods
     */
    NebulaRegistry RequestManagerRegistry;

    /**
     *  Register the XML-RPC API Calls
     */
    void register_xml_methods();

    int setup_socket();
};

#endif

