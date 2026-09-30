# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Chart catalogue and Cluster application endpoints.
    module ApplicationController

        # Public Application catalogue endpoints.
        module Catalogue

            extend ODS::GenericController

            BASE_PATH = '/applications'

            # GET /applications[?all=true][&cluster_id=:id]
            get :params_schema => ApplicationListParamsSchema do |args|
                cluster = nil

                if args[:cluster_id]
                    cluster = OneKS::Cluster.new_from_id(@client, args[:cluster_id])
                    next cluster if OpenNebula.is_error?(cluster)

                    feature = require_feature!(cluster, :monitor)
                    next feature if OpenNebula.is_error?(feature)
                end

                charts = args[:all] ? OneKS::Chart.all : OneKS::Chart.list
                next charts if OpenNebula.is_error?(charts)

                next charts.map(&:public_summary) unless cluster

                charts.map do |chart|
                    validations = OneKS::Applications::Validations.run(cluster, chart)
                    break validations if OpenNebula.is_error?(validations)

                    chart.public_summary.merge(validations.transform_keys(&:to_s))
                end
            end

            # GET /applications/:application_id[?cluster_id=:id]
            get ':application_id', :params_schema => ApplicationParamsSchema do |args|
                cluster = nil

                if args[:cluster_id]
                    cluster = OneKS::Cluster.new_from_id(@client, args[:cluster_id])
                    next cluster if OpenNebula.is_error?(cluster)

                    feature = require_feature!(cluster, :monitor)
                    next feature if OpenNebula.is_error?(feature)
                end

                chart = OneKS::Chart.find(args[:application_id])
                next chart if OpenNebula.is_error?(chart)

                definition = chart.public_definition
                next definition if OpenNebula.is_error?(definition)
                next definition unless cluster

                validations = OneKS::Applications::Validations.run(cluster, chart)
                next validations if OpenNebula.is_error?(validations)

                definition.merge(validations.transform_keys(&:to_s))
            end

        end

        # Application lifecycle endpoints scoped to one Cluster.
        module ClusterApplications

            extend ODS::DocumentController

            BASE_PATH = '/clusters'
            ODS_CLASS = OneKS::Cluster
            ODS_POOL  = OneKS::ClusterDocumentPool

            # GET /clusters/:id/applications[?all=true]
            attribute(
                :applications, :params_schema => ClusterApplicationsParamsSchema
            ) do |cluster, applications, args|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                applications = Array(applications)
                applications = applications.reject(&:parent) unless args.fetch(:all, false)

                applications.map do |application|
                    response = application.to_h
                    chart    = OneKS::Chart.find(application.id)
                    unless OpenNebula.is_error?(chart)
                        response[:version]  = chart['version']
                        response[:metadata] = chart.metadata
                    end
                    response
                rescue StandardError
                    response
                end
            end

            # GET /clusters/:id/applications/:release_name
            get 'applications/:release_name' do |cluster|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                application = OneKS::Application.by_release(
                    cluster.applications, params[:release_name]
                )

                next OpenNebula::Error.new(
                    "Application release #{params[:release_name]} " \
                    "not found in Cluster #{cluster.id}",
                    OpenNebula::Error::ENO_EXISTS
                ) unless application

                response = application.to_h
                dependencies = Array(cluster.applications).select do |dependency|
                    dependency.parent == application.release_name
                end
                response[:dependencies] = dependencies.map do |dependency|
                    dependency_response = dependency.to_h

                    begin
                        dependency_chart = OneKS::Chart.find(dependency.id)
                        unless OpenNebula.is_error?(dependency_chart)
                            dependency_response[:version] = dependency_chart['version']
                        end
                    rescue StandardError
                        nil
                    end

                    dependency_response
                end

                begin
                    chart = OneKS::Chart.find(application.id)
                    unless OpenNebula.is_error?(chart)
                        response[:version]  = chart['version']
                        response[:metadata] = chart.metadata
                    end
                rescue StandardError
                    nil
                end

                response
            end

            # POST /clusters/:id/applications
            post(
                'applications', :schema => InstallApplicationSchema, :status => 202,
                :response => false
            ) do |cluster, attributes|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                cluster.install_application(attributes, :actor => @username)
            end

            # DELETE /clusters/:id/applications/:release_name
            delete 'applications/:release_name', :status => 202 do |cluster|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                rc = cluster.delete_application(
                    params[:release_name], :actor => @username
                )
                next rc if OpenNebula.is_error?(rc)
            end

        end

        # Registers catalogue routes before Cluster application routes.
        def self.registered(app)
            Catalogue.register_routes(app)
            ClusterApplications.register_routes(app)
        end

    end

end
