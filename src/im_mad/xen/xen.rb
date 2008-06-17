#!/usr/bin/env ruby

require "pp"

XENTOP_PATH="/usr/sbin/xentop"
XM_PATH="/usr/sbin/xm"

xentop_text=`sudo #{XENTOP_PATH} -bi2`
xm_text=`sudo #{XM_PATH} info`

xentop_text.gsub!(/^xentop.*^xentop.*?$/m, "") # Strip first top output
xentop_text.gsub!("no limit", "no_limit")

xentop_text=xentop_text.split("\n")
xentop_text.reject! {|l| l.strip=="" } # Take out empty lines

domain_info_line=xentop_text[0]
memory_info_line=xentop_text[1]
domains_info=xentop_text[3..-1]


# Getting information from xm info

memory_info=Hash.new
cpu_info=Hash.new

xm_text.each_line {|line|
    columns=line.split(":").collect {|c| c.strip }

    case columns[0]
    when 'total_memory'
        memory_info[:total]=columns[1].to_i*1024
    when 'free_memory'
        memory_info[:free]=columns[1].to_i*1024
    when 'nr_cpus'
        cpu_info[:total]=columns[1].to_f*100
    when 'cpu_mhz'
        cpu_info[:speed]=columns[1]
    end
}

memory_info[:used]=memory_info[:total]-memory_info[:free]

# DOMAINS LINES

vm_info=Hash.new
vm_info[:cpu]=0.0
vm_info[:nettx]=0
vm_info[:netrx]=0

domains_info.each {|line|
    l=line.strip.split
    vm_info[:cpu]+=l[3].to_f
    vm_info[:nettx]+=l[10].to_i
    vm_info[:netrx]+=l[11].to_i
}


# WRITE INFO

puts "TOTALCPU=" + cpu_info[:total].round.to_s
puts "CPUSPEED=" + cpu_info[:speed]
puts "TOTALMEMORY=" + memory_info[:total].to_s
puts "FREEMEMORY=" + memory_info[:free].to_s
puts "USEDMEMORY=" + memory_info[:used].to_s
puts "USEDCPU=" + vm_info[:cpu].round.to_s
puts "FREECPU=" + (cpu_info[:total]-vm_info[:cpu]).round.to_s
puts "NETTX=" + vm_info[:nettx].to_s
puts "NETRX=" + vm_info[:netrx].to_s

