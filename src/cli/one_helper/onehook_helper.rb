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

require 'one_helper'
require 'rubygems'

# implements onehook command
class OneHookHelper < OpenNebulaHelper::OneHelper

    def self.rname
        'HOOK'
    end

    def self.conf_file
        'onehook.yaml'
    end

    private

    def factory(id = nil)
        if id
            OpenNebula::Hook.new_with_id(id, @client)
        else
            xml = OpenNebula::Hook.build_xml
            OpenNebula::Hook.new(xml, @client)
        end
    end

    def factory_pool(_user_flag = -2)
        OpenNebula::HookPool.new(@client)
    end

    def format_pool(_options)
        config_file = self.class.table_conf

        table = CLIHelper::ShowTable.new(config_file, self) do
            column :ID, 'ONE identifier for the Hook', :size => 5 do |d|
                d['ID']
            end

            column :NAME, 'Name of the Hook', :left, :size => 25 do |d|
                d['NAME']
            end

            column :TYPE, 'Type of the Hook', :left, :size => 45 do |d|
                d['TYPE']
            end

            default :ID, :NAME, :TYPE
        end

        table
    end

    # Function to print Execution Log records as sent by oned using:
    #   <HOOK_EXECUTION_RECORD>
    #     <HOOK_ID>
    #     <EXECUTION_ID>
    #     <TIMESTAMP>
    #     <ARGUMENTS>
    #     <EXECUTION_RESULT>
    #       <COMMAND>
    #       <STDIN>
    #       <STDOUT>
    #       <STDERR>
    #       <CODE>
    #    </EXECUTION_RESULT>
    #   </HOOK_EXECUTION_RECORD>
    #
    def print_execution(execs)
        puts
        CLIHelper.print_header('EXECUTION LOG', false)

        table = CLIHelper::ShowTable.new(nil, self) do
            column :ID, 'Execution ID', :size => 6, :left => false do |d|
                d['EXECUTION_ID']
            end

            column :TIMESTAMP, 'Timestamp', :size => 15 do |d|
                OpenNebulaHelper.time_to_str(d['TIMESTAMP'], false, true, false)
            end

            column :EXECUTION, 'Return code', :size => 12 do |d|
                rc = d['EXECUTION_RESULT']['CODE'].to_i

                if rc.zero?
                    'SUCESS'
                else
                    "ERROR (#{rc})"
                end
            end

            default :ID, :TIMESTAMP, :EXECUTION
        end

        table.show(execs)
    end

    def format_resource(hook, options = {})
        str = '%-18s: %-20s'
        str_h1 = '%-80s'

        CLIHelper.print_header(str_h1 % "HOOK #{hook['ID']} INFORMATION")
        puts format str, 'ID',   hook.id.to_s
        puts format str, 'NAME', hook.name
        puts format str, 'TYPE', hook['TYPE']
        puts format str, 'LOCK', OpenNebulaHelper.level_lock_to_str(hook['LOCK/LOCKED'])
        puts

        if options[:execution]
            xp = "//HOOK_EXECUTION_RECORD[EXECUTION_ID=#{options[:execution]}]"
            er = hook.retrieve_xmlelements(xp)
            er = er[0] if er

            if !er
                puts "Cannot find execution record #{options[:execution]}"
                return
            end

            er = er.to_hash['HOOK_EXECUTION_RECORD']

            CLIHelper.print_header(str_h1 % 'HOOK EXECUTION RECORD')

            arguments = ''

            arguments = er['ARGUMENTS'] if er['ARGUMENTS'].class == String

            puts format str, 'EXECUTION ID', er['EXECUTION_ID']
            puts format str, 'TIMESTAMP', OpenNebulaHelper.time_to_str(er['TIMESTAMP'])
            puts format str, 'COMMAND', er['EXECUTION_RESULT']['COMMAND']
            puts format str, 'ARGUMENTS', arguments
            puts format str, 'EXIT CODE', er['EXECUTION_RESULT']['CODE']

            stdout = er['EXECUTION_RESULT']['STDOUT']
            stderr = er['EXECUTION_RESULT']['STDERR']

            puts
            CLIHelper.print_header(str_h1 % 'EXECUTION STDOUT')
            puts Base64.decode64(stdout) if stdout.class == String && !stdout.empty?

            puts
            CLIHelper.print_header(str_h1 % 'EXECUTION STDERR')
            puts Base64.decode64(stderr) if stderr.class == String && !stderr.empty?

            puts
            return
        end

        CLIHelper.print_header(str_h1 % 'HOOK TEMPLATE', false)
        puts hook.template_str

        begin
            exerc = [hook.to_hash['HOOK']['HOOKLOG']['HOOK_EXECUTION_RECORD']]
            exerc = exerc.flatten.compact
        rescue StandardError
            exerc = nil
        end

        print_execution(exerc) if exerc && !exerc.empty?

        puts
    end

end
