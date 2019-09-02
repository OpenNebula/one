module Packet
  class Client
    module Ips
      def list_ips(project_id, *args)
        get("projects/#{project_id}/ips", *args).body['ip_addresses'].map { |p| Packet::Ip.new(p, self) }
      end

      def get_ip(id, *args)
        Packet::Ip.new(get("ips/#{id}", *args).body, self)
      end

      def create_ip(ip)
        post("projects/#{ip.project_id}/ips", ip.to_hash).tap do |response|
          ip.update_attributes(response.body)
        end
      end

      def delete_ip(ip_or_id)
        id = if ip_or_id.is_a?(Packet::Ip)
               ip_or_id.id
             else
               ip_or_id
             end
        delete("ips/#{id}")
      end

      def available_cidr(ip, cidr)
        get("ips/#{ip.id}/available", {'cidr'=>cidr}).body['available']
      end

      def assign_cidr_device(cidr, device)
        device_id = if device.is_a?(Packet::Device)
                      device.id
                    else
                      device
                    end

        data = { 'address' => cidr }
        post("devices/#{device_id}/ips", data).body['id']
      end
    end
  end
end
