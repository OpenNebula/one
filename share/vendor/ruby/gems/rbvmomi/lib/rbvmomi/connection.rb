# Copyright (c) 2010 VMware, Inc.  All Rights Reserved.
require 'time'
require 'date'
require 'rbvmomi/trivial_soap'
require 'rbvmomi/basic_types'
require 'rbvmomi/fault'
require 'rbvmomi/type_loader'
require 'rbvmomi/deserialization'

module RbVmomi

IS_JRUBY = RUBY_PLATFORM == 'java'

class DeserializationFailed < Exception; end

class Connection < TrivialSoap
  NS_XSI = 'http://www.w3.org/2001/XMLSchema-instance'

  attr_accessor :rev
  attr_reader :profile
  attr_reader :profile_summary
  attr_accessor :profiling
  attr_reader :deserializer
  
  def initialize opts
    @ns = opts[:ns] or fail "no namespace specified"
    @rev = opts[:rev] or fail "no revision specified"
    @deserializer = Deserializer.new self
    reset_profiling
    @profiling = false
    super opts
  end
  
  def reset_profiling
    @profile = {}
    @profile_summary = {:network_latency => 0, :request_emit => 0, :response_parse => 0, :num_calls => 0}
  end

  def emit_request xml, method, descs, this, params
    xml.tag! method, :xmlns => @ns do
      obj2xml xml, '_this', 'ManagedObject', false, this
      descs.each do |d|
        k = d['name']
        k = k.to_sym if !params.member?(k) && params.member?(k.to_sym)
        v = params[k]
        if not v == nil
          obj2xml xml, d['name'], d['wsdl_type'], d['is-array'], v
        else
          fail "missing required parameter #{d['name']}" unless d['is-optional']
        end
      end
    end
  end

  def parse_response resp, desc
    if resp.at('faultcode')
      detail = resp.at('detail')
      fault = detail && @deserializer.deserialize(detail.children.first, 'MethodFault')
      msg = resp.at('faultstring').text
      if fault
        raise RbVmomi::Fault.new(msg, fault)
      else
        fail "#{resp.at('faultcode').text}: #{msg}"
      end
    else
      if desc
        type = desc['is-task'] ? 'Task' : desc['wsdl_type']
        returnvals = resp.children.select(&:element?).map { |c| @deserializer.deserialize c, type }
        (desc['is-array'] && !desc['is-task']) ? returnvals : returnvals.first
      else
        nil
      end
    end
  end

  def call method, desc, this, params
    fail "this is not a managed object" unless this.is_a? BasicTypes::ManagedObject
    fail "parameters must be passed as a hash" unless params.is_a? Hash
    fail unless desc.is_a? Hash

    t1 = Time.now
    body = soap_envelope do |xml|
      emit_request xml, method, desc['params'], this, params
    end.target!

    t2 = Time.now
    resp, resp_size = request "#{@ns}/#{@rev}", body

    t3 = Time.now
    out = parse_response resp, desc['result']
    
    if @profiling
      t4 = Time.now
      @profile[method] ||= []
      profile_info = {
        :network_latency => (t3 - t2),
        :request_emit => t2 - t1,
        :response_parse => t4 - t3,
        :params => params, 
        :obj => this, 
        :backtrace => caller,
        :request_size => body.length,
        :response_size => resp_size,
      }
      @profile[method] << profile_info
      @profile_summary[:network_latency] += profile_info[:network_latency]
      @profile_summary[:response_parse] += profile_info[:response_parse]
      @profile_summary[:request_emit] += profile_info[:request_emit]
      @profile_summary[:num_calls] += 1
    end
    
    out
  end

  # hic sunt dracones
  def obj2xml xml, name, type, is_array, o, attrs={}
    expected = type(type)
    fail "expected array for '#{name}', got #{o.class.wsdl_name}" if is_array and not (o.is_a? Array or (o.is_a? Hash and expected == BasicTypes::KeyValue))
    case o
    when Array, BasicTypes::KeyValue
      if o.is_a? BasicTypes::KeyValue and expected != BasicTypes::KeyValue
        fail "expected #{expected.wsdl_name} for '#{name}', got KeyValue"
      elsif expected == BasicTypes::KeyValue and not is_array
        xml.tag! name, attrs do
          xml.tag! 'key', o[0].to_s
          xml.tag! 'value', o[1].to_s
        end
      else
        fail "expected #{expected.wsdl_name} for '#{name}', got array" unless is_array
        o.each do |e|
          obj2xml xml, name, expected.wsdl_name, false, e, attrs
        end
      end
    when BasicTypes::ManagedObject
      fail "expected #{expected.wsdl_name} for '#{name}', got #{o.class.wsdl_name} for field #{name.inspect}" if expected and not expected >= o.class and not expected == BasicTypes::AnyType
      xml.tag! name, o._ref, :type => o.class.wsdl_name
    when BasicTypes::DataObject
      if expected and not expected >= o.class and not expected == BasicTypes::AnyType
        fail "expected #{expected.wsdl_name} for '#{name}', got #{o.class.wsdl_name} for field #{name.inspect}"
      end 
      xml.tag! name, attrs.merge("xsi:type" => o.class.wsdl_name) do
        o.class.full_props_desc.each do |desc|
          if o.props.member? desc['name'].to_sym
            v = o.props[desc['name'].to_sym]
            next if v.nil?
            obj2xml xml, desc['name'], desc['wsdl_type'], desc['is-array'], v
          end
        end
      end
    when BasicTypes::Enum
      xml.tag! name, o.value.to_s, attrs
    when Hash
      if expected == BasicTypes::KeyValue and is_array
        obj2xml xml, name, type, is_array, o.to_a, attrs
      else
        fail "expected #{expected.wsdl_name} for '#{name}', got a hash" unless expected <= BasicTypes::DataObject
        obj2xml xml, name, type, false, expected.new(o), attrs
      end
    when true, false
      fail "expected #{expected.wsdl_name} for '#{name}', got a boolean" unless [BasicTypes::Boolean, BasicTypes::AnyType].member? expected
      attrs['xsi:type'] = 'xsd:boolean' if expected == BasicTypes::AnyType
      xml.tag! name, (o ? '1' : '0'), attrs
    when Symbol, String
      if expected == BasicTypes::Binary
        attrs['xsi:type'] = 'xsd:base64Binary' if expected == BasicTypes::AnyType
        xml.tag! name, [o].pack('m').chomp.gsub("\n", ""), attrs
      else
        attrs['xsi:type'] = 'xsd:string' if expected == BasicTypes::AnyType
        xml.tag! name, o.to_s, attrs
      end
    when Integer
      attrs['xsi:type'] = 'xsd:long' if expected == BasicTypes::AnyType
      xml.tag! name, o.to_s, attrs
    when Float
      attrs['xsi:type'] = 'xsd:double' if expected == BasicTypes::AnyType
      xml.tag! name, o.to_s, attrs
    when DateTime
      attrs['xsi:type'] = 'xsd:dateTime' if expected == BasicTypes::AnyType
      xml.tag! name, o.strftime('%FT%T%:z'), attrs
    when Time
      attrs['xsi:type'] = 'xsd:dateTime' if expected == BasicTypes::AnyType
      xml.tag! name, o.iso8601, attrs
    when BasicTypes::Int
      attrs['xsi:type'] = 'xsd:int'
      xml.tag! name, o.to_s, attrs
    else fail "unexpected object class #{o.class} for '#{name}'"
    end
    xml
  rescue
    $stderr.puts "#{$!.class} while serializing #{name} (#{type}):"
    PP.pp o, $stderr
    raise
  end

  def self.type name
    fail unless name and (name.is_a? String or name.is_a? Symbol)
    name = $' if name.to_s =~ /^xsd:/
    case name.to_sym
    when :anyType then BasicTypes::AnyType
    when :boolean then BasicTypes::Boolean
    when :string then String
    when :int, :long, :short, :byte then Integer
    when :float, :double then Float
    when :dateTime then Time
    when :base64Binary then BasicTypes::Binary
    when :KeyValue then BasicTypes::KeyValue
    else
      first_char = name[0].chr
      if first_char.downcase == first_char
        name = "%s%s" % [first_char.upcase, name[1..-1]]
      end

      if @loader.has? name
        const_get(name)
      else
        fail "no such type #{name.inspect}"
      end
    end
  end

  def type name
    self.class.type name
  end
  
  def instanceUuid
    nil
  end

  def self.extension_dirs
    @extension_dirs ||= []
  end

  def self.add_extension_dir dir
    extension_dirs << dir
    @loader.reload_extensions_dir dir if @loader
  end

  def self.reload_extensions
    @loader.reload_extensions
  end

  def self.loader; @loader; end

protected

  def self.const_missing sym
    name = sym.to_s
    if @loader and @loader.has? name
      @loader.get(name)
    else
      super
    end
  end

  def self.method_missing sym, *a
    name = sym.to_s
    if @loader and @loader.has? name
      @loader.get(name).new(*a)
    else
      super
    end
  end

  def self.load_vmodl fn
    @loader = RbVmomi::TypeLoader.new fn, extension_dirs, self
    nil
  end
end

end
