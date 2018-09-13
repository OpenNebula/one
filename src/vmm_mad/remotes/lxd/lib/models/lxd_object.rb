#!/usr/bin/ruby

require_relative 'requests'

class LXDObject
  attr_reader :uri

  def initialize(uri)
    @uri = uri
    @dirty = false
  end

  def sync; end

  def rollback; end

  def save; end
end
