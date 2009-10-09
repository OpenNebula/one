#!/usr/bin/ruby

require 'rubygems'
require 'uri'
require 'OpenNebula'
require 'crack'

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



module ONEOCCIClient
    
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
                @occiauth = user + ":" + Digest::SHA1.hexdigest(pass)  
            elsif ENV["ONE_AUTH"] and !ENV["ONE_AUTH"].empty? and File.exists?(ENV["ONE_AUTH"])
                one_auth=File.read(ENV["ONE_AUTH"])
            elsif File.exists?(ENV["HOME"]+"/.one/one_auth")
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
    
            res = Net::HTTP.start(url.host, url.port) do |http|
                http.request(req)
            end
            
            pp res.body
        end
        
        ######################################################################
        # Retieves the pool of Virtual Machines
        ######################################################################
        def get_vms
            url = URI.parse(@endpoint+"/compute")
            req = Net::HTTP::Get.new(url.path)
            
            auth=@occiauth.split(":")
            req.basic_auth auth[0], auth[1]
            
            res = Net::HTTP.start(url.host, url.port) {|http|
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
    
            res = Net::HTTP.start(url.host, url.port) do |http|
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
            
            res = Net::HTTP.start(url.host, url.port) {|http|
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
        
                res = Net::HTTP.start(url.host, url.port) do |http|
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
            
            res = Net::HTTP.start(url.host, url.port) {|http|
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
            
            res = Net::HTTP.start(url.host, url.port) {|http|
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
    
            res = Net::HTTP.start(url.host, url.port) do |http|
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
            
            res = Net::HTTP.start(url.host, url.port) {|http|
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
            
            res = Net::HTTP.start(url.host, url.port) {|http|
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
            
            res = Net::HTTP.start(url.host, url.port) {|http|
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
            
            res = Net::HTTP.start(url.host, url.port) {|http|
              http.request(req)
            }
            puts res.body
        end
    end
end








