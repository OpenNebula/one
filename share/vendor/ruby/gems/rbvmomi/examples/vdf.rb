# Translation of vGhetto vdf, originally by William Lam
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM

opts = Trollop.options do
  banner <<-EOS
Display utilization of each datastore in the datacenter.

Usage:
    vdf.rb [options]

VIM connection options:
    EOS

    rbvmomi_connection_opts

    text <<-EOS

Datacenter selection:
    EOS

    rbvmomi_datacenter_opt

    text <<-EOS

Other options:
  EOS
end

Trollop.die("must specify host") unless opts[:host]

vim = VIM.connect opts

dc = vim.serviceInstance.find_datacenter(opts[:datacenter]) or abort "datacenter not found"

def si n
  ['', 'K', 'M', 'G', 'T', 'P'].each_with_index do |x,i|
    v = n.to_f/(1000**i)
    return v,x if v < 1000 or x == 'P'
  end
end

def unit n, u, p
  "%.*g%s%s" % [p, si(n), u].flatten
end

def b n
  unit(n,'B',3)
end

puts "Filesystem#{' '*53}Size     Used     Avail    Use%     Mounted on"
fmt = "%-62s %-8s %-8s %-8s %-8s %s"

if false
  # simple version
  dc.datastore.sort_by { |ds| ds.info.url }.each do |ds|
    s = ds.summary
    next unless s.accessible
    size = s.capacity
    free = s.freeSpace
    used = size - free
    pct_used = used*100.0/size
    puts(fmt % [ds.info.url, b(size), b(used), b(free), unit(pct_used,'%',3), ds.name])
  end
else
  # fast version
  paths = %w(name info.url summary.accessible summary.capacity summary.freeSpace)
  propSet = [{ :type => 'Datastore', :pathSet => paths }]
  filterSpec = { :objectSet => dc.datastore.map { |ds| { :obj => ds } }, :propSet => propSet }
  data = vim.propertyCollector.RetrieveProperties(:specSet => [filterSpec])
  data.select { |d| d['summary.accessible'] }.sort_by { |d| d['info.url'] }.each do |d|
    size = d['summary.capacity']
    free = d['summary.freeSpace']
    used = size - free
    pct_used = used*100.0/size
    puts(fmt % [d['info.url'], b(size), b(used), b(free), unit(pct_used,'%',3), d['name']])
  end
end
