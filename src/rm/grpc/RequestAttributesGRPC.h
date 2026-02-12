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

#ifndef REQUEST_ATTRIBUTES_GRPC_H_
#define REQUEST_ATTRIBUTES_GRPC_H_

#include <grpcpp/grpcpp.h>

#include <google/protobuf/message.h>
#include <google/protobuf/descriptor.h>
#include <google/protobuf/reflection.h>

#include "RequestAttributes.h"

class ParamListGRPC: public ParamList
{
public:
    ParamListGRPC(const google::protobuf::Message* message, const std::set<int>& hidden):
        ParamList(hidden),
        input(message)
    {
        reflection = message->GetReflection();
        descriptor = message->GetDescriptor();
    };

    unsigned int size() const override
    {
        return descriptor->field_count();
    };

private:
    const google::protobuf::Message* input;

    const google::protobuf::Reflection* reflection;

    const google::protobuf::Descriptor* descriptor;

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    std::string api_value(int index) const override
    {
        const google::protobuf::FieldDescriptor* field = descriptor->field(index);

        std::ostringstream oss;

        switch (field->cpp_type())
        {
            case google::protobuf::FieldDescriptor::CPPTYPE_INT32:
                // oss << reflection->GetInt32(*input, field);
                // break;
                if ( field->is_repeated() )
                {
                    int n = reflection->FieldSize(*input, field);
                    for (int i = 0; i < n; ++i)
                    {
                        if (i) oss << ',';
                        oss << reflection->GetRepeatedInt32(*input, field, i);
                    }
                }
                else
                {
                    oss << reflection->GetInt32(*input, field);
                }
                break;
            case google::protobuf::FieldDescriptor::CPPTYPE_INT64:
                oss << reflection->GetInt64(*input, field);
                break;
            case google::protobuf::FieldDescriptor::CPPTYPE_UINT32:
                oss << reflection->GetUInt32(*input, field);
                break;
            case google::protobuf::FieldDescriptor::CPPTYPE_UINT64:
                oss << reflection->GetUInt64(*input, field);
                break;
            case google::protobuf::FieldDescriptor::CPPTYPE_DOUBLE:
                oss << reflection->GetDouble(*input, field);
                break;
            case google::protobuf::FieldDescriptor::CPPTYPE_FLOAT:
                oss << reflection->GetFloat(*input, field);
                break;
            case google::protobuf::FieldDescriptor::CPPTYPE_BOOL:
                oss << std::boolalpha << reflection->GetBool(*input, field);
                break;
            case google::protobuf::FieldDescriptor::CPPTYPE_ENUM:
            {
                const auto sv = reflection->GetEnum(*input, field)->name();
                return std::string(sv.data(), sv.size());
            }
            //return reflection->GetEnum(*input, field)->name();
            case google::protobuf::FieldDescriptor::CPPTYPE_STRING:
                return reflection->GetString(*input, field);
            case google::protobuf::FieldDescriptor::CPPTYPE_MESSAGE:
                return ""; //nested message
        }

        return oss.str();
    };
};

/**
 * Request attributes for and XML-RPC Call
 */
class RequestAttributesGRPC: public RequestAttributes
{
public:
    grpc::Status retval; /**< Return status of the grpc API call*/

    google::protobuf::Message* response; /**< Return value of the grpc API call*/

    RequestAttributesGRPC(AuthRequest::Operation api_auth_op,
                          const ParamListGRPC& pl,
                          google::protobuf::Message* resp)
        : RequestAttributes(api_auth_op, pl)
        , response(resp)
    {};

    RequestAttributesGRPC(const RequestAttributesGRPC& ra) = default;
};

#endif //REQUEST_ATTRIBUTES_GRPC_H_
