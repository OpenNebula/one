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

        def allocate(template_json)
            vm_hash = parse_json(template_json, 'vm')
            if OpenNebula.is_error?(vm_hash)
                return vm_hash
            end

            if vm_hash['vm_raw']
                super(vm_hash['vm_raw'])
            else
                template = template_to_str(vm_hash)
                super(template)
            end
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
                when "livemigrate" then self.live_migrate(action_hash['params'])
                when "migrate"      then self.migrate(action_hash['params'])
                when "resume"       then self.resume
                when "release"      then self.release
                when "stop"         then self.stop
                when "suspend"      then self.suspend
                when "restart"      then self.restart
                when "saveas"      then self.save_as(action_hash['params'])
                when "shutdown"     then self.shutdown
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
    end
end
