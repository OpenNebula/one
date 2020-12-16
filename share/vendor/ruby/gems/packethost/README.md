Packet
======

A Ruby client for the Packet API.

[![Build Status](https://travis-ci.org/packethost/packet-rb.svg)](https://travis-ci.org/packethost/packet-rb)

Configuration
-------------

You can either configure the library in a global way (easier):

    Packet.configure do |config|
      config.auth_token = 'my_token'
    end

or create and use an individual instance of `Packet::Client` (more complex):

    Packet::Client.new(auth_token)

Generally speaking, you'll probably want to configure it globally if you only
ever use a single API token.

Usage
-----

If you configured the library globally, you can just call methods on the
`Packet` module. For example:

    Packet.list_projects
    => [#<Packet::Project>, #<Packet::Project>]

If you configured a `Packet::Client` manually, you can call those same methods
on the client itself:

    client = Packet::Client.new( ... )
    client.list_projects
    => [#<Packet::Project>, #<Packet::Project>]

See a [list of available methods](https://github.com/packethost/packet-rb/tree/master/lib/packet/client).

Contributing
------------

* Check out the latest master to make sure the feature hasn't been implemented or the bug hasn't been fixed yet.
* Check out the issue tracker to make sure someone already hasn't requested it and/or contributed it.
* Fork the project.
* Start a feature/bugfix branch.
* Commit and push until you are happy with your contribution.
* Make sure to add tests for it. This is important so we don't break it in a future version unintentionally. You can run the test suite with `bundle exec rake`.
* Please try not to mess with the Rakefile, version, or history. If you want to have your own version, or is otherwise necessary, that is fine, but please isolate to its own commit so we can cherry-pick around it.

Copyright
---------

Copyright (c) 2015 Packet Host. See `LICENSE` for further details.
