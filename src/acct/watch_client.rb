module OneWatchClient
    require 'acct/watch_helper'

    class WatchClient
        TOTAL_COUNT = [:total, :active, :error]

        def resource_monitoring(id, monitoring_resources=[], filter={})
            # Retrieve Sequel resource
            rsql = filter_resource(id, filter)
            return nil if rsql.nil?

            # By default show all the available monitoring resources.
            # If a set of monitoring resources is specified
            # select only the allowed ones
            allowed_keys = allowed_samples.keys
            if monitoring_resources && !monitoring_resources.empty?
                monitoring_resources = allowed_keys & monitoring_resources
            else
                monitoring_resources = allowed_keys
            end

            # Initialize monitoring information
            mon = Hash.new
            monitoring_resources.each { |mr|
                mon[mr] = Array.new
            }

            # Retrieve information
            rsql.samples_dataset.map { |sample|
                monitoring_resources.each { |mr|
                    if sample.last_poll && sample.last_poll != 0
                        mon[mr] << [sample.last_poll, sample.send(mr.to_sym)]
                    end
                }
            }

            # Format response in a Hash
            hash = Hash.new
            hash[:resource]   = kind
            hash[:id]         = rsql.id
            hash[:monitoring] = mon
            hash
        end

        def total_monitoring(monitoring_resources=[], filter={})
            # Retrieve Sequel resource
            rsql = filter_pool(filter)
            return nil if rsql.nil?

            # By default show all the available monitoring resources.
            # If a set of monitoring resources is specified
            # select only the allowed ones
            allowed_keys = allowed_samples.keys + TOTAL_COUNT
            if monitoring_resources && !monitoring_resources.empty?
                monitoring_resources = allowed_keys & monitoring_resources
            else
                monitoring_resources = allowed_keys
            end

            # Retrieve information
            mon = Hash.new
            monitoring_resources.each { |opt|
                opt = opt.to_sym
                if allowed_samples.has_key?(opt)
                    mon[opt] = sum_monitoring(rsql, opt)
                elsif TOTAL_COUNT.include?(opt)
                    mon[opt] = count_monitoring(rsql, opt)
                end
            }

            # Format response in a Hash
            hash = Hash.new
            hash[:resource] = "#{kind.upcase}_POOL"
            hash[:monitoring] = mon
            hash
        end

        private

        def sum_monitoring(rsql, mr)
            # Get the MAX for each VM and last_poll value
            max_per_vm =
                rsql.
                group(:id, :last_poll).
                select(:last_poll, :MAX[mr.to_sym].as(:max_mr))

            # SUM the monitoring resource for each last_poll value
            last_poll_and_sum =
                max_per_vm.
                from_self.
                group(:last_poll).
                select(:last_poll, :SUM[:max_mr].as(:sum_mr))

            # Retrieve the information in an Array
            a = Array.new
            last_poll_and_sum.each do |row|
                if row[:last_poll] && row[:last_poll] != 0
                    a << [row[:last_poll], row[:sum_mr].to_i]
                end
            end

            a
        end

        def count_monitoring(rsql, opt)
            resources = case opt
                when :total  then rsql
                when :active then active(rsql)
                when :error  then error(rsql)
                else return nil
            end

            a = Array.new

            resources.group_and_count(:timestamp).all.each { |row|
                a << [row[:timestamp], row[:count].to_i]
            }

            a
        end
    end

    class HostWatchClient < WatchClient
        def pool
            WatchHelper::Host
        end

        def allowed_samples
            WatchHelper::HOST_SAMPLE
        end

        def kind
            "HOST"
        end

        def active(pool)
            pool.filter('state < 3')
        end

        def error(pool)
            pool.filter(:state=>3)
        end

        def filter_pool(filter)
            if filter[:uid]
                filter[:uid]==0 ? (hosts = pool) : (return nil)
            elsif filter[:gid]
                filter[:uid]==0 ? (hosts = pool) : (return nil)
            else
                hosts = pool
            end

            hosts.join(WatchHelper::HostSample, :host_id=>:id)
        end

        def filter_resource(id, filter)
            rsql = pool[id]
            return nil if rsql.nil?

            if filter[:uid]
                filter[:uid]==0 ? rsql : nil
            elsif filter[:gid]
                filter[:gid]==0 ? rsql : nil
            else
                rsql
            end
        end
    end

    class VmWatchClient < WatchClient
        def pool
            WatchHelper::Vm
        end

        def allowed_samples
            WatchHelper::VM_SAMPLE
        end

        def kind
            "VM"
        end

        def active(pool)
            pool.filter(:state=>3)
        end

        def error(pool)
            pool.filter(:state=>7)
        end

        def filter_pool(filter)
            if filter[:uid]
                vms = pool.filter(:uid=>filter[:uid])
            elsif filter[:gid]
                vms = pool.filter(:gid=>filter[:gid])
            else
                vms = pool
            end

            vms.join(WatchHelper::VmSample, :vm_id=>:id)
        end

        def filter_resource(id, filter)
            rsql = pool[id]
            return nil if rsql.nil?

            if filter[:uid]
                filter[:uid]==rsql.uid ? rsql : nil
            elsif filter[:gid]
                filter[:gid]==rsql.gid ? rsql : nil
            else
                rsql
            end
        end
    end
end