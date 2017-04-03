module VCenterDriver

class VIHelper

    ETC_LOCATION = "/etc/one/" if !defined?(ETC_LOCATION)
    VCENTER_DRIVER_DEFAULT = "#{ETC_LOCATION}/vcenter_driver.default"

    def self.client
        @@client ||= OpenNebula::Client.new
    end

    def self.return_if_error(rc, item, exit_if_fail)
        if OpenNebula::is_error?(rc)
            raise rc.message if !exit_if_fail

            STDERR.puts rc.message
            exit 1
        else
            item
        end
    end

    def self.one_item(the_class, id, exit_if_fail = true)
        item = the_class.new_with_id(id, client)
        rc = item.info
        return_if_error(rc, item, exit_if_fail)
    end

    def self.new_one_item(the_class)
        item = the_class.new(the_class.build_xml, client)
        return item
    end

    def self.one_pool(the_class, exit_if_fail = true)
        item = the_class.new(client)
        rc = item.info
        return_if_error(rc, item, exit_if_fail)
    end

    def self.find_by_name(the_class, name, pool = nil, raise_if_fail = true)
        pool = one_pool(the_class, raise_if_fail) if pool.nil?
        element = pool.select{|e| e['NAME'] == "#{name}" }.first rescue nil
        if element.nil? && raise_if_fail
            raise "Could not find element '#{name}' in pool '#{the_class}'"
        else
            element
        end
    end

    def self.find_by_ref(the_class, attribute, ref, vcenter_uuid, pool = nil)
        pool = one_pool(the_class, false) if pool.nil?
        element = pool.select{|e|
            e["#{attribute}"] == ref &&
            (e["TEMPLATE/VCENTER_INSTANCE_ID"] == vcenter_uuid ||
             e["USER_TEMPLATE/VCENTER_INSTANCE_ID"] == vcenter_uuid)}.first rescue nil

        return element
    end

    def self.get_default(xpath)
        begin
            xml = OpenNebula::XMLElement.new
            xml.initialize_xml(File.read(VCENTER_DRIVER_DEFAULT), 'VCENTER')
            return xml[xpath]
        rescue
            return nil
        end
    end

end # class VIHelper

end # module VCenterDriver
