#!/usr/bin/ruby

require 'rubygems'
require 'curb'
require 'uri'
require 'OpenNebula'
require 'Crack'

module VMIQueryClient
    ###########################################################################
    #
    #
    ###########################################################################
    class Client
        
        #######################################################################
        #
        #
        #######################################################################
        def initialize(endpoint_str=nil, user=nil, pass=nil, debug_flag=false)
            @debug = debug_flag
            
            # Server location
            if !endpoint_str
                @endpoint = "http://localhost:4567"
            else
                @endpoint = endpoint_str
            end
            
            # Autentication            
            if user && pass
                @vmiauth = user + ":" + Digest::SHA1.hexdigest(pass)  
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
            curl=Curl::Easy.new(@endpoint+"/vms")
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug 
            
            xml=File.read(xmlfile)
            
            begin
                curl.http_post(
                  Curl::PostField.content('vmixml', xml),
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
            curl=Curl::Easy.new(@endpoint+"/vms")
            curl.userpwd=@vmiauth
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
            curl=Curl::Easy.new(@endpoint+"/networks")
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug 
            
            xml=File.read(xmlfile)
            
            begin
                curl.http_post(
                  Curl::PostField.content('vmixml', xml)
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
            curl=Curl::Easy.new(@endpoint+"/networks")
            curl.userpwd=@vmiauth
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
      
            curl=Curl::Easy.new(@endpoint+"/images")
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug 
            curl.multipart_form_post = true
      
            file_path = image_info['IMAGE']['URL'] 
            
            m=file_path.match(/^\w+:\/\/(.*)$/)
            
            if m 
                file_path="/"+m[1]
            end
                 
            begin    
                curl.http_post(
                  Curl::PostField.content('vmixml', xml),
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
            curl=Curl::Easy.new(@endpoint+"/images")
            curl.userpwd=@vmiauth
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
            curl=Curl::Easy.new(@endpoint+"/vms/" + id.to_s)
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug
                        
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            pp curl.body_str
        end
        
        #######################################################################
        # Puts a new VM representation in order to change VM state
        # :xmlfile VM VMI xml representation
        #######################################################################
        def put_vm(id,xmlfile)
            xml=File.read(xmlfile)
            vm_info=Crack::XML.parse(xml)
      
            curl=Curl::Easy.new(@endpoint+"/vms/"+id)
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug 
                 
            begin    
                curl.http_post(Curl::PostField.content('vmixml', xml)) 
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end      
            
            puts curl.body_str            
        end
        
        #######################################################################
        # :id VM identifier
        #######################################################################
        def delete_vm(id)
            curl=Curl::Easy.new(@endpoint+"/vms/" + id.to_s)
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug
                        
            begin
                curl.http_delete
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            pp curl.body_str
        end
        
        #######################################################################
        # Retrieves a Virtual Network
        # :id Virtual Network identifier
        #######################################################################
        def get_network(id)
            curl=Curl::Easy.new(@endpoint+"/networks/" + id.to_s)
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug
            
            begin
                curl.http_get
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            pp curl.body_str
        end
        
        #######################################################################
        # :id VM identifier
        #######################################################################
        def delete_network(id)
            curl=Curl::Easy.new(@endpoint+"/networks/" + id.to_s)
            curl.userpwd=@vmiauth
            curl.verbose=true if @debug
                        
            begin
                curl.http_delete
            rescue Exception => e
                error = OpenNebula::Error.new(e.message)
                return error
            end
            pp curl.body_str
        end
        
        #######################################################################
        # Retieves an Image
        # :image_uuid Image identifier
        #######################################################################
        def get_image(image_uuid)
            curl=Curl::Easy.new(@endpoint+"/images/"+image_uuid)
            curl.userpwd=@vmiauth
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

if $0 == __FILE__
    vmiqc = VMIQueryClient::Client.new("http://localhost:4567","tinova","opennebula",true)
    #vmiqc.get_networks
    #vmiqc.post_network("vnxml")
    #vmiqc.post_image("imagexml")
    #vmiqc.get_images
    #vmiqc.get_image("988117f0-752a-012c-f16c-00254bd6f386")
    #vmiqc.post_vms("small","vmxml")
    #vmiqc.delete_vm("11")
    #vmiqc.delete_network("1")
    #vmiqc.put_vm("8","vmxml")
end




