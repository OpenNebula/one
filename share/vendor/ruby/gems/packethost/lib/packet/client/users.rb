module Packet
  class Client
    module Users
      def get_user(id, *args)
        Packet::User.new(get("users/#{id}", *args).body, self)
      end
    end
  end
end
