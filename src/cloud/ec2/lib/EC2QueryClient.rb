# -------------------------------------------------------------------------- #
# Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        #
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

$ec2url = nil

if ENV["EC2_URL"]
    $ec2url = ENV["EC2_URL"]
    ENV["EC2_URL"]=nil
end

require 'CloudClient'
require 'AWS'

module EC2QueryClient

    ACCESS_KEY = {
        :name => "access_key",
        :short => "-K id",
        :large => "--access-key id",
        :description => "The username of the user",
        :format => String
    }

    SECRET_KEY = {
        :name => "secret_key",
        :short => "-S key",
        :large => "--secret-key key",
        :description => "The sha1 hashed password of the user",
        :format => String
    }

    URL = {
        :name => "url",
        :short => "-U url",
        :large => "--url url",
        :description => "Set url as the web service url to use",
        :format => String
    }

    HEADERS = {
        :name => "headers",
        :short => "-H",
        :large => "--headers",
        :description => "Display column headers"
    }


    ##########################################################################
    #
    #
    ##########################################################################
    class Client

        API_VERSION = '2008-12-01'

        ######################################################################
        #
        #
        ######################################################################
        def initialize(access=nil, secret=nil, endpoint=nil, timeout=nil)
            # Autentication
            ec2auth  = nil
            @timeout = nil

            if access && secret
                ec2auth = access, secret
            elsif ENV["EC2_ACCESS_KEY"] and ENV["EC2_SECRET_KEY"]
                ec2auth = [ENV["EC2_ACCESS_KEY"], ENV["EC2_SECRET_KEY"]]
            else
                ec2auth = CloudClient::get_one_auth
                ec2auth[1] = Digest::SHA1.hexdigest(ec2auth[1])
            end

            if !ec2auth
                raise "No authorization data present"
            end

            @access_key_id     = ec2auth[0]
            @access_key_secret = ec2auth[1]

            # Server location

            if !endpoint
                if $ec2url
                    endpoint = $ec2url
                else
                    endpoint = "http://localhost:4567"
                end
            end

            @uri = URI.parse(endpoint)
            path = @uri.path.empty? ? '/' : @uri.path

            @ec2_connection = AWS::EC2::Base.new(
                :access_key_id     => @access_key_id,
                :secret_access_key => @access_key_secret,
                :server            => @uri.host,
                :port              => @uri.port,
                :use_ssl           => @uri.scheme == 'https',
                :path              => path)
        end


        ######################################################################
        #
        #
        ######################################################################
        def describe_instances()
            begin
                response = @ec2_connection.describe_instances
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        # :image_id
        # :instance_type
        ######################################################################
        def run_instances(opts)
            begin
                response = @ec2_connection.run_instances({
                    :base64_encoded => true,
                    :min_count      => 1,
                    :max_count      => 1
                }.merge(opts))
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def terminate_instances(instance_id)
            begin
                response = @ec2_connection.terminate_instances(
                    :instance_id   => instance_id
                 )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def stop_instances(instance_id)
            begin
                response = @ec2_connection.stop_instances(
                    :instance_id   => instance_id
                 )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def start_instances(instance_id)
            begin
                response = @ec2_connection.start_instances(
                    :instance_id   => instance_id
                 )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def reboot_instances(instance_id)
            begin
                response = @ec2_connection.reboot_instances(
                    :instance_id   => instance_id
                 )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #  Returns true if HTTP code is 200,
        ######################################################################
        def upload_image(file_name, curb=true)
            params = { "Action"           => "UploadImage",
                       "SignatureVersion" => "2",
                       "SignatureMethod"  => 'HmacSHA256',
                       "AWSAccessKeyId"   => @access_key_id,
                       "Version"          => API_VERSION,
                       "Timestamp"        => Time.now.getutc.iso8601 }

            str = AWS.canonical_string(params, @uri.host)
            sig = AWS.encode(@access_key_secret, str, false)

            post_fields = Array.new;

            if curb
                if !CURL_LOADED
                    error_msg = "curb gem not loaded"
                    error = CloudClient::Error.new(error_msg)
                    return error
                end

                params.each { |k,v|
                    post_fields << Curl::PostField.content(k,v)
                }

                post_fields << Curl::PostField.content("Signature",sig)
                post_fields << Curl::PostField.file("file",file_name)

                connection = Curl::Easy.new(@uri.to_s)
                connection.multipart_form_post = true
                connection.ssl_verify_peer = false

                connection.http_post(*post_fields)

                if connection.response_code == 200
                    return AWS::Response.parse(:xml => connection.body_str)
                else
                    r=AWS::Response.parse(:xml => connection.body_str)
                    message=r['Errors']['Error']['Message']
                    return CloudClient::Error.new(message)
                end
            else
                if !MULTIPART_LOADED
                    error_msg = "multipart-post gem not loaded"
                    error = CloudClient::Error.new(error_msg)
                    return error
                end

                params["Signature"]=sig

                file=File.open(file_name)
                params["file"]=UploadIO.new(file,
                    'application/octet-stream', file_name)

                req = Net::HTTP::Post::Multipart.new('/', params)
                res = CloudClient.http_start(@uri,@timeout) do |http|
                    http.request(req)
                end

                file.close

                if !CloudClient.is_error?(res)
                    return AWS::Response.parse(:xml => res.body)
                else
                    r=AWS::Response.parse(:xml => res.message)
                    message=r['Errors']['Error']['Message']
                    return CloudClient::Error.new(message)
                end
            end
        end

        ######################################################################
        #
        #
        ######################################################################
        def register_image(image_id)
            begin
               response = @ec2_connection.register_image(
                            :image_location => image_id
                          )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        # :image_id --> ALL
        # :owner_id --> mine (ALWAYS)
        # :executable_by --> Always Public (NO ACLS)
        ######################################################################
        def describe_images()
            begin
                response = @ec2_connection.describe_images
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        ######################################################################
        def describe_addresses()
            begin
                response = @ec2_connection.describe_addresses
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        ######################################################################
        def allocate_address()
            begin
                response = @ec2_connection.allocate_address
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        ######################################################################
        def associate_address(public_ip, instance_id)
            begin
                response = @ec2_connection.associate_address(
                            :public_ip   => public_ip,
                            :instance_id => instance_id)
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        ######################################################################
        def disassociate_address(public_ip)
            begin
                response = @ec2_connection.disassociate_address(
                            :public_ip   => public_ip)
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        ######################################################################
        def release_address(public_ip)
            begin
                response = @ec2_connection.release_address(
                            :public_ip   => public_ip)
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def describe_volumes
            begin
                response = @ec2_connection.describe_volumes
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def attach_volume(volume, instance, device)
            begin
                response = @ec2_connection.attach_volume(
                    :volume_id => volume,
                    :instance_id => instance,
                    :device => device
                    )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def delete_volume(volume)
            begin
                response = @ec2_connection.delete_volume(
                    :volume_id => volume
                    )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def detach_volume(volume, instance, device)
            begin
                response = @ec2_connection.detach_volume(
                    :volume_id => volume,
                    :instance_id => instance,
                    :device => device
                    )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        #
        #
        ######################################################################
        def create_volume(size)
            begin
                response = @ec2_connection.create_volume(
                    :size => size,
                    :availability_zone => 'default'
                    )
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        # Lists available key pairs
        #   @param name[String] of the kaypair
        #   @return keypairs[Hash]
        #     {"xmlns"=>"http://ec2.amazonaws.com/doc/2010-08-31/",
        #      "keySet"=>{"item"=>[
        #          {"keyName"=>"...", "keyFingerprint"=>"..."}]}}
        ######################################################################
        def describe_keypairs()
            begin
                response = @ec2_connection.describe_keypairs
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        # Creates a new key pair
        #   @param name[String] of the kaypair
        #   @return keypair[Hash]
        #   {"xmlns"=>"http://ec2.amazonaws.com/doc/2010-08-31",
        #    "keyName"=>"...",
        #    "keyFingerprint"=>"...",
        #    "keyMaterial"=>"..."}
        ######################################################################
        def create_keypair(name)
            begin
                response = @ec2_connection.create_keypair(:key_name => name)
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end

        ######################################################################
        # Deletes a new key pair
        #   @param name[String] of the kaypair
        #   @return response[Hash]
        #     {"xmlns"=>"http://ec2.amazonaws.com/doc/2010-08-31/",
        #      "return"=>{"true/false"}
        ######################################################################
        def delete_keypair(name)
            begin
                response = @ec2_connection.delete_keypair(:key_name => name)
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            return response
        end
    end
end
