# -------------------------------------------------------------------------- #
# Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                #
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

require 'securerandom'

# OneProvision Helper
class OneProvisionHelper < OpenNebulaHelper::OneHelper

    def self.rname
        'PROVISION'
    end

    def self.conf_file
        'oneprovision.yaml'
    end

    def parse_options(options)
        OneProvision::OneProvisionLogger.get_logger(options)
        OneProvision::Mode.get_run_mode(options)
        OneProvision::Options.get_run_options(options)
    end

    def format_pool
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'Identifier for the Provision', :size => 36 do |p|
                p['ID']
            end

            column :NAME, 'Name of the Provision', :left, :size => 25 do |p|
                p['NAME']
            end

            column :CLUSTERS, 'Number of Clusters', :size => 8 do |p|
                p['CLUSTERS']['ID'].size
            end

            column :HOSTS, 'Number of Hosts', :size => 5 do |p|
                p['HOSTS']['ID'].size
            end

            column :VNETS, 'Number of Networks', :size => 5 do |p|
                p['VNETS']['ID'].size
            end

            column :DATASTORES, 'Number of Datastores', :size => 10 do |p|
                p['DATASTORES']['ID'].size
            end

            column :STAT, 'Status of the Provision', :left, :size => 15 do |p|
                p['STATUS']
            end

            default :ID, :NAME, :CLUSTERS, :HOSTS, :VNETS, :DATASTORES, :STAT
        end

        table
    end

    #######################################################################
    # Helper provision functions
    #######################################################################

    def create(config)
        msg = 'OpenNebula is not running'

        OneProvision::Utils.fail(msg) if OneProvision::Utils.one_running?

        provision = OneProvision::Provision.new(SecureRandom.uuid)

        provision.create(config)
    end

    def configure(provision_id, force)
        provision = OneProvision::Provision.new(provision_id)

        provision.refresh

        provision.configure(force)
    end

    def delete(provision_id, cleanup)
        provision = OneProvision::Provision.new(provision_id)

        provision.refresh

        provision.delete(cleanup)
    end

    #######################################################################
    # Helper host functions
    #######################################################################

    def hosts_operation(args, operation, options)
        parse_options(options)

        pool   = OneProvision::Host.new.pool
        helper = OneHostHelper.new

        hosts = name_to_id(args[0], pool)

        helper.set_client(options)
        helper.perform_actions(hosts,
                               options,
                               operation[:message]) do |host|
            host = OneProvision::Host.new(host['ID'])

            case operation[:operation]
            when 'resume'
                host.resume
            when 'poweroff'
                host.poweroff
            when 'reboot'
                host.reboot((options.key? :hard))
            when 'delete'
                host.delete
            when 'configure'
                host.configure((options.key? :force))
            when 'ssh'
                host.ssh(args[1])
            end
        end
    end

    #######################################################################
    # Helper datastore functions
    #######################################################################

    def datastores_operation(args, operation, options)
        parse_options(options)

        pool   = OneProvision::Datastore.new.pool
        helper = OneDatastoreHelper.new

        datastores = name_to_id(args[0], pool)

        helper.set_client(options)
        helper.perform_actions(datastores,
                               options,
                               operation[:message]) do |datastore|
            case operation[:operation]
            when 'delete'
                msg = "Deleting datastore #{datastore['ID']}"

                OneProvision::OneProvisionLogger.info(msg)

                datastore.delete
            end
        end
    end

    #######################################################################
    # Helper vnet functions
    #######################################################################

    def vnets_operation(args, operation, options)
        parse_options(options)

        pool   = OneProvision::Vnet.new.pool
        helper = OneVNetHelper.new

        vnets = name_to_id(args[0], pool)

        helper.set_client(options)
        helper.perform_actions(vnets,
                               options,
                               operation[:message]) do |vnet|
            case operation[:operation]
            when 'delete'
                msg = "Deleting vnet #{vnet['ID']}"

                OneProvision::OneProvisionLogger.info(msg)

                vnet.delete
            end
        end
    end

    #######################################################################
    # Utils functions
    #######################################################################

    def provision_ids
        clusters = OneProvision::Cluster.new.pool
        rc = clusters.info

        if OpenNebula.is_error?(rc)
            OneProvision::Utils.fail(rc.message)
        end

        clusters = clusters.reject do |x|
            x['TEMPLATE/PROVISION/PROVISION_ID'].nil?
        end

        clusters = clusters.uniq do |x|
            x['TEMPLATE/PROVISION/PROVISION_ID']
        end

        ids = []

        clusters.each {|c| ids << c['TEMPLATE/PROVISION/PROVISION_ID'] }

        ids
    end

    def name_to_id(objects, pool)
        objects = [objects].flatten.map do |obj|
            if obj.to_s =~ /^[0-9]+$/
                obj.to_i
            else
                pool.info
                pool.select {|object| object.name == obj }.first.id
            end
        end

        objects
    end

    def get_list(columns, provision_list)
        ret = []
        ids = provision_ids

        ids.each do |i|
            provision = OneProvision::Provision.new(i)
            provision.refresh

            element = {}

            element['ID'] = i if provision_list
            element['ID'] = provision.clusters[0]['ID'] unless provision_list

            element['NAME'] = provision.name
            element['STATUS'] = provision.status

            columns.each do |c|
                element[c.to_s.upcase] = { 'ID' => [] }

                provision.instance_variable_get("@#{c}").each do |v|
                    element[c.to_s.upcase]['ID'] << v['ID']
                end
            end

            ret << element
        end

        ret
    end

    def list(options)
        columns = %w[clusters hosts vnets datastores]

        format_pool.show(get_list(columns, true), options)

        0
    end

    def show(provision_id)
        provision = OneProvision::Provision.new(provision_id)

        provision.refresh

        OneProvision::Utils.fail('Provision not found.') unless provision.exists

        ret = {}
        ret['id'] = provision_id
        ret['name'] = provision.name
        ret['status'] = provision.status

        %w[clusters datastores hosts vnets].each do |r|
            ret["@#{r}_ids"] = []

            provision.instance_variable_get("@#{r}").each do |x|
                ret["@#{r}_ids"] << (x['ID'])
            end
        end

        format_resource(ret)

        0
    end

    def format_resource(provision)
        str_h1 = '%-80s'
        status = provision['status']
        id     = provision['id']

        CLIHelper.print_header(str_h1 % "PROVISION #{id} INFORMATION")
        puts format('ID      : %<s>s', :s => id)
        puts format('NAME    : %<s>s', :s => provision['name'])
        puts format('STATUS  : %<s>s', :s => CLIHelper.color_state(status))

        puts
        CLIHelper.print_header(format('%<s>s', :s => 'CLUSTERS'))
        provision['@clusters_ids'].each do |i|
            puts format('%<s>s', :s => i)
        end

        puts
        CLIHelper.print_header(format('%<s>s', :s => 'HOSTS'))
        provision['@hosts_ids'].each do |i|
            puts format('%<s>s', :s => i)
        end

        puts
        CLIHelper.print_header(format('%<s>s', :s => 'VNETS'))
        provision['@vnets_ids'].each do |i|
            puts format('%<s>s', :s => i)
        end

        puts
        CLIHelper.print_header(format('%<s>s', :s => 'DATASTORES'))
        provision['@datastores_ids'].each do |i|
            puts format('%<s>s', :s => i)
        end
    end

end
