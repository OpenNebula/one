
/* -------------------------------------------------------------------------- */
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                */
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
#include <grpcpp/grpcpp.h>
#include <grpcpp/ext/proto_server_reflection_plugin.h>

#include "RequestManagerGRPC.h"
#include "NebulaLog.h"

using namespace std;
using namespace grpc;

/* -------------------------------------------------------------------------- */

RequestManagerGRPC::~RequestManagerGRPC()
{
    if (grpc_server)
    {
        finalize();
    }

    grpc_shutdown();
}

/* -------------------------------------------------------------------------- */

void RequestManagerGRPC::register_grpc_services(grpc::ServerBuilder& builder)
{
    builder.RegisterService(&acl_service);
    builder.RegisterService(&backupjob_service);
    builder.RegisterService(&cluster_service);
    builder.RegisterService(&datastore_service);
    builder.RegisterService(&document_service);
    builder.RegisterService(&group_service);
    builder.RegisterService(&hook_service);
    builder.RegisterService(&host_service);
    builder.RegisterService(&image_service);
    builder.RegisterService(&marketplace_service);
    builder.RegisterService(&marketplaceapp_service);
    builder.RegisterService(&securitygroup_service);
    builder.RegisterService(&system_service);
    builder.RegisterService(&template_service);
    builder.RegisterService(&user_service);
    builder.RegisterService(&vdc_service);
    builder.RegisterService(&virtualmachine_service);
    builder.RegisterService(&virtualnetwork_service);
    builder.RegisterService(&virtualrouter_service);
    builder.RegisterService(&vmgroup_service);
    builder.RegisterService(&vntemplate_service);
    builder.RegisterService(&zone_service);

#if NEW_GRPC
    builder.RegisterCallbackGenericService(&unknown_service);
#endif
}

/* -------------------------------------------------------------------------- */

int RequestManagerGRPC::start()
{
    ostringstream oss;
    std::string   server_address(listen_address + ":" + port);

    oss << "Starting GRPC server '" << server_address << "' ...";

    NebulaLog::info("ReM", "Starting Request Manager (gRPC)...");
    NebulaLog::info("ReM", oss.str());

    // ---------------  gRPC initialization ------------------

    grpc_init();

    grpc::EnableDefaultHealthCheckService(true);

    grpc::reflection::InitProtoReflectionServerBuilderPlugin();

    grpc::ServerBuilder builder;

    builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());

    register_grpc_services(builder);

    grpc_server = builder.BuildAndStart();

    if (!grpc_server)
    {
        NebulaLog::error("ReM", "Failed to start gRPC server");
        return -1;
    }

    NebulaLog::info("ReM", "Request Manager started (gRPC)");

    return 0;
}

/* -------------------------------------------------------------------------- */

void RequestManagerGRPC::finalize()
{
    if (!grpc_server)
    {
        return;
    }

    NebulaLog::log("ReM", Log::INFO, "Stopping gRPC server...");

    grpc_server->Shutdown();

    grpc_server->Wait();

    grpc_server.reset();

    NebulaLog::log("ReM", Log::INFO, "gRPC server stopped");
}

/* -------------------------------------------------------------------------- */
