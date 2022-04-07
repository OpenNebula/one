#!/usr/bin/ruby

# -------------------------------------------------------------------------- #
# Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                #
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
# -------------------------------------------------------------------------- #

require 'base64'
require 'digest/md5'
require 'net/http'
require 'uri'

# Utilities for Docker based marketplaces
module DockerMarket

    class << self

        # TODO: Make configurable
        # Returns template to append to all applications
        def template
            unindent(<<-EOS)
        CPU = \"1\"
        MEMORY = \"768\"
        GRAPHICS = [
            LISTEN  =\"0.0.0.0\",
            TYPE  =\"vnc\"
        ]
        CONTEXT = [
            NETWORK  =\"YES\",
            SSH_PUBLIC_KEY  =\"$USER[SSH_PUBLIC_KEY]\",
            SET_HOSTNAME  =\"$NAME\"
        ]
        OS = [
            KERNEL_CMD=\"console=ttyS0 reboot=k panic=1\"
        ]"
            EOS
        end

        # Makes text unindent
        #
        # @param str [String] String to use
        #
        # @return [String]
        def unindent(str)
            m = str.match(/^(\s*)/)
            spaces = m[1].size
            str.gsub!(/^ {#{spaces}}/, '')
        end

        # Fetch data from path
        #
        # @param options [Hash]    Class options
        # @param path    [String]  URL to fetch
        # @param ssl     [Boolean] True to use SSL
        #
        # @return [0/rc, body]
        def get(options, path, ssl = true)
            # Get proxy params (needed for ruby 1.9.3)
            http_proxy = ENV['http_proxy'] || ENV['HTTP_PROXY']

            p_host  = nil
            p_port  = nil

            if http_proxy
                p_uri   = URI(http_proxy)
                p_host  = p_uri.host
                p_port  = p_uri.port
            end

            uri = URI(path)
            req = Net::HTTP::Get.new(uri.request_uri)

            req['User-Agent'] = options[:agent] if options[:agent]

            opts = { :use_ssl => true } if ssl
            rc = Net::HTTP.start(uri.hostname,
                                 uri.port,
                                 p_host,
                                 p_port,
                                 opts) do |http|
                http.request(req)
            end

            return [rc.code.to_i, rc.msg] unless rc.is_a? Net::HTTPSuccess

            [0, rc.body]
        end

        # Generates app template
        #
        # @param app [Hash] App information
        #
        # @returns [String] App information in base64
        def gen_template(app)
            tmpl   = ''
            tmpl64 = ''

            app.each {|key, val| print_var(tmpl, key, val) }

            print_var(tmpl64, 'DRIVER', 'raw')
            print_var(tmpl64, 'DEV_PREFIX', 'vd')

            data = { 'APPTEMPLATE64' => tmpl64, 'VMTEMPLATE64' => template }

            data.each do |key, val|
                print_var(tmpl, key, Base64.strict_encode64(val))
            end

            "APP=\"#{Base64.strict_encode64(tmpl)}\"\n"
        end

        # Prints variable
        #
        # @param str  [String] String to print variable to
        # @param name [String] KEY
        # @param val  [String] Value
        #
        # @return [String] KEY=VALUE string
        def print_var(str, name, val)
            return if val.nil?
            return if val.class == String && val.empty?

            str << "#{name}=\"#{val}\"\n"
        end

        # Returns an md5 from a combination of the @option hash and an input str
        #
        # @param options [Hash]   Options to use
        # @param string  [String] String to combine
        def md5(options, string)
            Digest::MD5.hexdigest("#{options} #{string}")
        end

    end

end
