require 'mail'
require 'erb'

module Mailer
  MESSAGE = %q{
Hi

Your account for the OpenNebula Marketplace has been enabled

Username: <%= username %>

Please, do not forget to subscribe to the OpenNebula Marketplace mailing list [1]

* How to Develop your Appliance?
This guide [2] will show you how to create OpenNebula compatible images for the Marketplace

* How to Post your Appliance?
Log in with you Developer account int The OpenNebula Marketplace [3]. After that, you will be able to click your username in the navigation bar and select "Create new Appliance".

Kind regards

[1] http://lists.opennebula.org/listinfo.cgi/marketplace-opennebula.org
[2] http://opennebula.org/documentation:rel3.6:vm4market
[3] https://marketplace.c12g.com/
}

  if CONF['mail']
    Mail.defaults do
      delivery_method :smtp, CONF['mail']
    end

    def self.send_enable(email, username)
      Mail.deliver do
        from    CONF['mail'][:user_name]
        to      email
        subject 'OpenNebula Marketplace account'
        body    ERB.new(MESSAGE).result(binding)
      end
    end
  end
end

