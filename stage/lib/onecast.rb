# -------------------------------------------------------------------------- #
# Copyright 2010-2013, C12G Labs S.L.                                        #
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

module OpenNebula
    class OneCast
        attr_reader :vars, :error

        REG_VAR=/\$\{([^}|]+)(\|([^}]+))?\}/

        def initialize(template, vars={})
            @vars=ENV.to_hash.merge(vars)
            @error=nil
            @template=template.clone
        end

        def rewrite_template
            @error=nil

            @template.gsub(REG_VAR) do |var|
                match=REG_VAR.match(var)

                var_name=match[1]
                default_value=match[3]

                d=@vars[var_name]

                d||=default_value

                if !d
                    @error||=''
                    @error+="Variable '#{var_name}' not set. "
                end

                d
            end
        end

        def get_defaults
            defaults=Hash.new

            @template.scan(REG_VAR) do |match|
                var_name=match[0]
                default_value=match[2]

                defaults[var_name]=default_value
            end

            defaults
        end
    end
end

