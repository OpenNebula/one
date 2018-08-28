# -------------------------------------------------------------------------- #
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

module VCenterDriver
class Importer

def self.import_clusters(con_ops, options)
    begin
        STDOUT.print "\nConnecting to vCenter: #{options[:vcenter]}..."

        use_defaults = options.key?(:defaults)

        vi_client = VCenterDriver::VIClient.new(con_ops)

        STDOUT.print "done!\n\n"

        STDOUT.print "Exploring vCenter resources..."

        dc_folder = VCenterDriver::DatacenterFolder.new(vi_client)

        vcenter_instance_name = vi_client.vim.host

        # OpenNebula's ClusterPool
        cpool = VCenterDriver::VIHelper.one_pool(OpenNebula::ClusterPool, false)
        if cpool.respond_to?(:message)
            raise "Could not get OpenNebula ClusterPool: #{cpool.message}"
        end

        cluster_list = {}
        cpool.each do |c|
            cluster_list[c["ID"]] = c["NAME"] if c["ID"].to_i != 0
        end

        # Get OpenNebula's host pool
        hpool = VCenterDriver::VIHelper.one_pool(OpenNebula::HostPool, false)
        if hpool.respond_to?(:message)
            raise "Could not get OpenNebula HostPool: #{hpool.message}"
        end

        rs = dc_folder.get_unimported_hosts(hpool,vcenter_instance_name)

        STDOUT.print "done!\n\n"

        rs.each {|dc, clusters|

            if !use_defaults
                STDOUT.print "Do you want to process datacenter #{dc} (y/[n])? "
                next if STDIN.gets.strip.downcase != 'y'
            end

            if clusters.empty?
                STDOUT.puts "\n    No new clusters found in #{dc}..."
                next
            end

            clusters.each{ |cluster|
                one_cluster_id = nil
                rpool = nil
                if !use_defaults
                    STDOUT.print "\n  * vCenter cluster found:\n"\
                                 "      - Name       : \e[92m#{cluster[:simple_name]}\e[39m\n"\
                                 "      - Location   : #{cluster[:cluster_location]}\n"\
                                 "    Import cluster (y/[n])? "
                    next if STDIN.gets.strip.downcase != 'y'

                    if cluster_list.size > 0
                        STDOUT.print "\n    In which OpenNebula cluster do you want the vCenter cluster to be included?\n "

                        cluster_list_str = "\n"
                        cluster_list.each do |key, value|
                            cluster_list_str << "      - \e[94mID: " << key << "\e[39m - NAME: " << value << "\n"
                        end

                        STDOUT.print "\n    #{cluster_list_str}"
                        STDOUT.print "\n    Specify the ID of the cluster or press Enter if you want OpenNebula to create a new cluster for you: "

                        answer = STDIN.gets.strip
                        if !answer.empty?
                            one_cluster_id = answer
                        end
                    end

                    if !one_cluster_id
                        one_cluster = VCenterDriver::VIHelper.new_one_item(OpenNebula::Cluster)
                        rc = one_cluster.allocate("#{cluster[:cluster_name]}")
                        if ::OpenNebula.is_error?(rc)
                            STDOUT.puts "    Error creating OpenNebula cluster: #{rc.message}\n"
                            next
                        end
                        one_cluster_id = one_cluster.id
                    end
                else
                    # Defaults, add host to new cluster
                    one_cluster = VCenterDriver::VIHelper.new_one_item(OpenNebula::Cluster)
                    rc = one_cluster.allocate("#{cluster[:cluster_name]}")
                    if ::OpenNebula.is_error?(rc)
                        STDOUT.puts "    Error creating OpenNebula cluster: #{rc.message}\n"
                        next
                    end
                    one_cluster_id = one_cluster.id
                end



                # Generate the template and create the host in the pool
                one_host = VCenterDriver::ClusterComputeResource.to_one(cluster,
                                                                        con_ops,
                                                                        rpool,
                                                                        one_cluster_id)

                STDOUT.puts "\n    OpenNebula host \e[92m#{cluster[:cluster_name]}\e[39m with"\
                            " ID \e[94m#{one_host.id}\e[39m successfully created."
                STDOUT.puts
            }
        }
    rescue Interrupt => e
        puts "\n"
        exit 0 #Ctrl+C
    rescue Exception => e
        STDOUT.puts "    Error: #{e.message}/\n#{e.backtrace}"
    ensure
        vi_client.close_connection if vi_client
    end

end

end # Importer

end # module VCenterDriver
