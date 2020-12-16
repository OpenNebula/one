require 'active_support/concern'

module Packet
  module Entity
    module Persistence
      extend ActiveSupport::Concern

      def save!
        if id
          client.send("update_#{resource_name}", self)
        else
          client.send("create_#{resource_name}", self)
        end
        true
      end

      def destroy!
        client.send("delete_#{resource_name}", self)
        true
      end

      module ClassMethods
        def create!(attributes = {}, client = nil)
          new(attributes, client).tap(&:save!)
        end

        def destroy!(id, client = nil)
          (client || Packet.client).send("delete_#{resource_name}", id)
          true
        end
      end
    end
  end
end
