# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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
# -------------------------------------------------------------------------- #

# This class is a generic wrapper to the s3 upload and delete facilities.
# It can either handle simple or multipart uploads, but the logic to decide
# which uploader to use is not included in this class.
class S3
    def initialize(h)
        @name = h[:name]

        @config = {
            :bucket            => h[:bucket],
            :md5               => h[:md5],
            :region            => h[:region],
            :access_key_id     => h[:access_key_id],
            :secret_access_key => h[:secret_access_key]
        }

        @client = Aws::S3::Client.new({
            :region            => @config[:region],
            :access_key_id     => @config[:access_key_id],
            :secret_access_key => @config[:secret_access_key]
        })

        @parts = []
        @part_number = 1
    end

    def create_multipart_upload
        resp = @client.create_multipart_upload({
            :bucket => @config[:bucket],
            :key    => @name
        })

        @upload_id = resp.upload_id
    end

    def complete_multipart_upload
        @client.complete_multipart_upload({
          :bucket           => @config[:bucket],
          :key              => @name,
          :upload_id        => @upload_id,
          :multipart_upload => {:parts => @parts}
        })
    end

    def abort_multipart_upload
        @client.abort_multipart_upload({
            :upload_id   => @upload_id,
            :key         => @name,
            :bucket      => @config[:bucket]
        })
    end

    def upload_part(body)
        resp = @client.upload_part({
            :body        => body,
            :upload_id   => @upload_id,
            :part_number => @part_number,
            :key         => @name,
            :bucket      => @config[:bucket]
        })

        @parts << {
            :etag => resp.etag,
            :part_number => @part_number
        }

        @part_number += 1
    end

    def put_object(body)
        @client.put_object({
            :body   => body,
            :bucket => @config[:bucket],
            :key    => @name
        })
    end

    def delete_object
        @client.delete_object({
            :bucket => @config[:bucket],
            :key    => @name
        })
    end

    def exists?
        begin
            !!@client.head_object({
                :bucket => @config[:bucket],
                :key    => @name
            })
        rescue Aws::S3::Errors::NotFound
            false
        end
    end

    def get_bucket_size
        resp = @client.list_objects({
            bucket: @config[:bucket]
        })

        size = 0
        resp.contents.each do |o|
            size += o.size
        end

        return size
    end
end
