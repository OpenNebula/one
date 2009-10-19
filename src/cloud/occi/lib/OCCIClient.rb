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

require 'rubygems'
require 'uri'
require 'OpenNebula'

require 'net/https'

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



module OCCIClient
    
    #####################################################################
    #  Client Library to interface with the OpenNebula OCCI Service
    #####################################################################
    class Client
        
        ######################################################################
        # Initialize client library
        ######################################################################
        def initialize(endpoint_str=nil, user=nil, pass=nil, debug_flag=false)
            @debug = debug_flag
            
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
                @occiauth = user + ":" + pass
                one_auth=@occiauth
            elsif ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and File.file?(ENV["ONE_AUTH"])
                one_auth=File.read(ENV["ONE_AUTH"])
            elsif File.file?(ENV["HOME"]+"/.one/one_auth")
                one_auth=File.read(ENV["HOME"]+"/.one/one_auth")
            else
                raise "No authorization data present"
                return
            end
            
            one_auth=~/(\w+):(\w+)/
            user  = $1
            pass  = $2
            
            if user && pass
                @occiauth = user + ":" + Digest::SHA1.hexdigest(pass)
            else
                raise "Authorization data malformed"
            end          
        end
        
        # Starts an http connection and calls the block provided. SSL flag
        # is set if needed.
        def http_start(url, &block)
            http = Net::HTTP.new(url.host, url.port)
            if url.scheme=='https'
                http.use_ssl = true
                http.verify_mode=OpenSSL::SSL::VERIFY_NONE
            end
            
            begin
                http.start do |connection|
                    block.call(connection)
                end
            rescue Errno::ECONNREFUSED => e
                puts "Error connecting to server (" + e.to_s + ")."
                puts "Is the occi-server running? Try:"
                puts "  $ occi-server start"
                exit -1
            end
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
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) do |http|
                http.request(req)
            end
            
            puts res.body
        end
        
        ######################################################################
        # Retieves the pool of Virtual Machines
        ######################################################################
        def get_vms
            url = URI.parse(@endpoint+"/compute")
            req = Net::HTTP::Get.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
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
            
            auth=@occiauth.split(":")
            
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) do |http|
                http.request(req)
            end
            
            puts res.body
        end
        
        ######################################################################
        # Retieves the pool of Virtual Networks
        ######################################################################
        def get_networks
            url = URI.parse(@endpoint+"/network")
            req = Net::HTTP::Get.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
        end
        
        ######################################################################
        # Post a new Image to the Image Pool
        # :xmlfile
        ######################################################################
        def post_image(xmlfile, curb=true)
            xml=File.read(xmlfile)
            image_info=Crack::XML.parse(xml)
            
            file_path = image_info['DISK']['URL']
            
            m=file_path.match(/^\w+:\/\/(.*)$/)
            
            if m 
                file_path="/"+m[1]
            end
            
            if curb and CURL_LOADED
                curl=Curl::Easy.new(@endpoint+"/storage")
                curl.userpwd=@occiauth
                curl.verbose=true if @debug
                curl.multipart_form_post = true
                
                begin
                    curl.http_post(
                      Curl::PostField.content('occixml', xml),
                      Curl::PostField.file('file', file_path)
                    )
                rescue Exception => e
                    pp e.message
                end
                
                puts curl.body_str
            else
                file=File.open(file_path)
                
                params=Hash.new
                params["file"]=UploadIO.new(file,
                    'application/octet-stream', file_path)
                
                params['occixml'] = xml
                
                url = URI.parse(@endpoint+"/storage")
                
                req = Net::HTTP::Post::Multipart.new(url.path, params)
                
                auth=@occiauth.split(":")
                
                req.basic_auth auth[0], auth[1]
                
                res = http_start(url) do |http|
                    http.request(req)
                end
                file.close
                
                puts res.body
            end         
        end
        
        ######################################################################
        # Retieves the pool of Images owned by the user
        ######################################################################
        def get_images
            url = URI.parse(@endpoint+"/storage")
            req = Net::HTTP::Get.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
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
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
        end
        
        ######################################################################
        # Puts a new Compute representation in order to change its state
        # :xmlfile Compute OCCI xml representation
        ######################################################################
        def put_vm(xmlfile)
            xml=File.read(xmlfile)
            vm_info=Crack::XML.parse(xml)
            
            url = URI.parse(@endpoint+'/compute/' + vm_info['COMPUTE']['ID'])
            
            req = Net::HTTP::Put.new(url.path)
            req.body = xml
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) do |http|
                http.request(req)
            end
            
            pp res.body
        end
        
        ####################################################################
        # :id Compute identifier
        ####################################################################
        def delete_vm(id)
            url = URI.parse(@endpoint+"/compute/" + id.to_s)
            req = Net::HTTP::Delete.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
        end
        
        ######################################################################
        # Retrieves a Virtual Network
        # :id Virtual Network identifier
        ######################################################################
        def get_network(id)
            url = URI.parse(@endpoint+"/network/" + id.to_s)
            req = Net::HTTP::Get.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
        end
        
        ######################################################################
        # :id VM identifier
        ######################################################################
        def delete_network(id)
            url = URI.parse(@endpoint+"/network/" + id.to_s)
            req = Net::HTTP::Delete.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
        end
        
       #######################################################################
        # Retieves an Image
        # :image_uuid Image identifier
        ######################################################################
        def get_image(image_uuid)
            url = URI.parse(@endpoint+"/storage/"+image_uuid)
            req = Net::HTTP::Get.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = http_start(url) {|http|
                http.request(req)
            }
            puts res.body
        end
    end
end








