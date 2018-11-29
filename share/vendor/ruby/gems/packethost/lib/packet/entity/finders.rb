require 'active_support/inflector'
require 'active_support/concern'

module Packet
  module Entity
    module Finders
      extend ActiveSupport::Concern

      module ClassMethods
        def all(params = {}, client = nil)
          (client || Packet.client).send(:"list_#{resource_name.pluralize}", params)
        end

        def find(id, params = {}, client = nil)
          (client || Packet.client).send(:"get_#{resource_name}", id, params)
        end
      end
    end
  end
end
