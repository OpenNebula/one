require 'active_support/inflector'
require 'active_support/concern'
require 'active_support/core_ext/class/attribute'
require 'active_support/core_ext/module/delegation'

module Packet
  module Entity
    module Base
      extend ActiveSupport::Concern

      included do
        class_attribute :_casts
        self._casts = {}

        attr_accessor :id
        attr_writer :client
        delegate :resource_name, to: :class
      end

      def initialize(attributes = {}, client = nil)
        self.client = client
        update_attributes(attributes)
      end

      def update_attributes(attributes = {})
        attributes.each_pair do |attribute, value|
          setter = "#{attribute}="
          send(setter, _cast_value(attribute, value)) if respond_to?(setter)
        end
      end

      def client
        @client || Packet.client
      end

      module ClassMethods
        def casts(attribute, transformer)
          _casts[attribute.to_sym] = transformer
          attr_accessor attribute.to_sym
        end

        def resource_name
          to_s.demodulize.underscore
        end
      end

      private

      def _cast_value(attribute, value)
        if self.class._casts.key?(attribute.to_sym)
          callback = self.class._casts[attribute.to_sym]
          instance_exec(value, &callback)
        else
          value
        end
      end
    end
  end
end
