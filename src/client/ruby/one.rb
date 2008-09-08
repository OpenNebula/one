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


begin
    require 'rubygems'
rescue Exception
end
require 'sqlite3'
require 'xmlrpc/client'
require 'pp'

module ONE
    
    ########################
    # DATABASE DEFINITIONS #
    ########################
    
    ONE_LOCATION=ENV["ONE_LOCATION"]
    
    TABLES={
        "vmpool" => %w{oid aid tid uid priority reschedule last_reschedule 
            last_poll template state lcm_state stime etime deploy_id memory
            cpu net_tx net_rx},
        "history" => %w{oid seq hostname vm_dir hid vmmad tmmad stime
            etime pstime petime rstime retime estime eetime reason},
        "vm_template" => %w{id name type value},
        "hostpool" => %w{hid host_name state im_mad vm_mad tm_mad
            last_mon_time managed},
        "host_attributes" => %w{id name type value},
        "hostshares" => %w{hsid endpoint disk_usage mem_usage
            cpu_usage max_disk max_mem max_cpu running_vms}
    }
    
    
    #######################
    # ENUMS AND CONSTANTS #
    #######################
    
    VM_STATE=%w{INIT PENDING HOLD ACTIVE STOPPED SUSPENDED DONE FAILED}
    
    LCM_STATE=%w{LCM_INIT PROLOG BOOT RUNNING MIGRATE SAVE_STOP SAVE_SUSPEND
        SAVE_MIGRATE PROLOG_MIGRATE EPILOG_STOP EPILOG SHUTDOWN CANCEL}
    
    HOST_STATE=%w{INIT MONITORING MONITORED ERROR DISABLED}
    
    MIGRATE_REASON=%w{NONE ERROR STOP_RESUME USER CANCEL}


    ##################
    # HELPER CLASSES #
    ##################
    
    # Server class. This is the one that makes xml-rpc calls.
    class Server
        def initialize(endpoint=nil)
            if endpoint
                one_endpoint=endpoint
            elsif ENV["ONE_XMLRPC"]
                one_endpoint=ENV["ONE_XMLRPC"]
            else
                one_endpoint="http://localhost:2633/RPC2"
            end
            @server=XMLRPC::Client.new2(one_endpoint)
        end

        def call(action, *args)
            begin
                response=@server.call("one."+action, "sessionID", *args)
                response<<nil if response.length<2
                response
            rescue Exception => e
                [false, e.message]
            end
        end
    end
    
    
    # This class has the functions to access to the database
    class Database
        attr_reader :db
        
        def initialize(file=ONE_LOCATION+"/var/one.db")
            @db=SQLite3::Database.new(file)
            @db.busy_timeout(5000)
            
            @db.busy_handler do |data, retries|
                if retries < 3
                    puts "Timeout connecting to the database, retrying. "+
                            "Tries left #{2-retries}"
                    sleep 1
                    1
                else
                    0
                end
            end
        end
        
        def select_table_with_names(table, options=nil)
            options=Hash.new if !options
            where_clause=( options[:where] ? "where #{options[:where]}" : "" )
            order_clause=( options[:order] ? "order by #{options[:order]}" : "" )
            
            sql="select * from #{table} #{where_clause} #{order_clause}"
            begin
                result=@db.execute(sql)
            rescue Exception => e
                result=[false, e.message]
                return result
            end
            
            res=result.collect {|row|
                r=Hash.new
                TABLES[table].each_with_index {|value, index|
                    r[value]=row[index]
                }
                r
            }
            return [true,res]
        end
        
        def close
            @db.close
        end
    end
    
    # Prototype class to call server actions
    class CommandContainer
        def initialize(server)
            @server=server
        end
        
        # Magic goes here. This function converts each argument
        # using description provided by a hash returned by "commands"
        # method. If the position contains a nil or false the
        # argument is not converted (right now used for booleans).
        def call_method(name, *_args)
            args=[]
            _args.flatten!
            _args.each_with_index {|v,i|
                if self.commands[name][i]
                    args << v.send(self.commands[name][i])
                else
                    args << v
                end
            }
            
            @server.call(prefix+name.gsub(/_$/, ""), *args)
        end
        
        def method_missing(method, *args)
            if self.commands.has_key?(method.to_s)
                call_method(method.to_s, args)
            else
                raise NoMethodError
            end
        end
       
        # This method should return a hash with action names
        # and an array with methods to convert the arguments.
        def commands
            {}
        end
        
        def prefix
            ""
        end
    end
    
    
    ###########################
    # ONE ABSTRACTION CLASSES #
    ###########################
    
    class VM < CommandContainer
        
        SHORT_VM_STATES={
            "INIT"      => "init",
            "PENDING"   => "pend",
            "HOLD"      => "hold",
            "ACTIVE"    => "actv",
            "STOPPED"   => "stop",
            "SUSPENDED" => "susp",
            "DONE"      => "done",
            "FAILED"    => "fail"
        }

        SHORT_LCM_STATES={
            "PROLOG"        => "prol",
            "BOOT"          => "boot",
            "RUNNING"       => "runn",
            "MIGRATE"       => "migr",
            "SAVE_STOP"     => "save",
            "SAVE_SUSPEND"  => "save",
            "SAVE_MIGRATE"  => "save",
            "PROLOG_MIGRATE"=> "migr",
            "EPILOG_STOP"   => "epil",
            "EPILOG"        => "epil",
            "SHUTDOWN"      => "shut",
            "CANCEL"        => "shut"
        }
        
        SHORT_MIGRATE_REASON={
            "NONE"          => "none",
            "ERROR"         => "erro",
            "STOP_RESUME"   => "stop",
            "USER"          => "user",
            "CANCEL"        => "canc"
        }
        

        def commands
            {
                "allocate_" => [:to_s],
                "deploy"    => [:to_i, :to_i],
                "action"    => [:to_s, :to_i],
                "migrate_"  => [:to_i, :to_i, nil],
                "get_info"  => [:to_i],
                "cancel"    => [:to_i]
            }
        end
        
        def prefix
            "vm"
        end
        
        def allocate(*args)
            begin
                f=open(args[0], "r")
                template=f.read
                f.close
            rescue
                return [false, "Can not read template"]
            end
            
            self.allocate_(template)
        end
        
        def migrate(*args)
            self.migrate_(args[0], args[1], false)
        end

        def livemigrate(*args)
            self.migrate_(args[0], args[1], true)
        end
        
        def shutdown(*args)
            self.action("shutdown", args[0])
        end

        def hold(*args)
            self.action("hold", args[0])
        end
        
        def release(*args)
            self.action("release", args[0])
        end
        
        def stop(*args)
            self.action("stop", args[0])
        end
        
        def cancel(*args)
            self.action("cancel", args[0])
        end
        
        def suspend(*args)
            self.action("suspend", args[0])
        end
        
        def resume(*args)
            self.action("resume", args[0])
        end
        
        def delete(*args)
            self.action("finalize", args[0])
        end
        
        def get(options=nil)
            begin
                @db=Database.new
            
                res=@db.select_table_with_names("vmpool", options)
            
                @db.close
                
                result=res
            rescue
                result=[false, "Error accessing database"]
            end
            
            result
        end
        
        def get_vms(options=nil)
            res=self.get(options)
            if res[0]
                res[1].each {|row|
                    hostname=self.get_history_host(row["oid"])
                    row["hostname"]=hostname
                }
            end
            res
        end
        
        
        ###########
        # HELPERS #
        ###########
        
        def get_history_host(id, db=nil)
            if db
                my_db=db
            else
                my_db=Database.new
            end
            
            res=my_db.select_table_with_names("history", :where => "oid=#{id}")
            
            my_db.close if !db
            
            if res and res[0] and res[1] and res[1][-1]
                return hostname=res[1][-1]["hostname"]
            else
                return nil
            end
        end
        
        def get_history(id, db=nil)
            if db
                my_db=db
            else
                my_db=Database.new
            end
            
            res=my_db.select_table_with_names("history", :where => "oid=#{id}")
            
            my_db.close if !db

            return res
        end
        
        def get_template(id, db=nil)
            if db
                my_db=db
            else
                my_db=Database.new
            end
            
            res=my_db.select_table_with_names("vm_template", :where => "id=#{id}")
            
            my_db.close if !db
            
            if res && res[0]
                template=Hash.new
                res[1].each {|v|
                    name=v["name"]
                    type=v["type"]
                    value=v["value"]
                    if type=="0"
                        template[name]=value
                    else
                        template[name]=Hash.new
                        value.split(',').each {|v2|
                            name2, value2=v2.split("=")
                            template[name][name2]=value2
                        }
                    end
                }
                template
            else
                nil
            end
        end
        
        def get_state(data)
            vm_state=ONE::VM_STATE[data["state"].to_i]
            state_str=SHORT_VM_STATES[vm_state]

            if state_str=="actv"
                lcm_state=ONE::LCM_STATE[data["lcm_state"].to_i]
                state_str=SHORT_LCM_STATES[lcm_state]
            end

            state_str
        end
        
        def get_reason(data)
            reason=ONE::MIGRATE_REASON[data["reason"].to_i]
            reason_str=SHORT_MIGRATE_REASON[reason]

            reason_str
        end
        
        def str_running_time(data)
            stime=Time.at(data["stime"].to_i)
            if data["etime"]=="0"
                etime=Time.now
            else
                etime=Time.at(data["etime"].to_i)
            end
            dtime=Time.at(etime-stime).getgm

            "%02d %02d:%02d:%02d" % [dtime.yday-1, dtime.hour, dtime.min, dtime.sec]
        end
        
        def get_vm_id(name)
            vm_id=name.strip
            # Check if the name is not a number (is not an ID)
            vm_id=get_vm_from_name(vm_id) if !vm_id.match(/^[0123456789]+$/)
            return vm_id
        end
        
        # Gets vm ids which name is "name"
        # Returns:
        #   nil if not vm has that name
        #   id if there is only one vm with that name
        #   array of ids if there is more than one vm
        def get_vm_from_name(name)
            db=Database.new
            res_template=db.select_table_with_names(
                                "vm_template", 
                                :where => "name=\"NAME\" AND value=\"#{name}\"")
            
            return nil if !res_template[0] or res_template[1].length<1
            
            selected_vms=res_template[1].collect {|sel_template|
                template_id=sel_template["id"]
                res_vm=get(:where => "template=#{template_id}")
                if !res_vm[0] or res_vm[1].length<1
                    nil
                else
                    res_vm[1].collect {|vm|
                        vm["oid"]
                    }
                end
            }
            
            selected_vms.flatten!
            selected_vms.compact!

            case selected_vms.length
            when 0
                nil
            when 1
                selected_vms[0]
            else
                selected_vms
            end
        end
    end
    
    
    class Host < CommandContainer
                
        SHORT_HOST_STATES={
            "INIT"          => "on",
            "MONITORING"    => "on",
            "MONITORED"     => "on",
            "ERROR"         => "err",
            "DISABLED"      => "off",
        }
        
        def commands
            {
                "allocate_" => [:to_s, :to_s, :to_s, :to_s, nil],
                "info"      => [:to_i],
                "delete"    => [:to_i],
                "enable_"   => [:to_i, nil]
            }
        end
        
        def allocate(*args)
            case args[4]
            when /^true$/i, 1
                managed=true
            when /^false$/i, 0
                managed=false
            else
                puts "Error, use true/false or 0/1 for managed parameter"
                exit -1
            end
            self.allocate_( args[0..3]<<managed )
        end
        
        def enable(*args)
            self.enable_(args[0], true)
        end
        
        def disable(*args)
            self.enable_(args[0], false)
        end
        
        def get_generic(table, options=nil)
            begin
                @db=Database.new
            
                res=@db.select_table_with_names(table, options)
            
                @db.close
                
                result=res
            rescue
                result=[false, "Error accessing database"]
            end
            
            result
        end
        
        def get(options=nil)
            get_generic("hostpool", options)
        end
        
        def get_host_attributes(hid)
            get_generic("host_attributes", :where => "id=#{hid}")
        end
        
        def get_host_share(hid)
            get_generic("hostshares", :where => "hsid=#{hid}")
        end
        
        def prefix
            "host"
        end
        
        
        ###########
        # HELPERS #
        ###########
        
        def get_state(data)
            host_state=ONE::HOST_STATE[data["state"].to_i]
            state_str=SHORT_HOST_STATES[host_state]

            state_str
        end
        
        def get_host_id(name)
            host_id=name.strip
            # Check if the name is not a number (is not an ID)
            host_id=get_host_from_name(host_id) if !host_id.match(/^[0123456789]+$/)
            return host_id
        end
        
        def get_host_from_name(name)
            res=get(:where => "host_name=\"#{name}\"")
            
            return nil if !res[0] or res[1].length<1
            
            if res[1].length==1
                return res[1][0]["hid"]
            else
                return res[1].collect {|host| host["hid"] }
            end
        end
    end
    
end
