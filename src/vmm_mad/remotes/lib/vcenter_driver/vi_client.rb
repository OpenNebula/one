require 'openssl'

module VCenterDriver

class VIClient
    attr_accessor :vim

    def initialize(opts)
        opts = {:insecure => true}.merge(opts)
        @vim = RbVmomi::VIM.connect(opts)
    end

    def self.get_entities(folder, type, entities=[])
        if folder == []
            return nil
        end

        folder.childEntity.each do |child|
            the_name, junk = child.to_s.split('(')
            case the_name
            when "Folder"
                get_entities(child, type, entities)
            when type
                entities.push(child)
            end
        end

        return entities
    end

    def self.new_from_host(host_id)
        client = OpenNebula::Client.new
        host = OpenNebula::Host.new_with_id(host_id, client)
        rc = host.info
        if OpenNebula.is_error?(rc)
            puts rc.message
            exit -1
        end

        password = host["TEMPLATE/VCENTER_PASSWORD"]

        system = OpenNebula::System.new(client)
        config = system.get_configuration
        if OpenNebula.is_error?(config)
            puts "Error getting oned configuration : #{config.message}"
            exit -1
        end

        token = config["ONE_KEY"]

        begin
            cipher = OpenSSL::Cipher::Cipher.new("aes-256-cbc")

            cipher.decrypt
            cipher.key = token

            password =  cipher.update(Base64::decode64(password))
            password << cipher.final
        rescue
            puts "Error decrypting vCenter password"
            exit -1
        end

        connection = {
            :host     => host["TEMPLATE/VCENTER_HOST"],
            :user     => host["TEMPLATE/VCENTER_USER"],
            :password => password
        }

        self.new(connection)
    end
end

end # module VCenterDriver
