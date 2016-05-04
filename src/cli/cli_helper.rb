# -------------------------------------------------------------------------- #
# Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                #
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

require 'csv'

module CLIHelper
    LIST = {
        :name  => "list",
        :short => "-l x,y,z",
        :large => "--list x,y,z",
        :format => Array,
        :description => "Selects columns to display with list command"
    }

    CSV_OPT = {
        :name  => "csv",
        :large => "--csv",
        :description => "Write table in csv format"
    }

    #ORDER = {
    #    :name  => "order",
    #    :short => "-o x,y,z",
    #    :large => "--order x,y,z",
    #    :format => Array,
    #    :description => "Order by these columns, column starting with - means decreasing order"
    #}
    #
    FILTER = {
        :name  => "filter",
        :short => "-f x,y,z",
        :large => "--filter x,y,z",
        :format => Array,
        :description => "Filter data. An array is specified with\n"<<
                        " "*31<<"column=value pairs."
    }
    #
    #HEADER = {
    #    :name  => "header",
    #    :short => "-H",
    #    :large => "--header",
    #    :description => "Shows the header of the table"
    #}

    DELAY = {
        :name  => "delay",
        :short => "-d x",
        :large => "--delay x",
        :format => Integer,
        :description => "Sets the delay in seconds for top command"
    }

    #OPTIONS = [LIST, ORDER, FILTER, HEADER, DELAY]
    OPTIONS = [LIST, DELAY, FILTER, CSV_OPT]

    # Sets bold font
    def CLIHelper.scr_bold
        print "\33[1m"
    end

    # Sets underline
    def CLIHelper.scr_underline
        print "\33[4m"
    end

    # Restore normal font
    def CLIHelper.scr_restore
        print "\33[0m"
    end

    # Clears screen
    def CLIHelper.scr_cls
        print "\33[2J\33[H"
    end

    # Moves the cursor
    def CLIHelper.scr_move(x,y)
        print "\33[#{x};#{y}H"
    end

    def CLIHelper.scr_red
        print "\33[31m"
    end

    def CLIHelper.scr_green
        print "\33[32m"
    end

    ANSI_RED="\33[31m"
    ANSI_GREEN="\33[32m"
    ANSI_RESET="\33[0m"

    OK_STATES=%w{runn rdy on}
    BAD_STATES=%w{fail err err}

    def CLIHelper.color_state(stat)
        if $stdout.tty?
            case stat.strip
            when *OK_STATES
                ANSI_GREEN+stat+ANSI_RESET
            when *BAD_STATES
                ANSI_RED+stat+ANSI_RESET
            else
                stat
            end
        else
            stat
        end
    end

    # Print header
    def CLIHelper.print_header(str, underline=true)
        if $stdout.tty?
            scr_bold
            scr_underline if underline
            print str
            scr_restore
        else
            print str
        end
        puts
    end

    module HashWithSearch
        def dsearch(path)
            stems=path.split('/')
            hash=self

            stems.delete_if {|s| s.nil? || s.empty? }

            stems.each do |stem|
                if Hash===hash
                    if hash[stem]
                        hash=hash[stem]
                    else
                        hash=nil
                        break
                    end
                else
                    hash=nil
                    break
                end
            end

            hash
        end
    end

    class ShowTable
        require 'yaml'

        attr_reader :default_columns

        def initialize(conf=nil, ext=nil, &block)
            @columns = Hash.new
            @default_columns = Array.new

            @ext = ext
            @conf = conf

            instance_eval(&block)
        end

        def helper
            @ext
        end

        def column(name, desc, *conf, &block)
            column = Hash.new
            column[:desc] = desc
            column[:size] = 5
            conf.each{|c|
                if c.instance_of?(Symbol)
                    column[c]=true
                elsif c.instance_of?(Hash)
                    c.each{|key,value|
                        column[key]=value
                    }
                end
            }
            column[:proc] = block
            @columns[name.to_sym] = column
            @default_columns<<name
        end

        def default(*args)
            args.map!{|a| a.to_sym }
            @default_columns=args
        end

        def show(data, options={})
            update_columns(options)

            if Hash===data
                @data=data
                @data.extend(HashWithSearch)

                pool=@data.keys.first
                return print_table(nil, options) if !pool

                element=pool.split('_')[0..-2].join('_')

                pool_data=@data.dsearch("#{pool}/#{element}")
                pool_data=[pool_data].flatten if pool_data

                print_table(pool_data, options)
            else
                print_table(data, options)
            end
        end

        def top(options={}, &block)
            delay=options[:delay] ? options[:delay] : 1

            begin
                while true
                    data = block.call

                    CLIHelper.scr_cls
                    CLIHelper.scr_move(0,0)

                    show(data, options)
                    sleep delay
                end
            rescue Exception => e
                puts e.message
            end
        end

        def describe_columns
            str="%-20s: %-20s"

            @columns.each do |column, d|
                puts str % [column, d[:desc]]
            end
        end

        private

        def print_table(data, options)
            CLIHelper.print_header(header_str) if !options[:csv]
            data ? print_data(data, options) : puts
        end

        def print_data(data, options)
            ncolumns=@default_columns.length
            res_data=data_array(data, options)

            if options[:stat_column]
                stat_column=@default_columns.index(
                    options[:stat_column].upcase.to_sym)
            else
                stat_column=@default_columns.index(:STAT)
            end

            begin
                if options[:csv]
                    puts CSV.generate_line(@default_columns)
                    res_data.each {|l| puts CSV.generate_line(l) }
                else
                    res_data.each{|l|
                        puts (0..ncolumns-1).collect{ |i|
                            dat=l[i]
                            col=@default_columns[i]

                            str=format_str(col, dat)
                            str=CLIHelper.color_state(str) if i==stat_column

                            str
                        }.join(' ').rstrip
                    }
                end
            rescue Errno::EPIPE
            end
        end

        def data_array(data, options)
            res_data=data.collect {|d|
                @default_columns.collect {|c|
                    @columns[c][:proc].call(d).to_s if @columns[c]
                }
            }

            if options
                filter_data!(res_data, options[:filter]) if options[:filter]
                sort_data!(res_data, options[:order]) if options[:order]
            end

            res_data
        end

        def format_str(field, data)
            if @columns[field]
                minus=( @columns[field][:left] ? "-" : "" )
                size=@columns[field][:size]
                if @columns[field][:donottruncate]
                    return "%#{minus}#{size}s" % [ data.to_s ]
                end
                return "%#{minus}#{size}.#{size}s" % [ data.to_s ]
            else
                exit -1, "Column #{field} not defined."
            end
        end

        def update_columns(options)
            begin
                config = YAML.load_file(@conf)

                default = config.delete(:default)
                @default_columns = default unless default.empty?

                # Filter show options with available columns
                @default_columns &= @columns.keys

                @columns.merge!(config) { |key, oldval, newval|
                    oldval.merge(newval)
                }
            rescue Exception => e
            end

            @default_columns = options[:list].collect{|o| o.to_sym} if options[:list]
        end

        def header_str
            @default_columns.collect {|c|
                if @columns[c]
                    format_str(c, c.to_s)
                else
                    puts "Column #{c} not defined."
                    exit -1
                end
            }.compact.join(' ')
        end

        def filter_data!(data, filter)
            # TBD: add more operators
            # operators=/(==|=|!=|<|<=|>|>=)/
            operators=/(=)/

            stems=filter.map do |s|
                m=s.match(/^(.*?)#{operators}(.*?)$/)
                if m
                    left, operator, right=m[1..3]
                    index=@default_columns.index(left.to_sym)

                    if index
                        {
                            :left       => left,
                            :operator   => operator,
                            :right      => right,
                            :index      => index
                        }
                    else
                        STDERR.puts "Column '#{left}' not found"
                        exit(-1)
                    end
                else
                    STDERR.puts "Expression '#{s}' incorrect"
                    exit(-1)
                end
            end

            data.reject! do |d|
                pass=true

                stems.each do |s|
                    if d[s[:index]]!=s[:right]
                        pass=false
                        break
                    end
                end

                !pass
            end
        end

        # TBD def sort_data!
    end
end
