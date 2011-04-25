# -------------------------------------------------------------------------- #
# Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             #
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

require 'OpenNebulaJSON/JSONUtils'

module OpenNebulaJSON
    class VirtualMachineJSON < OpenNebula::VirtualMachine
        include JSONUtils

        def create(template_json)
            vm_hash = parse_json(template_json, 'vm')
            if OpenNebula.is_error?(vm_hash)
                return vm_hash
            end

            if vm_hash['vm_raw']
                template = vm_hash['vm_raw']
            else
                template = template_to_str(vm_hash)
            end

            self.allocate(template)
       end

        def perform_action(template_json)
            action_hash = parse_json(template_json,'action')
            if OpenNebula.is_error?(action_hash)
                return action_hash
            end

            rc = case action_hash['perform']
                when "cancel"       then self.cancel
                when "deploy"       then self.deploy(action_hash['params'])
                when "finalize"     then self.finalize
                when "hold"         then self.hold
                when "livemigrate"  then self.live_migrate(action_hash['params'])
                when "migrate"      then self.migrate(action_hash['params'])
                when "resume"       then self.resume
                when "release"      then self.release
                when "stop"         then self.stop
                when "suspend"      then self.suspend
                when "restart"      then self.restart
                when "saveas"       then self.save_as(action_hash['params'])
                when "shutdown"     then self.shutdown
                when "resubmit"     then self.resubmit
                when "startvnc"     then self.startvnc
                when "stopvnc"      then self.stopvnc
                else
                    error_msg = "#{action_hash['perform']} action not " <<
                                " available for this resource"
                    OpenNebula::Error.new(error_msg)
            end
        end

        def delete
            self.finalize
        end

        def deploy(params=Hash.new)
            super(params['host_id'])
        end

        def live_migrate(params=Hash.new)
            super(params['host_id'])
        end

        def migrate(params=Hash.new)
            super(params['host_id'])
        end

        def save_as(params=Hash.new)
            if params['image_type']
                image_type = params['image_type']
            else
                image_id = self["TEMPLATE/DISK[DISK_ID=\"#{params[:disk_id]}\"]/IMAGE_ID"]

                if (image_id != nil)
                    if self["TEMPLATE/DISK[DISK_ID=\"#{disk_id}\"]/SAVE_AS"]
                        error_msg = "Error: The disk #{disk_id} is already" <<
                                    " supposed to be saved"
                        return OpenNebula::Error.new(error_msg)
                    end

                    # Get the image type
                    image = OpenNebula::Image.new(
                                OpenNebula::Image.build_xml(image_id), @client)

                    result = image.info
                    if OpenNebula.is_error?(result)
                        return result
                    end

                    image_type = image.type_str
                end
            end

            # Build the template and allocate the new Image
            template = "NAME=\"#{params['image_name']}\"\n"
            template << "TYPE=#{image_type}\n" if image_type

            image = OpenNebula::Image.new(OpenNebula::Image.build_xml, @client)

            result = image.allocate(template)
            if OpenNebula.is_error?(result)
                return result
            end

            super(params['disk_id'].to_i, image.id)
        end
        
        def startvnc(port)
            result = self.info();
            if OpenNebula.is_error?(result)
                return result
            end
            
            if self['LCM_STATE'] != "3"
                return OpenNebula::Error.new("VM is not running");
            end
            
            if self['TEMPLATE/GRAPHICS/TYPE'] != "vnc"
                return OpenNebula::Error.new("VM has no VNC configured");
            end
                      
            if self['TEMPLATE/GRAPHICS/PORT']
                vnc_port = self['TEMPLATE/GRAPHICS/PORT']
            else
                return OpenNebula::Error.new("VM has no VNC port set");
            end
            
            if self['TEMPLATE/GRAPHICS/PASSWD']
                vnc_pw = self['TEMPLATE/GRAPHICS/PASSWD']
            else
                vnc_pw = ""
            end
            
            host = self['HISTORY/HOSTNAME']
            
            #we are ready for the party
            
            final_port = 29876+port.to_i;
            
            # puts "Launch noVNC on #{final_port} listenting to #{host}:#{vnc_port}"
            # So here we launch the noVNC server listening on the final_port 
            # and serving as proxy for the VM host on the configured VNC port.
            # TODO - This path is in public...            
            pipe = IO.popen("#{File.dirname(__FILE__)}/../../public/vendor/noVNC/utils/launch.sh --listen #{final_port} --vnc #{host}:#{vnc_port}")
            
            return {:pipe => pipe, :port => final_port, :password => vnc_pw}
            
        end
        
        def stopvnc(pipe)
            #am I allowed to do something affecting this machine?
            result = self.info();
            if OpenNebula.is_error?(result)
                return result
            end
            pid = pipe.pid
            # puts "Killing noVNC with pid #{pid}"
            Process.kill('KILL',pid)
            pipe.close
            return
        end
        
    end
end
