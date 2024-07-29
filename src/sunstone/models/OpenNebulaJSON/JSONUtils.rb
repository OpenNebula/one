# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

module OpenNebulaJSON

    require 'json'

    module JSONUtils
        def to_json
            begin
                JSON.pretty_generate self.to_hash
            rescue Exception => e
                OpenNebula::Error.new(e.message)
            end
        end

        def self.parse_json(json_str, root_element)
            begin
                hash = JSON.parse(json_str)
            rescue Exception => e
                return OpenNebula::Error.new(e.message)
            end

            if hash.has_key?(root_element)
                return hash[root_element]
            else
                return OpenNebula::Error.new("Error parsing JSON: Wrong resource type")
            end
        end

        def parse_json(json_str, root_element)
            JSONUtils.parse_json(json_str, root_element)
        end

        def parse_json_sym(json_str, root_element)
            begin
                hash = JSON.parse(json_str, {:symbolize_names => true})

                if hash.has_key?(root_element)
                    return hash[root_element]
                end

                Error.new("Error parsing JSON:\ root element not present")

            rescue => e
                Error.new(e.message)
            end
        end

        def template_to_str_sunstone_with_explicite_empty_value(attributes)
            result = template_to_str(attributes, indent=true)
            if result == ""
                "SUNSTONE=[]\n"
            else
                result
            end
        end

        def template_to_str(attributes, indent=true)
             if indent
                 ind_enter="\n"
                 ind_tab='  '
             else
                 ind_enter=''
                 ind_tab=' '
             end

             str = attributes.collect do |key, value|
                 next if value.nil? || value.empty?
                 
                 str_line = ""

                 case value
                 when Array
                     value.each do |i|
                        next if i.nil? || i.empty?

                        case i
                        when Hash
                            str_line << key.to_s.upcase << "=[" << ind_enter
                            str_line << i.collect do |k, j|
                                str = ind_tab + k.to_s.upcase + "="
                                str += "\"#{j.to_s}\"" if j
                                str
                            end.compact.join(",\n")
                            str_line << "\n]\n"
                        else
                            str_line << key.to_s.upcase << "=\"#{i.to_s}\"\n"
                        end
                     end
                when Hash
                    str_line << key.to_s.upcase << "=[" << ind_enter

                    str_line << value.collect do |key3, value3|
                        str = ind_tab + key3.to_s.upcase + "="
                        str += "\"#{value3.to_s}\"" if value3
                        str
                    end.compact.join(",\n")

                    str_line << "\n]\n"

                else
                    str_line<<key.to_s.upcase << "=" << "\"#{value.to_s}\""
                end

                str_line
             end.compact.join("\n")

             str
         end

         def hash_to_str(template_hash, delete_values)
            for del in delete_values
                template_hash.delete(del)
            end

            if !template_hash.empty?
                template_str = ""
                template_hash.collect do |key,value|
                    if value.kind_of?(Array)
                        template_str << key.to_s.upcase << " = \["
                        for obj in value
                            if obj.kind_of?(Hash)
                                obj.collect do |key,value|
                                    template_str << key.to_s.upcase << " = \""<< value.to_s << "\"\n"
                                end
                            end
                        end
                        template_str << "\]\n"
                    else
                        template_str << key.to_s.upcase << " = \""<< value.to_s << "\"\n"
                    end
                end
            end
            return template_str
        end
     end
end
