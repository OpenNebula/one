#!/usr/bin/env ruby

# ----------------------------------------------------------------------------
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ----------------------------------------------------------------------------

# ----------------------------------------------------------------------------
# Set up the environment for the driver
# ----------------------------------------------------------------------------

ONE_LOCATION = ENV['ONE_LOCATION']

if !ONE_LOCATION
    RUBY_LIB_LOCATION = '/usr/lib/one/ruby'
    GEMS_LOCATION     = '/usr/share/one/gems'
    VAR_LOCATION      = '/var/lib/one'
else
    RUBY_LIB_LOCATION = ONE_LOCATION + '/lib/ruby'
    GEMS_LOCATION     = ONE_LOCATION + '/share/gems'
    VAR_LOCATION      = ONE_LOCATION + '/var'
end

# %%RUBYGEMS_SETUP_BEGIN%%
if File.directory?(GEMS_LOCATION)
    real_gems_path = File.realpath(GEMS_LOCATION)
    if !defined?(Gem) || Gem.path != [real_gems_path]
        $LOAD_PATH.reject! {|l| l =~ /vendor_ruby/ }

        # Suppress warnings from Rubygems
        # https://github.com/OpenNebula/one/issues/5379
        begin
            verb = $VERBOSE
            $VERBOSE = nil
            require 'rubygems'
            Gem.use_paths(real_gems_path)
        ensure
            $VERBOSE = verb
        end
    end
end
# %%RUBYGEMS_SETUP_END%%

$LOAD_PATH << RUBY_LIB_LOCATION

require 'OpenNebulaDriver'
require 'getoptlong'
require 'base64'
require 'rexml/document'
require 'opennebula'

# This class provides basic messaging and logging functionality to implement
# Marketplace Drivers. A marketplace driver specialize the OpenNebula behavior
# to interface with different object or file stores.
class MarketPlaceDriver < OpenNebulaDriver

    # Market Driver Protocol constants
    ACTION = {
        :import  => 'IMPORT',
        :delete  => 'DELETE',
        :log     => 'LOG',
        :monitor => 'MONITOR',
        :export  => 'EXPORT' # For Datastore export action
    }

    # XPATHs for driver messages
    MARKETPLACE_XPATH    = '/MARKET_DRIVER_ACTION_DATA/MARKETPLACE'
    MARKETPLACEAPP_XPATH = '/MARKET_DRIVER_ACTION_DATA/MARKETPLACEAPP'

    # Register default actions for the protocol
    def initialize(market_type, options = {})
        @options={
            :concurrency => 10,
            :threaded => true,
            :retries => 0,
            :local_actions => {
                ACTION[:import]  => nil,
                ACTION[:delete]  => nil,
                ACTION[:log]     => nil,
                ACTION[:monitor] => nil
            }
        }.merge!(options)

        super('market/', @options)

        if market_type.nil?
            @types = Dir["#{@local_scripts_path}/*/"].map do |d|
                d.split('/')[-1]
            end
        elsif market_type.class == String
            @types = [market_type]
        else
            @types = market_type
        end

        @local_ds_scripts_path = File.join(@local_scripts_base_path, 'datastore/')

        @one = OpenNebula::Client.new

        register_action(ACTION[:import].to_sym, method('import'))
        register_action(ACTION[:delete].to_sym, method('delete'))
        register_action(ACTION[:monitor].to_sym, method('monitor'))
    end

    ############################################################################
    # Import a marketplace app into the marketplace. This is a two step process:
    #   1- The associated datastore_mad/export script is invoked to generate
    #      a file representation of the app.
    #   2- The resulting file path is used to import it into the marketplace
    #      invoking marketplace_mad/import.
    ############################################################################
    def import(id, drv_message)
        xml = decode(drv_message)

        if xml.nil?
            failure(:import, id, 'Cannot decode driver message')
            return
        end

        type   = xml['MARKETPLACEAPP/TYPE']
        origin = xml['MARKETPLACEAPP/ORIGIN_ID']
        mp_mad = xml['MARKETPLACE/MARKET_MAD']

        if type.nil? || origin.nil? || mp_mad.nil?
            failure(:import, id, 'Wrong driver message format')
            return
        end

        case OpenNebula::MarketPlaceApp::MARKETPLACEAPP_TYPES[type.to_i]
        #-----------------------------------------------------------------------
        # Export marketplace origin to a file path, IMAGE
        #-----------------------------------------------------------------------
        when 'IMAGE'
            # ------------ Execute export action from Datastore ----------------
            ds_mad = xml['DATASTORE/DS_MAD']

            if ds_mad.nil?
                failure(:import, id, 'Wrong driver message format')
                return
            end

            ds_msg = '<DS_DRIVER_ACTION_DATA>'\
                     "#{xml.element_xml('IMAGE')}"\
                     "#{xml.element_xml('DATASTORE')}"\
                     '</DS_DRIVER_ACTION_DATA>'

            result, info = do_action(id,
                                     nil,
                                     ds_mad,
                                     :export,
                                     Base64.strict_encode64(ds_msg),
                                     false,
                                     true)

            if result == RESULT[:failure]
                failure(:import, id, "Error exporting image to file: #{info}")
                return
            end

            info_doc = OpenNebula::XMLElement.new
            info_doc.initialize_xml(info, 'IMPORT_INFO')
        #-----------------------------------------------------------------------
        # Only IMAGE type is supported
        # when "VMTEMPLATE"
        # when "SERVICE_TEMPLATE"
        #-----------------------------------------------------------------------
        else
            failure(:import, id, "Type #{apptype} not supported")
            return
        end

        # --------------- Import image app into the marketplace ----------------
        # rubocop:disable Style/RedundantInterpolation
        xml.add_element('/MARKET_DRIVER_ACTION_DATA',
                        'IMPORT_SOURCE' => "#{info_doc['IMPORT_SOURCE']}",
                        'MD5'           => "#{info_doc['MD5']}",
                        'SIZE'          => "#{info_doc['SIZE']}",
                        'FORMAT'        => "#{info_doc['FORMAT']}",
                        'DISPOSE'       => "#{info_doc['DISPOSE']}",
                        'DISPOSE_CMD'   => "#{info_doc['DISPOSE_CMD']}")
        # rubocop:enable Style/RedundantInterpolation

        rc, info = do_action(id,
                             mp_mad,
                             nil,
                             :import,
                             Base64.strict_encode64(xml.to_xml),
                             true,
                             false)

        send_message(ACTION[:import], rc, id, info)
    end

    ############################################################################
    # Deletes an app from the marketplace
    ############################################################################
    def delete(id, drv_message)
        xml = decode(drv_message)

        if xml.nil?
            failure(:import, id, 'Cannot decode driver message')
            return
        end

        mp_mad = xml['MARKETPLACE/MARKET_MAD']

        if mp_mad.nil?
            failure(:delete, id, 'Wrong driver message format')
            return
        end

        # Marketplace apps types that don't call the driver action
        # VMTEMPLATE (2) and pSERVICE_TEMPLATE (3)
        if ![2, 3].include?(xml['MARKETPLACEAPP/TYPE'].to_i)
            rc, info = do_action(id,
                                 mp_mad,
                                 nil,
                                 :delete,
                                 drv_message,
                                 false,
                                 false)

            send_message(ACTION[:delete], rc, id, info)
        else
            send_message(ACTION[:delete], 0, id, nil)
        end
    end

    ############################################################################
    # Monitor the marketplace. It gathers information about usage and app status
    ############################################################################
    def monitor(id, drv_message)
        xml = decode(drv_message)

        if xml.nil?
            failure(:monitor, id, 'Cannot decode driver message')
            return
        end

        mp_mad = xml['MARKETPLACE/MARKET_MAD']

        if mp_mad.nil?
            failure(:monitor, id, 'Wrong driver message format')
            return
        end

        rc, info = do_action(id,
                             mp_mad,
                             nil,
                             :monitor,
                             drv_message,
                             true,
                             false)

        send_message(ACTION[:monitor], rc, id, info)
    end

    private

    # Check if the selected marketplace driver is enabled in the configuration
    def available?(market, id, action)
        if @types.include?(market)
            true
        else
            send_message(ACTION[action], RESULT[:failure], id,
                         "Marketplace driver '#{market}' not available")
            false
        end
    end

    # Execute marketplace or datastore actions for
    #  @param id of the app
    #  @param market driver to use
    #  @param datastore driver to use
    #  @param action to invoke from the driver
    #  @param drv_action message for the driver, it will be append with id
    #  @param encode base64 encode returning info
    #  @param stdin use stdin to pass drv_action and not command line argument
    #
    #  @return result and info of the action
    # rubocop:disable Metric/ParameterLists
    def do_action(id, market, datastore, action, drv_action, encode, stdin)
        if !datastore.nil?
            path = File.join(@local_ds_scripts_path, datastore)
        else
            return unless available?(market, id, action)

            path = File.join(@local_scripts_path, market)
        end

        if stdin
            arguments = " #{id}"
        else
            arguments  = " #{drv_action} #{id}"
            drv_action = nil
        end

        cmd  = File.join(path, ACTION[action].downcase)
        cmd << arguments

        rc = LocalCommand.run(cmd, log_method(id), drv_action)

        result, info = get_info_from_execution(rc)

        info = Base64.strict_encode64(info) if encode && result != RESULT[:failure]

        [result, info]
    end
    # rubocop:enable Metric/ParameterLists

    # Decodes the core message and returns the app and market information as
    # xml documents
    def decode(drv_message)
        msg = Base64.decode64(drv_message)
        doc = OpenNebula::XMLElement.new
        doc.initialize_xml(msg, 'MARKET_DRIVER_ACTION_DATA')

        doc = nil if doc.xml_nil?

        doc
    end

    def failure(asym, id, message)
        send_message(ACTION[asym], RESULT[:failure], id, message)
    end

end

################################################################################
################################################################################
# DatastoreDriver Main program
################################################################################
################################################################################

opts = GetoptLong.new(
    ['--threads', '-t', GetoptLong::OPTIONAL_ARGUMENT],
    ['--market-types', '-m', GetoptLong::OPTIONAL_ARGUMENT],
    ['--timeout', '-w', GetoptLong::OPTIONAL_ARGUMENT],
    ['--proxy', '-p', GetoptLong::OPTIONAL_ARGUMENT]
)

mp_type = nil
threads = 15
timeout = nil

begin
    opts.each do |opt, arg|
        case opt
        when '--threads'
            threads = arg.to_i
        when '--market-types'
            mp_type = arg.split(',').map {|a| a.strip }
        when '--timeout'
            timeout = arg.to_i
        when '--proxy'
            ENV['http_proxy'] = arg
        end
    end
rescue StandardError
    exit(-1)
end

mp_driver = MarketPlaceDriver.new(mp_type,
                                  :concurrency  => threads,
                                  :timeout      => timeout)
mp_driver.start_driver
