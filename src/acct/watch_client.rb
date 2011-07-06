module OneWatchClient
    require 'watch_helper'
    require 'json'

    class WatchClient
        def vm_monitoring(id, opts=[])
            if resource = WatchHelper::Vm[id]
                monitoring(resource, "VM", WatchHelper::VM_SAMPLE, opts)
            else
                return nil
            end
        end

        def host_monitoring(id, opts=[])
            if resource = WatchHelper::Host[id]
                monitoring(resource, "HOST", WatchHelper::HOST_SAMPLE, opts)
            else
                return nil
            end
        end

        private

        def monitoring(rsql, kind, allowed_sample, monitoring_resources)
            hash = Hash.new
            hash[:resource] = kind
            hash[:id] = rsql.id

            mon = Hash.new
            monitoring_resources.each { |mr|
                if allowed_sample.has_key?(mr.to_sym)
                    mon[mr] = Array.new
                else
                    opts.remove(opt)
                end
            }

            rsql.samples_dataset.map { |sample|
                monitoring_resources.each { |mr|
                    mon[mr] << [sample.last_poll, sample.send(mr.to_sym)]
                }
            }

            hash[:monitoring] = mon

            puts JSON.pretty_generate hash
        end
    end
end