# Copyright (c) 2011 VMware, Inc.  All Rights Reserved.
require 'trollop'

# Convenience methods for Trollop, Ruby's premier option parser.
# @see http://trollop.rubyforge.org/
# @see Trollop::Parser
module Trollop

# Convenience methods for Trollop, Ruby's premier option parser.
#
# See the examples directory for sample code.
# Descriptions are of the form:
#  <key>: <options> <environment variable> (<default>)
# @see http://trollop.rubyforge.org/
class Parser
  # Options used by VIM.connect
  #
  #  !!!plain
  #  host: -o --host RBVMOMI_HOST
  #  port: --port RBVMOMI_PORT (443)
  #  no-ssl: --no-ssl RBVMOMI_SSL (false)
  #  insecure: -k --insecure RBVMOMI_INSECURE (false)
  #  user: -u --user RBVMOMI_USER (root)
  #  password: -p --password RBVMOMI_PASSWORD ()
  #  path: --path RBVMOMI_PATH (/sdk)
  #  debug: -d --debug RBVMOMI_DEBUG (false)
  def rbvmomi_connection_opts
    opt :host, "host", :type => :string, :short => 'o', :default => ENV['RBVMOMI_HOST']
    opt :port, "port", :type => :int, :short => :none, :default => (ENV.member?('RBVMOMI_PORT') ? ENV['RBVMOMI_PORT'].to_i : 443)
    opt :"no-ssl", "don't use ssl", :short => :none, :default => (ENV['RBVMOMI_SSL'] == '0')
    opt :insecure, "don't verify ssl certificate", :short => 'k', :default => (ENV['RBVMOMI_INSECURE'] == '1')
    opt :user, "username", :short => 'u', :default => (ENV['RBVMOMI_USER'] || 'root')
    opt :password, "password", :short => 'p', :default => (ENV['RBVMOMI_PASSWORD'] || '')
    opt :path, "SOAP endpoint path", :short => :none, :default => (ENV['RBVMOMI_PATH'] || '/sdk')
    opt :debug, "Log SOAP messages", :short => 'd', :default => (ENV['RBVMOMI_DEBUG'] || false)
  end

  # Select a datacenter
  #
  #  !!!plain
  #  datacenter: -D --datacenter RBVMOMI_DATACENTER (ha-datacenter)
  def rbvmomi_datacenter_opt
    opt :datacenter, "datacenter", :type => :string, :short => "D", :default => (ENV['RBVMOMI_DATACENTER'] || 'ha-datacenter')
  end

  # Select a folder
  #
  #  !!!plain
  #  folder: -F --folder RBVMOMI_FOLDER ()
  def rbvmomi_folder_opt
    opt :folder, "VM folder", :type => :string, :short => "F", :default => (ENV['RBVMOMI_FOLDER'] || '')
  end

  # Select a compute resource
  #
  #  !!!plain
  #  computer: -R --computer RBVMOMI_COMPUTER
  def rbvmomi_computer_opt
    opt :computer, "Compute resource", :type => :string, :short => "R", :default => (ENV['RBVMOMI_COMPUTER']||'ha-compute-res')
  end

  # Select a datastore
  #
  #  !!!plain
  #  datastore: -s --datastore RBVMOMI_DATASTORE (datastore1)
  def rbvmomi_datastore_opt
    opt :datastore, "Datastore", :short => 's', :default => (ENV['RBVMOMI_DATASTORE'] || 'datastore1')
  end
end
end
