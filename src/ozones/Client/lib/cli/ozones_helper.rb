require 'OZonesClient'

module OZonesHelper
    
    class OZHelper
        def initialize(user=nil, pass=nil, endpoint_str=nil,
                       timeout=nil, debug_flag=true)
            @client = OZonesClient::Client.new(user, 
                                               pass, 
                                               endpoint_str,
                                               timeout, 
                                               debug_flag)
        end

        def create_resource(kind, template)
            rc = @client.post_resource(kind, template)
                        
            if OZonesClient::is_error?(rc) 
               [-1, rc.message] 
            else
               id=rc.body.match('\"id\":(.*)$')[1].strip
               if id[-1..-1] == ","
                   id = id[0..id.size-2]
               end
               [0, "ID: #{id}"]
            end
        end
        
        def list_pool(kind, options)
            rc = @client.get_pool(kind)
            
            if OZonesClient::is_error?(rc) 
               [-1, rc.message] 
            else
               pool=OZonesClient::parse_json(rc.body, kind.upcase + "_POOL")
               format_pool(pool, options)
            end
        end
        
        def show_resource(kind, id, options)
            rc = @client.get_resource(kind, id)
    
            if OZonesClient::is_error?(rc) 
               [-1, rc.message] 
            else
               resource=OZonesClient::parse_json(rc.body, kind.upcase)
               format_resource(resource, options)
            end
        end
        
        def delete_resource(kind, id, options)
            rc = @client.delete_resource(kind, id)
            
            if OZonesClient::is_error?(rc) 
               [-1, rc.message] 
            else
               message=OZonesClient::parse_json(rc.body, "message")
               [0, "#{message}"]
            end
        end
             
    end
end