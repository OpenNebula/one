# Copyright (c) 2010 VMware, Inc.  All Rights Reserved.
require 'set'
require 'monitor'

module RbVmomi

class TypeLoader
  def initialize fn, extension_dirs, namespace
    @extension_dirs = extension_dirs
    @namespace = namespace
    @lock = Monitor.new
    @db = {}
    @id2wsdl = {}
    @loaded = {}
    add_types Hash[BasicTypes::BUILTIN.map { |k| [k,nil] }]
    vmodl_database = File.open(fn, 'r') { |io| Marshal.load io }
    vmodl_database.reject! { |k,v| k =~ /^_/ }
    add_types vmodl_database
    preload
  end

  def preload
    names = (@namespace.constants + Object.constants).map(&:to_s).uniq.
                                                      select { |x| has? x }
    names.each { |x| get(x) }
  end

  # Reload all extensions for loaded VMODL types
  def reload_extensions
    @extension_dirs.each do |path|
      reload_extensions_dir path
    end
  end

  # Reload all extensions for loaded VMODL types from the given directory
  def reload_extensions_dir path
    loaded = Set.new(typenames.select { |x| @namespace.const_defined? x })
    Dir.open(path) do |dir|
      dir.each do |file|
        next unless file =~ /\.rb$/
        next unless loaded.member? $`
        file_path = File.join(dir, file)
        load file_path
      end
    end
  end

  def has? name
    fail unless name.is_a? String

    @db.member?(name) or BasicTypes::BUILTIN.member?(name)
  end

  def get name
    fail "name '#{name}' is #{name.class} expecting String" unless name.is_a? String

    first_char = name[0].chr
    if first_char.downcase == first_char
      name = "%s%s" % [first_char.upcase, name[1..-1]]
    end

    return @loaded[name] if @loaded.member? name
    @lock.synchronize do
      return @loaded[name] if @loaded.member? name
      klass = make_type(name)
      @namespace.const_set name, klass
      load_extension name
      @loaded[name] = klass
    end
  end

  def add_types types
    @lock.synchronize do
      @db.merge! types
      @db = Hash[@db.map do |name, value|
        if value
          value['wsdl_name'] ||= name
        end
        first_char = name[0].chr
        if first_char.downcase == first_char
          name = "%s%s" % [first_char.upcase, name[1..-1]]
        end
        [name, value]
      end]
    end
  end

  def typenames
    @db.keys
  end

  private

  def load_extension name
    @extension_dirs.map { |x| File.join(x, "#{name}.rb") }.
                    select { |x| File.exists? x }.
                    each { |x| load x }
  end

  def make_type name
    name = name.to_s
    return BasicTypes.const_get(name) if BasicTypes::BUILTIN.member? name
    desc = @db[name] or fail "unknown VMODL type #{name}"
    case desc['kind']
    when 'data' then make_data_type name, desc
    when 'managed' then make_managed_type name, desc
    when 'enum' then make_enum_type name, desc
    else fail desc.inspect
    end
  end

  def make_data_type name, desc
    superclass = get desc['wsdl_base']
    Class.new(superclass).tap do |klass|
      klass.init name, desc['props']
      klass.wsdl_name = desc['wsdl_name']
    end
  end

  def make_managed_type name, desc
    superclass = get desc['wsdl_base']
    Class.new(superclass).tap do |klass|
      klass.init name, desc['props'], desc['methods']
      klass.wsdl_name = desc['wsdl_name']
    end
  end

  def make_enum_type name, desc
    Class.new(BasicTypes::Enum).tap do |klass|
      klass.init name, desc['values']
      klass.wsdl_name = desc['wsdl_name']
    end
  end
end

end
