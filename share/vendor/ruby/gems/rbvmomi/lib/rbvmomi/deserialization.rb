# Copyright (c) 2011 VMware, Inc.  All Rights Reserved.
require 'time'

module RbVmomi

class NewDeserializer
  NS_XSI = 'http://www.w3.org/2001/XMLSchema-instance'

  DEMANGLED_ARRAY_TYPES = {
    'AnyType' => 'xsd:anyType',
    'DateTime' => 'xsd:dateTime',
  }
  %w(Boolean String Byte Short Int Long Float Double).each do |x|
    DEMANGLED_ARRAY_TYPES[x] = "xsd:#{x.downcase}"
  end

  BUILTIN_TYPE_ACTIONS = {
    'xsd:string' => :string,
    'xsd:boolean' => :boolean,
    'xsd:byte' => :int,
    'xsd:short' => :int,
    'xsd:int' => :int,
    'xsd:long' => :int,
    'xsd:float' => :float,
    'xsd:dateTime' => :date,
    'PropertyPath' => :string,
    'MethodName' => :string,
    'TypeName' => :string,
    'xsd:base64Binary' => :binary,
    'KeyValue' => :keyvalue,
  }

  BUILTIN_TYPE_ACTIONS.dup.each do |k,v|
    if k =~ /^xsd:/
      BUILTIN_TYPE_ACTIONS[$'] = v
    end
  end

  def initialize conn
    @conn = conn
    @loader = conn.class.loader
  end

  def deserialize node, type=nil
    type_attr = node['type']

    # Work around for 1.5.x which doesn't populate node['type']
    # XXX what changed
    if node.attributes['type'] and not type_attr
      type_attr = node.attributes['type'].value
    end

    type = type_attr if type_attr

    if action = BUILTIN_TYPE_ACTIONS[type]
      case action
      when :string
        node.content
      when :boolean
        node.content == '1' || node.content == 'true'
      when :int
        node.content.to_i
      when :float
        node.content.to_f
      when :date
        leaf_date node
      when :binary
        leaf_binary node
      when :keyvalue
        leaf_keyvalue node
      else fail
      end
    else
      if type =~ /:/
        type = type.split(":", 2)[1]
      end
      if type =~ /^ArrayOf/
        type = DEMANGLED_ARRAY_TYPES[$'] || $'
        return node.children.select(&:element?).map { |c| deserialize c, type }
      end
      if type =~ /:/
        type = type.split(":", 2)[1]
      end

      klass = @loader.get(type) or fail "no such type '#{type}'"
      case klass.kind
      when :data
        traverse_data node, klass
      when :enum
        node.content
      when :managed
        leaf_managed node, klass
      else fail
      end
    end
  end

  def traverse_data node, klass
    obj = klass.new nil
    props = obj.props
    children = node.children.select(&:element?)
    n = children.size
    i = 0

    klass.full_props_desc.each do |desc|
      name = desc['name']
      child_type = desc['wsdl_type']

      # Ignore unknown fields
      while child = children[i] and not klass.full_props_set.member? child.name
        i += 1
      end

      if desc['is-array']
        a = []
        while ((child = children[i]) && (child.name == name))
          child = children[i]
          a << deserialize(child, child_type)
          i += 1
        end
        props[name.to_sym] = a
      elsif ((child = children[i]) && (child.name == name))
        props[name.to_sym] = deserialize(child, child_type)
        i += 1
      end
    end

    obj
  end

  def leaf_managed node, klass
    type_attr = node['type']
    klass = @loader.get(type_attr) if type_attr
    klass.new(@conn, node.content)
  end

  def leaf_date node
    Time.parse node.content
  end

  def leaf_binary node
    node.content.unpack('m')[0]
  end

  # XXX does the value need to be deserialized?
  def leaf_keyvalue node
    h = {}
    node.children.each do |child|
      next unless child.element?
      h[child.name] = child.content
    end
    [h['key'], h['value']]
  end 
end

class OldDeserializer
  NS_XSI = 'http://www.w3.org/2001/XMLSchema-instance'

  def initialize conn
    @conn = conn
  end

  def deserialize xml, typename=nil
    if IS_JRUBY
      type_attr = xml.attribute_nodes.find { |a| a.name == 'type' &&
                                                 a.namespace &&
                                                 a.namespace.prefix == 'xsi' }
    else
      type_attr = xml.attribute_with_ns('type', NS_XSI)
    end
    typename = (type_attr || typename).to_s

    if typename =~ /^ArrayOf/
      typename = demangle_array_type $'
      return xml.children.select(&:element?).map { |c| deserialize c, typename }
    end

    t = @conn.type typename
    if t <= BasicTypes::DataObject
      props_desc = t.full_props_desc
      h = {}
      props_desc.select { |d| d['is-array'] }.each { |d| h[d['name'].to_sym] = [] }
      xml.children.each do |c|
        next unless c.element?
        field = c.name.to_sym
        d = t.find_prop_desc(field.to_s) or next
        o = deserialize c, d['wsdl_type']
        if h[field].is_a? Array
          h[field] << o
        else
          h[field] = o
        end
      end
      t.new h
    elsif t == BasicTypes::ManagedObjectReference
      @conn.type(xml['type']).new @conn, xml.text
    elsif t <= BasicTypes::ManagedObject
      @conn.type(xml['type'] || t.wsdl_name).new @conn, xml.text
    elsif t <= BasicTypes::Enum
      xml.text
    elsif t <= BasicTypes::KeyValue
      h = {}
      xml.children.each do |c|
        next unless c.element?
        h[c.name] = c.text
      end
      [h['key'], h['value']]
    elsif t <= String
      xml.text
    elsif t <= Symbol
      xml.text.to_sym
    elsif t <= Integer
      xml.text.to_i
    elsif t <= Float
      xml.text.to_f
    elsif t <= Time
      Time.parse xml.text
    elsif t == BasicTypes::Boolean
      xml.text == 'true' || xml.text == '1'
    elsif t == BasicTypes::Binary
      xml.text.unpack('m')[0]
    elsif t == BasicTypes::AnyType
      fail "attempted to deserialize an AnyType"
    else fail "unexpected type #{t.inspect} (#{t.ancestors * '/'})"
    end
  rescue
    $stderr.puts "#{$!.class} while deserializing #{xml.name} (#{typename}):"
    $stderr.puts xml.to_s
    raise
  end

  def demangle_array_type x
    case x
    when 'AnyType' then 'anyType'
    when 'DateTime' then 'dateTime'
    when 'Boolean', 'String', 'Byte', 'Short', 'Int', 'Long', 'Float', 'Double' then x.downcase
    else x
    end
  end
end

if ENV['RBVMOMI_NEW_DESERIALIZER'] == '1' || true # Always use new one now
  Deserializer = NewDeserializer
else
  Deserializer = OldDeserializer
end

end
