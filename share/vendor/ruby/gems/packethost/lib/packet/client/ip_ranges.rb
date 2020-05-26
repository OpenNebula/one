module Packet
    class Client
        module IpRanges

            def allocate_ip_range(range)
                post("/projects/#{range.project_id}/ips", range.to_hash).tap do |response|
                    range.update_attributes(response.body)
                end
            end

            def release_ip_range(range)
                delete("/ips/#{range.id}")
            end

            def assign_ip_old(device, range)
                data = {"address" => get_ips(range)}

                post("/devices/#{device.id}/ips", data).tap do |response|
                    puts response.body['id']
                end
            end

            def unassign_ip_old(range)
                delete("/ips/#{range.id}")
            end

            def get_ips(range, address = nil)
                if address.nil?
                    cidr = get_cidr(range.quantity)
                    ips = get("/ips/#{range.id}/available?cidr=#{cidr}").body['available']

                    if ips.size > 0
                        ips.sample
                    else
                        exit (-1)
                    end
                else
                    ips = get("/ips/#{range.id}/available?cidr=32").body['available']

                    if ips.include? address
                        exit (0)
                    else
                        exit(-1)
                    end
                end
            end

            private

            def get_cidr(quantity)
                32 - Math.log(quantity, 2).to_i
            end
        end
    end
end
