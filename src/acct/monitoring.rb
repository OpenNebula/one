module OneWatch
    require 'watch_helper'

    class Monitoring
        def insert(hash)
            timestamp = generate_timestamp

            if (pool_hash = hash["#{resource}_POOL"]) && !pool_hash.empty?
                [pool_hash["#{resource}"]].flatten.each { |elem|
                    sql = sql_elem(elem)
                    sql.add_sample_from_resource(elem, timestamp)
                }
            end
        end

        private

        def generate_timestamp
            Time.now.to_i
        end
    end

    class VmMonitoring < Monitoring
        def resource
            'VM'
        end

        def sql_elem(elem)
            WatchHelper::Vm.info(elem)
        end
    end

    class HostMonitoring < Monitoring
        def resource
            'HOST'
        end

        def sql_elem(elem)
            WatchHelper::Host.info(elem)
        end
    end
end