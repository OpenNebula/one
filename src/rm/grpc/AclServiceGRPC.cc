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

#include "AclServiceGRPC.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status AclService::AddRule(
        grpc::ServerContext* context,
        const one::acl::AddRuleRequest* request,
        one::ResponseID* response)
{
    return AclAddRuleGRPC().execute(context, request, response);
}

grpc::Status AclService::DelRule(
        grpc::ServerContext* context,
        const one::acl::DelRuleRequest* request,
        one::ResponseID* response)
{
    return AclDelRuleGRPC().execute(context, request, response);
}

grpc::Status AclService::Info(
        grpc::ServerContext* context,
        const one::acl::InfoRequest* request,
        one::ResponseXML* response)
{
    return AclInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void AclAddRuleGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::acl::AddRuleRequest*>(_request);

    int oid;

    auto ec = add_rule(
        request->user(),
        request->resource(),
        request->rights(),
        request->zone(),
        oid,
        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void AclDelRuleGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::acl::DelRuleRequest*>(_request);

    auto oid = request->oid();

    auto ec = del_rule(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void AclInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                  google::protobuf::Message*       _response,
                                  RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(xml, att);

    response(ec, xml, att);
}

