# ---------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                  #
#                                                                              #
# Licensed under the Apache License, Version 2.0 (the "License"); you may      #
# not use this file except in compliance with the License. You may obtain      #
# a copy of the License at                                                     #
#                                                                              #
# http://www.apache.org/licenses/LICENSE-2.0                                   #
#                                                                              #
# Unless required by applicable law or agreed to in writing, software          #
# distributed under the License is distributed on an "AS IS" BASIS,            #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.     #
# See the License for the specific language governing permissions and          #
# limitations under the License.                                               #
# ---------------------------------------------------------------------------- #

require 'rubygems'
require 'opennebula/xml_utils'
require 'opennebula/client'
require 'opennebula/group_pool'
require 'yaml'
require 'onelogin/ruby-saml'

if !defined?(ONE_LOCATION)
    ONE_LOCATION=ENV['ONE_LOCATION']
end

if !ONE_LOCATION
    VAR_LOCATION='/var/lib/one/'
else
    VAR_LOCATION=ONE_LOCATION+'/var/'
end

# A top-level module for OpenNebula related classes.
module OpenNebula

    # This class handles SAML authentication responses and group mapping for OpenNebula.
    class SamlAuth

        def initialize(provider, config)
            @options={
                :issuer             => nil,
                :idp_cert           => nil,
                :user_field         => 'NameID',
                :group_field        => 'memberOf',
                :group_required     => nil,
                :mapping_generate   => true,
                :mapping_key        => 'SAML_GROUP',
                :mapping_mode       => 'strict',
                :mapping_timeout    => 300,
                :mapping_filename   => 'saml_groups_1.yaml',
                :mapping_default    => 1,
                :group_admin_name   => 'cloud-admins'
            }.merge(provider)

            @options[:mapping_file_path] = VAR_LOCATION + @options[:mapping_filename]
            @options[:sp_entity_id] = config[:sp_entity_id]
            @options[:acs_url] = config[:acs_url]

            if !options_ok?
                STDERR.puts('Identity Provider configured options are not correct.')
                STDERR.puts('Please, configure a valid Identity Provider certificate.')
                exit(-1)
            end

            generate_mapping if @options[:mapping_generate]
            load_mapping
        end

        def options_ok?
            required_keys = [:issuer, :idp_cert, :sp_entity_id, :group_field]
            return false unless required_keys.all? {|key| @options.key?(key) }

            # Avoid XPath injection towards the assertion
            !@options[:group_field].include?("'")
        end

        # Validates SAML assertion using the ruby-saml library.
        # Returns true if the assertion is valid.
        # If not valid, returns an array of errors with the failed validations.
        # The following validations are performed:
        #     validations = [
        #       :validate_version, # checks if SAML 2.0 is used
        #       :validate_id, # checks that the assertion contains an ID
        #       :validate_success_status, # validates the status of the assertion
        #       :validate_num_assertion, # validates that only a single assertion is contained
        #       :validate_signed_elements, # validates that only valid elements are signed
        #       :validate_structure, # validates the assertion against a specific schema
        #       :validate_no_duplicated_attributes, # checks for duplicated attributes
        #       :validate_in_response_to, # check if the provided request_id == inResponseTo
        #       :validate_one_conditions, # checks that saml:Conditions exist
        #       :validate_conditions, # validates that the assertion is not expired
        #       :validate_one_authnstatement, # checks that saml:AuthnStatement exists
        #       :validate_audience, # validates that Audience == sp_entity_id
        #       :validate_destination, # validates that destination == acs_url
        #       :validate_issuer, # validates if the assertion issuer matches the configured one
        #       :validate_session_expiration, # validates expiration (SessionNotOnOrAfter)
        #       :validate_subject_confirmation, # checks if subject confirmation is correct
        #       :validate_name_id, # checks that the NameID element is present
        #       :validate_signature # validates the assertion signature
        #     ]

        # Source: https://github.com/SAML-Toolkits/ruby-saml/blob/fbbedc978300deb9355a8e505849666974ef2e67/lib/onelogin/ruby-saml/response.rb#L399

        def validate_assertion(assertion_text)
            saml_settings = OneLogin::RubySaml::Settings.new
            saml_settings.idp_cert = @options[:idp_cert]
            saml_settings.issuer = @options[:issuer]
            saml_settings.sp_entity_id = @options[:sp_entity_id]
            saml_settings.assertion_consumer_service_url = @options[:acs_url]
            assertion = OneLogin::RubySaml::Response.new(assertion_text, :settings => saml_settings)
            return true if assertion.is_valid?

            return assertion.errors
        end

        def generate_mapping
            file=@options[:mapping_file_path]
            generate = false

            if File.exist?(file)
                stat = File.stat(file)
                age = Time.now.to_i - stat.mtime.to_i
                generate = true if age > @options[:mapping_timeout]
            else
                generate = true
            end

            return unless generate

            client = OpenNebula::Client.new
            group_pool = OpenNebula::GroupPool.new(client)
            rc = group_pool.info

            if OpenNebula.is_error?(rc)
                STDERR.puts 'Unable to retrieve OpenNebula groups. OpenNebula error.'
                STDERR.puts "Error: #{rc.message}"
                exit(-1)
            end

            groups=[group_pool.get_hash['GROUP_POOL']['GROUP']].flatten

            yaml={}

            groups.each do |group|
                if group['TEMPLATE'] && group['TEMPLATE'][@options[:mapping_key]]
                    yaml[group['TEMPLATE'][@options[:mapping_key]]] = group['ID']
                end
            end

            File.open(file, 'w') do |f|
                f.write(yaml.to_yaml)
            end
        end

        def load_mapping
            file=@options[:mapping_file_path]

            @mapping = {}

            if File.exist?(file)
                @mapping = YAML.safe_load(File.read(file))
            end

            @mapping = {} unless @mapping.class == Hash
        end

        def validate_required_group(idp_groups)
            required = @options[:group_required]
            return if required.nil?

            return if idp_groups.include?(required) || idp_groups.include?("/#{required}")

            STDERR.puts('The user does not belong to the required group.')
            STDERR.puts("Groups reported by the IdP: #{idp_groups}")
            STDERR.puts("Configured required group: #{required} ( /#{required} if using Keycloak )")
            exit(-1)
        end

        def get_groups(idp_groups)
            is_admin = false
            case @options[:mapping_mode]
            # Direct mapping of SAML group names to ONE group IDs
            when 'strict'
                valid_mappings = idp_groups.map {|group| @mapping[group] }.compact
                g_admin = @options[:group_admin_name]
                is_admin = g_admin && idp_groups.include?(g_admin)
            # Keycloak-specific group syntax and group nesting support (e.g. /group1/subgroup1)
            when 'keycloak'
                valid_mappings = []
                idp_groups.each do |idp_group|
                    group_parts = idp_group.split('/')
                    # Remove empty strings from leading/trailing slashes
                    group_parts.reject!(&:empty?)

                    # Build all possible parent group paths
                    (1..group_parts.length).each do |i|
                        # Create group path with leading slash (Keycloak format)
                        group_path = '/' + group_parts[0...i].join('/')

                        is_admin = true if group_path == @options[:group_admin_name]

                        # Check direct mapping first
                        if @mapping[group_path]
                            valid_mappings << @mapping[group_path]
                        elsif i == 1
                            # Try without the leading slash for single group parts
                            # E.g. in the mapping file "/group1" should be the same as "group1"
                            group_path_no_slash = group_parts[0]
                            is_admin = true if group_path_no_slash == @options[:group_admin_name]
                            if @mapping[group_path_no_slash]
                                valid_mappings << @mapping[group_path_no_slash]
                            end
                        end
                    end
                end
                # Remove potential nil and duplicated values
                valid_mappings.compact!
                valid_mappings.uniq!
            else
                STDERR.puts("Unsupported group mapping mode: #{@options[:mapping_mode]}")
                STDERR.puts('Supported modes are "strict" and "keycloak".')
                exit(-1)
            end

            # Return the default group if no mapping is found
            valid_mappings = [@options[:mapping_default].to_s] if valid_mappings.empty?

            # Handle group admin case. Group admin can NOT be a nested group
            valid_mappings = valid_mappings.map {|id| "*#{id}" } if is_admin

            return valid_mappings.join(' ')
        end

    end

end
