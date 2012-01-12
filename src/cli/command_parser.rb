# -------------------------------------------------------------------------- #
# Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             #
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
            @opts = Array.new
            @commands = Hash.new
            @formats = Hash.new
            @script = nil

            @args = args
            @options = Hash.new

            set :format, :file, "Path to a file" do |arg|
                format_file(arg)
            end

            set :format, :range, "List of id's in the form 1,8..15" do |arg|
                format_range(arg)
            end

            set :format, :text, "String" do |arg|
                format_text(arg)
            end

            instance_eval(&block)

            self.run
        end

        def usage(str)
            @usage=<<EOT
## SYNOPSIS

#{str}
EOT
        end

        def version(str)
            @version = str
        end

        def description(str)
            @description = str
        end

        def set(e, *args, &block)
            case e
            when :option
                add_option(args[0])
            when :format
                add_format(args[0], args[1], block)
            end
        end

        def exit_with_code(code, output=nil)
            puts output if output
            exit code
        end

        def command(name, desc, *args_format, &block)
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
                    cmd[:options] << args[:options]
                else
                    cmd[:arity]+=1
                    cmd[:args_format] << [args]
                end
            }
            cmd[:proc] = block
            @commands[name.to_sym] = cmd
        end

        def script(*args_format, &block)
            @script=Hash.new
            @script[:args_format] = Array.new
            args_format.collect {|args|
                if args.instance_of?(Array)
                    @script[:arity]+=1 unless args.include?(nil)
                    @script[:args_format] << args
                elsif args.instance_of?(Hash) && args[:options]
                    @opts << args[:options]
                else
                    @script[:arity]+=1
                    @script[:args_format] << [args]
                end
            }

            @script[:proc] = block
        end

        def run
            comm_name=""
            if @script
                comm=@script
            elsif
                if @args[0] && !@args[0].match(/^-/)
                    comm_name=@args.shift.to_sym
                    comm=@commands[comm_name]
                end
            end

            if comm.nil?
                help
                exit -1
            end

            extra_options = comm[:options] if comm
            parse(extra_options)

            if comm
                check_args!(comm_name, comm[:arity], comm[:args_format])

                rc = comm[:proc].call
                if rc.instance_of?(Array)
                    puts rc[1]
                    exit rc.first
                else
                    exit rc
                end
            end
        end

        def help
            puts @usage if @usage
            puts
            puts @description if @description
            puts
            print_options
            puts
            print_commands
            puts
            print_formatters
            puts
            if @version
                puts "## LICENSE"
                puts @version
            end
        end

        private

        def print_options
            puts "## OPTIONS"

            shown_opts = Array.new
            opt_format = "#{' '*5}%-25s %s"
            @commands.each{ |key,value|
                value[:options].flatten.each { |o|
                    if shown_opts.include?(o[:name])
                        next
                    else
                        shown_opts << o[:name]

                        str = ""
                        str << o[:short].split(' ').first << ', ' if o[:short]
                        str << o[:large]

                        printf opt_format, str, o[:description]
                        puts
                    end
                }
            }

            @opts.each{ |o|
                str = ""
                str << o[:short].split(' ').first << ', ' if o[:short]
                str << o[:large]

                printf opt_format, str, o[:description]
                puts
            }
        end

        def print_commands
            puts "## COMMANDS"

            cmd_format5 =  "#{' '*3}%s"
            cmd_format10 =  "#{' '*8}%s"
            @commands.each{ |key,value|
                printf cmd_format5, "* #{key} "

                args_str=value[:args_format].collect{ |a|
                    if a.include?(nil)
                        "[<#{a.compact.join("|")}>]"
                    else
                        "<#{a.join("|")}>"
                    end
                }.join(' ')
                printf "#{args_str}"
                puts

                value[:desc].split("\n").each { |l|
                    printf cmd_format10, l
                    puts
                }

                unless value[:options].empty?
                    opts_str=value[:options].flatten.collect{|o|
                        o[:name]
                    }.join(', ')
                    printf cmd_format10, "valid options: #{opts_str}"
                    puts
                end
                puts
            }
        end

        def print_formatters
            puts "## ARGUMENT FORMATS"

            cmd_format5 =  "#{' '*3}%s"
            cmd_format10 =  "#{' '*8}%s"
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

        def add_option(option)
            if option.instance_of?(Array)
                option.each { |o| @opts << o }
            elsif option.instance_of?(Hash)
                @opts << option
            end
        end

        def add_format(format, description, block)
            @formats[format] = {
                :desc => description,
                :proc => block
            }
        end

        def parse(extra_options)
            @cmdparse=OptionParser.new do |opts|
                merge = @opts
                merge = @opts + extra_options if extra_options
                merge.flatten.each do |e|
                    args = []
                    args << e[:short] if e[:short]
                    args << e[:large]
                    args << e[:format]
                    args << e[:description]

                    opts.on(*args) do |o|
                        if e[:proc]
                            e[:proc].call(o, @options)
                        elsif e[:name]=="help"
                            help
                            exit
                        elsif e[:name]=="version"
                            puts @version
                            exit
                        else
                            @options[e[:name].to_sym]=o
                        end
                    end
                end
            end

            begin
                @cmdparse.parse!(@args)
            rescue => e
                puts e.message
                exit -1
            end
        end

        def check_args!(name, arity, args_format)
            if @args.length < arity
                print "Command #{name} requires "
                if arity>1
                    puts "#{args_format.length} parameters to run."
                else
                    puts "one parameter to run"
                end
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

                        puts "Wrong number of arguments"
                        if args_str.empty?
                            puts "No argument is required"
                        else
                            puts "The arguments should be: #{args_str}"
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
                        puts error_msg if error_msg
                        puts "command #{name}: argument #{id} must be one of #{format.join(', ')}"
                        exit -1
                    end

                    id+=1
                    argument
                }
            end
        end

        ########################################################################
        # Formatters for arguments
        ########################################################################
        def format_text(arg)
            arg.instance_of?(String) ? [0,arg] : [-1]
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
    end
end


