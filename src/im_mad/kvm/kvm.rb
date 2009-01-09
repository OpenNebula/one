#!/usr/bin/env ruby

######
#  First, get all the posible info out of virsh 
#  TODO : use virsh freecell when available
######

nodeinfo_text = `virsh nodeinfo`

nodeinfo_text.split(/\n/).each{|line|
    if     line.match('^CPU\(s\)') 
        $total_cpu   = line.split(":")[1].strip.to_i * 100
    elsif  line.match('^CPU frequency')
        $cpu_speed   = line.split(":")[1].strip.split(" ")[0]
    elsif  line.match('^Memory size')
        $total_memory = line.split(":")[1].strip.split(" ")[0]
    end
}

######
#   for everything else, top & proc
#####

NETINTERFACE = "eth1"

top_text=`top -bin2`
top_text.gsub!(/^top.*^top.*?$/m, "") # Strip first top output

top_text.split(/\n/).each{|line|
    if line.match('^Mem')  
        line[4..-1].split(",").each{|elemento|
            temp = elemento.strip.split("k ")
            if temp[1] == "used"
                $used_memory = temp[0]
            end
        }
    
    elsif line.match('^Cpu')
        line[7..-1].split(",").each{|elemento|
            temp = elemento.strip.split("%")
            if temp[1]=="id"
                $free_cpu = temp[0]
                used     = temp[0].to_f
                $used_cpu = (((100 - used)*100).round / 100).to_f.to_s
                break
            end

        }
    end
}

$free_memory=`free -k|grep "buffers\/cache"|awk '{print $4}'`
    
net_text=`cat /proc/net/dev`

net_text.split(/\n/).each{|line|
    if line.match("^ *#{NETINTERFACE}")
        arr   = line.split(":")[1].split(" ")
        $netrx = arr[0]
        $nettx = arr[8]
        break
    end
}

puts "TOTALCPU=#{$total_cpu}"
puts "CPUSPEED=#{$cpu_speed}"

puts "TOTALMEMORY=#{$total_memory}"
puts "USEDMEMORY=#{$used_memory}"
puts "FREEMEMORY=#{$free_memory}"

puts "FREECPU=#{$free_cpu}"
puts "USEDCPU=#{$used_cpu}"

puts "NETRX=#{$netrx}"
puts "NETTX=#{$nettx}"

