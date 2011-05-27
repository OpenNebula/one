ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION = ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

require 'OpenNebula'
require 'OneMonitorUtils'
include OpenNebula

class OneMonitor

    OUTPUT_METHOD="CSV"
    case OUTPUT_METHOD
    when "CSV" then include OneMonitorCSV
    end

    def initialize(log_file_prefix,monitoring_elems)
        # Authenticate in OpenNebula
        @client = Client.new
        @log_file_prefix = log_file_prefix
        @monitoring_elems = monitoring_elems
        @results = []
        reinit_global_results
    end

    def results
        @results
    end

    def snapshot(poolClass)
        #init global results

        rc = monitor #calling the extending class method
        rc = save if rc
        if rc
            @results = []
            reinit_global_results
            puts "New monitoring snapshots saved."
        else
            puts "Error saving new snapshot."
        end
        return rc
    end

    def monitor(poolClass)
        pool = poolClass.new(@client)
        rc = pool.info

        if OpenNebula.is_error?(rc)
        then
            puts "Error monitoring: #{rc}"
            return nil
        end

        pool.each do | elem |
            hash = {}
            @monitoring_elems.each do | key,value |
                hash[key] = elem[value]
            end
            @results << hash
            add_to_global(hash)
            @n_active += 1 if active(hash)
            @n_error += 1 if error(hash)
            @n_total += 1
        end

    end

    def reinit_global_results
        @global_results = {}
        @monitoring_elems.each do | key,value |
            @global_results[key] = 0
        end
        @n_active = @n_error = @n_total = 0
    end

    def add_to_global(hash)
        hash.each do | key,value |
            @global_results[key] += value.to_i
        end
        @global_results[:time] = hash[:time].to_i
    end

end
