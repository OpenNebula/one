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

require 'parse-cron'

module OpenNebula

    # Service Template
    class ServiceTemplate < DocumentJSON

        ROLE_SCHEMA = {
            :type => :object,
            :properties => {
                'name' => {
                    :type => :string,
                    :required => true,
                    :regex => /^\w+$/
                },
                'cardinality' => {
                    :type => :integer,
                    :default => 0,
                    :minimum => 0
                },
                'vm_template' => {
                    :type => :integer,
                    :required => true
                },
                'vm_template_contents' => {
                    :type => :string,
                    :required => false
                },
                'custom_attrs' => {
                    :type => :object,
                    :properties => {},
                    :required => false
                },
                'custom_attrs_values' => {
                    :type => :object,
                    :properties => {},
                    :required => false
                },
                'parents' => {
                    :type => :array,
                    :items => {
                        :type => :string
                    }
                },
                'shutdown_action' => {
                    :type => :string,
                    :enum => [
                        'terminate',
                        'terminate-hard',
                        'shutdown',
                        'shutdown-hard'
                    ],
                    :required => false
                },
                'min_vms' => {
                    :type => :integer,
                    :required => false,
                    :minimum => 0
                },
                'max_vms' => {
                    :type => :integer,
                    :required => false,
                    :minimum => 0
                },
                'cooldown' => {
                    :type => :integer,
                    :required => false,
                    :minimum => 0
                },
                'on_hold' => {
                    :type => :boolean,
                    :required => false
                },
                'elasticity_policies' => {
                    :type => :array,
                    :items => {
                        :type => :object,
                        :properties => {
                            'type' => {
                                :type => :string,
                                :enum => [
                                    'CHANGE',
                                    'CARDINALITY',
                                    'PERCENTAGE_CHANGE'
                                ],
                                :required => true
                            },
                            'adjust' => {
                                :type => :integer,
                                :required => true
                            },
                            'min_adjust_step' => {
                                :type => :integer,
                                :required => false,
                                :minimum => 1
                            },
                            'period_number' => {
                                :type => :integer,
                                :required => false,
                                :minimum => 0
                            },
                            'period' => {
                                :type => :integer,
                                :required => false,
                                :minimum => 0
                            },
                            'expression' => {
                                :type => :string,
                                :required => true
                            },
                            'cooldown' => {
                                :type => :integer,
                                :required => false,
                                :minimum => 0
                            }
                            # 'statistic' => {
                            # # SampleCount | Average | Sum | Minimum | Maximum
                            #    :type => :string
                            # }
                        }
                    }
                },
                'scheduled_policies' => {
                    :type => :array,
                    :items => {
                        :type => :object,
                        :properties => {
                            'type' => {
                                :type => :string,
                                :enum => [
                                    'CHANGE',
                                    'CARDINALITY',
                                    'PERCENTAGE_CHANGE'
                                ],
                                :required => true
                            },
                            'adjust' => {
                                :type => :integer,
                                :required => true
                            },
                            'min_adjust_step' => {
                                :type => :integer,
                                :required => false,
                                :minimum => 1
                            },
                            'start_time' => {
                                :type => :string,
                                :required => false
                            },
                            'recurrence' => {
                                :type => :string,
                                :required => false
                            }
                        }
                    }
                }
            }
        }

        SCHEMA = {
            :type => :object,
            :properties => {
                'name' => {
                    :type => :string,
                    :required => true
                },
                'deployment' => {
                    :type => :string,
                    :enum => ['none', 'straight'],
                    :default => 'none'
                },
                'description' => {
                    :type => :string,
                    :default => ''
                },
                'shutdown_action' => {
                    :type => :string,
                    :enum => [
                        'terminate',
                        'terminate-hard',
                        'shutdown',
                        'shutdown-hard'
                    ],
                    :required => false
                },
                'roles' => {
                    :type => :array,
                    :items => ROLE_SCHEMA,
                    :required => true
                },
                'custom_attrs' => {
                    :type => :object,
                    :properties => {},
                    :required => false
                },
                'custom_attrs_values' => {
                    :type => :object,
                    :properties => {},
                    :required => false
                },
                'ready_status_gate' => {
                    :type => :boolean,
                    :required => false
                },
                'automatic_deletion' => {
                    :type => :boolean,
                    :required => false
                },
                'networks' => {
                    :type => :object,
                    :properties => {},
                    :required => false
                },
                'networks_values' => {
                    :type => :array,
                    :items => {
                        :type => :object,
                        :properties => {}
                    },
                    :required => false
                },
                'on_hold' => {
                    :type => :boolean,
                    :required => false
                }
            }
        }

        # List of attributes that can't be changed in update operation
        #
        # registration_time: this is internal info managed by OneFlow server
        IMMUTABLE_ATTRS = [
            'registration_time'
        ]

        def self.init_default_vn_name_template(vn_name_template)
            # rubocop:disable Style/ClassVars
            @@vn_name_template = vn_name_template
            # rubocop:enable Style/ClassVars
        end

        DOCUMENT_TYPE = 101

        def allocate(template_json)
            template = JSON.parse(template_json)

            ServiceTemplate.validate(template)

            template['registration_time'] = Integer(Time.now)

            super(template.to_json, template['name'])
        end

        # Delete service template
        #
        # @param type [String] Delete type
        #   - none: just the service template
        #   - all: delete VM templates, images and service template
        #   - templates: delete VM templates and service template
        def delete(type = nil)
            case type
            when 'all'
                recursive = true
            when 'templates'
                recursive = false
            end

            if type && type != 'none'
                rc = vm_template_ids

                return rc if OpenNebula.is_error?(rc)

                rc = rc.each do |t_id|
                    t  = OpenNebula::Template.new_with_id(t_id, @client)
                    rc = t.info

                    break rc if OpenNebula.is_error?(rc)

                    rc = t.delete(recursive)

                    break rc if OpenNebula.is_error?(rc)
                end
            end

            return rc if OpenNebula.is_error?(rc)

            super()
        end

        # Retrieves the template
        #
        # @return [String] json template
        def template
            @body.to_json
        end

        # Replaces the template contents
        #
        # @param template_json [String] New template contents
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update(template_json, append = false)
            rc = info

            return rc if OpenNebula.is_error?(rc)

            template = JSON.parse(template_json)

            if append
                IMMUTABLE_ATTRS.each do |attr|
                    unless template[attr].nil?
                        return [false, "service_template/#{attr}"]
                    end
                end
            else
                IMMUTABLE_ATTRS.each do |attr|
                    # Allows updating the template without
                    # specifying the immutable attributes
                    if template[attr].nil?
                        template[attr] = @body[attr]
                    end

                    next if template[attr] == @body[attr]

                    return [false, "service_template/#{attr}"]
                end
            end

            template = @body.merge(template) if append

            ServiceTemplate.validate(template)

            super(template.to_json)
        end

        # Clone service template and the VM templates asssociated to it
        #
        # @param name [String] New template name
        # @param mode [Symbol] Cloning mode (:all, :templates)
        #
        # @return [Integer] New document ID
        def clone_recursively(name, mode)
            recursive = mode == 'all'

            # clone the document to get new ID
            new_id = clone(name)

            return new_id if OpenNebula.is_error?(new_id)

            doc = OpenNebula::ServiceTemplate.new_with_id(new_id, @client)
            rc  = doc.info

            return rc if OpenNebula.is_error?(rc)

            body             = JSON.parse(doc["TEMPLATE/#{TEMPLATE_TAG}"])
            cloned_templates = {}

            # iterate over roles to clone templates
            rc = body['roles'].each do |role|
                t_id = role['vm_template']

                # if the template has already been cloned, just update the value
                if cloned_templates.keys.include?(t_id)
                    role['vm_template'] = cloned_templates[t_id]
                    next
                end

                template = OpenNebula::Template.new_with_id(t_id, @client)
                rc       = template.info

                break rc if OpenNebula.is_error?(rc)

                # The maximum size is 128, so crop the template name if it
                # exceeds the limit
                new_name = "#{template.name}-#{name}"

                if new_name.size > 119
                    new_name = "#{template.name[0..(119 - name.size)]}-#{name}"
                end

                rc = template.clone(new_name, recursive)

                break rc if OpenNebula.is_error?(rc)

                # add new ID to the hash
                cloned_templates[t_id] = rc

                role['vm_template'] = rc
            end

            # if any error, rollback and delete the left templates
            if OpenNebula.is_error?(rc)
                cloned_templates.each do |_, value|
                    template = OpenNebula::Template.new_with_id(value, @client)

                    rc = template.info

                    break rc if OpenNebula.is_error?(rc)

                    rc = template.delete(recursive)

                    break rc if OpenNebula.is_error?(rc)
                end

                return rc
            end

            # update the template with the new body
            doc.update(body.to_json)

            # return the new document ID
            new_id
        end

        # Clones a service template
        #
        # @param name [Stirng] New name
        #
        # @return [Integer] New template ID
        def clone(name)
            new_id = super

            doc = OpenNebula::ServiceTemplate.new_with_id(new_id, @client)
            rc  = doc.info

            return rc if OpenNebula.is_error?(rc)

            body = JSON.parse(doc["TEMPLATE/#{TEMPLATE_TAG}"])

            # add registration time, as the template is new
            body['registration_time'] = Integer(Time.now)

            # update the template with the new body
            DocumentJSON.instance_method(:update).bind(doc).call(body.to_json)

            # return the new document ID
            new_id
        end

        # Replaces the raw template contents
        #
        # @param template [String] New template contents, in the form KEY = VAL
        # @param append [true, false] True to append new attributes instead of
        #   replace the whole template
        #
        # @return [nil, OpenNebula::Error] nil in case of success, Error
        #   otherwise
        def update_raw(template_raw, append = false)
            super(template_raw, append)
        end

        def self.validate(template)
            validator = Validator::Validator.new(
                :default_values => true,
                :delete_extra_properties => false,
                :allow_extra_properties => true
            )

            validator.validate!(template, SCHEMA)

            validate_values(template)
        end

        def self.validate_role(template)
            validator = Validator::Validator.new(
                :default_values => true,
                :delete_extra_properties => false,
                :allow_extra_properties => true
            )

            validator.validate!(template, ROLE_SCHEMA)
        end

        def instantiate(merge_template)
            rc = nil

            if merge_template.nil?
                instantiate_template = JSON.parse(@body.to_json)
            else
                instantiate_template = JSON.parse(@body.to_json)
                                           .deep_merge(merge_template)
            end

            begin
                ServiceTemplate.validate(instantiate_template)

                xml     = OpenNebula::Service.build_xml
                service = OpenNebula::Service.new(xml, @client)

                rc = service.allocate(instantiate_template.to_json)
            rescue Validator::ParseException, JSON::ParserError => e
                return e
            end

            return rc if OpenNebula.is_error?(rc)

            service.info
            service
        end

        def self.validate_values(template)
            parser = ElasticityGrammarParser.new

            roles = template['roles']

            roles.each_with_index do |role, role_index|
                roles[role_index+1..-1].each do |other_role|
                    if role['name'] == other_role['name']
                        raise Validator::ParseException,
                              "Role name '#{role['name']}' is repeated"
                    end
                end

                if !role['min_vms'].nil? &&
                   role['min_vms'].to_i > role['cardinality'].to_i

                    raise Validator::ParseException,
                          "Role '#{role['name']}' 'cardinality' must be " \
                          "greater than or equal to 'min_vms'"
                end

                if !role['max_vms'].nil? &&
                   role['max_vms'].to_i < role['cardinality'].to_i

                    raise Validator::ParseException,
                          "Role '#{role['name']}' 'cardinality' must be " \
                          "lower than or equal to 'max_vms'"
                end

                if ((role['elasticity_policies'] &&
                    !role['elasticity_policies'].empty?) ||
                   (role['scheduled_policies'] &&
                   !role['scheduled_policies'].empty?)) &&
                   (role['min_vms'].nil? || role['max_vms'].nil?)
                    raise Validator::ParseException,
                          "Role '#{role['name']}' with " \
                          " 'elasticity_policies' or " \
                          "'scheduled_policies'must define both 'min_vms'" \
                          " and 'max_vms'"
                end

                if role['elasticity_policies']
                    role['elasticity_policies'].each_with_index do |policy, index|
                        exp = policy['expression']

                        if exp.empty?
                            raise Validator::ParseException,
                                  "Role '#{role['name']}', elasticity policy " \
                                  "##{index} 'expression' cannot be empty"
                        end

                        treetop = parser.parse(exp)
                        next unless treetop.nil?

                        raise Validator::ParseException,
                              "Role '#{role['name']}', elasticity policy " \
                              "##{index} 'expression' parse error: " \
                              "#{parser.failure_reason}"
                    end
                end

                next unless role['scheduled_policies']

                role['scheduled_policies'].each_with_index do |policy, index|
                    start_time = policy['start_time']
                    recurrence = policy['recurrence']

                    if !start_time.nil?
                        if !policy['recurrence'].nil?
                            raise Validator::ParseException,
                                  "Role '#{role['name']}', scheduled policy "\
                                  "##{index} must define "\
                                  "'start_time' or 'recurrence', but not both"
                        end

                        begin
                            next if start_time.match(/^\d+$/)

                            Time.parse(start_time)
                        rescue ArgumentError
                            raise Validator::ParseException,
                                  "Role '#{role['name']}', scheduled policy " \
                                  "##{index} 'start_time' is not a valid " \
                                  'Time. Try with YYYY-MM-DD hh:mm:ss or ' \
                                  '0YYY-MM-DDThh:mm:ssZ'
                        end
                    elsif !recurrence.nil?
                        begin
                            cron_parser = CronParser.new(recurrence)
                            cron_parser.next
                        rescue StandardError
                            raise Validator::ParseException,
                                  "Role '#{role['name']}', scheduled policy " \
                                  "##{index} 'recurrence' is not a valid " \
                                  'cron expression'
                        end
                    else
                        raise Validator::ParseException,
                              "Role '#{role['name']}', scheduled policy #" \
                              "#{index} needs to define either " \
                              "'start_time' or 'recurrence'"
                    end
                end
            end
        end

        # Retreives all associated VM templates IDs
        #
        # @return [Array] VM templates IDs
        def vm_template_ids
            rc = info

            return rc if OpenNebula.is_error?(rc)

            ret = []

            @body['roles'].each do |role|
                t_id = Integer(role['vm_template'])
                ret << t_id unless ret.include?(t_id)
            end

            ret
        end

    end

end
