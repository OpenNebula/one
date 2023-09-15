#!/usr/bin/ruby

require 'sinatra'

# Testing application for External Scheduler
# Returns valid response for the POST request
before do
    content_type 'application/json'
end

# get '/' do
#     'Hello get!'
# end

post '/' do
    body = request.body.read
    data = JSON.parse body

    # puts JSON.pretty_generate(data)

    vms = []
    response = { :VMS => vms }

    # Go through all Virtual Machines
    data['VMS'].each do |vm|
        hosts = vm['HOST_IDS']

        next if hosts.nil? || hosts.empty?

        # Randomize the host based on the VM ID
        host_id = hosts[vm['ID'].to_i % hosts.size]

        vms << { :ID => vm['ID'], :HOST_ID => host_id }
    end

    # puts JSON.pretty_generate(response)
    response.to_json
end
