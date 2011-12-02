#!/usr/bin/env ruby

#tr_strings = $stdin.read
tr_strings = `grep -h -o -R -e 'tr("[[:print:]]*")' ../js/* | cut -d'"' -f 2 | sort -u`

puts "//Default translation template"
puts 'lang="en_US"'
puts 'datatable_lang=""'
puts "locale={"

tr_strings.each_line do | line |
    puts "    \"#{line.chomp}\":\"\","
end

puts "};"
