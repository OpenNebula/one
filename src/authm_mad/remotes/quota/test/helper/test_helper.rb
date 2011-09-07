
ONE_LOCATION = ENV['ONE_LOCATION']
if !ONE_LOCATION
    RUBY_LIB_LOCATION="/usr/lib/one/ruby"
else
    RUBY_LIB_LOCATION=ONE_LOCATION+"/lib/ruby"
end

$: << RUBY_LIB_LOCATION

$: << './helper'
$: << '.'
$: << '..'

require 'mock_client'
require 'OpenNebula'
require 'quota'

class Quota
    def set_client(client)
        @client = client
    end

    def rm_and_set_testdb
        `rm -f /tmp/onequota_test.db`
        @db=Sequel.connect("sqlite:///tmp/onequota_test.db")

        create_table(QUOTA_TABLE)
        create_table(USAGE_TABLE)
    end
end
