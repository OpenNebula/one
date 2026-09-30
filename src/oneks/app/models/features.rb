# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License");            #
#--------------------------------------------------------------------------- #

module OneKS

    # Resolves and validates optional OneKS features from server configuration.
    module Features

        # Monitor feature configuration requirements.
        module Monitor

            TPROXY_PORT = 10780

            def self.configured?
                SERVER_CONF.key?(:monitor) && !SERVER_CONF[:monitor].nil?
            end

            def self.validate
                config  = SERVER_CONF[:monitor] || {}
                missing = [:endpoint, :chart_repo].select do |key|
                    config[key].to_s.strip.empty?
                end

                return OpenNebula::Error.new(
                    "Monitor configuration requires: #{missing.join(', ')}",
                    OpenNebula::Error::EACTION
                ) unless missing.empty?

                ClusterRouter.ensure_tproxy_ports!([TPROXY_PORT])
            rescue StandardError => e
                OpenNebula::Error.new(
                    "Monitor configuration is invalid: #{e.message}",
                    OpenNebula::Error::EACTION
                )
            end

        end

        REGISTRY = {
            :monitor => Monitor
        }

        DEFAULTS = REGISTRY.keys.to_h {|name| [name, false] }

        # Returns the optional features available to newly created Clusters.
        def self.enabled
            REGISTRY.to_h do |name, validator|
                validation = validator.validate if validator.configured?
                [name, validation == true]
            end
        end

        # Validates every configured feature before server components start.
        def self.validate!
            errors = REGISTRY.filter_map do |name, validator|
                next unless validator.configured?

                validation = validator.validate
                next if validation == true

                message = if OpenNebula.is_error?(validation)
                              validation.message
                          else
                              'unknown validation error'
                          end

                "#{name}: #{message}"
            end

            return true if errors.empty?

            OpenNebula::Error.new(
                "Feature configuration validation failed:\n  - #{errors.join("\n  - ")}",
                OpenNebula::Error::EACTION
            )
        end

    end

end
