APPMARKET_CONF_FILE = ETC_LOCATION + "/sunstone-appmarket.conf"

$: << RUBY_LIB_LOCATION+"/apptools/market"

require 'appmarket_client'

begin
    appmarket_conf = YAML.load_file(APPMARKET_CONF_FILE)
rescue Exception => e
    STDERR.puts "Error parsing config file #{APPMARKET_CONF_FILE}: #{e.message}"
    exit 1
end

set :appmarket_config, appmarket_conf

helpers do
    def am_build_client
        Market::ApplianceClient.new(
            settings.appmarket_config[:marketplace_username],
            settings.appmarket_config[:marketplace_password],
            settings.appmarket_config[:marketplace_url],
            "Sunstone")
    end

    def am_format_response(response)
        if CloudClient::is_error?(response)
            error = Error.new(response.to_s)
            [response.code.to_i, error.to_json]
        else
            [200, response.body]
        end
    end
end

get '/appmarket' do
    client = am_build_client

    response = client.list

    am_format_response(response)
end

get '/appmarket/:id' do
    client = am_build_client

    response = client.show(params[:id])

    am_format_response(response)
end