require_relative 'app'

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

# The PKI resource (CA certificate download) is served over plain HTTP, any
# other request arriving on the plain HTTP listener is redirected to HTTPS
class HttpsRedirect

    PKI_PATH = '/ovirt-engine/services/pki-resource'

    def initialize(app)
        @app = app
    end

    def call(env)
        req = Rack::Request.new(env)

        if !req.ssl? && !req.path_info.casecmp?(PKI_PATH)
            return [301, { 'location' => "https://#{req.host}#{req.fullpath}" }, []]
        end

        @app.call(env)
    end

end

use FilteredLogger
use HttpsRedirect

run Sinatra::Application
