# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

require 'ods_helper'
require 'one_helper/oneks_helper'
require 'cloud/CloudClient'

# OneKS Application catalogue and installation helper.
class OneKSApplicationHelper < ODSHelper

    include OneKSHelper

    ONEKS_ENDPOINT    = 'http://localhost:10780'
    DEFINITION_FIELDS = [
        :id, :repo, :chart, :version, :user_inputs, :dependencies,
        :installDefaults, :defaultValuesContent, :authSecret
    ]

    def self.conf_file
        'ks_cluster.yaml'
    end

    def self.client_class
        OneKS::Client
    end

    def self.template_tag
        :APPLICATION
    end

    # Lists public catalogue Applications.
    def list(client, options = {})
        query = {}
        query[:all] = true if options[:all]
        response = client.list_applications(query)

        render_response(response, options) do |applications|
            table = format_pool
            table.show(applications, options)
            table.describe_columns if options[:describe]
        end
    end

    # Shows one complete catalogue definition.
    def show(client, application_id, options = {})
        response = client.get_application(application_id)

        render_response(response, options) {|application| format_application(application) }
    end

    # Resolves an Application, collects missing public inputs and starts install.
    def install(client, identifier, cluster_id, body = nil, options = {})
        application = resolve_application(client, identifier, :cluster_id => cluster_id)
        return [-1, application[1]] if is_error?(application)

        print_install_context(application, cluster_id)

        unless application[:installable]
            reasons = Array(application[:reasons])
            message = ['Application cannot be installed:']
            message.concat(reasons.map {|reason| "- #{reason}" })

            return [-1, message.join("\n")]
        end

        body = (body || {}).dup
        defaults = application[:installDefaults] || {}

        release_name = body[:release_name] || options[:release_name] || defaults[:releaseName]
        target_namespace =
            body[:target_namespace] || options[:target_namespace] || defaults[:targetNamespace]

        release_name     ||= ask_required_value('Release name')
        target_namespace ||= ask_required_value('Target namespace')

        create_namespace =
            if body.key?(:create_namespace)
                body[:create_namespace]
            elsif options[:create_namespace]
                true
            else
                defaults.fetch(:createNamespace, true)
            end

        unless body.key?(:user_input_values)
            puts
            body[:user_input_values] = get_user_values(application[:user_inputs]) || {}
        end

        request = {
            :application_id   => application[:id],
            :release_name     => release_name,
            :target_namespace => target_namespace,
            :create_namespace => create_namespace,
            :user_input_values => body[:user_input_values] || {}
        }

        response = client.install_application(cluster_id, request)
        return [-1, response[:message]] if CloudClient.is_error?(response)

        0
    end

    # Starts deletion of a root Application release from one Cluster.
    def delete(client, cluster_id, release_name)
        response = client.delete_application(cluster_id, release_name)
        return [-1, response[:message]] if CloudClient.is_error?(response)

        0
    end

    private

    # Resolves the canonical ID from the public catalogue, also accepting an
    # exact Application name for CLI convenience.
    def resolve_application(client, identifier, query = {})
        catalogue = client.list_applications
        return [catalogue[:err_code], catalogue[:message]] if CloudClient.is_error?(catalogue)

        identifier = identifier.to_s
        id_match = Array(catalogue).find {|application| application[:id].to_s == identifier }
        matches  = Array(catalogue).select {|application| application[:name].to_s == identifier }

        if id_match
            application_id = id_match[:id]
        elsif matches.empty?
            return [-1, "Application '#{identifier}' not found"]
        elsif matches.size > 1
            return [-1, "Application name '#{identifier}' is ambiguous; use its ID"]
        else
            application_id = matches.first[:id]
        end

        application = client.get_application(application_id, query)
        return [application[:err_code], application[:message]] \
            if CloudClient.is_error?(application)

        application
    end

    def format_pool
        CLIHelper::ShowTable.new(nil, self) do
            column :ID, '', :left, :size => 38 do |application|
                application[:id]
            end

            column :NAME, '', :left, :expand => true do |application|
                application[:name]
            end

            column :VERSION, '', :left, :size => 12 do |application|
                application[:version]
            end

            default :ID, :NAME, :VERSION
        end
    end

    def format_application(application)
        str    = '%-20s: %s'
        str_h1 = '%-80s'
        name   = application[:name] || '--'

        CLIHelper.print_header(str_h1 % "ONEKS #{name.upcase} APPLICATION")
        puts Kernel.format(str, 'ID', application[:id] || '--')

        metadata = application.reject do |key, _value|
            DEFINITION_FIELDS.include?(key) || key == :about
        end
        metadata = { :name => name }.merge(metadata.reject {|key, _value| key == :name })
        metadata.each do |key, value|
            puts Kernel.format(str, metadata_label(key), display_value(value))
        end

        puts Kernel.format(str, 'CHART', application[:chart] || '--')
        puts Kernel.format(str, 'REPOSITORY', application[:repo]) if application[:repo]
        puts Kernel.format(str, 'VERSION', application[:version] || '--')

        format_user_inputs(application[:user_inputs])
        format_dependencies(application[:dependencies])
        format_install_defaults(application[:installDefaults])
        format_about(application[:about])
        0
    end

    def format_user_inputs(inputs)
        inputs = Array(inputs)
        return if inputs.empty?

        puts
        CLIHelper.print_header('USER INPUTS', false)
        value_formatter = method(:display_value)
        CLIHelper::ShowTable.new(nil, self) do
            column :NAME, '', :left, :size => 30 do |input|
                input[:name]
            end
            column :TYPE, '', :left, :size => 10 do |input|
                input[:type]
            end
            column :MANDATORY, '', :left, :size => 9 do |input|
                input[:mandatory] ? 'YES' : 'NO'
            end
            column :DEFAULT, '', :left, :size => 15 do |input|
                if input[:sensitive] && input.key?(:default)
                    '<hidden>'
                elsif input.key?(:default)
                    value_formatter.call(input[:default])
                else
                    '--'
                end
            end
            default :NAME, :TYPE, :MANDATORY, :DEFAULT
        end.show(inputs, {})
    end

    def format_dependencies(dependencies)
        dependencies = Array(dependencies)
        return if dependencies.empty?

        puts
        CLIHelper.print_header('DEPENDENCIES', false)
        CLIHelper::ShowTable.new(nil, self) do
            column(:ID, '', :left, :size => 38) {|dependency| dependency[:id] }
            column(:NAME, '', :left, :size => 50) {|dependency| dependency[:name] }
            column(:VERSION, '', :left, :size => 12) {|dependency| dependency[:version] }
            default :ID, :NAME, :VERSION
        end.show(dependencies, {})
    end

    def format_install_defaults(defaults)
        return if defaults.nil? || defaults.empty?

        puts
        CLIHelper.print_header('INSTALL DEFAULTS', false)
        defaults.each do |key, value|
            puts Kernel.format(
                '%<label>-20s: %<value>s',
                :label => metadata_label(key), :value => display_value(value)
            )
        end
    end

    def print_install_context(application, cluster_id)
        puts "Application: #{application[:name]}"
        puts "Version:     #{application[:version]}"
        puts "Cluster:     #{cluster_id}"
        puts
    end

end
