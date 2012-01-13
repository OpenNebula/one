#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'rubygems'
require 'rexml/document'
require 'uri'

require 'CloudClient'


module OCCIClient

    #####################################################################
    #  Client Library to interface with the OpenNebula OCCI Service
    #####################################################################
    class Client

        ######################################################################
        # Initialize client library
        ######################################################################
        def initialize(endpoint_str=nil, user=nil, pass=nil,
                       timeout=nil, debug_flag=true)
            @debug   = debug_flag
            @timeout = timeout

            # Server location
            if endpoint_str
                @endpoint =  endpoint_str
            elsif ENV["OCCI_URL"]
                @endpoint = ENV["OCCI_URL"]
            else
                @endpoint = "http://localhost:4567"
            end

            # Autentication
            if user && pass
                @occiauth = [user, pass]
            else
                @occiauth = CloudClient::get_one_auth
            end

            if !@occiauth
                raise "No authorization data present"
            end

            @occiauth[1] = Digest::SHA1.hexdigest(@occiauth[1])
        end

        #################################
        # Pool Resource Request Methods #
        #################################

        ######################################################################
        # Post a new VM to the VM Pool
        # :instance_type
        # :xmlfile
        ######################################################################
        def post_vms(xmlfile)
            xml=File.read(xmlfile)

            url = URI.parse(@endpoint+"/compute")

            req = Net::HTTP::Post.new(url.path)
            req.body=xml

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) do |http|
                http.request(req)
            end

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Retieves the pool of Virtual Machines
        ######################################################################
        def get_vms
            url = URI.parse(@endpoint+"/compute")
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Post a new Network to the VN Pool
        # :xmlfile xml description of the Virtual Network
        ######################################################################
        def post_network(xmlfile)
            xml=File.read(xmlfile)

            url = URI.parse(@endpoint+"/network")

            req = Net::HTTP::Post.new(url.path)
            req.body=xml

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) do |http|
                http.request(req)
            end

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Retieves the pool of Virtual Networks
        ######################################################################
        def get_networks
            url = URI.parse(@endpoint+"/network")
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Post a new Image to the Image Pool
        # :xmlfile
        ######################################################################
        def post_image(xmlfile, curb=true)
            xml        = File.read(xmlfile)

            begin
                image_info = REXML::Document.new(xml).root
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            if image_info.elements['URL']
                file_path = image_info.elements['URL'].text

                m = file_path.match(/^\w+:\/\/(.*)$/)

                if m
                    file_path="/"+m[1]
                end
            elsif !image_info.elements['TYPE'] == "DATABLOCK"
                return CloudClient::Error.new("Can not find URL")
            end

            if curb
                if !CURL_LOADED
                    error_msg = "curb gem not loaded"
                    error = CloudClient::Error.new(error_msg)
                    return error
                end

                curl=Curl::Easy.new(@endpoint+"/storage")

                curl.http_auth_types     = Curl::CURLAUTH_BASIC
                curl.userpwd             = "#{@occiauth[0]}:#{@occiauth[1]}"
                curl.verbose             = true if @debug
                curl.multipart_form_post = true

                begin
                    postfields = Array.new
                    postfields << Curl::PostField.content('occixml', xml)

                    if file_path
                        postfields << Curl::PostField.file('file', file_path)
                    end

                    curl.http_post(*postfields)
                rescue Exception => e
                    return CloudClient::Error.new(e.message)
                end

                return curl.body_str
            else
                if !MULTIPART_LOADED
                    error_msg = "multipart-post gem not loaded"
                    error = CloudClient::Error.new(error_msg)
                    return error
                end

                params=Hash.new

                if file_path
                    file=File.open(file_path)
                    params["file"]=UploadIO.new(file,
                        'application/octet-stream', file_path)
                end

                params['occixml'] = xml

                url = URI.parse(@endpoint+"/storage")

                req = Net::HTTP::Post::Multipart.new(url.path, params)

                req.basic_auth @occiauth[0], @occiauth[1]

                res = CloudClient::http_start(url, @timeout) do |http|
                    http.request(req)
                end

                file.close if file_path

                if CloudClient::is_error?(res)
                    return res
                else
                    return res.body
                end
            end
        end

        ######################################################################
        # Retieves the pool of Images owned by the user
        ######################################################################
        def get_images
            url = URI.parse(@endpoint+"/storage")
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ####################################
        # Entity Resource Request Methods  #
        ####################################

        ######################################################################
        # :id VM identifier
        ######################################################################
        def get_vm(id)
            url = URI.parse(@endpoint+"/compute/" + id.to_s)
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Puts a new Compute representation in order to change its state
        # :xmlfile Compute OCCI xml representation
        ######################################################################
        def put_vm(xmlfile)
            xml     = File.read(xmlfile)

            begin
                vm_info = REXML::Document.new(xml).root
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            if vm_info.elements['ID'] == nil
                return CloudClient::Error.new("Can not find COMPUTE_ID")
            end

            vm_id = vm_info.elements['ID'].text

            url = URI.parse(@endpoint+'/compute/' + vm_id)

            req = Net::HTTP::Put.new(url.path)
            req.body = xml

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) do |http|
                http.request(req)
            end

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ####################################################################
        # :id Compute identifier
        ####################################################################
        def delete_vm(id)
            url = URI.parse(@endpoint+"/compute/" + id.to_s)
            req = Net::HTTP::Delete.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Retrieves a Virtual Network
        # :id Virtual Network identifier
        ######################################################################
        def get_network(id)
            url = URI.parse(@endpoint+"/network/" + id.to_s)
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Puts a new Network representation in order to change its state
        # :xmlfile Network OCCI xml representation
        ######################################################################
        def put_network(xmlfile)
            xml     = File.read(xmlfile)

            begin
                vnet_info = REXML::Document.new(xml).root
            rescue Exception => e
                error = CloudClient::Error.new(e.message)
                return error
            end

            if vnet_info.elements['ID'] == nil
                return CloudClient::Error.new("Can not find NETWORK_ID")
            end

            vnet_id = vnet_info.elements['ID'].text

            url = URI.parse(@endpoint+'/network/' + vnet_id)

            req = Net::HTTP::Put.new(url.path)
            req.body = xml

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) do |http|
                http.request(req)
            end

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end
        
        ######################################################################
        # :id VM identifier
        ######################################################################
        def delete_network(id)
            url = URI.parse(@endpoint+"/network/" + id.to_s)
            req = Net::HTTP::Delete.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

       #######################################################################
        # Retieves an Image
        # :image_uuid Image identifier
        ######################################################################
        def get_image(image_uuid)
            url = URI.parse(@endpoint+"/storage/"+image_uuid)
            req = Net::HTTP::Get.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end

        ######################################################################
        # Puts a new Storage representation in order to change its state
        # :xmlfile Storage OCCI xml representation
        ######################################################################
        def put_image(xmlfile)
            xml     = File.read(xmlfile)
            
            begin
                image_info = REXML::Document.new(xml).root
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            
            if image_info.elements['ID'] == nil
                return CloudClient::Error.new("Can not find STORAGE_ID")
            end

            image_id = image_info.elements['ID'].text

            url = URI.parse(@endpoint+'/storage/' + image_id)

            req = Net::HTTP::Put.new(url.path)
            req.body = xml

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) do |http|
                http.request(req)
            end

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end
        
        ######################################################################
        # :id VM identifier
        ######################################################################
        def delete_image(id)
            url = URI.parse(@endpoint+"/storage/" + id.to_s)
            req = Net::HTTP::Delete.new(url.path)

            req.basic_auth @occiauth[0], @occiauth[1]

            res = CloudClient::http_start(url, @timeout) {|http|
                http.request(req)
            }

            if CloudClient::is_error?(res)
                return res
            else
                return res.body
            end
        end
    end
end
