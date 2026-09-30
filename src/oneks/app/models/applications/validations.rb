# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    module Applications

        # Installation eligibility checks shared by preflight and install.
        module Validations

            BASE_VALIDATIONS       = []
            DEPLOYMENT_CONSTRAINTS = {}

            class << self

                # Runs every validation applicable to the selected chart.
                # @return [Hash, OpenNebula::Error] Aggregated eligibility result
                def run(cluster, chart)
                    reasons = []

                    validations_for(chart).each do |validation|
                        result = public_send(validation, cluster, chart)
                        return result if OpenNebula.is_error?(result)

                        valid, validation_reasons = result
                        reasons.concat(Array(validation_reasons)) unless valid
                    end

                    return { :installable => true } if reasons.empty?

                    { :installable => false, :reasons => reasons }
                end

                private

                # Base checks plus constraints declared by the complete chart graph.
                def validations_for(chart)
                    charts      = [chart] + chart.ordered_dependencies
                    constraints = charts.flat_map(&:deployment_constraints)

                    dynamic = constraints.map do |constraint|
                        DEPLOYMENT_CONSTRAINTS.fetch(constraint)
                    end

                    (BASE_VALIDATIONS + dynamic).uniq
                end

            end

        end

    end

end
