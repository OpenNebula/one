require './app'

Sinatra::Application.set :logging, false

# Custom logger to filter out specific requests
class FilteredLogger < Rack::CommonLogger

    def log(env, status, header, began_at)
        if env['PATH_INFO'] == '/ovirt-engine/sso/oauth/token'
            return # Skip logging the token endpoint
        end

        super # Otherwise, proceed with standard logging
    end

end

use FilteredLogger

run Sinatra::Application
