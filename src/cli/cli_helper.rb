# -------------------------------------------------------------------------- #
# Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                #
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

# CLI Helper
module CLIHelper

    # Available operators for filtering operations
    FILTER_OPS = ['=', '!=', '<', '<=', '>', '>=', '~']

    # CLI general options
    LIST = {
        :name => 'list',
        :short => '-l x,y,z',
        :large => '--list x,y,z',
        :format => Array,
        :description => 'Selects columns to display with list command'
    }

    LISTCONF = {
        :name => 'listconf',
        :short => '-c conf',
        :large => '--listconf conf',
        :format => String,
        :description => 'Selects a predefined column list'
    }

    CSV_OPT = {
        :name => 'csv',
        :large => '--csv',
        :description => 'Write table in csv format'
    }

    CSV_DEL = {
        :name => 'csv_del',
        :large => '--csv-del del',
        :format => String,
        :description => 'Set delimiter for csv output'
    }

    FILTER = {
        :name => 'filter',
        :short => '-f x,y,z',
        :large => '--filter x,y,z',
        :format => Array,
        :description => "Filter data. An array is specified with\n" <<
                        ' ' * 31 << 'column=value pairs.' <<
                        ' ' * 31 << "Valid operators #{FILTER_OPS.join(',')}" <<
                        ' ' * 31 << 'e.g. NAME=test (match name with test)' <<
                        ' ' * 31 << 'NAME~test (match every NAME containing' <<
                        ' ' * 31 << 'the substring \'test\')'
    }

    OPERATOR = {
        :name => 'operator',
        :large => '--operator operator',
        :format => String,
        :description => 'Logical operator used on filters: AND, OR. ' \
                        'Default: AND.'
    }

    NO_HEADER = {
        :name => 'no_header',
        :large => '--no-header',
        :description => 'Hides the header of the table'
    }

    DELAY = {
        :name => 'delay',
        :short => '-d x',
        :large => '--delay x',
        :format => Integer,
        :description => 'Sets the delay in seconds for top command'
    }

    NO_PAGER = {
        :name => 'no_pager',
        :large => '--no-pager',
        :description => 'Disable pagination',
        :proc => lambda {|_o, _options|
            ENV['ONE_PAGER'] = 'cat' if File.exist?('/bin/cat')
        }
    }

    ADJUST = {
        :name => 'adjust',
        :large => '--adjust x,y,z',
        :format => Array,
        :description => 'Adjust size to not truncate selected columns'
    }

    SIZE = {
        :name => 'size',
        :short => '-s x=size,y=size',
        :large => '--size x=size,y=size',
        :format => Array,
        :description => 'Change the size of selected columns. ' \
                        'For example: ' \
                        '$ onevm list --size "name=20" ' \
                        'will make column name size 20.'
    }

    EXPAND = {
        :name => 'expand',
        :large => '--expand [x=prop,y=prop]',
        :format => Array,
        :description => 'Expands the columns size to fill the terminal. ' \
                        'For example: ' \
                        '$onevm list --expand name=0.4,group=0.6 ' \
                        'will expand name 40% and group 60%. ' \
                        '$onevm list --expand name,group ' \
                        'will expand name and group based on its size.' \
                        '$onevm list --expand will expand all columns.'
    }

    NO_EXPAND = {
        :name => 'no_expand',
        :large => '--no-expand',
        :description => 'Disable expand'
    }

    OPTIONS = [LIST,
               LISTCONF,
               DELAY,
               FILTER,
               OPERATOR,
               CSV_OPT,
               CSV_DEL,
               NO_PAGER,
               NO_HEADER,
               ADJUST,
               SIZE,
               EXPAND,
               NO_EXPAND]

    # Sets bold font
    def self.scr_bold
        print "\33[1m"
    end

    # Sets underline
    def self.scr_underline
        print "\33[4m"
    end

    # Restore normal font
    def self.scr_restore
        print "\33[0m"
    end

    # Clears screen
    def self.scr_cls
        print "\33[2J\33[H"
    end

    # Moves the cursor
    #
    # @param cord_x [Integer] Coordinate x
    # @param cord_y [Integer] Coordinate y
    def self.scr_move(cord_x, cord_y)
        print "\33[#{cord_x};#{cord_y}H"
    end

    # CLI state colors
    ANSI_RED    = "\33[31m"
    ANSI_GREEN  = "\33[32m"
    ANSI_RESET  = "\33[0m"
    ANSI_YELLOW = "\33[33m"

    # CLI states
    OK_STATES      = ['runn', 'rdy', 'on', 'SUCCESS', 'RUNNING']
    BAD_STATES     = ['fail',
                      'err',
                      'error',
                      'ERROR',
                      'FAILED_DEPLOYING',
                      'FAILED_DEPLOYING_NETS',
                      'FAILED_UNDEPLOYING',
                      'FAILED_UNDEPLOYING_NETS',
                      'FAILED_SCALING']
    REGULAR_STATES = ['PENDING',
                      'DEPLOYING',
                      'DEPLOYING_NETS',
                      'UNDEPLOYING',
                      'UNDEPLOYING_NETS',
                      'CONFIGURING',
                      'WARNING']

    # Set state color
    #
    # @param stat [String] Current state
    def self.color_state(state)
        if $stdout.tty?
            case state.strip
            when *OK_STATES
                ANSI_GREEN + state + ANSI_RESET
            when *BAD_STATES
                ANSI_RED + state + ANSI_RESET
            when *REGULAR_STATES
                ANSI_YELLOW + state + ANSI_RESET
            else
                state
            end
        else
            state
        end
    end

    # Get text in green colour
    #
    # @param text [String] String to print
    def self.green(text)
        if $stdout.tty?
            ANSI_GREEN + text + ANSI_RESET
        else
            text
        end
    end

    # Print header
    #
    # @param str       [String]  String with header content
    # @param underline [Boolean] True to underline the header
    def self.print_header(str, underline = true)
        if $stdout.tty?
            print_tty_header(str, underline)
        else
            print str
        end

        puts
    end

    # Print pretty header
    #
    # @param str       [String]  String with header content
    # @param underline [Boolean] True to underline the header
    def self.print_tty_header(str, underline = true)
        scr_bold
        scr_underline if underline
        print str
        scr_restore
    end

    # Show error message and exit with error
    #
    # @param message [String] Error message to show
    def self.fail(message)
        STDERR.puts message

        exit(-1)
    end

    # Check if value is in base64
    #
    # @param value [String] Value to check
    #
    # @return [Boolean] True if it's base64
    def self.base64?(value)
        re = %r(^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)?$)

        !value.match(re).nil?
    end

    # Hash with search
    module HashWithSearch

        # Search inside path
        #
        # @param path [String] Path to search on
        def dsearch(path)
            stems = path.split('/')
            hash  = self

            stems.delete_if {|s| s.nil? || s.empty? }

            stems.each do |stem|
                if hash.is_a? Hash
                    if hash[stem]
                        hash = hash[stem]
                    else
                        hash = nil
                        break
                    end
                else
                    hash = nil
                    break
                end
            end

            hash
        end

    end

    # Show table
    class ShowTable

        require 'yaml'

        attr_reader :default_columns

        # Class constructor
        #
        # @param conf [String] Configuration file
        # @param ext  [Helper] Cli helper information
        def initialize(conf = nil, ext = nil, &block)
            @columns         = {}
            @default_columns = []

            @ext  = ext
            @conf = conf

            instance_eval(&block)
        end

        # Get the helper
        def helper
            @ext
        end

        # Fill column attributes
        #
        # @param name [String] Column name
        # @param desc [String] Column description
        # @param conf [Array]  Configutation attributes
        def column(name, desc, *conf, &block)
            column = {}

            column[:desc] = desc
            column[:size] = 5

            conf.each do |c|
                case c
                when Symbol
                    column[c] = true
                when Hash
                    c.each do |key, value|
                        column[key] = value
                    end
                end
            end

            column[:proc] = block

            @columns[name.to_sym] = column

            @default_columns << name
        end

        # Get default columns
        #
        # @param args [Array] Array with default columns
        def default(*args)
            args.map! {|a| a.to_sym }

            @default_columns = args
        end

        # Show resource
        #
        # @param data    [Hash/Object] Data to show
        # @param options [Hash] Object with CLI user options
        # @param top     [Boolean]     True to not update columns again
        def show(data, options = {}, top = false)
            update_columns(options) unless top

            if options[:list]
                @cli_columns = options[:list].collect {|o| o.upcase.to_sym }
            else
                @cli_columns = @default_columns
            end

            if data.is_a? Hash
                @data = data

                @data.extend(HashWithSearch)

                pool = @data.keys.first

                return print_table(data, options) unless pool

                element = pool.split('_')[0..-2].join('_')

                pool_data = @data.dsearch("#{pool}/#{element}")

                if pool_data
                    pool_data = [pool_data].flatten
                else
                    pool_data = []
                end

                print_table(pool_data, options)
            else
                data ||= []

                print_table(data, options)
            end
        end

        # Show resource continuosly
        #
        # @param options [Hash] Object with CLI user options
        def top(options = {})
            delay = options[:delay] || 1
            top   = false

            begin
                loop do
                    data = yield

                    CLIHelper.scr_cls
                    CLIHelper.scr_move(0, 0)

                    show(data, options, top)

                    sleep delay

                    top = true
                end
            rescue SystemExit, Interrupt, StandardError => e
                CLIHelper.fail(e.message)
            end
        end

        # Show column description
        def describe_columns
            str = '%-20s: %-20s'

            @columns.each do |column, d|
                puts format(str, column, d[:desc])
            end
        end

        # Get maximum string lenght in column
        #
        # @param index [Integer] Column index to search
        #
        # @return      [Integer] Maximum length
        def max_size(index)
            sizes = []

            @res_data.each do |d|
                sizes << d[index].size
            end

            sizes.max
        end

        # Get total size of all columns
        #
        # @param columns [Array]   Array with columns name
        #
        # @return        [Integer] Total size
        def total_columns_size(columns)
            size = 0

            columns.each do |c|
                size += @columns[c[:name]][:size]
            end

            size
        end

        # Get columns information
        #
        # @param columns [Array] Array with columns information
        #
        # @return        [Array] Array with columns objects
        def columns_info(columns)
            ret = []

            columns.each do |column|
                data = column.to_s.split('=')

                ret << { :name => data[0].upcase.to_sym, :prop => data[1] }
            end

            ret
        end

        # Print tty header
        def print_tty_header
            CLIHelper.print_tty_header(header_str)

            puts
        end

        private

        # Get header in string format
        def header_str
            @cli_columns.collect do |c|
                if @columns[c]
                    format_str(c, c.to_s)
                else
                    CLIHelper.fail("Column #{c} not defined.")
                end
            end.compact.join(' ')
        end

        # Print data in table format
        #
        # @param data    [Array] Array with data to show
        # @param options [Hash]  Object with CLI user options
        def print_table(data, options)
            @res_data = data_array(data, options)

            update_columns_size(options)

            options[:csv_del] ? del = options[:csv_del] : del = ','

            if !options[:csv] && (!options.key? :no_header)
                CLIHelper.print_header(header_str)
            elsif options[:csv] && (!options.key? :no_header)
                puts CSV.generate_line(@cli_columns, :col_sep => del)
            end

            @res_data ? print_data(@res_data, options) : puts
        end

        # Print data
        #
        # @param data [Array] Array with data to show
        # @param options [Hash] Object with CLI user options
        def print_data(data, options)
            if options[:csv]
                print_csv_data(data, options[:csv_del])
            else
                print_normal_data(data, options[:stat_column])
            end
        rescue Errno::EPIPE => e
            CLIHelper.fail(e.message)
        end

        # Print data in CSV format
        #
        # @param data [Array] Array with data to show
        # @param del  [Char]  CSV delimiter
        def print_csv_data(data, del)
            del ||= ','

            data.each do |l|
                result = []

                @cli_columns.each do |col|
                    result << l[@default_columns.index(col)]
                end

                puts CSV.generate_line(result, :col_sep => del)
            end
        end

        # Print data in normal format
        #
        # @param data        [Array]  Array with data to show
        # @param stat_column [String] Name of the state column
        def print_normal_data(data, stat_column)
            if stat_column
                stat = stat_column.upcase.to_sym
            else
                stat = :STAT
            end

            data.each do |l|
                result = []

                @cli_columns.each do |col|
                    i = @default_columns.index(col)

                    # Column might not exist
                    next unless i

                    dat = l[i]

                    str = format_str(col, dat)

                    str = CLIHelper.color_state(str) if col == stat

                    result << str
                end
                puts result.join(' ').rstrip
            end
        end

        # Get data in array format
        #
        # @param data    [Array] Array with data to show
        # @param options [Hash]  Object with CLI user options
        #
        # @return        [Array] Array with selected columns information
        def data_array(data, options)
            # Take default table columns and desired ones by the user
            cols = @default_columns

            @cli_columns.each do |col|
                next if @default_columns.include?(col)

                @default_columns.insert(@cli_columns.index(col) + 1, col)
            end

            res_data = data.collect do |d|
                cols.collect do |c|
                    @columns[c][:proc].call(d).to_s if @columns[c]
                end
            end

            filter_data!(res_data, options) if options && options[:filter]

            res_data
        end

        # Format data as string
        #
        # @param field [Symbol] Name of the column to format
        # @param data  [String] Data to format
        def format_str(field, data)
            if @columns[field]
                @columns[field][:left] ? minus = '-' : minus = ''
                size = @columns[field][:size]

                if @columns[field][:adjust]
                    format("%#{minus}#{size}s", data.to_s)
                else
                    format("%#{minus}#{size}.#{size}s", data.to_s)
                end
            else
                CLIHelper.fail("Column #{field} not defined.")
            end
        end

        # Get expand information from configuration files
        #
        # @return [Array] Array with columns data
        def config_expand_data
            ret = []

            @cli_columns.each do |column|
                expand_c = @columns[column][:expand]

                next unless expand_c

                column = column.to_s.downcase

                ret << "#{column}=#{expand_c}" if expand_c.is_a? Numeric

                ret << column.to_s.downcase unless expand_c.is_a? Numeric
            end

            ret
        end

        # Get adjust information from configuration files
        #
        # @return [Array] Array with columns data
        def config_adjust_data
            ret = []

            @cli_columns.each do |column|
                next unless @columns[column][:adjust]

                ret << column.to_s.downcase
            end

            ret
        end

        # Change the size of expand columns
        #
        # @param expand_columns [Array]   Array with expand columns names
        # @param all            [Boolean] True to expand all columns
        def expand_columns(expand_columns, all = false)
            return if expand_columns.empty?

            if $stdout.isatty
                terminal_size = $stdout.winsize[1]
            elsif IO.console && IO.console.tty?
                terminal_size = IO.console.winsize[1]
            else
                terminal_size = nil
            end

            return if terminal_size.nil?

            default_columns = columns_info(@cli_columns)
            expand_columns  = columns_info(expand_columns)

            total_size     = total_columns_size(default_columns)
            columns_size   = total_columns_size(expand_columns)

            terminal_size -= (@cli_columns.size - 1)
            left_size      = terminal_size - total_size
            remaining_size = left_size

            return if left_size <= 0

            expand_columns.each do |c|
                column = c[:name]
                prop   = c[:prop]

                if @columns[column].nil?
                    CLIHelper.fail("Unknown column #{column}")
                end

                if all
                    prop = @columns[column][:size] / total_size.to_f
                elsif !prop
                    prop = @columns[column][:size] / columns_size.to_f
                end

                size = (left_size * prop.to_f).round

                @columns[column][:adjust] = false
                @columns[column][:size]  += size

                remaining_size -= size
            end

            if remaining_size > 0
                # If there is some left space, add it to the last column
                @columns[expand_columns[-1][:name]][:size] += remaining_size
            end

            return if terminal_size == total_columns_size(default_columns)

            # If there is extra space, sub it from the last column
            diff = total_columns_size(default_columns) - terminal_size

            @columns[expand_columns[-1][:name]][:size] -= diff
        end

        # Change columns size
        #
        # @param options [Array] Array with size information for each column
        def size_columns(options)
            options[:size].each do |column|
                data   = column.split('=')
                column = data[0].upcase.to_sym
                size   = data[1].to_i

                @columns[column][:adjust] = false
                @columns[column][:size]   = size
            end
        end

        # Update columns size information
        #
        # @param options [Hash] Object with CLI user options
        def update_columns_size(options)
            adjust = options[:adjust]

            if adjust
                adjust += config_adjust_data
            else
                adjust = config_adjust_data
            end

            expand_all  = (options.key? :expand) && options[:expand].nil?
            expand      = !options[:expand].nil?
            expand_data = []

            if expand_all
                expand_data = @cli_columns
            elsif expand
                expand_data += options[:expand]
            end

            expand_data += config_expand_data

            c_size = options[:size]

            # Update adjust attribute to not truncate the column
            # If expand all columns adjust is ignored
            unless expand_all
                adjust.each do |column|
                    column = column.upcase.to_sym
                    size   = max_size(@cli_columns.index(column))

                    if size && size > @columns[column][:size]
                        @columns[column][:adjust] = true
                        @columns[column][:size]   = size
                    end
                end
            end

            # Update size attribute if size
            size_columns(options) if c_size

            # Update size attribute if expand
            expand_columns(expand_data) unless options.key? :no_expand
        end

        # Update columns information
        #
        # @param options [Hash] Object with CLI user options
        def update_columns(options)
            begin
                if @conf && File.exist?(@conf)
                    config = YAML.load_file(@conf)
                else
                    config = {}
                end

                default      = config.delete(:default) || {}
                default_conf = config.delete(:default_conf) || {}
                listconf     = options[:listconf]

                listconf = default_conf[listconf.to_sym] if listconf

                if !listconf && ENV['ONE_LISTCONF']
                    listconf = default_conf[ENV['ONE_LISTCONF'].to_sym]
                end

                if listconf
                    @default_columns = listconf
                else
                    @default_columns = default unless default.empty?
                end

                # Filter show options with available columns
                @default_columns &= @columns.keys

                @columns.merge!(config) do |_key, oldval, newval|
                    oldval.merge(newval)
                end
            rescue StandardError => e
                CLIHelper.fail(e.message)
            end
        end

        # Filter data
        #
        # @param data    [Array] Array with data to filter
        # @param options [Hash]  Object with CLI user options
        def filter_data!(data, options)
            operators = /(#{FILTER_OPS.join('|')})/
            filter    = options[:filter]

            if options.key?(:operator)
                log_operator = options[:operator].upcase
            else
                log_operator = 'AND'
            end

            stems = filter.map do |s|
                m = s.match(/^(.*?)#{operators}(.*?)$/)

                if m
                    index = @default_columns.index(m[1].upcase.to_sym)

                    if index
                        {
                            :left       => m[1],
                            :operator   => m[2],
                            :right      => m[3],
                            :index      => index
                        }
                    else
                        CLIHelper.fail("Column '#{m[1]}' not found")
                    end
                else
                    CLIHelper.fail("Expression '#{s}' incorrect")
                end
            end

            data.select! do |d|
                pass = true

                stems.each do |s|
                    case s[:operator]
                    when '='
                        op = '=='
                    when '~'
                        op = 'include?'
                    else
                        op = s[:operator]
                    end

                    if d[s[:index]].public_send(op, s[:right])
                        if log_operator == 'OR'
                            pass = true

                            break
                        end
                    else
                        pass = false

                        break if log_operator == 'AND'
                    end
                end

                pass
            end
        end

        # TODO: def sort_data!(data, options)

    end

end
