#!/usr/bin/ruby

require_relative 'requests'
require_relative 'lxd_object'

class Container < LXDObject
  include Requests

  # def initialize(name)
  #   @name = name # Client.containers.get(container) or .create(container)
  # end

  # Container attrs
  @config
  @devices
  


  def change_state(name, action)
    put(@containers + name + "/state", {action: action})
  end

  def start(name)
    change_state(name, {action: "start"})  
  end
  
  def stop(name)
    change_state(name, {action: "stop"})  
  end
  
  def restart(name)
    change_state(name, {action: "restart"})  
  end
  
  def freeze(name)
    change_state(name, {action: "freeze"})  
  end
  
  def unfreeze(name)
    change_state(name, {action: "unfreeze"})  
  end
  

  def delete(sock, uri)
    request = Net::HTTP::Delete.new("/1.0/#{uri}", initheader = { 'Host' => 'localhost' })
    request.exec(sock, '1.1', "/1.0/#{uri}")
    request
  end

  

  def update(sock, uri)
    request = Net::HTTP::Patch.new("/1.0/#{uri}", initheader = { 'Host' => 'localhost' })

    request.body = JSON.dump(
      "config": {
        'limits.cpu' => '4'
      }
    )

    request.exec(sock, '1.1', "/1.0/#{uri}")
    request

end
