# -------------------------------------------------------------------------- #
# Copyright 2010-2014, C12G Labs S.L.                                        #
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

    class ServiceTemplate < DocumentJSON
        ROLE_SCHEMA = {
            :type => :object,
            :properties => {
                'name' => {
                    :type => :string,
                    :required => true
                },
                'cardinality' => {
                    :type => :integer,
                    :default => 1,
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
                'parents' => {
                    :type => :array,
                    :items => {
                        :type => :string
                    }
                },
                'shutdown_action' => {
                    :type => :string,
                    :enum => %w{shutdown shutdown-hard},
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
                'elasticity_policies' => {
                    :type => :array,
                    :items => {
                        :type => :object,
                        :properties => {
                            'type' => {
                                :type => :string,
                                :enum => %w{CHANGE CARDINALITY PERCENTAGE_CHANGE},
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
                            #'statistic' => {
                            # # SampleCount | Average | Sum | Minimum | Maximum
                            #    :type => :string
                            #}
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
                                :enum => %w{CHANGE CARDINALITY PERCENTAGE_CHANGE},
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
                :enum => %w{none straight},
                :default => 'none'
                },
                'shutdown_action' => {
                    :type => :string,
                    :enum => %w{shutdown shutdown-hard},
                    :required => false
                },
                'roles' => {
                    :type => :array,
                    :items => ROLE_SCHEMA,
                    :required => true
                },
                'custom_attrs' => {
                    :type => :object,
                    :properties => {
                    },
                    :required => false
                }
            }
        }



        DOCUMENT_TYPE = 101

        def allocate(template_json)
            template = JSON.parse(template_json)

            ServiceTemplate.validate(template)

            super(template.to_json, template['name'])
        end

        # Retrieves the template
        #
        # @return [String] json template
        def template
            @body.to_json
        end

        def update(template_json)
            template = JSON.parse(template_json)

            ServiceTemplate.validate(template)

            super(template.to_json)
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

    private

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

                if (!role['min_vms'].nil? && role['min_vms'].to_i > role['cardinality'].to_i)

                    raise Validator::ParseException,
                    "Role '#{role['name']}' 'cardinality' must be greater than "\
                    "or equal to 'min_vms'"
                end

                if !role['max_vms'].nil? &&
                    role['max_vms'].to_i < role['cardinality'].to_i

                    raise Validator::ParseException,
                    "Role '#{role['name']}' 'cardinality' must be lower than "\
                    "or equal to 'max_vms'"
                end

                if ((role['elasticity_policies'] && role['elasticity_policies'].size > 0) ||
                    (role['scheduled_policies'] && role['scheduled_policies'].size > 0))

                    if role['min_vms'].nil? || role['max_vms'].nil?
                        raise Validator::ParseException,
                        "Role '#{role['name']}' with 'elasticity_policies' or "<<
                        "'scheduled_policies' must define both 'min_vms'"<<
                        "and 'max_vms'"
                    end
                end

                if role['elasticity_policies']
                    role['elasticity_policies'].each_with_index do |policy, index|
                        exp = policy['expression']

                        if exp.empty?
                            raise Validator::ParseException,
                            "Role '#{role['name']}', elasticity policy "\
                            "##{index} 'expression' cannot be empty"
                        end

                        treetop = parser.parse(exp)
                        if treetop.nil?
                            raise Validator::ParseException,
                            "Role '#{role['name']}', elasticity policy "\
                            "##{index} 'expression' parse error: #{parser.failure_reason}"
                        end
                    end
                end

                if role['scheduled_policies']
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
                                Time.parse(start_time)
                            rescue ArgumentError
                                raise Validator::ParseException,
                                "Role '#{role['name']}', scheduled policy "\
                                "##{index} 'start_time' is not a valid Time. "\
                                "Try with YYYY-MM-DD hh:mm:ss or YYYY-MM-DDThh:mm:ssZ"
                            end
                        elsif !recurrence.nil?
                            begin
                                cron_parser = CronParser.new(recurrence)
                                start_time = cron_parser.next()
                            rescue Exception => e
                                raise Validator::ParseException,
                                "Role '#{role['name']}', scheduled policy "\
                                "##{index} 'recurrence' is not a valid "\
                                "cron expression"
                            end
                        else
                            raise Validator::ParseException,
                            "Role '#{role['name']}', scheduled policy ##{index} needs to define either "<<
                            "'start_time' or 'recurrence'"
                        end
                    end
                end
            end
        end
    end
end
