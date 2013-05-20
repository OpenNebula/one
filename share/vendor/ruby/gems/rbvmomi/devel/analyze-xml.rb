require 'nokogiri'

# removes line breaks and whitespace between xml nodes.
def prepare_xml(xml)
  xml = xml.gsub(/\n+/, "")
  xml = xml.gsub(/(>)\s*(<)/, '\1\2')
end

def analyze_xml x, tree
  subtree = (tree[x.name] ||= { :attributes => [], :min_occur => nil, :max_occur => nil })
  attrs = x.attributes.keys.sort
  subtree[:attributes] << attrs unless subtree[:attributes].member? attrs

  child_occurs = Hash.new 0
  x.children.select(&:element?).each do |c|
    child_occurs[c.name] += 1
    analyze_xml c, subtree
  end

  subtree.select { |k,v| k.is_a? String }.each do |k,v|
    v[:min_occur] = [v[:min_occur], child_occurs[k]].compact.min
    v[:max_occur] = [v[:max_occur], child_occurs[k]].compact.max
  end
end

def print_tree tree, indent=0
  tree.select { |k,v| k.is_a? String }.sort.each do |k,v|
    attrs = v[:attributes] || []
    min, max = v[:min_occur], v[:max_occur]
    numsym = if min == 0 and max == 0 then fail
             elsif min == 0 and max == 1 then '?'
             elsif min == 0 then '*'
             elsif min == 1 and max == 1 then ''
             else '+'
             end
    puts "#{'  '*indent}#{k}#{numsym}: #{attrs.sort.map { |a| "[#{a * ' '}]"} * ', '} {#{min},#{max}}"
    print_tree v, (indent+1)
  end
end

tree = {}
ARGV.each do |fn|
  nk = Nokogiri(prepare_xml(File.read fn))
  analyze_xml nk.root, tree
end
print_tree tree
