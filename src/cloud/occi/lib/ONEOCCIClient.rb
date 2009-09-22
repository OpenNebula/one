#!/usr/bin/ruby

require 'rubygems'
require 'curb'
require 'uri'
require 'OpenNebula'
require 'crack'

module ONEOCCIClient
    #####################################################################
    #
    #
    #####################################################################
    class Client
        
        #######################################################################
        #
        #
        #######################################################################
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
            elsif ENV["ONE_AUTH"]
                one_auth= ENV["ONE_AUTH"]
                one_auth=~/(\w+):(\w+)/
                user  = $1
                pass  = $2
                @occiauth = user + ":" + Digest::SHA1.hexdigest(pass)
            elsif
                raise "No authorization data present"
            end
            
        end

        #######################################################################
        # Pool Resource Request Methods
        #######################################################################
        
        #######################################################################
        # Post a new VM to the VM Pool
        # :instance_type
        # :xmlfile
        #######################################################################
        def post_vms(instance_type,xmlfile)
            curl=Curl::Easy.new(@endpoint+"/compute")
            curl.userpwd=@occiauth
            curl.verbose=true if @debug 
            
            xml=File.read(xmlfile)
            
            begin
                curl.http_post(
                  Curl::PostField.content('occixml', xml),
                  Curl::PostField.content('InstanceType', instance_type)
                )
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end      
            
            puts curl.body_str            
        end
        
        #######################################################################
        # Retieves the pool of Virtual Machines
        #######################################################################
        def get_vms
            curl=Curl::Easy.new(@endpoint+"/compute")
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
            
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
        
        #######################################################################
        # Post a new Network to the VN Pool
        # :xmlfile xml description of the Virtual Network
        #######################################################################
        def post_network(xmlfile)
            curl=Curl::Easy.new(@endpoint+"/network")
            curl.userpwd=@occiauth
            curl.verbose=true if @debug 
            
            xml=File.read(xmlfile)
            
            begin
                curl.http_post(
                  Curl::PostField.content('occixml', xml)
                )
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end      
            
            puts curl.body_str            
        end
        
        #######################################################################
        # Retieves the pool of Virtual Networks
        #######################################################################
        def get_networks
            curl=Curl::Easy.new(@endpoint+"/network")
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
            
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
        
        #######################################################################
        # Post a new Image to the Image Pool
        # :xmlfile
        #######################################################################
        def post_image(xmlfile)
            xml=File.read(xmlfile)
            image_info=Crack::XML.parse(xml)
      
            curl=Curl::Easy.new(@endpoint+"/storage")
            curl.userpwd=@occiauth
            curl.verbose=true if @debug 
            curl.multipart_form_post = true
      
            file_path = image_info['DISK']['URL'] 
            
            m=file_path.match(/^\w+:\/\/(.*)$/)
            
            if m 
                file_path="/"+m[1]
            end
                 
            begin    
                curl.http_post(
                  Curl::PostField.content('occixml', xml),
                  Curl::PostField.file('file', file_path)
                )   
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end      
            
            puts curl.body_str            
        end
        
        #######################################################################
        # Retieves the pool of Images owned by the user
        #######################################################################
        def get_images
            curl=Curl::Easy.new(@endpoint+"/storage")
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
            
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
        
        #######################################################################
        # Entity Resource Request Methods
        #######################################################################
        
        #######################################################################
        # :id VM identifier
        #######################################################################
        def get_vm(id)
            curl=Curl::Easy.new(@endpoint+"/compute/" + id.to_s)
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
                        
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
        
        #######################################################################
        # Puts a new Compute representation in order to change its state
        # :xmlfile Compute OCCI xml representation
        #######################################################################
        def put_vm(xmlfile)
            xml=File.read(xmlfile)
            vm_info=Crack::XML.parse(xml)
      
            curl=Curl::Easy.new(@endpoint+"/compute/"+vm_info['ID'])
            curl.userpwd=@occiauth
            curl.verbose=true if @debug 
                 
            begin    
                curl.http_post(Curl::PostField.content('occixml', xml)) 
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end      
            
            puts curl.body_str            
        end
        
        #######################################################################
        # :id Compute identifier
       #######################################################################
        def delete_vm(id)
            curl=Curl::Easy.new(@endpoint+"/compute/" + id.to_s)
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
                        
            begin
                curl.http_delete
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
        
        #######################################################################
        # Retrieves a Virtual Network
        # :id Virtual Network identifier
        #######################################################################
        def get_network(id)
            curl=Curl::Easy.new(@endpoint+"/network/" + id.to_s)
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
            
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
        
        #######################################################################
        # :id VM identifier
        #######################################################################
        def delete_network(id)
            curl=Curl::Easy.new(@endpoint+"/network/" + id.to_s)
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
                        
            begin
                curl.http_delete
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
        
        #######################################################################
        # Retieves an Image
        # :image_uuid Image identifier
        #######################################################################
        def get_image(image_uuid)
            curl=Curl::Easy.new(@endpoint+"/storage/"+image_uuid)
            curl.userpwd=@occiauth
            curl.verbose=true if @debug
            
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            puts curl.body_str
        end
    end
end






