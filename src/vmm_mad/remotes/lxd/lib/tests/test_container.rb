#!/usr/bin/ruby

require_relative '../lib/client'
require_relative '../lib/container'

client = LXDClient.new
sep = '-' * 20
real = 'ruby'
ghost = 'one-12'

container = Container.get(real, client)
puts container.monitor

# container = Container.get(ghost, client)
# container = Container.new({ 'name' => 'one-19' }, client)
# container2 = Container.new({ 'name' => 'one-21' }, client)

# container.start({ :wait => true })
# puts container.status
# container.start
# puts container.status
# sleep 1
# container.stop
# puts container.status
# puts container.start({ :wait => false })
# puts container.stop({ :wait => false })
# puts container.stop({ :wait => false })
# puts container.stop

# a = Container.exist?(ghost, client)
# b = Container.existb?(real, client)

# c = ''
# # puts 'yai' unless a
# puts 'yaiii' if
# puts a.class
# puts container2.create
# puts container.status
# puts container.start
# sleep 2
# puts container.status
# puts container.stop
# sleep 1
# puts container.status
# puts container.stop({ :wait => false })
# puts container.stop

# 13.upto(20) do |i|
#     container = Container.get('one-' + i.to_s, client)
#     container.delete
# end

# puts container.start
# puts container.stop
# puts container.start({ :wait => true })

# start = Time.now
# puts Time.now - start
# puts sep * 2

# start = Time.now
# puts container.create
# puts Time.now - start

# puts container.stop
# puts container.wait('76901d92-205a-4534-af03-d170f936c332', 1)
# puts container.wait('76901d92-205a-4534-af03-d170f936c332')

# puts container.stop
# puts container.status
# puts sep * 2
# container.stop({ :force => true })
# puts container.status
# putps sep * 2
# container.start
# puts container.status
# puts sep * 2
# container.freezeo
# puts container.status

# puts container.config.is_a? Hash
# puts container.config
# container.config.update({ 'limits.cpu' => '4' })
# puts container.config
# container.update

# container = Container.new({ 'name' => 'one-10' }, client)
# puts container.create

# puts container.info
# puts sep * 2
# puts container.info

# puts container.info
# puts container.config_expanded
# puts sep * 2
# puts container.devices_expanded

# puts container.status
# puts container.status_code
# puts sep * 2
# container.create
# puts container.status
# puts container.status_code
# puts container.start
# puts container.delete

# container.info.each {|key| puts key }

# puts Container.exist(real, client)
# puts Container.exist('xxx', client)

# puts container.config
# puts container.name
# puts container.devices

# puts sep * 2

# containers = Container.get_all(client)
# puts containers[0].config
# puts sep
# puts containers[1].name
