require 'active_support/concern'
require 'packet/entity/base'
require 'packet/entity/associations'
require 'packet/entity/finders'
require 'packet/entity/persistence'
require 'packet/entity/serialization'
require 'packet/entity/timestamps'

module Packet
  module Entity
    extend ActiveSupport::Concern

    included do
      include(Base)
      include(Associations)
      include(Finders)
      include(Persistence)
      include(Serialization)
      include(Timestamps)
    end
  end
end
