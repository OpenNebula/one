#!/usr/bin/env ruby

# ----------------------------------------------------------------------------
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems
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
        :export  => "EXPORT",
        :delete  => "DELETE",
        :log     => "LOG",
        :monitor => "MONITOR"
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
                ACTION[:export]  => nil,
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
            @types = [marke_type]
        else
            @types = market_type
        end

        @local_ds_scripts_path = File.join(@local_scripts_base_path, 'datastore/')

        @one = OpenNebula::Client.new()

        register_action(ACTION[:import].to_sym, method("import"))
        register_action(ACTION[:export].to_sym, method("export"))
        register_action(ACTION[:delete].to_sym, method("delete"))
        register_action(ACTION[:monitor].to_sym,method("monitor"))
    end

    ############################################################################
    # Image Manager Protocol Actions (generic implementation)
    ############################################################################

    def import(id, drv_message)
        xml = decode(drv_message)

        if xml.nil?
            failure(:import, id, "Cannot decode driver message")
            return
        end

        type   = xml['MARKETPLACEAPP/TYPE']
        origin = xml['MARKETPLACEAPP/ORIGIN']
        mp_mad = xml['MARKETPLACE/MARKET_MAD']

        if type.nil? || origin.nil? || mp_mad.nil?
            failure(:import, id,"Wrong driver message format")
            return
        end

        #-----------------------------------------------------------------------
        #  Export origin to a path
        #-----------------------------------------------------------------------
        case OpenNebula::MarketPlaceApp::MARKETPLACEAPP_TYPES[type.to_i]
          when "IMAGE" then
            if ( origin =~ /\d+$/ )
                # Get the associated datastore ID
                image = OpenNebula::Image.new_with_id(origin, @one)
                rc    = image.info

                if OpenNebula.is_error?(rc)
                    failure(:import, id, "Cannot find information for image "\
                            "#{origin}: #{rc.to_str()}")
                    return
                end

                ds_id = image['DATASTORE_ID']

                if ds_id.nil?
                    failure(:import, id, "Cannot find datastore for image #{origin}")
                    return
                end

                ds = OpenNebula::Datastore.new_with_id(ds_id, @one)
                rc = ds.info

                if OpenNebula.is_error?(rc)
                    failure(:import, id, "Datastore #{ds_id} not found: #{rc}")
                    return
                end

                ds_mad = ds['DS_MAD']

                if ds_mad.nil?
                    failure(:import, id, "Cannot find datastore driver")
                    return
                end

                #Execute export action from Datastore
                ds_msg   = "<DS_DRIVER_ACTION_DATA>"\
                           "#{image.to_xml}"\
                           "#{ds.to_xml}"\
                           "</DS_DRIVER_ACTION_DATA>"
                ds_msg64 = Base64::strict_encode64(ds_msg)

                result, info = do_action(id, nil, ds_mad, :export,
                    "#{ds_msg64} #{id}", false)

                if ( result == RESULT[:failure] )
                    failure(:import, id, "Error exporting image to file: #{info}")
                    return
                end

                source = info
            elsif ( source =~ /\/.+|https?:\/\// )
                source = origin
            else
                failure(:import, id, "Origin is not a valid ID, path or URL")
                return
            end
          else # Only IMAGE type is supported
                failure(:import, id, "Type #{apptype} not supported")
                return
        end

        xml.add_element('/MARKET_DRIVER_ACTION_DATA',
            'IMPORT_SOURCE' => "#{source}")
        mp_msg64 = Base64::strict_encode64(xml.to_xml)

        result, info = do_action(id, mp_mad, nil, :import, "#{mp_msg64} #{id}",
                            true)

        send_message(ACTION[:import], result, id, info)
    end

    def export(id, drv_message)
        send_message(ACTION[:export], RESULT[:failure], id, "Not implemented")
    end

    def delete(id, drv_message)
        send_message(ACTION[:export], RESULT[:failure], id, "Not implemented")
    end

    def monitor(id, drv_message)
        send_message(ACTION[:export], RESULT[:failure], id, "Not implemented")
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

        info = Base64::strict_encode64(info) if encode

        return result, info
    end

    # Decodes the core message and returns the app and market information as
    # xml documents
    def decode(drv_message)
        msg = Base64.decode64(drv_message)
        doc = OpenNebula::XMLElement.new
        doc.initialize_xml(msg, 'MARKET_DRIVER_ACTION_DATA')

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
    [ '--market-types',    '-m', GetoptLong::OPTIONAL_ARGUMENT ]
)

mp_type = nil
threads = 15

begin
    opts.each do |opt, arg|
        case opt
            when '--threads'
                threads = arg.to_i
            when '--market-types'
                mp_type = arg.split(',').map {|a| a.strip }
        end
    end
rescue Exception => e
    exit(-1)
end

mp_driver = MarketPlaceDriver.new(mp_type, :concurrency => threads)
mp_driver.start_driver

