# Copyright (c) 2010 VMware, Inc.  All Rights Reserved.
require 'pp'
require 'set'

module RbVmomi
module BasicTypes

BUILTIN = Set.new %w(ManagedObject DataObject TypeName PropertyPath ManagedObjectReference MethodName MethodFault LocalizedMethodFault KeyValue)

class Base
  class << self
    attr_accessor :wsdl_name

    def init wsdl_name=self.name
      @wsdl_name = wsdl_name
    end

    def to_s
      @wsdl_name
    end
  end

  init
end

class ObjectWithProperties < Base
  class << self
    attr_accessor :props_desc

    def init name=self.name, props=[]
      super name
      @props_desc = props
      @props_desc.each do |d|
        sym = d['name'].to_sym
        define_method(sym) { _get_property sym }
        define_method(:"#{sym}=") { |x| _set_property sym, x }
      end
    end

    def full_props_set
      @full_props_set ||= Set.new(full_props_desc.map { |x| x['name'] })
    end

    def full_props_desc
      @full_props_desc ||= (self == ObjectWithProperties ? [] : superclass.full_props_desc) + props_desc
    end

    def find_prop_desc name
      full_props_desc.find { |x| x['name'] == name.to_s }
    end
  end

  def _get_property sym
    fail 'unimplemented'
  end

  def _set_property sym, val
    fail 'unimplemented'
  end

  init
end

class ObjectWithMethods < ObjectWithProperties
  class << self
    attr_accessor :methods_desc

    def init name=self.name, props=[], methods={}
      super name, props
      @methods_desc = methods

      @methods_desc.each do |k,d|
        sym = k.to_sym
        define_method(sym) { |*args| _call sym, *args }
        define_method(:"#{sym}!") { |*args| _call sym, *args }
      end
    end

    # XXX cache
    def full_methods_desc
      (self == ObjectWithMethods ? {} : superclass.full_methods_desc).merge methods_desc
    end
  end

  init
end

class DataObject < ObjectWithProperties
  attr_reader :props

  def self.kind; :data end

  def initialize props={}
    # Deserialization fast path
    if props == nil
      @props = {}
      return
    end

    @props = Hash[props.map { |k,v| [k.to_sym, v] }]
    #self.class.full_props_desc.each do |desc|
      #fail "missing required property #{desc['name'].inspect} of #{self.class.wsdl_name}" if @props[desc['name'].to_sym].nil? and not desc['is-optional']
    #end
    @props.each do |k,v|
      fail "unexpected property name #{k}" unless self.class.find_prop_desc(k)
    end
  end

  def initialize_copy(source)  
    super  
    @props = @props.dup  
  end 

  def _get_property sym
    @props[sym]
  end

  def [] sym
    _get_property sym
  end

  def _set_property sym, val
    @props[sym] = val
  end

  def []= sym, val
    _set_property sym, val
  end

  def == o
    return false unless o.class == self.class
    keys = (props.keys + o.props.keys).uniq
    keys.all? { |k| props[k] == o.props[k] }
  end

  alias eql? ==

  def hash
    props.hash
  end

  def pretty_print q
    q.text self.class.wsdl_name
    q.group 2 do
      q.text '('
      q.breakable
      props = @props.sort_by { |k,v| k.to_s }
      q.seplist props, nil, :each do |e|
        k, v = e
        q.group do
          q.text k.to_s
          q.text ': '
          q.pp v
        end
      end
    end
    q.breakable
    q.text ')'
  end

  init
end

class ManagedObject < ObjectWithMethods
  def self.kind; :managed end

  def initialize connection, ref
    super()
    @connection = connection
    @soap = @connection # XXX deprecated
    @ref = ref
  end

  def _connection
    @connection
  end

  def _ref
    @ref
  end

  def _get_property sym
    ret = @connection.propertyCollector.RetrieveProperties(:specSet => [{
      :propSet => [{ :type => self.class.wsdl_name, :pathSet => [sym.to_s] }],
      :objectSet => [{ :obj => self }],
    }])[0]

    if !ret
      return nil
    elsif ret.propSet.empty?
      return nil if ret.missingSet.empty?
      raise ret.missingSet[0].fault
    else
      ret.propSet[0].val
    end
  end

  def _set_property sym, val
    fail 'unimplemented'
  end

  def _call method, o={}
    fail "parameters must be passed as a hash" unless o.is_a? Hash
    desc = self.class.full_methods_desc[method.to_s] or fail "unknown method"
    @connection.call method, desc, self, o
  end

  def to_s
    "#{self.class.wsdl_name}(#{@ref.inspect})"
  end

  def pretty_print pp
    pp.text to_s
  end

  def [] k
    _get_property k
  end

  def == x
    out = (x.class == self.class && x._ref == @ref) 
    out = (x._connection.instanceUuid == self._connection.instanceUuid) if out && x._connection.host
    out
  end

  alias eql? ==

  def hash
    [self.class, @ref].hash
  end

  init 'ManagedObject'
end

class Enum < Base
  class << self
    attr_accessor :values

    def init name=self.name, values=[]
      super name
      @values = values
    end
  end

  def self.kind; :enum end

  attr_reader :value

  def initialize value
    @value = value
  end

  init
end

class MethodFault < DataObject
  init 'MethodFault', [
    {
      'name' => 'faultCause',
      'wsdl_type' => 'LocalizedMethodFault',
      'is-array' => false,
      'is-optional' => true,
    }, {
      'name' => 'faultMessage',
      'wsdl_type' => 'LocalizableMessage',
      'is-array' => true,
      'is-optional' => true,
    },
  ]

  def self.=== exn
    exn.class == RbVmomi::Fault and self <= exn.fault.class
  end
end

class LocalizedMethodFault < DataObject
  init 'LocalizedMethodFault', [
    {
      'name' => 'fault',
      'wsdl_type' => 'MethodFault',
      'is-array' => false,
      'is-optional' => false,
    }, {
      'name' => 'localizedMessage',
      'wsdl_type' => 'xsd:string',
      'is-array' => false,
      'is-optional' => true,
    },
  ]

  def exception
    RbVmomi::Fault.new(self.localizedMessage, self.fault)
  end
end

class RuntimeFault < MethodFault
  init
end

class MethodName < String
  def self.wsdl_name; 'MethodName' end
end

class PropertyPath < String
  def self.wsdl_name; 'PropertyPath' end
end

class TypeName < String
  def self.wsdl_name; 'TypeName' end
end

class ManagedObjectReference
  def self.wsdl_name; 'ManagedObjectReference' end
end

class Boolean
  def self.wsdl_name; 'xsd:boolean' end
end

class AnyType
  def self.wsdl_name; 'xsd:anyType' end
end

class Binary
  def self.wsdl_name; 'xsd:base64Binary' end
end

class ::Class
  def wsdl_name; self.class.name end
end

class ::String
  def self.wsdl_name; 'xsd:string' end
end

class ::Integer
  def self.wsdl_name; 'xsd:int' end
end

class ::Float
  def self.wsdl_name; 'xsd:float' end
end

class Int
  def self.wsdl_name; 'xsd:int' end
  
  def initialize x
    @val = x
  end
  
  def to_s
    @val.to_s
  end
end

class KeyValue
  def self.wsdl_name; 'KeyValue' end
  attr_accessor :key, :value

  def initialize k, v
    @key = k
    @value = v
  end

  def [] i
    if i == 0 then @key
    elsif i == 1 then @value
    else fail "invalid index #{i.inspect}"
    end
  end
end


end
end
