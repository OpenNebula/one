module Packet
  class User
    include Entity

    attr_accessor :first_name
    attr_accessor :last_name
    # attr_accessor :full_name
    attr_accessor :email
    attr_accessor :avatar_url
    attr_accessor :timezone

    has_timestamps
  end
end
