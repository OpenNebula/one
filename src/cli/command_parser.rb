# -------------------------------------------------------------------------- #
# Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                #
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

require 'optparse'
require 'pp'

class String
    def unindent(spaces=nil)
        unless spaces
            m = self.match(/^(\s*)/)
            spaces = m[1].size
        end

        self.gsub!(/^ {#{spaces}}/, '')
    end
end

module CommandParser
    OPTIONS = [
        VERBOSE={
            :name  => "verbose",
            :short => "-v",
            :large => "--verbose",
            :description => "Verbose mode"
        },
        HELP={
            :name => "help",
            :short => "-h",
            :large => "--help",
            :description => "Show this message"
        },
        VERSION={
            :name => "version",
            :short => "-V",
            :large => "--version",
            :description => "Show version and copyright information",
        }
    ]

    class CmdParser
        attr_reader :options, :args

        def initialize(args=[], &block)
            @available_options = Array.new
            @commands = Hash.new
            @command_list = Array.new
            @formats = Hash.new

            @main = nil

            @exit_code = nil

            @args = args
            @options = Hash.new

            @before_proc=nil
            @comm_name=nil

            define_default_formats

            instance_eval(&block)

            addons = Dir["#{OpenNebulaHelper::CLI_ADDONS_LOCATION}/#{File.basename($0)}/*"]
            if defined?(addons) and !addons.nil?
                    addons.each do |addon_path|
                        addon_code = File.read(addon_path)
                        instance_eval(addon_code)
                    end
            end

            self.run
        end

        # Defines the usage information of the command
        # @param [String] str
        def usage(str)
            @usage = str
            @name ||= @usage.split(' ').first
        end

        # Defines the version the command
        # @param [String] str
        def version(str)
            @version = str
        end

        # Defines the additional information of the command
        # @param [String] str
        def description(str)
            @description = str
        end

        # Defines the name of the command
        # @param [String] str
        def name(str)
            @name = str
        end

        # Defines a proc to be called before any command
        # @param [Proc] block
        def before_proc(&block)
            @before_proc = block
        end

        # Defines a block that will be used to parse the arguments
        # of the command. Formats defined using this method con be used
        # in the arguments section of the command method, when defining a new
        # action
        #
        # @param [Symbol] format name of the format
        # @param [String] description
        #
        # @yieldreturn [Array[Integer, String]] the block must return an Array
        #    containing the result (0:success, 1:failure) and the
        #    new value for the argument.
        def format(format, description, &block)
            @formats[format] = {
                :desc => description,
                :proc => block
            }
        end

        # Defines a global option for the command that will be used for all the
        # actions
        # @param [Hash, Array<Hash>] options the option to be included. An
        #   array of options can be also provided
        # @option options [String] :name
        # @option options [String] :short
        # @option options [String] :large
        # @option options [Boolean] :multiple
        # @option options [String] :description
        # @option options [Class] :format
        # @option options [Block] :proc The block receives the value of the
        #    option and the hash of options. The block must return an Array
        #    containing the result (0:success, 1:failure) and the
        #    new value for the argument or nil. More than one option can be
        #    specified in the block using the options hash. This hash will be
        #    available inside the command block.
        #
        # @example
        #       This example will define the following options:
        #           options[:type] = type
        #
        #       TYPE={
        #           :name => "type",
        #           :short => "-t type",
        #           :large => "--type type",
        #           :format => String,
        #           :description => "Type of the new Image"
        #       }
        #
        #       This example will define the following options:
        #           options[:check] = true
        #           options[:datastore] = id
        #
        #       DATASTORE = {
        #           :name   => "datastore",
        #           :short  => "-d id|name",
        #           :large  => "--datastore id|name" ,
        #           :description => "Selects the datastore",
        #           :format => String,
        #           :proc   => lambda { |o, options|
        #               options[:check] = true
        #               [0, OpenNebulaHelper.dname_to_id(o)]
        #           }
        #       }
        #
        def option(options)
            if options.instance_of?(Array)
                options.each { |o| @available_options << o }
            elsif options.instance_of?(Hash)
                @available_options << options
            end
        end

        # Defines the exit code to be returned by the command
        # @param [Integer] code
        def exit_code(code)
            @exit_code = code
        end

        def exit_with_code(code, output=nil)
            puts output if output
            exit code
        end

        # Defines a new action for the command, several actions can be defined
        # for a command. For example: create, delete, list.
        # The options and args variables can be used inside the block, and
        # they contain the parsedarguments and options.
        #
        # @param [Symbol] name Name of the action (i.e: :create, :list)
        # @param [String] desc Description of the action
        # @param [Array<Symbol, Array<Symbol, nil>>, Hash] args_format arguments
        #    or specific options for this actiion
        #    Note that the first argument of the command is the
        #    action and should not be defined using this parameter. The rest of
        #    the argument must be defined using this parameter.
        #    This parameter can use formats previously defined with the format
        #    method
        #    Options are specified using a hash :options => ... containing
        #    the hashes representing the options. The option method doc contains
        #    the hash that has to be used to specify an option
        # @yieldreturn [Integer, Array[Integer, String]] the block must
        #    return the exit_code and if a String is returned it will be printed
        #
        # @example
        #   Definining two arguments:
        #       $ onetest test a1 a2
        #
        #   CommandParser::CmdParser.new(ARGV) do
        #       description "Test"
        #       usage "onetest <command> <args> [options]"
        #       version "1.0"
        #
        #       options VERBOSE, HELP
        #
        #       command :test, "Test", :test1, :test2, :options => XML do
        #           puts options[:xml]
        #           puts options[:verbose]
        #           puts args[0]
        #           puts args[1]
        #           [0, "It works"]
        #       end
        #   end
        #
        #
        #   Defining optional arguments: test1 is mandatory, test2 optional
        #       $ onetest test a1 | $ onetest test a1 a2
        #
        #   CommandParser::CmdParser.new(ARGV) do
        #       description "Test"
        #       usage "onetest <command> <args> [options]"
        #       version "1.0"
        #
        #       options VERBOSE, HELP
        #
        #       command :test, "Test", :test1, [:test2, nil], :options => XML do
        #           puts options[:xml]
        #           puts options[:verbose]
        #           puts args[0]
        #           puts "It works"
        #           0
        #       end
        #   end
        #
        #
        #   Defining an argument with different formats:
        #       $ onetest test a1 a2 | $ onetest test a1 123
        #
        #   CommandParser::CmdParser.new(ARGV) do
        #       description "Test"
        #       usage "onetest <command> <args> [options]"
        #       version "1.0"
        #
        #       options VERBOSE, HELP
        #
        #       format :format1, "String to Integer" do
        #           [0, arg.to_i]
        #       end
        #
        #       command :test, "Test", :test1, [:format1, format2], :options => XML do
        #           puts options[:xml]
        #           puts options[:verbose]
        #           puts args[0]
        #           0
        #       end
        #   end
        #
        def command(name, desc, *args_format, &block)
            if name.is_a? (Array)
                name = name.join(" ").to_sym
            end

            cmd = Hash.new
            cmd[:desc] = desc
            cmd[:arity] = 0
            cmd[:options] = []
            cmd[:args_format] = Array.new
            args_format.each {|args|
                if args.instance_of?(Array)
                    cmd[:arity]+=1 unless args.include?(nil)
                    cmd[:args_format] << args
                elsif args.instance_of?(Hash) && args[:options]
                    if args[:options].is_a? Array
                        args[:options].flatten!
                        args[:options] = args[:options].sort_by {|o| o[:name] }
                    end

                    cmd[:options] << args[:options]
                else
                    cmd[:arity]+=1
                    cmd[:args_format] << [args]
                end
            }
            cmd[:proc] = block
            @command_list << name.to_sym
            @commands[name.to_sym] = cmd
        end

        def deprecated_command(name, new_command)
            cmd = @commands[name.to_sym] || Hash.new
            cmd[:desc] += "\nDeprecated, use #{new_command} instead"
            cmd[:deprecated] = new_command

            @commands[name.to_sym] = cmd
        end

        # Defines a new action for the command, several actions can be defined
        # for a command. For example: create, delete, list.
        # The options and args variables can be used inside the block, and
        # they contain the parsedarguments and options.
        #
        # @param [Array<Symbol, Array<Symbol, nil>>] args_format arguments
        #    or specific options for this actiion
        #    Note that the first argument of the command is the
        #    action and should not be defined using this parameter. The rest of
        #    the argument must be defined using this parameter.
        #    This parameter can use formats previously defined with the format
        #    method
        # @yieldreturn [Integer, Array[Integer, String]] the block must
        #    return the exit_code and if a String is returned it will be printed
        #
        # @example
        #   Definining two arguments:
        #       $ onetest a1 a2
        #
        #   CommandParser::CmdParser.new(ARGV) do
        #       description "Test"
        #       usage "onetest <args> [options]"
        #       version "1.0"
        #
        #       options XML, VERBOSE, HELP
        #
        #       main :test1, :test2 do
        #           puts options[:xml]
        #           puts options[:verbose]
        #           puts args[0]
        #           puts args[1]
        #           [0, "It works"]
        #       end
        #   end
        #
        #
        #   Defining optional arguments: test1 is mandatory, test2 optional
        #       $ onetest a1 | $ onetest a1 a2
        #
        #   CommandParser::CmdParser.new(ARGV) do
        #       description "Test"
        #       usage "onetest <args> [<options>]"
        #       version "1.0"
        #
        #       options XML, VERBOSE, HELP
        #
        #       main :test1, [:test2, nil] do
        #           puts options[:xml]
        #           puts options[:verbose]
        #           puts args[0]
        #           puts "It works"
        #           0
        #       end
        #   end
        #
        #
        #   Defining an argument with different formats:
        #       $ onetest a1 a2 | $ onetest a1 123
        #
        #   CommandParser::CmdParser.new(ARGV) do
        #       description "Test"
        #       usage "onetest <args> [<options>]"
        #       version "1.0"
        #
        #       options XML, VERBOSE, HELP
        #
        #       format :format1, "String to Integer" do
        #           [0, arg.to_i]
        #       end
        #
        #       main :test1, [:format1, :format2] do
        #           puts options[:xml]
        #           puts options[:verbose]
        #           puts args[0]
        #           puts args[1]
        #           0
        #       end
        #   end
        #
        def main(*args_format, &block)
            @main=Hash.new
            @main[:arity] = 0
            @main[:args_format] = Array.new
            args_format.collect {|args|
                if args.instance_of?(Array)
                    @main[:arity]+=1 unless args.include?(nil)
                    @main[:args_format] << args
                elsif args.instance_of?(Hash) && args[:options]
                    @available_options << args[:options]
                else
                    @main[:arity]+=1
                    @main[:args_format] << [args]
                end
            }

            @main[:proc] = block
        end

        # DEPRECATED, use format and options instead
        def set(e, *args, &block)
            case e
            when :option
                option(args[0])
            when :format
                format(args[0], args[1], &block)
            end
        end


        def run
            comm_name=""

            if @main
                comm_name = @name
                comm      = @main
            elsif
                if @args[0] && !@args[0].match(/^-/)
                    while comm.nil? and @args.size > 0 do
                        current = @args.shift

                        if comm_name.empty?
                            @comm_name = comm_name = "#{current}".to_sym
                        else
                            @comm_name = comm_name = "#{comm_name} #{current}".to_sym
                        end

                        comm      = @commands[comm_name]
                    end
                end
            end

            if comm.nil?
                print_help
                exit 0
            end

            if comm[:deprecated]
                print_deprecated(comm[:deprecated])
            end

            extra_options = comm[:options] if comm
            parse(extra_options)

            if comm
                begin
                    @before_proc.call if @before_proc
                rescue StandardError => e
                    STDERR.puts e.message
                    exit(-1)
                end

                check_args!(comm_name, comm[:arity], comm[:args_format])

                begin
                    rc = comm[:proc].call

                    if rc.instance_of?(Array) && rc[0] != 0
                        STDERR.puts rc[1]
                        exit(rc[0])
                    elsif rc.instance_of?(Array)
                        puts rc[1]
                        exit(rc[0])
                    else
                        exit(@exit_code || rc)
                    end
                rescue StandardError => e
                    STDERR.puts e.message
                    exit(-1)
                end
            end
        end

        private

        def parse(extra_options)
            with_proc=Array.new

            @cmdparse=OptionParser.new do |opts|
                merge = @available_options
                merge = @available_options + extra_options if extra_options

                merge.flatten.each do |e|
                    args = []
                    args << e[:short] if e[:short]
                    args << e[:large]
                    args << e[:multiple] if e[:multiple]
                    args << e[:format]
                    args << e[:description]

                    opts.on(*args) do |o|
                        if e[:proc] && !e[:multiple]
                            @options[e[:name].to_sym]=o
                            with_proc<<e
                        elsif e[:name]=="help"
                            print_help
                            exit 0
                        elsif e[:name]=="version"
                            puts @version
                            exit 0
                        elsif !e[:multiple]
                            @options[e[:name].to_sym]=o
                        else
                            if @options[e[:name].to_sym].nil?
                                @options[e[:name].to_sym] = []
                            end

                            @options[e[:name].to_sym] << o
                        end
                    end
                end
            end

            begin
                @cmdparse.parse!(@args)
            rescue => e
                STDERR.puts e.message
                exit -1
            end

            with_proc.each do |e|
                rc = e[:proc].call(@options[e[:name].to_sym], @options)
                if rc.instance_of?(Array)
                    if rc[0] == 0
                        @options[e[:name].to_sym] = rc[1]
                    else
                        STDERR.puts rc[1]
                        STDERR.puts "option #{e[:name]}: Parsing error"
                        exit -1
                    end
                end
            end
        end

        def check_args!(name, arity, args_format)
            if @args.length < arity
                STDERR.print "Command #{name} requires "
                if arity>1
                    STDERR.puts "#{args_format.length} parameters to run."
                else
                    STDERR.puts "one parameter to run"
                end

                print_command_help(name)

                exit -1
            else
                id=0
                @args.collect!{|arg|
                    unless format=args_format[id]
                        args_str=args_format.collect{ |a|
                            if a.include?(nil)
                                "[#{a.compact.join("|")}]"
                            else
                                "<#{a.join("|")}>"
                            end
                        }.join(' ')

                        STDERR.puts "Wrong number of arguments"
                        if args_str.empty?
                            STDERR.puts "No argument is required"
                        else
                            STDERR.puts "The arguments should be: #{args_str}"
                        end
                        exit -1
                    end

                    format = args_format[id]
                    argument = nil
                    error_msg = nil
                    format.each { |f|
                        if @formats[f]
                            format_hash = @formats[f]
                        elsif f.nil?
                            argument = nil
                            break
                        else
                            format_hash = @formats[:text]
                        end

                        rc = format_hash[:proc].call(arg)
                        if rc[0]==0
                            argument=rc[1]
                            break
                        else
                            error_msg=rc[1]
                            next
                        end
                    }

                    unless argument
                        if error_msg
                            STDERR.puts error_msg
                        else
                            STDERR.puts "command #{name}: argument #{id} must be one of #{format.join(', ')}"
                        end
                        exit -1
                    end

                    id+=1
                    argument
                }
            end
        end

        ########################################################################
        # Printers
        ########################################################################

        def print_help
            if @comm_name
                print_command_help(@comm_name)
            else
                print_all_commands_help
            end
        end

        def print_all_commands_help
            if @usage
                puts "## SYNOPSIS"
                puts
                puts @usage
                puts
            end
            puts @description if @description
            puts
            print_options
            puts
            print_commands
            puts
            print_formatters
            puts
            if @version
                puts "## VERSION"
                puts @version
            end
        end

        def print_command_help(name)
            command=@commands[name]

            if !command
                STDERR.puts "Command '#{name}' not found"
                return print_all_commands_help
            end

            puts "## USAGE"
            print "#{name} "
            print_command(@commands[name])

            puts "## OPTIONS"
            command[:options].flatten.each do |o|
                print_option(o)
            end

            @available_options.each do |o|
                print_option o
            end
        end

        def print_options
            puts "## OPTIONS"

            shown_opts = []
            options    = []

            @command_list.each do |key|
                value = @commands[key]

                value[:options].flatten.each do |o|
                    if shown_opts.include?(o[:name])
                        next
                    else
                        shown_opts << o[:name]
                        options << o
                    end
                end
            end

            options << @available_options
            options.flatten!
            options = options.sort_by {|o| o[:name] }

            options.each do |o|
                print_option(o)
            end
        end

        def print_option(o)
            opt_format = "#{' '*5}%-25s"

            str = ""
            str << o[:short].split(' ').first << ', ' if o[:short]
            str << o[:large]

            params=sprintf(opt_format, str)

            first_line=80-params.length

            description=word_wrap(80-32, o[:description], first_line).
                join(("\n"+" "*31))

            puts "#{params} #{description}"
        end

        def print_commands
            cmd_format5 =  "#{' '*3}%s"

            if @main
                print_command(@main)
            else
                puts "## COMMANDS"

                @command_list.sort! if @command_list

                @command_list.each do |key|
                    value = @commands[key]
                    printf cmd_format5, "* #{key} "

                    print_command(value)
                end
            end
        end

        def print_command(command)
            cmd_format10 =  "#{' '*8}%s"

            args_str=command[:args_format].collect{ |a|
                if a.include?(nil)
                    "[<#{a.compact.join("|")}>]"
                else
                    "<#{a.join("|")}>"
                end
            }.join(' ')
            printf "#{args_str}"
            puts

            command[:desc].split("\n").each { |l|
                printf cmd_format10, l
                puts
            } if command[:desc]

            if command[:options] && !command[:options].empty?
                opts_str=command[:options].flatten.collect{|o|
                    o[:name]
                }.join(', ')
                printf cmd_format10, "valid options: #{opts_str}"
                puts
            end
            puts
        end

        def print_formatters
            puts "## ARGUMENT FORMATS"

            cmd_format5 =  "#{' '*3}%s"
            cmd_format10 =  "#{' '*8}%s"

            @formats = @formats.sort_by {|key, _| key } if @formats

            @formats.each{ |key,value|
                printf cmd_format5, "* #{key}"
                puts

                value[:desc].split("\n").each { |l|
                    printf cmd_format10, l
                    puts
                }

                puts
            }
        end

        def print_deprecated(new_command)
            puts "This command is deprecated, use instead:"
            puts "  $ #{File.basename $0} #{new_command}"
        end

        def word_wrap(size, text, first_size=nil)
            output=[]
            line=""
            if first_size
                line_size=first_size
            else
                line_size=size
            end

            text.scan(/[^\s]+/) do |word|
                if line.length+word.length+1<=line_size
                    line+=" #{word}"
                else
                    output<<line
                    line=word
                    line_size=size
                end
            end

            output<<line
            output[0].strip!
            output
        end

        ########################################################################
        # Default Formatters for arguments
        ########################################################################
        def format_text(arg)
            arg.instance_of?(String) ? [0,arg] : [-1]
        end

        def format_int(arg)
            arg.match(/^\d+$/) ? [0,arg] : [-1]
        end

        def format_file(arg)
            File.file?(arg) ? [0,arg] : [-1]
        end

        REG_RANGE=/^(?:(?:\d+\.\.\d+|\d+),)*(?:\d+\.\.\d+|\d+)$/

        def format_range(arg)
            arg_s = arg.gsub(" ","").to_s
            return [-1] unless arg_s.match(REG_RANGE)

            ids = Array.new
            arg_s.split(',').each { |e|
                if e.match(/^\d+$/)
                    ids << e.to_i
                elsif m = e.match(/^(\d+)\.\.(\d+)$/)
                    ids += (m[1].to_i..m[2].to_i).to_a
                else
                    return [-1]
                end
            }

            return 0,ids.uniq
        end

        def define_default_formats
            format :file, "Path to a file" do |arg|
                format_file(arg)
            end

            format :range, "List of id's in the form 1,8..15" do |arg|
                format_range(arg)
            end

            format :text, "String" do |arg|
                format_text(arg)
            end
        end
    end
end


