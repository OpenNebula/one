#!/usr/bin/env ruby

require 'json'
require 'net/http'

unless ARGV[0]
    STDERR.puts 'No API token provied'
    STDERR.puts '`packet_plans.rb` <API_TOKEN>'
    exit(-1)
end

uri = URI('https://api.packet.net/plans')
req = Net::HTTP::Get.new(uri)

req['Accept']       = 'application/json'
req['X-Auth-Token'] = ARGV[0]

res         = Net::HTTP.new(uri.hostname, uri.port)
res.use_ssl = true

response = res.request(req)

unless response.is_a? Net::HTTPOK
    STDERR.puts 'Error getting plans from Packet'
    exit(-1)
end

plans = JSON.parse(response.body)['plans']
file  = ":plans:\n"

plans.each do |plan|
    specs = plan['specs']

    specs['cpus'].nil? ? cpu = 0 : cpu = specs['cpus'][0]['count']
    specs['memory'].nil? ? mem = 0 : mem = specs['memory']['total']

    next if cpu == 0 || mem == 0

    file << "    #{plan['name']}:\n"
    file << "        cpu: #{cpu}\n"
    file << "        memory: #{mem[/\d+/]}.0\n"
end

puts file
puts

print 'Do you want to overwrite file packet_driver.conf? '
over = STDIN.readline.chop.downcase

exit if over != 'yes'

File.open('packet_driver.conf', 'w') {|f| f.write(file) }
