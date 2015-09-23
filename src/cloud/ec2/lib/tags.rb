# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
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

module Tags
    # Adds or overwrites one or more tags for the specified EC2 resource or
    #   resources. Each resource can have a maximum of 10 tags. Each tag
    #   consists of a key and optional value. Tag keys must be unique per resource.
    #
    # @param [Hash] params
    # @option params [String] ResourceId.n The IDs of one or more resources
    #   to tag. For example, ami-1a2b3c4d.
    # @option params [String] Tag.n.Key The key for a tag.
    # @option params [String] Tag.n.Value The value for a tag. If you don't
    #   want the tag to have a value, specify the parameter with no value,
    #   and we set the value to an empty string.
    #
    # TODO: return if error or continue
    def create_tags(params)
        resources = []
        tags = {}

        params.each { |key, value|
            case key
            when /ResourceId\./
              resources << case value
              when /ami\-(.+)/
                image = ImageEC2.new(Image.build_xml($1), @client)
                rc = image.info
                if OpenNebula.is_error?(rc) || !image.ec2_ami?
                    rc ||= OpenNebula::Error.new()
                    rc.ec2_code = "InvalidAMIID.NotFound"
                    return rc
                else
                    image
                end
              when /vol\-(.+)/
                image = ImageEC2.new(Image.build_xml($1), @client)
                rc = image.info
                if OpenNebula.is_error?(rc) || !image.ebs_volume?
                    rc ||= OpenNebula::Error.new()
                    rc.ec2_code = "InvalidVolume.NotFound"
                    return rc
                else
                    image
                end
              when /snap\-(.+)/
                image = ImageEC2.new(Image.build_xml($1), @client)
                rc = image.info
                if OpenNebula.is_error?(rc) || !image.ebs_snapshot?
                    rc ||= OpenNebula::Error.new()
                    rc.ec2_code = "InvalidSnapshot.NotFound"
                    return rc
                else
                    image
                end
              when /i\-(.+)/
                vm = VirtualMachine.new(VirtualMachine.build_xml($1), @client)
                rc = vm.info
                if OpenNebula.is_error?(rc)
                    rc.ec2_code = "InvalidInstanceID.NotFound"
                    return rc
                else
                    vm
                end
              end
            when /Tag\.(\d+)\.Key/
                tags[value] = params["Tag.#{$1}.Value"] || "\"\""
            end
        }

        resources.each {|resource|
            if resource.is_a?(VirtualMachine)
                template_key = "USER_TEMPLATE"
            elsif resource.is_a?(Image)
                template_key = "TEMPLATE"
            end

            former_tags = resource.to_hash.first[1][template_key]["EC2_TAGS"] || {}
            resource.delete_element("#{template_key}/EC2_TAGS")
            resource.add_element(template_key, {"EC2_TAGS" => former_tags.merge(tags)})

            rc = resource.update(resource.template_like_str(template_key))
            return rc if OpenNebula::is_error?(rc)
        }

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/create_tags.erb"))
        return response.result(binding), 200
    end

    # Deletes the specified set of tags from the specified set of resources.
    #
    # @param [Hash] params
    # @option params [String] ResourceId.n The IDs of one or more resources
    #   to tag. For example, ami-1a2b3c4d.
    # @option params [String] Tag.n.Key The key for a tag.
    # @option params [String] Tag.n.Value The value for a tag. If you don't
    #   want the tag to have a value, specify the parameter with no value,
    #   and we set the value to an empty string.
    #
    # TODO: return if error or continue
    def delete_tags(params)
        resources = []
        tags = {}

        params.each { |key, value|
            case key
            when /ResourceId\./
              resources << case value
              when /ami\-(.+)/
                image = ImageEC2.new(Image.build_xml($1), @client)
                rc = image.info
                if OpenNebula.is_error?(rc) || !image.ec2_ami?
                    rc ||= OpenNebula::Error.new()
                    rc.ec2_code = "InvalidAMIID.NotFound"
                    return rc
                else
                    image
                end
              when /vol\-(.+)/
                image = ImageEC2.new(Image.build_xml($1), @client)
                rc = image.info
                if OpenNebula.is_error?(rc) || !image.ebs_volume?
                    rc ||= OpenNebula::Error.new()
                    rc.ec2_code = "InvalidVolume.NotFound"
                    return rc
                else
                    image
                end
              when /snap\-(.+)/
                image = ImageEC2.new(Image.build_xml($1), @client)
                rc = image.info
                if OpenNebula.is_error?(rc) || !image.ebs_snapshot?
                    rc ||= OpenNebula::Error.new()
                    rc.ec2_code = "InvalidSnapshot.NotFound"
                    return rc
                else
                    image
                end
              when /i\-(.+)/
                vm = VirtualMachine.new(VirtualMachine.build_xml($1), @client)
                rc = vm.info
                if OpenNebula.is_error?(rc)
                    rc.ec2_code = "InvalidInstanceID.NotFound"
                    return rc
                else
                    vm
                end
              end
            when /Tag\.(\d+)\.Key/
                tags[value] = params["Tag.#{$1}.Value"] || ""
            end
        }

        resources.each {|resource|
            if resource.is_a?(VirtualMachine)
                template_key = "USER_TEMPLATE"
            elsif resource.is_a?(Image)
                template_key = "TEMPLATE"
            end

            tags.each { |key,value|
                resource.delete_element("#{template_key}/EC2_TAGS/#{key.upcase}")
            }

            rc = resource.update(resource.template_like_str(template_key))
            return rc if OpenNebula::is_error?(rc)
        }

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/delete_tags.erb"))
        return response.result(binding), 200
    end

    def describe_tags(params)
        user_flag = OpenNebula::Pool::INFO_ALL
        impool = ImageEC2Pool.new(@client, user_flag)

        rc = impool.info
        return rc if OpenNebula::is_error?(rc)

        user_flag = OpenNebula::Pool::INFO_ALL
        vmpool = VirtualMachinePool.new(@client, user_flag)

        if include_terminated_instances?
            rc = vmpool.info(user_flag, -1, -1,
                    OpenNebula::VirtualMachinePool::INFO_ALL_VM)
        else
            rc = vmpool.info
        end

        return rc if OpenNebula::is_error?(rc)

        erb_version = params['Version']

        response = ERB.new(File.read(@config[:views]+"/describe_tags.erb"))
        return response.result(binding), 200
    end
end
