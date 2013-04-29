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

require 'rubygems'
require 'json'

require 'OpenNebula'

require 'OpenNebula/DocumentJSON'
require 'OpenNebula/DocumentPoolJSON'

require 'onecast'

module OpenNebula
    class ChefConf
        TEMPLATE_TAG='BODY'

        def initialize(conf=nil)
            case conf
            when String
                @chef=JSON.parse(conf)
            when Hash
                @chef=conf
            else
                @chef=Hash.new
            end
        end

        def name=(_name)
            @chef['name']=_name
        end

        def node=(node)
            cast=OneCast.new(node)
            @chef['defaults']=cast.get_defaults

            @chef['node']=JSON.parse(node)
            @chef['name']=@chef['node']['name'] if @chef['node']['name']
        end

        def to_json
            @chef.to_json
        end

        def [](key)
            @chef[key]
        end

        def variables=(vars)
            @chef['variables']=vars
        end

        def templates=(templates)
            @chef['templates']=templates
        end

        def cookbooks=(cookbooks)
            @chef['cookbooks']=cookbooks
        end

        def description=(description)
            @chef['description']=description
        end

        def save(client)
            doc=ChefDoc.new(ChefDoc.build_xml, client)

            name=@chef['name']
            [doc, doc.allocate(@chef.to_json, name)]
        end
    end

    class ChefDoc < DocumentJSON
        DOCUMENT_TYPE = 666

        def node
            if !defined?(@node)
                @node=ChefConf.new(self["/DOCUMENT/TEMPLATE/#{TEMPLATE_TAG}"])
            end

            @node
        end

        def instantiate(template, variables={})
            xml=OpenNebula::Template.build_xml(template.to_i)
            template=OpenNebula::Template.new(xml, @client)

            res=template.info

            return res if OpenNebula.is_error? res

            res=self.info

            return res if OpenNebula.is_error? res

            # Create context if it does not exist
            if !template.has_elements?('/VMTEMPLATE/TEMPLATE/CONTEXT')
                template.add_element('/VMTEMPLATE/TEMPLATE', 'CONTEXT'=>nil)
            end

            # Encode the node
            node_string=node['node'].to_json
            node_base64=Base64.encode64(node_string).delete("\n")

            template.add_element('/VMTEMPLATE/TEMPLATE/CONTEXT', 'NODE'=>
                node_base64)

            if variables && !variables.empty?
                hash=Hash.new
                variables.each do |var|
                    key, val=var.split('=')

                    hash[key]=val
                end

                template.add_element('/VMTEMPLATE/TEMPLATE/CONTEXT', hash)
            end

            if node['cookbooks']
                template.add_element('/VMTEMPLATE/TEMPLATE/CONTEXT',
                    'COOKBOOKS' => node['cookbooks'])
            end

            t=template.element_xml('/VMTEMPLATE/TEMPLATE')

            xml=OpenNebula::VirtualMachine.build_xml()
            vm=OpenNebula::VirtualMachine.new(xml, @client)

            res=vm.allocate(t)

            if OpenNebula.is_error? res
                return res
            else
                vm
            end
        end
    end

    class ChefDocPool < DocumentPoolJSON

        DOCUMENT_TYPE = 666

        def factory(element_xml)
            ChefDoc.new(element_xml, @client)
        end
    end
end
