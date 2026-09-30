# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Shared guards for Cluster-scoped optional feature endpoints.
    module FeatureHelper

        def require_feature!(cluster, feature)
            return true if cluster.feature_enabled?(feature)

            OpenNebula::Error.new(
                {
                    'message' => "Operation unavailable: Cluster #{cluster.id} " \
                                 "does not have the #{feature} feature enabled",
                    'context' => {
                        'code'       => 'FEATURE_NOT_ENABLED',
                        'feature'    => feature.to_s,
                        'cluster_id' => cluster.id.to_i
                    }
                },
                ODS::ResponseHelper::CONFLICT_EC
            )
        end

    end

end
