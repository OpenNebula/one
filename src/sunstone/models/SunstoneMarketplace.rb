require 'marketplace/marketplace_client'

module SunstoneMarketplace
    def get_appliance_pool
        client = Market::ApplianceClient.new(
                    @config[:marketplace_username],
                    @config[:marketplace_password],
                    @config[:marketplace_url])

        response = client.list

        if CloudClient::is_error?(response)
            error = Error.new(response.to_s)
            return [response.code, error.to_json]
        end

        [200, response.body]
    end

    def get_appliance(app_id)
        client = Market::ApplianceClient.new(
                    @config[:marketplace_username],
                    @config[:marketplace_password],
                    @config[:marketplace_url])

        response = client.show(app_id)

        if CloudClient::is_error?(response)
            error = Error.new(response.to_s)
            return [response.code, error.to_json]
        end

        [200, response.body]
    end
end