# -------------------------------------------------------------------------- #
# Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

require 'opennebula/grpc/template_services_pb'

module GRPCMappings

    TEMPLATE_MAP = {
        'template.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::AllocateRequest.new(:session_id => one_auth,
                                                  :template   => args[0])
            stub.allocate(req, options)
        end,

        'template.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::DeleteRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :recursive  => args[1])
            stub.delete(req, options)
        end,

        'template.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::InfoRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :extended   => args[1],
                                              :decrypt    => args[2])
            stub.info(req, options)
        end,

        'template.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::UpdateRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :template   => args[1],
                                                :append     => args[2])
            stub.update(req, options)
        end,

        'template.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::RenameRequest.new(:session_id   => one_auth,
                                                :oid          => args[0],
                                                :name         => args[1])
            stub.rename(req, options)
        end,

        'template.clone' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::CloneRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :name       => args[1],
                                               :recursive  => args[2])
            stub.clone(req, options)
        end,

        'template.instantiate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::InstantiateRequest.new(:session_id     => one_auth,
                                                     :oid            => args[0],
                                                     :name           => args[1],
                                                     :hold           => args[2],
                                                     :extra_template => args[3],
                                                     :persistent     => args[4])
            stub.instantiate(req, options)
        end,

        'template.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::ChmodRequest.new(:session_id   => one_auth,
                                               :oid          => args[0],
                                               :user_use     => args[1],
                                               :user_manage  => args[2],
                                               :user_admin   => args[3],
                                               :group_use    => args[4],
                                               :group_manage => args[5],
                                               :group_admin  => args[6],
                                               :other_use    => args[7],
                                               :other_manage => args[8],
                                               :other_admin  => args[9],
                                               :recursive    => args[10])
            stub.chmod(req, options)
        end,

        'template.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::ChownRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :user_id    => args[1],
                                               :group_id   => args[2])
            stub.chown(req, options)
        end,

        'template.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::LockRequest.new(:session_id => one_auth,
                                              :oid        => args[0],
                                              :level      => args[1],
                                              :test       => args[2])
            stub.lock(req, options)
        end,

        'template.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Tmpl::UnlockRequest.new(:session_id => one_auth,
                                                :oid        => args[0])
            stub.unlock(req, options)
        end,

        'templatepool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Tmpl::TemplateService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Tmpl::PoolInfoRequest.new(:session_id  => one_auth,
                                                 :filter_flag => args[0],
                                                 :start       => args[1],
                                                 :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
