module VCenterDriver

class VIHelper
    def self.client
        @@client ||= OpenNebula::Client.new
    end

    def self.return_if_error(rc, item, exit_if_fail)
        if OpenNebula::is_error?(rc)
            if exit_if_fail
                STDERR.puts rc.message
                exit 1
            else
                rc
            end
        else
            item
        end
    end

    def self.one_item(the_class, id, exit_if_fail = true)
        item = the_class.new_with_id(id, client)
        rc = item.info
        return_if_error(rc, item, exit_if_fail)
    end

    def self.one_pool(the_class, exit_if_fail = true)
        item = the_class.new(client)
        rc = item.info
        return_if_error(rc, item, exit_if_fail)
    end

    def self.find_by_name(the_class, name, exit_if_fail = true)
        pool = one_pool(the_class)
        element = pool.select{|e| e['NAME'] == name }.first rescue nil
        if element.nil?
            raise "Could not find element '#{name}' in pool '#{the_class}'"
        else
            element
        end
    end
end

end
