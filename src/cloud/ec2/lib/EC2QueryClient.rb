#!/usr/bin/ruby
# -------------------------------------------------------------------------- #
# Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

require 'rubygems'
require 'AWS'
require 'uri'
require 'OpenNebula'

begin
    require 'curb'
    CURL_LOADED=true
rescue LoadError
    CURL_LOADED=false
end

begin
    require 'net/http/post/multipart'
rescue LoadError
end

module EC2QueryClient
    ###########################################################################
    #
    #
    ###########################################################################
    class Client

        API_VERSION = '2008-12-01'
        
        #######################################################################
        #
        #
        #######################################################################
        def initialize(secret=nil, endpoint=nil)
            # Autentication
            
            if secret
                ec2auth = secret
            elsif ENV["EC2_ACCESS_KEY"] and ENV["EC2_SECRET_KEY"]
                ec2auth = ENV["EC2_ACCESS_KEY"] + ":" + ENV["EC2_SECRET_KEY"]   
            elsif ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and File.file?(ENV["ONE_AUTH"])
                ec2auth=File.read(ENV["ONE_AUTH"])
            elsif File.file?(ENV["HOME"]+"/.one/one_auth")
                ec2auth=File.read(ENV["HOME"]+"/.one/one_auth")
            else
                raise "No authorization data present"
            end
            

            ec2auth=~/(.+?):(.+)/
            
            @access_key_id     = $1
            @access_key_secret = Digest::SHA1.hexdigest($2)

            # Server location

            if !endpoint
                if $ec2url
                    endpoint = $ec2url
                else
                    endpoint = "http://localhost:4567"
                end
            end
            
            @uri = URI.parse(endpoint)

            if !@uri.scheme or @uri.scheme != "http"
                raise "Only http protocol supported"
            elsif !@uri.host
                raise "Wrong URI format, host not found"
            end
 
            @ec2_connection = AWS::EC2::Base.new(
                :access_key_id     => @access_key_id,
                :secret_access_key => @access_key_secret,
                :server            => @uri.host,
                :port              => @uri.port,
                :use_ssl           => false)
        end

        #######################################################################
        #
        #
        #######################################################################
        def describe_instances()
            begin
                response = @ec2_connection.describe_instances
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            
            return response
        end

        #######################################################################
        # :image_id
        # :instance_type
        #######################################################################
        def run_instances(ami_id, type)
            begin
                response = @ec2_connection.run_instances(
                                :image_id      => ami_id,
                                :min_count     => 1,
                                :max_count     => 1,
                                :instance_type => type
                           )            
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            
            return response
        end

        #######################################################################
        #
        #
        #######################################################################
        def terminate_instances(instance_id)
            begin
                response = @ec2_connection.terminate_instances(
                    :instance_id   => instance_id
                 )
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            
            return response
        end

        #######################################################################
        #
        #  Returns true if HTTP code is 200, 
        #######################################################################
        def upload_image(file_name, curb=true)
            params = { "Action"           => "UploadImage",
                       "SignatureVersion" => "2",
                       "SignatureMethod"  => 'HmacSHA1',
                       "AWSAccessKeyId"   => @access_key_id,
                       "Version"          => API_VERSION,
                       "Timestamp"        => Time.now.getutc.iso8601 }

            str = AWS.canonical_string(params, @uri.host)
            sig = AWS.encode(@access_key_secret, str, false)
   
            post_fields = Array.new;

            if curb and CURL_LOADED
                params.each { |k,v|
                    post_fields << Curl::PostField.content(k,v)
                }

                post_fields << Curl::PostField.content("Signature",sig)
                post_fields << Curl::PostField.file("file",file_name)

                connection = Curl::Easy.new(@uri.to_s)
                connection.multipart_form_post = true

                connection.http_post(*post_fields)

                if connection.response_code == 200
                    return AWS::Response.parse(:xml => connection.body_str)
                else
                    return OpenNebula::Error.new(connection.body_str)
                end
            else
                params["Signature"]=sig

                file=File.open(file_name)
                params["file"]=UploadIO.new(file,
                    'application/octet-stream', file_name)

                req = Net::HTTP::Post::Multipart.new('/', params)
                res = Net::HTTP.start(@uri.host, @uri.port) do |http|
                    http.request(req)
                end

                file.close

                if res.code == '200'
                    return AWS::Response.parse(:xml => res.body)
                else
                    return OpenNebula::Error.new(res.body)
                end
            end
        end

        #######################################################################
        #
        #
        #######################################################################
        def register_image(image_id)
            begin
               response = @ec2_connection.register_image(
                            :image_location => image_id
                          )
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            
            return response
        end

        #######################################################################
        # :image_id --> ALL
        # :owner_id --> mine (ALWAYS)
        # :executable_by --> Always Public (NO ACLS)
        #######################################################################
        def describe_images()
            begin
                response = @ec2_connection.describe_images
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            
            return response
        end
    end
end


