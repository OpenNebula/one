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

require 'nokogiri'
require 'securerandom'

# OneProvision Helper
class OneProvisionHelper < OpenNebulaHelper::OneHelper

    RESOURCES = %w[
        CLUSTERS
        DATASTORES
        HOSTS
        NETWORKS
        IMAGES
        TEMPLATES
        VNTEMPLATES
        FLOWTEMPLATES
    ]

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
        OneProvision::ObjectOptions.get_obj_options(options)
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

            column :NETWORKS, 'Number of Networks', :size => 5 do |p|
                p['NETWORKS']['ID'].size
            end

            column :DATASTORES, 'Number of Datastores', :size => 10 do |p|
                p['DATASTORES']['ID'].size
            end

            column :STAT, 'Status of the Provision', :left, :size => 15 do |p|
                p['STATUS']
            end

            default :ID, :NAME, :CLUSTERS, :HOSTS, :NETWORKS, :DATASTORES, :STAT
        end

        table
    end

    #######################################################################
    # Helper provision functions
    #######################################################################

    def create(config, cleanup, timeout, virtual)
        msg = 'OpenNebula is not running'

        OneProvision::Utils.fail(msg) if OneProvision::Utils.one_running?

        provision = OneProvision::Provision.new(SecureRandom.uuid)

        provision.create(config, cleanup, timeout, virtual)
    end

    def configure(provision_id, force)
        provision = OneProvision::Provision.new(provision_id)

        provision.refresh

        provision.configure(force)
    end

    def delete(provision_id, cleanup, timeout)
        provision = OneProvision::Provision.new(provision_id)

        provision.refresh

        provision.delete(cleanup, timeout)
    end

    #######################################################################
    # Helper host functions
    #######################################################################

    def host_operation(host, operation, options, args)
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
            host.ssh(args)
        end
    end

    #######################################################################
    # Helper datastore functions
    #######################################################################

    def datastore_operation(datastore, operation)
        case operation[:operation]
        when 'delete'
            msg = "Deleting datastore #{datastore['ID']}"

            OneProvision::OneProvisionLogger.info(msg)

            datastore.delete
        end
    end

    #######################################################################
    # Helper network functions
    #######################################################################

    def network_operation(network, operation)
        case operation[:operation]
        when 'delete'
            msg = "Deleting network #{network['ID']}"

            OneProvision::OneProvisionLogger.info(msg)

            network.delete
        end
    end

    #######################################################################
    # Helper resource functions
    #######################################################################

    def resources_operation(args, operation, options, type)
        parse_options(options)

        helper = nil

        case type
        when 'HOST'      then helper = OneHostHelper.new
        when 'DATASTORE' then helper = OneDatastoreHelper.new
        when 'NETWORK'   then helper = OneVNetHelper.new
        end

        objects = names_to_ids(args[0], type)

        helper.set_client(options)
        helper.perform_actions(objects,
                               options,
                               operation[:message]) do |obj|
            case type
            when 'HOST'
                host_operation(obj, operation, options, args[1])
            when 'DATASTORE'
                datastore_operation(obj, operation)
            when 'NETWORK'
                network_operation(obj, operation)
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

    def names_to_ids(objects, type)
        objects = [objects].flatten.map do |obj|
            OpenNebulaHelper.rname_to_id(obj.to_s, type)[1]
        end

        objects
    end

    def get_list(provision_list)
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

            RESOURCES.each do |c|
                element[c.to_s.upcase] = { 'ID' => [] }
                obj                    = OneProvision::Resource.object(c)

                element[c.to_s.upcase]['ID'] = obj.get(i).map do |o|
                    o['ID']
                end
            end

            ret << element
        end

        ret
    end

    def list(options)
        list = get_list(true)

        if options.key? :xml
            list.map {|e| to_xml(e) }
        else
            format_pool.show(list, options)
        end

        0
    end

    def show(provision_id, xml)
        provision = OneProvision::Provision.new(provision_id)

        provision.refresh

        OneProvision::Utils.fail('Provision not found.') unless provision.exists

        ret = {}
        ret['ID']     = provision_id
        ret['NAME']   = provision.name
        ret['STATUS'] = provision.status

        RESOURCES.each do |r|
            obj = OneProvision::Resource.object(r)

            next unless obj

            ret[r] = obj.get(provision_id).map {|o| o['ID'] }
        end

        if xml
            to_xml(ret)
        else
            format_resource(ret)
        end

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

        RESOURCES.each do |r|
            puts
            CLIHelper.print_header(format('%<s>s', :s => r.upcase))
            provision[r].each do |i|
                puts format('%<s>s', :s => i)
            end
        end
    end

    private

    def to_xml(provision)
        xml = "<PROVISION>
            <ID>#{provision['ID']}</ID>
            <NAME>#{provision['NAME']}</NAME>
            <STATUS>#{provision['STATUS']}</STATUS>
            #{
                RESOURCES.map do |r|
                    provision[r] = provision[r]['ID'] if provision[r].is_a? Hash

                    ids = provision[r].map do |id|
                        "<ID>#{id}</ID>"
                    end.join("\n")

                    "<#{r.upcase}>
                    #{ids}
                    </#{r.upcase}"
                end.join("\n")
            }
        </PROVISION>"

        doc = Nokogiri.XML(xml) {|config| config.default_xml.noblanks }
        puts doc.root.to_xml(:indent => 2)
    end

end
