require 'active_support/inflector'
require 'active_support/concern'

module Packet
  module Entity
    module Associations
      extend ActiveSupport::Concern

      module ClassMethods
        def has_one(association)
          require "packet/#{association}"
          casts(association, lambda do |value|
            klass = "Packet::#{association.to_s.classify}".constantize
            klass.new(value, client)
          end)
        end

        def has_many(association)
          require "packet/#{association.to_s.singularize}"
          casts(association, lambda do |value|
            klass = "Packet::#{association.to_s.classify}".constantize
            value.map { |v| klass.new(v, client) }
          end)
        end
      end
    end
  end
end
