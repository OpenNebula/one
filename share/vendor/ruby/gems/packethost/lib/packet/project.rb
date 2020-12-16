module Packet
  class Project
    include Entity

    attr_accessor :name

    has_many :devices
    has_many :ssh_keys
    has_timestamps

    def new_device(opts = {})
      Packet::Device.new(opts.merge(project_id: id))
    end
  end
end
