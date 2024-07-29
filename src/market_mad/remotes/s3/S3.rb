# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'aws-sdk-s3'

# This class is a generic wrapper to the s3 gem.
# It can either handle simple or multipart uploads, but the logic to decide
# which uploader to use is not included in this class.
class S3

    attr_accessor :name, :client

    def initialize(h)
        @client = Aws::S3::Client.new(h)
    end

    def bucket=(bucket)
        @bucket = bucket

        # Implicit creation of the bucket
        begin
            @client.head_bucket({ :bucket => @bucket })
        rescue Aws::S3::Errors::NotFound
            @client.create_bucket({ :bucket => @bucket })
        end
    end

    def create_multipart_upload
        @parts = []
        @part_number = 1

        resp = @client.create_multipart_upload(
            {
                :bucket => @bucket,
                :key    => @name
            }
        )

        @upload_id = resp.upload_id
    end

    def complete_multipart_upload
        @client.complete_multipart_upload(
            {
                :bucket           => @bucket,
                :key              => @name,
                :upload_id        => @upload_id,
                :multipart_upload => { :parts => @parts }
            }
        )
    end

    def abort_multipart_upload
        @client.abort_multipart_upload(
            {
                :upload_id   => @upload_id,
                :key         => @name,
                :bucket      => @bucket
            }
        )
    end

    def upload_part(body)
        resp = @client.upload_part(
            {
                :body        => body,
                :upload_id   => @upload_id,
                :part_number => @part_number,
                :key         => @name,
                :bucket      => @bucket
            }
        )

        @parts << {
            :etag => resp.etag,
            :part_number => @part_number
        }

        @part_number += 1
    end

    def put_object(body)
        @client.put_object(
            {
                :body   => body,
                :bucket => @bucket,
                :key    => @name

            }
        )
    end

    def delete_object
        @client.delete_object(
            {
                :bucket => @bucket,
                :key    => @name
            }
        )
    end

    def exists?
        begin
            !@client.head_object(
                {
                    :bucket => @bucket,
                    :key    => @name
                }
            ).nil?
        rescue Aws::S3::Errors::NotFound
            false
        end
    end

    def bucket_size
        resp = @client.list_objects({ :bucket => @bucket })

        size = 0
        resp.contents.each do |o|
            size += o.size
        end

        size
    end

end
