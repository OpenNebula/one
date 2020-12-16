require 'time'
require 'active_support/concern'

module Packet
  module Entity
    module Timestamps
      extend ActiveSupport::Concern

      DEFAULT_TIMESTAMPS = [:created_at, :updated_at].freeze

      module ClassMethods
        def has_timestamps(timestamps = DEFAULT_TIMESTAMPS)
          timestamps.each { |timestamp| casts(timestamp, ->(value) { Time.parse(value) }) }
        end
      end
    end
  end
end
