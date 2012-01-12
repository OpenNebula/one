#!/usr/bin/env ruby

# -------------------------------------------------------------------------- */
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    */
# not use this file except in compliance with the License. You may obtain    */
# a copy of the License at                                                   */
#                                                                            */
# http://www.apache.org/licenses/LICENSE-2.0                                 */
#                                                                            */
# Unless required by applicable law or agreed to in writing, software        */
# distributed under the License is distributed on an "AS IS" BASIS,          */
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
# See the License for the specific language governing permissions and        */
# limitations under the License.                                             */
# -------------------------------------------------------------------------- */

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

# This class provides basic messaging and logging functionality
# to implement Image Repository Drivers. A image repository driver
# is a program (or a set of) that  specialize the OpenNebula behavior
# by interfacing with specific infrastructure storage solutions.
class ImageDriver < OpenNebulaDriver

    # Image Driver Protocol constants
    ACTION = {
        :mv   => "MV",
        :cp   => "CP",
        :rm   => "RM",
        :mkfs => "MKFS",
        :log  => "LOG"
    }

    # Register default actions for the protocol
    def initialize(fs_type, options={})
        @options={
            :concurrency => 10,
            :threaded => true,
            :retries => 0,
            :local_actions => {
                'MV' => nil,
                'CP' => nil,
                'RM' => nil,
                'MKFS' => nil
            }
        }.merge!(options)

        super("image/#{fs_type}", @options)

        register_action(ACTION[:mv].to_sym, method("mv"))
        register_action(ACTION[:cp].to_sym, method("cp"))
        register_action(ACTION[:rm].to_sym, method("rm"))
        register_action(ACTION[:mkfs].to_sym, method("mkfs"))
    end

    # Image Manager Protocol Actions (generic implementation
    def mv(id, src, dst)
        do_action("#{src} #{dst} #{id}", id, nil,
            ACTION[:mv])
    end

    def cp(id, src)
        do_action("#{src} #{id}", id, nil, ACTION[:cp])
    end

    def rm(id, dst)
        do_action("#{dst} #{id}", id, nil, ACTION[:rm])
    end

    def mkfs(id, fs, size)
        do_action("#{fs} #{size} #{id}", id, nil,
            ACTION[:mkfs])
    end
end


# ImageDriver Main program

opts = GetoptLong.new(
    [ '--threads',    '-t', GetoptLong::OPTIONAL_ARGUMENT ]
)

fs_type    = ''
threads    = 15

begin
    opts.each do |opt, arg|
        case opt
            when '--threads'
                threads   = arg.to_i
        end
    end
rescue Exception => e
    exit(-1)
end

if ARGV.length >= 1
    fs_type = ARGV.shift
else
    exit(-1)
end

image_driver = ImageDriver.new(fs_type, :concurrency => threads)
image_driver.start_driver
