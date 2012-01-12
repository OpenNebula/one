# -----------------------------------------------------------------------------
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)
#
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
# -----------------------------------------------------------------------------

require 'socket'
require 'pp'
require 'rexml/document'

begin
    require 'rubygems'
    require 'nokogiri'
    $nokogiri_enabled=true
rescue LoadError
    $nokogiri_enabled=false
end

# -----------------------------------------------------------------------------
# This class holds the parsing code of ganglia xml monitoring data
# -----------------------------------------------------------------------------
class GangliaHost
    
    # Gets monitoring data from ganglia or file
    def self.new_with_options(host, options)
        begin
            if options[:file]
                xml=File.read(options[:file])
            else
                socket=TCPSocket.new(options[:host], options[:port])
                xml=socket.read
                socket.close
            end
        rescue
            STDERR.puts "Error reading ganglia data"
            nil
        end
        
        self.new(xml, host)
    end
    
    def self.new_from_file(host, file)
        new_with_options(host, :file => file)
    end
    
    def self.new_from_ganglia(host, server, port)
        new_with_options(host, :host => server, :port => port)
    end

    # Initializes the object with raw xml data and the host we
    # want to monitor
    def initialize(xml, host)

        # Checks if the host was specified as an IP address to
        # choose the correct xpath string
        if host.match(/(\d{1,3}\.){3}\d{1,3}/)
            xpath="/GANGLIA_XML/CLUSTER/HOST[@IP='#{host}']"
        else
            xpath="/GANGLIA_XML/CLUSTER/HOST[@NAME='#{host}']"
        end

        if $nokogiri_enabled
            @doc=Nokogiri::XML.parse(xml)
            @host=@doc.xpath(xpath)
        else
            @doc=REXML::Document.new(xml)
            @host=@doc.root.elements[xpath]
        end
    end

    # Gets a metric value from the host
    def get_value(name)
        xpath="METRIC[@NAME='#{name}']"

        if $nokogiri_enabled
            metric=@host.xpath(xpath).first
        else
            metric=@host.elements[xpath]
        end

        if metric
            if $nokogiri_enabled
                metric.attr 'VAL'
            else
                metric.attributes['VAL']
            end
        else
            nil
        end
    end

    # The same as get_value
    def [](name)
        get_value(name)
    end

    # Returns a hash with the hosts metrics
    def to_hash
        xpath='METRIC'

        if $nokogiri_enabled
            values=Hash.new

            @host.xpath(xpath).each do |node|
                values[node.attr('NAME')]=node.attr('VAL')
            end

            values
        else
            values=Hash.new

            @host.elements.each(xpath) do |node|
                values[node.attributes['NAME']]=node.attributes['VAL']
            end

            values
        end
    end
    
    # extract opennebula related metrics (start with OPENNEBULA_) and
    # return a hash
    def get_opennebula_metrics
        all_info=self.to_hash
        one_info=Hash.new
        
        keys=all_info.keys.select {|key| key.match(/^OPENNEBULA_.*/) }
        
        keys.each do |key|
            m=key.match(/^OPENNEBULA_(.*)$/)
            name=m[1]
            
            one_info[name]=all_info[key]
        end
        
        one_info
    end
    
    # extract base64 encoded yaml hash from OPENNEBULA_VMS_INFORMATION
    # metric and return the hash with the VMs information
    def get_vms_information
        require 'base64'
        require 'yaml'
        
        base64_info=self['OPENNEBULA_VMS_INFORMATION']
        
        return nil if !base64_info
        
        info_yaml=Base64::decode64(base64_info)
        info=YAML.load(info_yaml)
    end
    
    # Helper class method to print monitoring values
    def self.print_info(name, value)
        return if value.nil? or value.to_s.strip.empty?
        puts "#{name}=\"#{value}\""
    end
end
