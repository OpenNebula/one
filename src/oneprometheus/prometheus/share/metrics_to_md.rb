#!/usr/bin/env ruby


metrics = {}

STDIN.each_line do |l|
  h = l.match(/# HELP ([^\s]*) (.*)$/)

  if h
      metrics[h[1]] ||= {}
      metrics[h[1]][:help] = h[2]
      next
  end

  t = l.match(/# TYPE ([^\s]*) (.*)$/)

  if t
      metrics[t[1]] ||= {}
      metrics[t[1]][:type] = t[2]
  end
end

puts " Name | Description | Type "
puts "----- | ----------- | -----"

metrics.each do |k,v|
   puts "#{k} | #{v[:help]} | #{v[:type]}"
end
