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

require 'opennebula/grpc/image_services_pb'

module GRPCMappings

    IMAGE_MAP = {
        'image.allocate' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::AllocateRequest.new(:session_id          => one_auth,
                                                   :template            => args[0],
                                                   :ds_id               => args[1],
                                                   :skip_capacity_check => args[2])
            stub.allocate(req, options)
        end,

        'image.delete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::DeleteRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :force      => args[1])
            stub.delete(req, options)
        end,

        'image.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::InfoRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :decrypt    => args[1])
            stub.info(req, options)
        end,

        'image.update' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::UpdateRequest.new(:session_id => one_auth,
                                                 :oid        => args[0],
                                                 :template   => args[1],
                                                 :append     => args[2])
            stub.update(req, options)
        end,

        'image.rename' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::RenameRequest.new(:session_id   => one_auth,
                                                 :oid          => args[0],
                                                 :name         => args[1])
            stub.rename(req, options)
        end,

        'image.chmod' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::ChmodRequest.new(:session_id   => one_auth,
                                                :oid          => args[0],
                                                :user_use     => args[1],
                                                :user_manage  => args[2],
                                                :user_admin   => args[3],
                                                :group_use    => args[4],
                                                :group_manage => args[5],
                                                :group_admin  => args[6],
                                                :other_use    => args[7],
                                                :other_manage => args[8],
                                                :other_admin  => args[9])
            stub.chmod(req, options)
        end,

        'image.chown' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::ChownRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :user_id    => args[1],
                                                :group_id   => args[2])
            stub.chown(req, options)
        end,

        'image.lock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::LockRequest.new(:session_id => one_auth,
                                               :oid        => args[0],
                                               :level      => args[1],
                                               :test       => args[2])
            stub.lock(req, options)
        end,

        'image.unlock' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::UnlockRequest.new(:session_id => one_auth,
                                                 :oid        => args[0])
            stub.unlock(req, options)
        end,

        'image.clone' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::CloneRequest.new(:session_id => one_auth,
                                                :oid        => args[0],
                                                :name       => args[1],
                                                :ds_id      => args[2])
            stub.clone(req, options)
        end,

        'image.enable' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::EnableRequest.new(:session_id     => one_auth,
                                                 :oid            => args[0],
                                                 :enable         => args[1])
            stub.enable(req, options)
        end,

        'image.persistent' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::PersistentRequest.new(:session_id     => one_auth,
                                                     :oid            => args[0],
                                                     :persistent     => args[1])
            stub.persistent(req, options)
        end,

        'image.chtype' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::ChtypeRequest.new(:session_id     => one_auth,
                                                 :oid            => args[0],
                                                 :type           => args[1])
            stub.chtype(req, options)
        end,

        'image.snapshotdelete' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::SnapshotDeleteRequest.new(:session_id     => one_auth,
                                                         :oid            => args[0],
                                                         :snapshot_id    => args[1])
            stub.snapshot_delete(req, options)
        end,

        'image.snapshotrevert' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::SnapshotRevertRequest.new(:session_id     => one_auth,
                                                         :oid            => args[0],
                                                         :snapshot_id    => args[1])
            stub.snapshot_revert(req, options)
        end,

        'image.snapshotflatten' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::SnapshotFlattenRequest.new(:session_id     => one_auth,
                                                          :oid            => args[0],
                                                          :snapshot_id    => args[1])
            stub.snapshot_flatten(req, options)
        end,

        'image.restore' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req  = One::Image::RestoreRequest.new(:session_id     => one_auth,
                                                  :oid            => args[0],
                                                  :ds_id          => args[1],
                                                  :opt_tmpl       => args[2])
            stub.restore(req, options)
        end,

        'imagepool.info' => lambda do |one_auth, endpoint, *args, options|
            stub = One::Image::ImageService::Stub.new(endpoint, :this_channel_is_insecure)
            req = One::Image::PoolInfoRequest.new(:session_id  => one_auth,
                                                  :filter_flag => args[0],
                                                  :start       => args[1],
                                                  :end         => args[2])
            stub.pool_info(req, options)
        end
    }.freeze

end
