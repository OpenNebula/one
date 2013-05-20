coverage_tool = :simplecov if ENV['RBVMOMI_COVERAGE']

case coverage_tool
when :simplecov
  require 'simplecov'
  SimpleCov.start
when :cover_me
  require 'cover_me'
end

require 'rbvmomi'
VIM = RbVmomi::VIM

require 'test/unit'
