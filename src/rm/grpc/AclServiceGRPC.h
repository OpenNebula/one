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

#ifndef ACL_GRPC_H
#define ACL_GRPC_H

#include "RequestGRPC.h"
#include "AclAPI.h"

#include "acl.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class AclService final : public one::acl::AclService::Service
{
    grpc::Status AddRule(grpc::ServerContext* context,
                         const one::acl::AddRuleRequest* request,
                         one::ResponseID* response) override;

    grpc::Status DelRule(grpc::ServerContext* context,
                         const one::acl::DelRuleRequest* request,
                         one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::acl::InfoRequest* request,
                      one::ResponseXML* response) override;

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class AclAddRuleGRPC : public RequestGRPC, public AclAPI
{
public:
    AclAddRuleGRPC() :
        RequestGRPC("one.acl.addrule", "/one.acl.AclService/AddRule"),
        AclAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class AclDelRuleGRPC : public RequestGRPC, public AclAPI
{
public:
    AclDelRuleGRPC() :
        RequestGRPC("one.acl.delrule", "/one.acl.AclService/DelRule"),
        AclAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class AclInfoGRPC : public RequestGRPC, public AclAPI
{
public:
    AclInfoGRPC() :
        RequestGRPC("one.acl.info", "/one.acl.AclService/Info"),
        AclAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
