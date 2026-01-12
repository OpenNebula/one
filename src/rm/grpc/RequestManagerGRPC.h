/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANGER_GRPC_H_
#define REQUEST_MANGER_GRPC_H_

#include <grpcpp/grpcpp.h>

#include <string>
#include <memory>

#include "AclServiceGRPC.h"
#include "BackupJobServiceGRPC.h"
#include "ClusterServiceGRPC.h"
#include "DatastoreServiceGRPC.h"
#include "DocumentServiceGRPC.h"
#include "GroupServiceGRPC.h"
#include "HookServiceGRPC.h"
#include "HostServiceGRPC.h"
#include "ImageServiceGRPC.h"
#include "MarketPlaceServiceGRPC.h"
#include "MarketPlaceAppServiceGRPC.h"
#include "SecurityGroupServiceGRPC.h"
#include "SystemServiceGRPC.h"
#include "TemplateServiceGRPC.h"
#include "UserServiceGRPC.h"
#include "VdcServiceGRPC.h"
#include "VirtualMachineServiceGRPC.h"
#include "VirtualNetworkServiceGRPC.h"
#include "VirtualRouterServiceGRPC.h"
#include "VMGroupServiceGRPC.h"
#include "VNTemplateServiceGRPC.h"
#include "ZoneServiceGRPC.h"
#include "UnknownServiceGRPC.h"

class RequestManagerGRPC
{
public:

    RequestManagerGRPC(
            const std::string& _listen_address,
            const std::string& _port) :
        listen_address(_listen_address),
        port(_port)
    {};

    ~RequestManagerGRPC();

    /**
     *  This functions starts the associated listener thread (zeroMQ server), and
     *  creates a new thread for the Request Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    void finalize();

private:
    /**
     *  Specifies the address xmlrpc server will bind to
     */
    std::string listen_address;

    /**
     *  Port number where the connection will be open
     */
    std::string port;

    // --- GRPC members

    std::unique_ptr<grpc::Server> grpc_server;

    AclService acl_service;
    BackupJobService backupjob_service;
    ClusterService cluster_service;
    DatastoreService datastore_service;
    DocumentService document_service;
    GroupService group_service;
    HookService hook_service;
    HostService host_service;
    ImageService image_service;
    MarketPlaceService marketplace_service;
    MarketPlaceAppService marketplaceapp_service;
    SecurityGroupService securitygroup_service;
    SystemService system_service;
    TemplateService template_service;
    UserService user_service;
    VdcService vdc_service;
    VirtualMachineService virtualmachine_service;
    VirtualNetworkService virtualnetwork_service;
    VirtualRouterService virtualrouter_service;
    VMGroupService vmgroup_service;
    VNTemplateService vntemplate_service;
    ZoneService zone_service;
    UnknownService unknown_service;

    void register_grpc_services(grpc::ServerBuilder& builder);

    // --- end GRPC members
};

#endif
