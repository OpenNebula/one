# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Encrypted monitor ingestion endpoints.
    module MonitorController

        # Monitor endpoints scoped to one Cluster.
        module ClusterMonitor

            extend ODS::DocumentController

            BASE_PATH = '/clusters'
            ODS_CLASS = OneKS::Cluster
            ODS_POOL  = OneKS::ClusterDocumentPool

            # POST /clusters/:id/events
            post(
                'events', :schema => EncryptedApiEventSchema, :response => false
            ) do |cluster, envelope|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                event = MonitorPayload.decode(
                    envelope[:payload],
                    cluster.monitor_key,
                    :schema => ApiEventSchema
                )
                next event if OpenNebula.is_error?(event)

                ApiEvents.dispatch(ClusterLCM.instance, cluster.id, **event)
            end

            # POST /clusters/:id/observations
            post(
                'observations', :schema => EncryptedApiEventSchema, :response => false
            ) do |cluster, envelope|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                observations = MonitorPayload.decode(
                    envelope[:payload],
                    cluster.monitor_key,
                    :schema => ObservationsSchema,
                    :root   => :observations
                )
                next observations if OpenNebula.is_error?(observations)

                cluster.replace_observations(observations)
            end

            # POST /clusters/:id/pods
            post(
                'pods', :schema => EncryptedApiEventSchema, :response => false
            ) do |cluster, envelope|
                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                pods = MonitorPayload.decode(
                    envelope[:payload],
                    cluster.monitor_key,
                    :schema => PodsSchema,
                    :root   => :pods
                )
                next pods if OpenNebula.is_error?(pods)

                cluster.replace_pods(pods)
            end

        end

        # Monitor endpoints scoped to one K8sGroup.
        module GroupMonitor

            extend ODS::DocumentController

            BASE_PATH = '/clusters/:cluster_id/nodegroups'
            ODS_CLASS = OneKS::K8sGroup
            ODS_POOL  = OneKS::K8sGroupDocumentPool

            # POST /clusters/:cluster_id/nodegroups/:id/events
            post(
                'events', :schema => EncryptedApiEventSchema, :response => false
            ) do |group, envelope|
                next OpenNebula::Error.new(
                    "NodeGroup #{params[:id]} not found in " \
                    "Cluster #{params[:cluster_id]}",
                    OpenNebula::Error::ENO_EXISTS
                ) unless group.cluster_id.to_i == params[:cluster_id].to_i

                cluster = group.parent_cluster
                next cluster if OpenNebula.is_error?(cluster)

                feature = require_feature!(cluster, :monitor)
                next feature if OpenNebula.is_error?(feature)

                event = MonitorPayload.decode(
                    envelope[:payload],
                    cluster.monitor_key,
                    :schema => ApiEventSchema
                )
                next event if OpenNebula.is_error?(event)

                ApiEvents.dispatch(GroupLCM.instance, group.id, **event)
            end

        end

        def self.registered(app)
            ClusterMonitor.register_routes(app)
            GroupMonitor.register_routes(app)
        end

    end

end
