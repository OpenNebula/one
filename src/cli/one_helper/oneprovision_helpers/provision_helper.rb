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

require 'base64'

class Provision
    attr_reader :id

    def initialize(id, name=nil)
        @id = id
        @name = name
        @clusters = []
        @hosts = []
        @datastores = []
        @networks = []
    end

    def exists()
        clusters = $provision_helper.clusters_factory_pool()
        clusters.info

        clusters.each do |c|
            return true if c['TEMPLATE/PROVISION/PROVISION_ID'] == @id
        end

        false
    end

    def refresh()
        $provision_helper.get_provision_resources(['clusters', 'datastores', 'hosts', 'networks'], self)

        @hosts = @hosts.map { |h|
            $host_helper.factory(h.id)
        }
    end

    def append_cluster(cluster)
        @clusters << cluster
    end

    def append_datastore(datastore)
        @datastores << datastore
    end

    def append_host(host)
        @hosts << host
    end

    def append_network(network)
        @networks << network
    end

    def clusters()
        @clusters
    end

    def hosts()
        @hosts
    end

    def datastores()
        @datastores
    end

    def networks()
        @networks
    end

    #TODO: rename delete_all -> cleanup
    def delete(delete_all=false)
        $common_helper.fail('Provision not found.') unless exists

        $logger.info("Deleting provision #{@id}")

        # offline and (optionally) clean all hosts
        $logger.debug("Offlining OpenNebula hosts")

        @hosts.each do |host|
            $common_helper.retry_loop 'Failed to offline host' do
                rc = host.offline
                if OpenNebula.is_error?(rc)
                    raise OneProvisionLoopException.new(rc.message)
                end

                rc = host.info
                if OpenNebula.is_error?(rc)
                    raise OneProvisionLoopException.new(rc.message)
                end
            end

            if $host_helper.running_vms?(host)
                if delete_all
                    $provision_helper.delete_vms(host)
                else
                    $common_helper.fail("Provision with running VMs can't be deleted")
                end
            end
        end

        # undeploy hosts
        $logger.info('Undeploying hosts')

        threads = []

        @hosts.each do |host|
            if $THREADS > 1
                while Thread.list.count > $THREADS
                    threads.map do |thread|
                        thread.join(5)
                    end
                end

                threads << Thread.new do
                    $host_helper.delete_host(host)
                end
            else
                $host_helper.delete_host(host)
            end
        end

        threads.map(&:join)

        # delete all other deployed objects
        $logger.info('Deleting provision objects')

        ['datastores', 'networks', 'clusters'].each do |section|
            self.send("#{section}").each do |obj|
                $common_helper.retry_loop "Failed to delete #{section.chomp('s')} #{obj['ID']}" do
                    $logger.debug("Deleting OpenNebula #{section.chomp('s')}: #{obj['ID']}")

                    if delete_all
                        case section
                        when 'datastores'
                            $provision_helper.delete_images(obj)
                        end
                    end

                    # Fix ubuntu 14.04 broken pipe
                    obj.info

                    rc = obj.delete
                    if OpenNebula.is_error?(rc)
                        raise OneProvisionLoopException.new(rc.message)
                    end
                end
            end
        end
    end

    def get_binding
        binding
    end
end


class OneProvisionProvisionHelper < OpenNebulaHelper::OneHelper

    def self.rname
        "PROVISION"
    end

    def self.conf_file
        "oneprovision_provision.yaml"
    end

    def format_pool(options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, "Identifier for the Provision", :size=>36 do |d|
                d["ID"]
            end

            column :NAME, "Name of the Provision", :left, :size=>25 do |d|
                d["NAME"]
            end

            column :CLUSTERS, "Number of Clusters", :size=>8 do |d|
                d["CLUSTERS"]
            end

            column :HOSTS, "Number of Hosts", :size=>5 do |d|
                d["HOSTS"]
            end

            column :VNETS, "Number of Networks", :size=>5 do |d|
                d["NETWORKS"]
            end

            column :DATASTORES, "Number of Datastores", :size=>10 do |d|
                d["DATASTORES"]
            end

            column :STAT, "Status of the Provision", :left, :size=>15 do |d|
                d["STATUS"]
            end

            default :ID, :NAME, :CLUSTERS, :HOSTS, :VNETS, :DATASTORES, :STAT
        end

        table
    end

    def get_provision_resources(resources_names, provision=nil)
        resources_names.each do |r|
            resources = self.send("#{r}_factory_pool")
            rc = resources.info

            if OpenNebula.is_error?(rc)
                $common_helper.fail(rc.message)
            end

            if !provision.nil?
                provision.instance_variable_set("@#{r}", resources.select{ |x|
                    x['TEMPLATE/PROVISION/PROVISION_ID'] == provision.id
                })
            else
                return resources.select{ |x|
                    !x['TEMPLATE/PROVISION/PROVISION_ID'].nil?
                }
            end

        end
    end

    def get_ids()
        clusters = clusters_factory_pool()
        rc = clusters.info

        if OpenNebula.is_error?(rc)
            $common_helper.fail(rc.message)
        end

        clusters = clusters.select{ |x| !x['TEMPLATE/PROVISION/PROVISION_ID'].nil? }
        clusters = clusters.uniq{ |x| x['TEMPLATE/PROVISION/PROVISION_ID'] }
        ids = []

        clusters.each do |c| ids << c['TEMPLATE/PROVISION/PROVISION_ID'] end

        ids
    end

    def get_list(columns, provision_list)
        ret = []
        ids = get_ids()

        ids.each do |i|
            provision = Provision.new(i)
            provision.refresh

            element = {}
            element['ID'] = provision_list ? i : provision.clusters[0]['ID']
            element['NAME'] = provision.clusters[0]['NAME']
            element['STATUS'] = get_provision_status(provision.hosts)

            columns.each do |c|
                if provision.instance_variable_get("@#{c}").nil?
                    element["#{c}".upcase] = "0"
                else
                    element["#{c}".upcase] = provision.instance_variable_get("@#{c}").size.to_s
                end
            end

            ret << element
        end

        ret
    end

    def get_provision_status(hosts)
        hosts.each do |h|
            h.info

            if h['TEMPLATE/PROVISION_CONFIGURATION_STATUS'] == 'pending'
                return 'pending'
            elsif h['TEMPLATE/PROVISION_CONFIGURATION_STATUS'] == 'error'
                return 'error'
            end
        end

        'configured'
    end

    def show(provision_id, options)
        provision = Provision.new(provision_id)
        provision.refresh

        $common_helper.fail('Provision not found.') if !provision.exists

        ret = {}
        ret['id'] = provision_id
        ret['name'] = provision.clusters[0]['NAME']
        ret['status'] = get_provision_status(provision.hosts)

        ['clusters', 'datastores', 'hosts', 'networks'].each do |r|
            ret["@#{r}_ids"] = []

            provision.instance_variable_get("@#{r}").each do |x|
                ret["@#{r}_ids"] << (x['ID'])
            end
        end

        format_resource(ret, options)
    end

    def create(config, options, provision_id=nil)
        update = !provision_id.nil?

        $common_helper.retry_loop "Failed to #{update ? "update" : "create"} provision" do
            $ansible_helper.check_ansible_version

            # read provision file
            cfg = $common_helper.create_config($common_helper.read_config(config), update)

            if cfg['version'] == 2
                if !update
                    provision = Provision.new(SecureRandom.uuid, cfg['name'])
                else
                    provision = Provision.new(provision_id, cfg['name'])
                end

                whole_provision = Provision.new(provision.id, cfg['name'])
                whole_provision.refresh
                cluster = nil

                $logger.info('Creating provision objects')

                $common_helper.retry_loop "Failed to create cluster" do
                    if !cfg['cluster'].nil?
                        $logger.debug("Creating OpenNebula cluster: #{cfg['cluster']['name']}")

                        # create new cluster
                        cluster = $cluster_helper.create_cluster(cfg['cluster'], provision.id)

                        provision.append_cluster(cluster)

                        $logger.debug("cluster created with ID: #{cluster['ID']}")
                    else
                        cluster = $cluster_helper.get_cluster(provision.id)
                    end
                end

                $CLEANUP = true

                ['datastores', 'networks'].each do |r|
                    if !cfg["#{r}"].nil?
                        cfg["#{r}"].each do |x|
                            begin
                                $common_helper.retry_loop "Failed to create #{r}: #{x['name']}" do
                                    $logger.debug("Creating OpenNebula #{r}: #{x['name']}")

                                    if r == 'datastores'
                                        provision.append_datastore($datastore_helper.create_datastore(
                                            $common_helper.evaluate_erb(whole_provision, x),
                                            cluster['ID'], provision.id, cfg['defaults']['provision']['driver']))
                                    else
                                        provision.append_network($vnet_helper.create_vnet(
                                            $common_helper.evaluate_erb(whole_provision, x),
                                            cluster['ID'], provision.id, cfg['defaults']['provision']['driver']))
                                    end

                                    whole_provision.refresh

                                    $logger.debug("#{r} created with ID: #{provision.instance_variable_get("@#{r}").last['ID']}")
                                end

                            rescue OneProvisionCleanupException
                                provision.refresh
                                provision.delete

                                exit (-1)
                            end
                        end
                    end
                end

                if cfg['hosts'].nil?
                    puts "ID: #{provision.id}"

                    exit (0)
                end
            end

            begin
                host = nil

                cfg['hosts'].each do |h|

                    if cfg['version'] == 2
                        dfile = $common_helper.create_deployment_file($common_helper.evaluate_erb(whole_provision, h), provision.id)
                        host = $host_helper.create_host(dfile.to_xml, cluster['ID'].to_i, cfg['playbook'])
                        provision.append_host(host)
                    else
                        dfile = $common_helper.create_deployment_file($common_helper.evaluate_erb(whole_provision, h), nil)
                        host = $host_helper.create_host(dfile.to_xml, 0, cfg['playbook'])
                    end

                    host.offline
                end

                hosts = []

                if provision
                    total_hosts = provision.hosts.size
                    hosts = provision.hosts
                else
                    total_hosts = 1
                    hosts << host
                end

                # ask user to be patient, mandatory for now
                STDERR.puts 'WARNING: This operation can take tens of minutes. Please be patient.'

                $logger.info('Deploying')

                deploy_ids = []
                threads = []
                processed_hosts = 0

                hosts.each do |h|
                    h.info

                    # deploy host
                    pm_mad = h['TEMPLATE/PM_MAD']

                    $logger.debug("Deploying host: #{h['ID']}")

                    processed_hosts += 1

                    deployFile = Tempfile.new("xmlDeploy#{h['ID']}")
                    deployFile.close()

                    $common_helper.write_file_log(deployFile.path, h.to_xml)

                    if $THREADS > 1
                        threads << Thread.new do
                            $common_helper.pm_driver_action(pm_mad, 'deploy', [deployFile.path, 'TODO'])
                        end

                        if (processed_hosts % $THREADS == 0) || (total_hosts == processed_hosts)
                            ids = threads.map(&:join).map(&:value)

                            ids.each do |i|
                                deploy_ids << i
                            end

                            deployFile.unlink
                            threads.clear
                        end
                    else
                        deploy_ids << $common_helper.pm_driver_action(pm_mad, 'deploy', [deployFile.path, 'TODO'])
                    end
                end

                if deploy_ids.nil? || deploy_ids.empty?
                    $common_helper.fail('Deployment failed, no ID got from driver')
                end

                $logger.info("Monitoring hosts")

                hosts.each do |h|
                    h.add_element('//TEMPLATE/PROVISION', {'DEPLOY_ID' => deploy_ids.shift.strip})
                    h.update(h.template_str)
                    name = $host_helper.poll(h)
                    h.rename(name)
                    h.info
                    h
                end

                whole_provision.refresh if cfg['version'] == 2

                if options.has_key? :incremental
                    $host_helper.configure_host(provision.hosts, options)
                else
                    if whole_provision
                        $host_helper.configure_host(whole_provision.hosts, options)
                    else
                        $host_helper.configure_host(hosts, options)
                    end
                end

                puts "ID: #{provision.id}" if !update && cfg['version'] == 2

                puts "ID: #{ host['ID']}" if cfg['version'] == 1
            rescue OneProvisionCleanupException
                if cfg['version'] == 2
                    provision.delete
                else
                    $host_helper.delete_host(host)
                end

                exit(-1)
            end
        end
    end

    def configure(provision_id, options)
        provision = Provision.new(provision_id)

        provision.refresh

        $common_helper.fail('Provision not found.') if !provision.exists

        $host_helper.configure_host(provision.hosts, options)
    end

    def update(provision_id, config, options)
        $logger.info("Updating provision #{provision_id}")

        provision = Provision.new(provision_id)

        $common_helper.fail('Provision not found.') if !provision.exists

        create(config, options, provision_id)
    end

    #TODO: doesn't drop PENDING VMs, blocks delete of images
    def delete_vms(host, wait=true)
        vm_ids = host.retrieve_elements('VMS/ID')

        if vm_ids
            vm_ids.each do |vm_id|
                $common_helper.retry_loop "Failed to delete OpenNebula VM #{vm_id}" do
                    $logger.debug("Deleting OpenNebula VM #{vm_id}")

                    vm = OpenNebula::VirtualMachine.new_with_id(vm_id, OpenNebula::Client.new())

                    rc = vm.info
                    if OpenNebula.is_error?(rc)
                        raise OneProvisionLoopException.new(rc.message)
                    end

                    rc = vm.delete
                    if OpenNebula.is_error?(rc)
                        raise OneProvisionLoopException.new(rc.message)
                    end
                end
            end

            if wait
                sleep 5

                # refresh host information
                rc = host.info
                if OpenNebula.is_error?(rc)
                    raise OneProvisionLoopException.new(rc.message)
                end

                #TODO: causes infinite loop
                if $host_helper.running_vms?(host)
                    $logger.debug("Still found running VMs on host #{host['ID']}, retrying...")
                    delete_vms(host, wait)
                end
            end
        end
    end

    def delete_images(datastore, wait=true)
        image_ids = datastore.retrieve_elements('IMAGES/ID')

        if image_ids
            image_ids.each do |image_id|
                $common_helper.retry_loop "Failed to delete image #{image_id}" do
                    $logger.debug("Deleting OpenNebula image #{image_id}")

                    image = OpenNebula::Image.new_with_id(image_id, OpenNebula::Client.new())

                    rc = image.info
                    if OpenNebula.is_error?(rc)
                        raise OneProvisionLoopException.new(rc.message)
                    end

                    rc = image.delete
                    if OpenNebula.is_error?(rc)
                        raise OneProvisionLoopException.new(rc.message)
                    end
                end
            end

            if wait
                sleep 5

                # refresh datastore information
                rc = datastore.info
                if OpenNebula.is_error?(rc)
                    raise OneProvisionLoopException.new(rc.message)
                end

                #TODO: causes infinite loop
                if datastore.retrieve_elements('IMAGES/ID')
                    $logger.debug("Still found images in datastore #{datastore['ID']}, retrying...")
                    delete_images(datastore, wait)
                end
            end
        end
    end

    def clusters_factory_pool(user_flag=-2)
        OpenNebula::ClusterPool.new(@client)
    end

    def hosts_factory_pool(user_flag=-2)
        OpenNebula::HostPool.new(@client)
    end

    def networks_factory_pool(user_flag=-2)
        OpenNebula::VirtualNetworkPool.new(@client)
    end

    def datastores_factory_pool(user_flag=-2)
        OpenNebula::DatastorePool.new(@client)
    end

    def format_resource(provision, options = {})
        str="%-18s: %-20s"
        str_h1="%-80s"

        CLIHelper.print_header(str_h1 % "PROVISION #{provision['ID']} INFORMATION")
        puts str % ["ID",   provision['id'].to_s]
        puts str % ["NAME", provision['name']]
        puts str % ["STATUS", CLIHelper.color_state(provision['status'])]
        puts

        CLIHelper.print_header("%-15s" % ["CLUSTERS"])
        provision['@clusters_ids'].each do |id|
            puts "%-15s" % [id]
        end

        puts
        CLIHelper.print_header("%-15s" % ["HOSTS"])
        provision['@hosts_ids'].each do |id|
            puts "%-15s" % [id]
        end

        puts
        CLIHelper.print_header("%-15s" % ["VNETS"])
        provision['@networks_ids'].each do |id|
            puts "%-15s" % [id]
        end

        puts
        CLIHelper.print_header("%-15s" % ["DATASTORES"])
        provision['@datastores_ids'].each do |id|
            puts "%-15s" % [id]
        end
    end
end
