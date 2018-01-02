#!/usr/bin/env ruby

# ----------------------------------------------------------------------------
# Copyright 2002-2018, OpenNebula Project, OpenNebula Systems
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

ONE_LOCATION = ENV["ONE_LOCATION"]

if !ONE_LOCATION
    RUBY_LIB_LOCATION = "/usr/lib/one/ruby"
    VAR_LOCATION      = "/var/lib/one"
else
    RUBY_LIB_LOCATION = ONE_LOCATION + "/lib/ruby"
    VAR_LOCATION      = ONE_LOCATION + "/var"
end

$: << RUBY_LIB_LOCATION

require "OpenNebulaDriver"
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
        :import  => "IMPORT",
        :delete  => "DELETE",
        :log     => "LOG",
        :monitor => "MONITOR",
        :export  => "EXPORT"  #For Datastore export action
    }

    # XPATHs for driver messages
    MARKETPLACE_XPATH    = '/MARKET_DRIVER_ACTION_DATA/MARKETPLACE'
    MARKETPLACEAPP_XPATH = '/MARKET_DRIVER_ACTION_DATA/MARKETPLACEAPP'

    # Register default actions for the protocol
    def initialize(market_type, options={})
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

        super("market/", @options)

        if market_type == nil
            @types = Dir["#{@local_scripts_path}/*/"].map do |d|
                d.split('/')[-1]
            end
        elsif market_type.class == String
            @types = [market_type]
        else
            @types = market_type
        end

        @local_ds_scripts_path = File.join(@local_scripts_base_path, 'datastore/')

        @one = OpenNebula::Client.new()

        register_action(ACTION[:import].to_sym, method("import"))
        register_action(ACTION[:delete].to_sym, method("delete"))
        register_action(ACTION[:monitor].to_sym,method("monitor"))
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
            failure(:import, id, "Cannot decode driver message")
            return
        end

        type   = xml['MARKETPLACEAPP/TYPE']
        origin = xml['MARKETPLACEAPP/ORIGIN_ID']
        mp_mad = xml['MARKETPLACE/MARKET_MAD']

        if type.nil? || origin.nil? || mp_mad.nil?
            failure(:import, id, "Wrong driver message format")
            return
        end

        case OpenNebula::MarketPlaceApp::MARKETPLACEAPP_TYPES[type.to_i]
        #-----------------------------------------------------------------------
        # Export marketplace origin to a file path, IMAGE
        #-----------------------------------------------------------------------
        when "IMAGE" then
            # ------------ Execute export action from Datastore ----------------
            ds_mad = xml['DATASTORE/DS_MAD']

            if ds_mad.nil?
                failure(:import, id, "Wrong driver message format")
                return
            end

            ds_msg = "<DS_DRIVER_ACTION_DATA>"\
                     "#{xml.element_xml('IMAGE')}"\
                     "#{xml.element_xml('DATASTORE')}"\
                     "</DS_DRIVER_ACTION_DATA>"

            ds_msg64 = Base64::strict_encode64(ds_msg)

            result, info = do_action(id, nil, ds_mad, :export,
                "#{ds_msg64} #{id}", false)

            if ( result == RESULT[:failure] )
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
        xml.add_element('/MARKET_DRIVER_ACTION_DATA',
                        'IMPORT_SOURCE' => "#{info_doc['IMPORT_SOURCE']}",
                        'MD5'           => "#{info_doc['MD5']}",
                        'SIZE'          => "#{info_doc['SIZE']}",
                        'FORMAT'        => "#{info_doc['FORMAT']}",
                        'DISPOSE'       => "#{info_doc['DISPOSE']}")

        mp_msg64 = Base64::strict_encode64(xml.to_xml)

        rc, info = do_action(id, mp_mad, nil, :import, "#{mp_msg64} #{id}",true)

        send_message(ACTION[:import], rc, id, info)
    end

    ############################################################################
    # Deletes an app from the marketplace
    ############################################################################
    def delete(id, drv_message)
        xml = decode(drv_message)

        if xml.nil?
            failure(:import, id, "Cannot decode driver message")
            return
        end

        mp_mad = xml['MARKETPLACE/MARKET_MAD']

        if mp_mad.nil?
            failure(:delete, id, "Wrong driver message format")
            return
        end

        rc, info = do_action(id,mp_mad,nil,:delete,"#{drv_message} #{id}",false)

        send_message(ACTION[:delete], rc, id, info)
    end

    ############################################################################
    # Monitor the marketplace. It gathers information about usage and app status
    ############################################################################
    def monitor(id, drv_message)
        xml = decode(drv_message)

        if xml.nil?
            failure(:monitor, id, "Cannot decode driver message")
            return
        end

        mp_mad = xml['MARKETPLACE/MARKET_MAD']

        if mp_mad.nil?
            failure(:monitor, id, "Wrong driver message format")
            return
        end

        rc, info = do_action(id,mp_mad,nil,:monitor,"#{drv_message} #{id}",true)

        send_message(ACTION[:monitor], rc, id, info)
    end

    private

    # Check if the selected marketplace driver is enabled in the configuration
    def is_available?(market, id, action)
        if @types.include?(market)
            return true
        else
            send_message(ACTION[action], RESULT[:failure], id,
                "Marketplace driver '#{market}' not available")
            return false
        end
    end

    #Execute marketplace or datastore actions for
    #  @param id of the app
    #  @param market driver to use
    #  @param datastore driver to use
    #  @param action to invoke from the driver
    #  @param arguments for the action
    #  @return result and info of the action
    def do_action(id, market, datastore, action, arguments, encode)

        if !datastore.nil?
            path = File.join(@local_ds_scripts_path, datastore)
        else
            return if not is_available?(market, id, action)
            path = File.join(@local_scripts_path, market)
        end

        cmd  = File.join(path, ACTION[action].downcase)
        cmd << " " << arguments

        rc = LocalCommand.run(cmd, log_method(id))

        result, info = get_info_from_execution(rc)

        info = Base64::strict_encode64(info) if encode && result != RESULT[:failure]

        return result, info
    end

    # Decodes the core message and returns the app and market information as
    # xml documents
    def decode(drv_message)
        msg = Base64.decode64(drv_message)
        doc = OpenNebula::XMLElement.new
        doc.initialize_xml(msg, 'MARKET_DRIVER_ACTION_DATA')

        doc = nil if doc.xml_nil?

        return doc
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
    [ '--threads',         '-t', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--market-types',    '-m', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--timeout',         '-w', GetoptLong::OPTIONAL_ARGUMENT ],
    [ '--proxy'                , GetoptLong::OPTIONAL_ARGUMENT ]
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
        end
    end
rescue Exception => e
    exit(-1)
end

mp_driver = MarketPlaceDriver.new(mp_type,
                                  :concurrency  => threads,
                                  :timeout      => timeout)
mp_driver.start_driver

