#!/usr/bin/env ruby

require 'rubygems'
require 'rspec'
require 'open3'
require 'pp'

require File.expand_path(File.dirname(__FILE__) + '/../OpenNebulaVLAN')

OUTPUT = Hash.new
Dir[File.dirname(__FILE__) + "/output/**"].each do |f|
    key = File.basename(f).to_sym
    OUTPUT[key] = File.read(f)
end

def execute_cmd(cmd)
    if $capture_commands
        $capture_commands.each do |regex, output|
            if cmd.match(regex)
                return output
            end
        end
    end
    Open3.popen3(cmd){|stdin, stdout, stderr| stdout.read}
end

def `(cmd)
    log_command(:backtick, cmd)
    execute_cmd(cmd)
end

def system(cmd)
    log_command(:system, cmd)
    execute_cmd(cmd)
    nil
end

def log_command(facility, msg)
    $collector = Hash.new if !$collector
    $collector[facility] = Array.new if !$collector[facility]
    $collector[facility] << msg
end

RSpec.configure do |config|
    config.before(:all) do
        $capture_commands = Hash.new
        $collector = Hash.new
    end
end

describe 'networking' do
    it "get all nics in kvm" do
        $capture_commands = {
            /virsh.*dumpxml/ => OUTPUT[:virsh_dumpxml]
        }
        onevlan = OpenNebulaVLAN.new(OUTPUT[:onevm_show],"kvm")
        nics_expected = [{:bridge=>"br0",
                      :ip=>"172.16.0.100",
                      :mac=>"02:00:ac:10:00:64",
                      :network=>"Small network",
                      :network_id=>"0",
                      :tap=>"vnet0"},
                     {:bridge=>"br1",
                      :ip=>"10.1.1.1",
                      :mac=>"02:00:0a:01:01:01",
                      :network=>"r1",
                      :network_id=>"1",
                      :tap=>"vnet1"},
                     {:bridge=>"br2",
                      :ip=>"10.1.2.1",
                      :mac=>"02:00:0a:01:02:01",
                      :network=>"r2",
                      :network_id=>"2",
                      :tap=>"vnet2"}]
        onevlan.nics.should == nics_expected
    end
end

describe 'ebtables' do
    it "generate ebtable rules in kvm" do
        $capture_commands = {
            /virsh.*dumpxml/ => OUTPUT[:virsh_dumpxml],
            /ebtables/       => nil
        }
        onevlan = EbtablesVLAN.new(OUTPUT[:onevm_show],"kvm")
        onevlan.activate
        ebtables_cmds = [
        "sudo /sbin/ebtables -A FORWARD -s ! 02:00:ac:10:00:00/ff:ff:ff:ff:ff:00 -o vnet0 -j DROP",
        "sudo /sbin/ebtables -A FORWARD -s ! 02:00:ac:10:00:64 -i vnet0 -j DROP",
        "sudo /sbin/ebtables -A FORWARD -s ! 02:00:0a:01:01:00/ff:ff:ff:ff:ff:00 -o vnet1 -j DROP",
        "sudo /sbin/ebtables -A FORWARD -s ! 02:00:0a:01:01:01 -i vnet1 -j DROP",
        "sudo /sbin/ebtables -A FORWARD -s ! 02:00:0a:01:02:00/ff:ff:ff:ff:ff:00 -o vnet2 -j DROP",
        "sudo /sbin/ebtables -A FORWARD -s ! 02:00:0a:01:02:01 -i vnet2 -j DROP"]
        $collector[:system].should == ebtables_cmds
    end
end
