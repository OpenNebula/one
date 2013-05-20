#!/usr/bin/env ruby
require 'nokogiri'

# :usage => analyze-vim-declarations.rb vim-declarations.xml foo-declarations.xml vmodl.db

XML_FNS = ARGV[0...-1]
abort "must specify path to vim-declarations.xml" if XML_FNS.empty?
OUT_FN = ARGV[-1] or abort "must specify path to output database"

XML_FNS.each do |x|
  abort "XML file #{x} does not exist" unless File.exists? x
end

TYPES = {}
VERSIONS = []

ID2NAME = Hash.new { |h,k| fail "unknown type-id #{k.inspect}" }

ID2NAME.merge!({
  'java.lang.String' => 'xsd:string',
  'BOOLEAN' => 'xsd:boolean',
  'BYTE' => 'xsd:byte',
  'SHORT' => 'xsd:short',
  'INT' => 'xsd:int',
  'LONG' => 'xsd:long',
  'FLOAT' => 'xsd:float',
  'DOUBLE' => 'xsd:double',
  'vmodl.DateTime' => 'xsd:dateTime',
  'vmodl.Binary' => 'xsd:base64Binary',
  'vmodl.Any' => 'xsd:anyType',
  'void' => nil,
})

%w(DataObject ManagedObject MethodFault MethodName
   PropertyPath RuntimeFault TypeName).each do |x|
  ID2NAME['vmodl.' + x] = x
end

def handle_data_object node
  if TYPES[node['name']]
    puts "Type #{node['name']} already exists"
    return
  end

  ID2NAME[node['type-id']] = node['name']
  TYPES[node['name']] = {
    'kind' => 'data',
    'base-type-id' => node['base-type-id'],
    'props' => node.children.select { |x| x.name == 'property' }.map do |property|
      {
        'name' => property['name'],
        'type-id-ref' => property['type-id-ref'],
        'is-optional' => property['is-optional'] ? true : false,
        'is-array' => property['is-array'] ? true : false,
        'version-id-ref' => property['version-id-ref'],
      }
    end
  }
end

def handle_managed_object node
  if TYPES[node['name']]
    puts "Type #{node['name']} already exists"
    return
  end
  ID2NAME[node['type-id']] = node['name']
  TYPES[node['name']] = {
    'kind' => 'managed',
    'base-type-id' => node['base-type-id'],
    'props' => node.children.select { |x| x.name == 'property' }.map do |property|
      {
        'name' => property['name'],
        'type-id-ref' => property['type-id-ref'],
        'is-optional' => property['is-optional'] ? true : false,
        'is-array' => property['is-array'] ? true : false,
        'version-id-ref' => property['version-id-ref'],
      }
    end,
    'methods' => Hash[
      node.children.select { |x| x.name == 'method' }.map do |method|
        [method['is-task'] ? "#{method['name']}_Task" : method['name'],
         {
           'params' => method.children.select { |x| x.name == 'parameter' }.map do |param|
             {
               'name' => param['name'],
               'type-id-ref' => param['type-id-ref'],
               'is-array' => param['is-array'] ? true : false,
               'is-optional' => param['is-optional'] ? true : false,
               'version-id-ref' => param['version-id-ref'],
             }
           end,
           'result' => {
             'type-id-ref' => method['type-id-ref'],
             'is-array' => method['is-array'] ? true : false,
             'is-optional' => method['is-optional'] ? true : false,
             'is-task' => method['is-task'] ? true : false,
             'version-id-ref' => method['version-id-ref'],
           }
         }
        ]
      end
    ]
  }
end

def handle_enum node
  if TYPES[node['name']]
    puts "Type #{node['name']} already exists"
    return
  end

  ID2NAME[node['type-id']] = node['name']
  TYPES[node['name']] = {
    'kind' => 'enum',
    'values' => node.children.map { |child| child['name'] },
  }
end

def handle_fault node
  handle_data_object node
end

def handle_version x
  attrs = %w(display-name name service-namespace type-id version-id vmodl-name)
  h = Hash[attrs.map { |k| [k, x[k]] }]
  h['compatible'] = x.children.select(&:element?).map { |y| y.text }
  VERSIONS << h
end

XML_FNS.each do |fn|
  puts "parsing #{fn} ..."
  xml = Nokogiri.parse(File.read(fn), nil, nil, Nokogiri::XML::ParseOptions::NOBLANKS)
  xml.root.at('enums').children.each { |x| handle_enum x }
  xml.root.at('managed-objects').children.each { |x| handle_managed_object x }
  xml.root.at('data-objects').children.each { |x| handle_data_object x }
  xml.root.at('faults').children.each { |x| handle_fault x }
  #xml.root.at('definitions').at('version-types').children.each { |x| handle_version x }
end

munge_fault = lambda { |x| true }

TYPES.each do |k,t|
  case t['kind']
  when 'data'
    t['wsdl_base'] = t['base-type-id'] ? ID2NAME[t['base-type-id']] : 'DataObject'
    t.delete 'base-type-id'
    t['props'].each do |x|
      x['wsdl_type'] = ID2NAME[x['type-id-ref']]
      x.delete 'type-id-ref'
      munge_fault[x]
    end
  when 'managed'
    t['wsdl_base'] = t['base-type-id'] ? ID2NAME[t['base-type-id']] : 'ManagedObject'
    t.delete 'base-type-id'
    t['props'].each do |x|
      x['wsdl_type'] = ID2NAME[x['type-id-ref']]
      x.delete 'type-id-ref'
      munge_fault[x]
    end
    t['methods'].each do |mName,x|
      if y = x['result']
        y['wsdl_type'] = ID2NAME[y['type-id-ref']]
        y.delete 'type-id-ref'
        munge_fault[y]
      end
      x['params'].each do |r|
        r['wsdl_type'] = ID2NAME[r['type-id-ref']]
        r.delete 'type-id-ref'
        munge_fault[r]
      end
    end
  when 'enum'
  else fail
  end
end

db = {}

TYPES.each do |k,t|
  db[k] = t
end

db['_typenames'] = TYPES.keys
db['_versions'] = VERSIONS

File.open(OUT_FN, 'w') { |io| Marshal.dump db, io }

if filename = ENV['VERSION_GRAPH']
  File.open(filename, 'w') do |io|
    io.puts "digraph versions\n{"
    VERSIONS.each do |h|
      io.puts "\"#{h['vmodl-name']}\" [label=\"#{h['vmodl-name']} (#{h['version-id']})\"]"
      h['compatible'].each do |x|
        x =~ /^interface / or fail x
        io.puts "\"#{h['vmodl-name']}\" -> \"#{$'}\""
      end
    end
    io.puts "}\n"
  end
end
