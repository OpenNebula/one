#!/usr/bin/ruby

$ec2url = nil

if ENV["EC2_URL"]
    $ec2url = ENV["EC2_URL"]
    ENV["EC2_URL"]=nil
end

require 'rubygems'
require 'EC2'
require 'curb'
require 'uri'
require 'OpenNebula'

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
            elsif ENV["ONE_AUTH"]
                ec2auth = ENV["ONE_AUTH"]
            elsif
                raise "No authorization data present"
            end

            ec2auth=~/(\w+):(\w+)/
            
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
 
            @ec2_connection = EC2::Base.new(
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
        def upload_image(file_name)
            params = { "Action"           => "UploadImage",
                       "SignatureVersion" => "2",
                       "SignatureMethod"  => 'HmacSHA1',
                       "AWSAccessKeyId"   => @access_key_id,
                       "Version"          => API_VERSION,
                       "Timestamp"        => Time.now.getutc.iso8601 }

            str = EC2.canonical_string(params, @uri.host)
            sig = EC2.encode(@access_key_secret, str, false)
   
            post_fields = Array.new;

            params.each { |k,v|
                post_fields << Curl::PostField.content(k,v)
            }

            post_fields << Curl::PostField.content("Signature",sig)
            post_fields << Curl::PostField.file("file",file_name)

            connection = Curl::Easy.new(@uri.to_s)
            connection.multipart_form_post = true

            connection.http_post(*post_fields)

            if connection.response_code == 200
                return EC2::Response.parse(:xml => connection.body_str)
            else
                return OpenNebula::Error.new(connection.body_str)
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


