# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

require 'one_helper'
require 'opennebula/marketplaceapp_ext'
require 'opennebula/template_ext'
require 'opennebula/virtual_machine_ext'
require 'opennebula/flow/service_template_ext'

require 'securerandom'

# OneMarketApp Command Helper
class OneMarketPlaceAppHelper < OpenNebulaHelper::OneHelper

    TEMPLATE_OPTIONS=[
        {
            :name        => 'name',
            :large       => '--name name',
            :format      => String,
            :description => 'Name of the new MarketPlaceApp'
        },
        {
            :name        => 'description',
            :large       => '--description description',
            :format      => String,
            :description => 'Description for the new MarketPlaceApp'
        },
        {
            :name         => 'image',
            :large        => '--image id|name',
            :description  => 'Selects the image',
            :format       => String,
            :template_key => 'origin_id',
            :proc         => lambda {|o, _options|
                OpenNebulaHelper.rname_to_id(o, 'IMAGE')
            }
        },
        OpenNebulaHelper::DRY
    ]

    VMNAME = {
        :name   => 'vmname',
        :large  => '--vmname name',
        :description => 'Selects the name for the new VM Template, ' \
                        'if the App contains one',
        :format => String
    }

    # Available market place mads to import apps on them
    MARKETS = ['http', 's3']

    def self.rname
        'MARKETPLACEAPP'
    end

    def self.conf_file
        'onemarketapp.yaml'
    end

    def self.state_to_str(id)
        id = id.to_i
        state_str = MarketPlaceApp::MARKETPLACEAPP_STATES[id]
        MarketPlaceApp::SHORT_MARKETPLACEAPP_STATES[state_str]
    end

    def format_pool(_options)
        CLIHelper::ShowTable.new(self.class.table_conf, self) do
            column :ID,
                   'ONE identifier for the marketplace app',
                   :size=>4 do |d|
                d['ID']
            end

            column :NAME, 'Name of the marketplace app', :left, :size=>25 do |d|
                d['NAME']
            end

            column :VERSION, 'Version of the app', :size=>10 do |d|
                d['VERSION']
            end

            column :SIZE, 'App size', :size =>5 do |d|
                OpenNebulaHelper.unit_to_str(d['SIZE'].to_i, {}, 'M')
            end

            column :STAT, 'State of the app', :size=>4 do |d|
                OneMarketPlaceAppHelper.state_to_str(d['STATE'])
            end

            column :REGTIME, 'Registration time of the app', :size=>8 do |d|
                Time.at(d['REGTIME'].to_i).strftime('%D')
            end

            column :TYPE, 'Marketplace app type', :size=>4 do |d|
                type = MarketPlaceApp::MARKETPLACEAPP_TYPES[d['TYPE'].to_i]
                MarketPlaceApp::SHORT_MARKETPLACEAPP_TYPES[type]
            end

            column :MARKET, 'Name of the MarketPlace', :left, :size=>20 do |d|
                d['MARKETPLACE']
            end

            column :ZONE, 'Zone ID', :size=>4 do |d|
                d['ZONE_ID']
            end

            default :ID,
                    :NAME,
                    :VERSION,
                    :SIZE,
                    :STAT,
                    :TYPE,
                    :REGTIME,
                    :MARKET,
                    :ZONE
        end
    end

    def self.create_template_options_used?(options, conflicting_opts)
        # Get the template options names as symbols. options hash
        # uses symbols
        template_options=self::TEMPLATE_OPTIONS.map do |o|
            o[:name].to_sym
        end

        # Check if at least one of the template options is in options hash
        conflicting_opts.replace(options.keys & template_options)

        !conflicting_opts.empty?
    end

    # Import object into marketplace
    #
    # @param object  [String] Object ID or name
    # @param o_class [Class]  Object class
    def import(object, o_class)
        id = get_obj_id(object, o_class)

        if OpenNebula.is_error?(id)
            STDERR.puts id.message
            exit(-1)
        end

        rc = yield(id) if block_given?

        if OpenNebula.is_error?(rc)
            STDERR.puts rc.message
            exit(-1)
        elsif rc[0] == -1
            STDERR.puts rc[1]
            exit(-1)
        end

        0
    end

    # Import service template into marketplace
    #
    # @param id      [Integer] Service Template ID
    # @param options [Hash]    User CLI options
    #
    # @return [Error code, error message] 0 if everything was correct
    #                                     1 otherwhise
    def import_service_template(id, options)
        require 'json'

        pool = private_markets

        return pool if OpenNebula.is_error?(pool)

        s_template = ServiceTemplate.new_with_id(id, @client)
        rc         = s_template.info

        return rc if OpenNebula.is_error?(rc)

        body = JSON.parse(s_template.to_json)['DOCUMENT']['TEMPLATE']['BODY']
        import_all = options[:yes] || options[:no]

        while import_all != 'no' && import_all != 'yes'
            print 'Do you want to import images too? (yes/no, default=yes): '
            import_all = STDIN.readline.chop.downcase

            if import_all.empty?
                puts 'yes'
                import_all = 'yes'
            end
        end

        # Turn import all into a boolean
        import_all == 'yes' ? import_all = true : import_all = false

        main_market = options[:market]

        # Read marketplace where import the service template
        # It can only be a private marketplace
        unless main_market
            puts
            puts 'Available Marketplaces (please enter ID)'
            pool.each {|market| puts "- #{market['ID']}: #{market['NAME']}" }
            puts
        end

        default_mp = pool.first['ID'].to_i

        # Keep asking while user selects an incorrect marketplace
        until OneMarketPlaceAppHelper.market_exist?(pool, main_market)
            print 'Where do you want to import the Service template? ' \
                  "(default=#{default_mp})"
            main_market = STDIN.readline.chop

            if main_market.empty?
                puts default_mp
                main_market = default_mp
            else
                main_market = main_market.to_i
            end
        end

        markets = import_service_template_roles(import_all,
                                                body,
                                                pool,
                                                options[:market])
        ids = []

        # Create roles apps
        if import_all
            rc  = create_apps(markets, import_all)
            ids = rc[1]

            return [-1, rc[0]] unless rc[0].empty?
        end

        # Create service template app
        s_template.extend(ServiceTemplateExt)

        rc = s_template.mp_import(markets, main_market, options[:vmname])

        if rc[0] == -1
            rc
        else
            ids.each {|i| puts "ID: #{i}" }
            puts "ID: #{rc[1]}"
            [0, nil]
        end
    end

    # Import VM Template into marketplace
    #
    # @param id      [Integer] VM Template ID
    # @param options [Hash]    User CLI options
    #
    # @return [Error code, error message] 0 if everything was correct
    #                                     1 otherwhise
    def import_vm_template(id, options)
        pool = private_markets

        return pool if OpenNebula.is_error?(pool)

        template = Template.new_with_id(id, @client)
        rc       = template.info

        return rc if OpenNebula.is_error?(rc)

        import_all = options[:yes] || options[:no]

        while import_all != 'no' && import_all != 'yes'
            print 'Do you want to import images too? (yes/no, default=yes): '
            import_all = STDIN.readline.chop.downcase

            if import_all.empty?
                puts 'yes'
                import_all = 'yes'
            end
        end

        # Turn import all into a boolean
        import_all == 'yes' ? import_all = true : import_all = false

        main_market = options[:market]

        # Read marketplace where import the VM template
        # It can only be a private marketplace
        unless main_market
            puts
            puts 'Available Marketplaces (please enter ID)'
            pool.each {|market| puts "- #{market['ID']}: #{market['NAME']}" }
            puts
        end

        default_mp = pool.first['ID'].to_i

        # Keep asking while user selects an incorrect marketplace
        until OneMarketPlaceAppHelper.market_exist?(pool, main_market)
            print 'Where do you want to import the VM template? ' \
                  "(default=#{default_mp})"
            main_market = STDIN.readline.chop

            if main_market.empty?
                puts default_mp
                main_market = default_mp
            else
                main_market = main_market.to_i
            end
        end

        # Templates import information
        #
        # template_id => :market   => marketplace ID to import it
        #                :template => ONE Template information
        #                :name     => generated name for the template
        markets                            = {}
        markets[template['ID']]            = {}
        markets[template['ID']][:market]   = main_market
        markets[template['ID']][:template] = template

        rc = create_apps(markets, import_all, options[:vmname])

        if rc[0] == -1
            rc
        else
            rc[1].each {|i| puts "ID: #{i}" }
            [0, nil]
        end
    end

    # Save VM as template to be able to import it
    #
    # @param id [Integer] VM ID
    #
    # @return [Integer] New template ID
    def save_as_template(id)
        vm = VirtualMachine.new_with_id(id, @client)
        rc = vm.info

        return rc if OpenNebula.is_error?(rc)

        vm.extend(VirtualMachineExt)

        vm.save_as_template("#{vm['NAME']}-saved", 'App to import')
    end

    # Get object ID from name
    #
    # @param id  [String]            ID or NAME
    # @param obj [OpenNebula::Class] OpenNebula pool class
    #
    # @return [Integer] Object ID
    def get_obj_id(id, obj)
        if (id.is_a? Integer) || id.match(/^\d+$/)
            id.to_i
        else
            pool = obj.new(@client)
            rc   = pool.info_all

            return rc if OpenNebula.is_error?(rc)

            rc = pool.find {|v| v['NAME'] == id }

            return Error.new("Object `#{id}` not found") unless rc

            rc['ID'].to_i
        end
    end

    private

    def factory(id = nil)
        if id
            OpenNebula::MarketPlaceApp.new_with_id(id, @client)
        else
            xml=OpenNebula::MarketPlaceApp.build_xml
            OpenNebula::MarketPlaceApp.new(xml, @client)
        end
    end

    def factory_pool(user_flag = -2)
        OpenNebula::MarketPlaceAppPool.new(@client, user_flag)
    end

    def format_resource(app, _options = {})
        str='%-15s: %-20s'
        str_h1='%-80s'

        CLIHelper.print_header(
            str_h1 % "MARKETPLACE APP #{app['ID']} INFORMATION"
        )
        puts format(str, 'ID', app.id.to_s)
        puts format(str, 'NAME', app.name)
        puts format(str, 'TYPE', app.type_str)
        puts format(str, 'USER', app['UNAME'])
        puts format(str, 'GROUP', app['GNAME'])
        puts format(str, 'MARKETPLACE', app['MARKETPLACE'])
        puts format(str,
                    'STATE',
                    OneMarketPlaceAppHelper.state_to_str(app['STATE']))
        puts format(str,
                    'LOCK',
                    OpenNebulaHelper.level_lock_to_str(app['LOCK/LOCKED']))

        puts

        CLIHelper.print_header(str_h1 % 'PERMISSIONS', false)

        ['OWNER', 'GROUP', 'OTHER'].each do |e|
            mask = '---'
            mask[0] = 'u' if app["PERMISSIONS/#{e}_U"] == '1'
            mask[1] = 'm' if app["PERMISSIONS/#{e}_M"] == '1'
            mask[2] = 'a' if app["PERMISSIONS/#{e}_A"] == '1'

            puts format(str, e, mask)
        end
        puts

        CLIHelper.print_header(str_h1 % 'DETAILS', false)

        puts format(str, 'SOURCE', app['SOURCE'])
        puts format(str, 'MD5', app['MD5'])
        puts format(str, 'PUBLISHER', app['PUBLISHER'])
        puts format(str,
                    'REGISTER TIME',
                    Time.at(app['REGTIME'].to_i).strftime('%c'))
        puts format(str, 'VERSION', app['VERSION'])
        puts format(str, 'DESCRIPTION', app['DESCRIPTION'])
        puts format(str,
                    'SIZE',
                    OpenNebulaHelper.unit_to_str(app['SIZE'].to_i, {}, 'M'))
        puts format(str, 'ORIGIN_ID', app['ORIGIN_ID'])
        puts format(str, 'FORMAT', app['FORMAT'])

        puts

        CLIHelper.print_header(str_h1 % 'IMPORT TEMPLATE', false)

        puts Base64.decode64(app['APPTEMPLATE64'])

        puts

        CLIHelper.print_header(str_h1 % 'MARKETPLACE APP TEMPLATE', false)
        puts app.template_str

        puts
    end

    class << self

        def create_variables(options, name)
            names = [name].flatten
            t     = ''

            names.each do |n|
                next unless options[n]

                t << "#{n.to_s.upcase}=\"#{options[n]}\"\n"
            end

            t
        end

        def create_datastore_template(options)
            template_options = TEMPLATE_OPTIONS.map do |o|
                o[:name].to_sym
            end

            template = create_variables(options,
                                        template_options-[:dry, :image])

            template << "ORIGIN_ID=#{options[:image]}\n" if options[:image]
            template << "TYPE=image\n"

            [0, template]
        end

        # Check if marketplace exists
        #
        # @param pool   [MarketPlacePool] Marketplaces pool
        # @param market [String]          ID to check
        #
        # @return [Boolean] True if exists, false otherwise
        def market_exist?(pool, market)
            !pool.select {|v| v['ID'].to_i == market }.empty?
        end

    end

    # Get private marketplace to import templates
    #
    # @return [OpenNebula::Pool] Marketplace pool or error if any
    def private_markets
        pool = MarketPlacePool.new(@client)
        rc   = pool.info

        return rc if OpenNebula.is_error?(rc)

        # Get private marketplaces
        pool = pool.select {|market| MARKETS.include?(market['MARKET_MAD']) }
        pool = pool.sort_by {|market| market['ID'].to_i }

        if pool.empty?
            return Error.new("There are no #{MARKETS.join('/')} marketplaces")
        end

        pool
    end

    # Get roles information when importing a service template into marketplace
    #
    # @param import_all [Boolean] true to import VM templates too
    # @param body       [Hash]    Sevice Template information
    # @param pool       [Array]   Marketplace pool
    # @param market     [Integer] Marketplace to import
    #
    # @return [Hash] Roles templates and marketplaces to import them
    def import_service_template_roles(import_all, body, pool, market)
        # Templates import information
        #
        # template_id => :market   => marketplace ID to import it
        #                :template => ONE Template information
        #                :name     => generated name for the template
        markets = {}
        default_mp = pool.first['ID'].to_i

        if import_all
            # Read marketplace where import each different VM template
            # It can only be a private marketplace
            unless market
                puts
                puts 'Available Marketplaces for roles (please enter ID)'
                pool.each do |m|
                    puts "- #{m['ID']}: #{m['NAME']}"
                end
                puts
            end

            # Iterate all the roles to ask for the marketplace
            body['roles'].each do |role|
                # Read role VM template information from OpenNebula
                template = Template.new_with_id(role['vm_template'], @client)
                rc       = template.info

                return rc if OpenNebula.is_error?(rc)

                next if markets.include?(template['ID'])

                if market
                    m = market
                else
                    # Keep asking while user selects an incorrect marketplace
                    until OneMarketPlaceAppHelper.market_exist?(pool, m)
                        print 'Where do you want to import' \
                              "`#{template['NAME']}`? (default=#{default_mp})"
                        m = STDIN.readline.chop

                        if m.empty?
                            puts default_mp
                            m = default_mp
                        else
                            m = m.to_i
                        end
                    end
                end

                # Update current template information
                markets[template['ID']] = {}
                markets[template['ID']][:market]   = m
                markets[template['ID']][:template] = template
            end
        else
            # Do not ask for marketplaces, just fill templates information
            body['roles'].each do |role|
                # Read role VM template information from OpenNebula
                template = Template.new_with_id(role['vm_template'], @client)
                rc       = template.info

                return rc if OpenNebula.is_error?(rc)

                next if markets.include?(template['ID'])

                # update current template information
                markets[template['id']] = {}
                markets[template['id']][:template] = template
            end
        end

        markets
    end

    # Create applications in Marketplace
    #
    # @param markets       [Hash]    Marketplaces and templates information
    # @param import_all    [Boolean] true to import images too
    # @param template_name [String]  Virtual Machine Template app name
    #
    # @return [String] Error message in case of any
    def create_apps(markets, import_all, template_name = nil)
        ids = nil

        markets.each do |_, market|
            template = market[:template]

            template.extend(OpenNebula::TemplateExt)

            rc, ids = template.mp_import(market[:market].to_i,
                                         import_all,
                                         template_name)

            return [rc.message, ids] if OpenNebula.is_error?(rc)

            # Store name to use it after
            market[:name] = nil
            market[:name] = rc
        end

        ['', ids]
    end

end
