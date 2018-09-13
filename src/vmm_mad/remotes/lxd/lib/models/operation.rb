#!/usr/bin/ruby

class Operation
  def initialize(name)
    @name = name # Client.containers.get(container) or .create(container)
  end

  # Wait for the operation to complete and return.
  def wait; end
end
