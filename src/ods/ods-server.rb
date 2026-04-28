# -------------------------------------------------------------------------- #
# Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                #
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

require_relative 'config/environment'

module OpenNebula

    module DocumentServer

        # ODS Server
        class Base < Sinatra::Base

            configure do
                SERVER_CONF[:server].each do |key, value|
                    set key, value
                end

                # Configure custom logger
                disable :logging
                set :logger, Log.instance(SERVER_CONF[:log])
                use Rack::CommonLogger, logger
                use Rack::Session::Pool, :key => ODS_NAME

                set :log_auth_factory, lambda { |client, id, _resource_name|
                    Document.new_from_id(client, id, :raw => true)
                }
            end

            # Environments
            configure :development do
                set :dump_errors, true
                set :raise_errors, true
                set :show_exceptions, true
            end

            configure :production do
                set :dump_errors, false
                set :raise_errors, false
                set :show_exceptions, false
                enable :sessions, :protection
            end

            register AppRoutes
            run! if app_file == $PROGRAM_NAME

        end

    end

end

# Prevent crashes during Ruby shutdown caused by GC finalizer ordering:
#
#   1) SIGSEGV: FFI::DynamicLibrary's C-level destructor calls dlclose() on
#      libzmq, unmapping its code while ZMQ I/O threads still execute it.
#      On Ruby 3.4+, FFI objects are frozen (Ractor-safety), so
#      ObjectSpace.undefine_finalizer raises FrozenError — cannot suppress.
#      Fix: pin libzmq via Fiddle.dlopen with close disabled, adding a dlopen
#      refcount that is never decremented (leaked; OS reclaims on exit)
#
#   2) Deadlock: ZMQ::Context finalizer calls zmq_ctx_term which blocks if
#      sockets are still open (GC order is undefined)
#      Fix: suppress the ZMQ::Context finalizer (not frozen, works on all Rubies)
at_exit do
    # Suppress ZMQ::Context finalizer to prevent zmq_ctx_term deadlock.
    ObjectSpace.each_object(ZMQ::Context) do |c|
        ObjectSpace.undefine_finalizer(c) rescue nil
    end

    # Pin libzmq in memory to prevent SIGSEGV from dlclose.
    begin
        require 'fiddle'
        zmq_handle = Fiddle.dlopen('libzmq.so.5')
        zmq_handle.disable_close
    rescue StandardError
        # Fallback for systems without Fiddle or different soname;
        # works on Ruby < 3.4 where FFI objects are not frozen.
        ObjectSpace.each_object(FFI::DynamicLibrary) do |lib|
            ObjectSpace.undefine_finalizer(lib) rescue nil
        end
    end
end
