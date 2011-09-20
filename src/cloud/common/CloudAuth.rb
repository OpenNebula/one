class CloudAuth
    AUTH_MODULES = {
        "basic" => 'BasicCloudAuth',
        "ec2"   => 'EC2CloudAuth',
        "x509"  => 'X509CloudAuth'
    }

    attr_reader :client, :token

    def initialize(conf)
        @xmlrpc = conf[:one_xmlrpc]

        if AUTH_MODULES.include?(conf[:auth])
            require 'CloudAuth/' + AUTH_MODULES[conf[:auth]]
            extend Kernel.const_get(AUTH_MODULES[conf[:auth]])
        else
            raise "Auth module not specified"
        end
    end

    protected

    def get_password(username)
        @oneadmin_client ||= OpenNebula::Client.new(nil, @xmlrpc)

        if @user_pool.nil?
            @user_pool ||= OpenNebula::UserPool.new(@oneadmin_client)

            rc = @user_pool.info
            if OpenNebula.is_error?(rc)
                raise rc.message
            end
        end

        return @user_pool["USER[NAME=\"#{username}\"]/PASSWORD"]
    end
end