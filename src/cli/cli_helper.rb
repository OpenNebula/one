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

module CLIHelper
    LIST = {
        :name  => "list",
        :short => "-l x,y,z",
        :large => "--list x,y,z",
        :format => Array,
        :description => "Selects columns to display with list command"
    }

    #ORDER = {
    #    :name  => "order",
    #    :short => "-o x,y,z",
    #    :large => "--order x,y,z",
    #    :format => Array,
    #    :description => "Order by these columns, column starting with - means decreasing order"
    #}
    #
    #FILTER = {
    #    :name  => "filter",
    #    :short => "-f x,y,z",
    #    :large => "--filter x,y,z",
    #    :format => Array,
    #    :description => "Filter data. An array is specified with column=value pairs."
    #}
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
    OPTIONS = [LIST, DELAY]

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

    class ShowTable
        require 'yaml'

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
            print_table(data, options)
        end

        def top(options={}, &block)
            delay=options[:delay] ? options[:delay] : 1

            begin
                while true
                    CLIHelper.scr_cls
                    CLIHelper.scr_move(0,0)

                    data = block.call

                    show(data, options)
                    sleep delay
                end
            rescue Exception => e
                puts e.message
            end
        end

        private

        def print_table(data, options)
            CLIHelper.print_header(header_str)
            data ? print_data(data, options) : puts
        end

        def print_data(data, options)
            ncolumns=@default_columns.length
            res_data=data_array(data, options)
            print res_data.collect{|l|
                (0..ncolumns-1).collect{ |i|
                    dat=l[i]
                    col=@default_columns[i]
                    format_str(col, dat)
                }.join(' ')
            }.join("\n")
            puts
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

        # TBD def filter_data!

        # TBD def sort_data!
    end
end
