# @todo Retrieve ESX log bundles when run against VC.
require 'trollop'
require 'rbvmomi'
require 'rbvmomi/trollop'

VIM = RbVmomi::VIM
DEFAULT_SERVER_PLACEHOLDER = '0.0.0.0'

opts = Trollop.options do
  banner <<-EOS
Generate and retrieve a log bundle.

Usage:
    logbundle.rb [options] dest

dest must be a directory.

VIM connection options:
    EOS

    rbvmomi_connection_opts

    text <<-EOS

Other options:
  EOS
end

Trollop.die("must specify host") unless opts[:host]
dest = ARGV[0] or abort("must specify destination directory")

abort "destination is not a directory" unless File.directory? dest

vim = VIM.connect opts
is_vc = vim.serviceContent.about.apiType == 'VirtualCenter'
diagMgr = vim.serviceContent.diagnosticManager

bundles =
  begin
    diagMgr.GenerateLogBundles_Task(includeDefault: true).wait_for_completion
  rescue VIM::TaskInProgress
    $!.task.wait_for_completion
  end

bundles.each do |b|
  uri = URI.parse(b.url.sub('*', DEFAULT_SERVER_PLACEHOLDER))
  dest_path = File.join(dest, File.basename(uri.path))
  puts "downloading bundle #{b.url} to #{dest_path}"
  if uri.host == DEFAULT_SERVER_PLACEHOLDER
    vim.http.request_get(uri.path) do |res|
      File.open dest_path, 'w' do |io|
        res.read_body do |data|
          io.write data
          $stdout.write '.'
          $stdout.flush
        end
      end
      puts
    end
  else
    puts 'not supported yet'
  end
end
