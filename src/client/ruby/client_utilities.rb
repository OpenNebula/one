# -------------------------------------------------------------------------- #
# Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   #
# Complutense de Madrid (dsa-research.org)                                   #
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

#####################
# CONSOLE UTILITIES #
#####################

# Sets bold font
def scr_bold
    print "\33[1m"
end

# Sets underline
def scr_underline
    print "\33[4m"
end

# Restore normal font
def scr_restore
    print "\33[0m"
end

# Clears screen
def scr_cls
    print "\33[2J\33[H"
end

# Moves the cursor
def scr_move(x,y)
    print "\33[#{x};#{y}H"
end



##################################
# Class show configurable tables #
##################################

ShowTableExample={
    :id => {
        :name => "ID",
        :size => 4,
        :proc => lambda {|d,e| d["oid"] }
    },
    :name => {
        :name => "NAME",
        :size => 8,
        :proc => lambda {|d,e| d["deploy_id"] }
    },
    :stat => {
        :name => "STAT",
        :size => 4,
        :proc => lambda {|d,e| e[:vm].get_state(d) }
    },
    :default => [:id, :name, :stat]
}

# Class to print tables
class ShowTable
    attr_accessor :ext, :columns
    
    # table => definition of the table to print
    # ext => external variables (Hash), @ext
    def initialize(table, ext=nil)
        @table=table
        @ext=Hash.new
        @ext=ext if ext.kind_of?(Hash)
        @columns=@table[:default]
    end
    
    # Returns a formated string for header
    def header_str
        @columns.collect {|c|
            if @table[c]
                #{}"%#{@table[c][:size]}s" % [@table[c][:name]]
                format_data(c, @table[c][:name])
            else
                nil
            end
        }.compact.join(' ')
    end
    
    # Returns an array with header titles
    def header_array
        @columns.collect {|c|
            if @table[c]
                @table[c][:name].to_s
            else
                ""
            end
        }.compact
    end
    
    def data_str(data, options=nil)
        # TODO: Use data_array so it can be ordered and/or filtered
        res_data=data_array(data, options)
        
        res_data.collect {|d|
            (0..(@columns.length-1)).collect {|c|
                dat=d[c]
                col=@columns[c]
                
                format_data(col, dat) if @table[col]
            }.join(' ')
        }.join("\n")
        
        #data.collect {|d|
        #    @columns.collect {|c|
        #        format_data(c, @table[c][:proc].call(d, @ext)) if @table[c]
        #    }.join(' ')
        #}.join("\n")
    end
    
    def data_array(data, options=nil)
        res_data=data.collect {|d|
            @columns.collect {|c|
                @table[c][:proc].call(d, @ext).to_s if @table[c]
            }
        }
        
        if options
            filter_data!(res_data, options[:filter]) if options[:filter]
            sort_data!(res_data, options[:order]) if options[:order]
        end
        
        res_data
    end

    def format_data(field, data)
        minus=( @table[field][:left] ? "-" : "" )
        size=@table[field][:size]
        "%#{minus}#{size}.#{size}s" % [ data.to_s ]
    end
    
    def get_order_column(column)
        desc=column.match(/^-/)
        col_name=column.gsub(/^-/, '')
        index=@columns.index(col_name.to_sym)
        [index, desc]
    end
    
    def sort_data!(data, order)
        data.sort! {|a,b|
            # rows are equal by default
            res=0
            order.each {|o|
                # compare
                pos, dec=get_order_column(o)
                break if !pos
                
                r = (b[pos]<=>a[pos])
                
                # if diferent set res (return value) and exit loop
                if r!=0
                    # change sign if the order is decreasing
                    r=-r if dec
                    res=r
                    break
                end
            }
            res
        }
    end
    
    def filter_data!(data, filters)
        filters.each {|key, value|
            pos=@columns.index(key.downcase.to_sym)
            if pos
                data.reject! {|d|
                    if !d[pos]
                        true
                    else
                        !d[pos].downcase.match(value.downcase)
                    end
                }
            end
        }
    end
    
    def print_help
        text=[]
        @table.each {|option, data|
            next if option==:default
            text << "%9s (%2d) => %s" % [option, data[:size], data[:desc]]
        }
        text.join("\n")
    end
    
end


################
# Miscelaneous #
################

def check_parameters(name, number)
    if ARGV.length < number
        print "Command #{name} requires "
        if number>1
            puts "#{number} parameters to run."
        else
            puts "one parameter to run"
        end
        exit -1
    end
end


def get_vm_id(vm, name)
    vm_id=vm.get_vm_id(name)
    
    result=nil
    
    if vm_id
        if vm_id.kind_of?(Array)
            puts "There are multiple VM's with name #{name}."
            exit -1
        else
            result=vm_id
        end
    else
        puts "VM named #{name} not found."
        exit -1
    end
    
    result
end

def get_host_id(host, name)
    host_id=host.get_host_id(name)
    
    result=nil
    
    if host_id
        if host_id.kind_of?(Array)
            puts "There are multiple hosts with name #{name}."
            exit -1
        else
            result=host_id
        end
    else
        puts "Host named #{name} not found."
        exit -1
    end
    
    result
end
