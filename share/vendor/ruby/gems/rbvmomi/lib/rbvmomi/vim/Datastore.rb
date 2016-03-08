# @note +download+ and +upload+ require +curl+. If +curl+ is not in your +PATH+
#       then set the +CURL+ environment variable to point to it.
# @todo Use an HTTP library instead of executing +curl+.
class RbVmomi::VIM::Datastore
  CURLBIN = ENV['CURL'] || "curl" #@private

  # Check whether a file exists on this datastore.
  # @param path [String] Path on the datastore.
  def exists? path
    req = Net::HTTP::Head.new mkuripath(path)
    req.initialize_http_header 'cookie' => _connection.cookie
    resp = _connection.http.request req
    case resp
    when Net::HTTPSuccess
      true
    when Net::HTTPNotFound
      false
    else
      fail resp.inspect
    end
  end

  # Download a file from this datastore.
  # @param remote_path [String] Source path on the datastore.
  # @param local_path [String] Destination path on the local machine.
  # @return [void]
  def download remote_path, local_path
    url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"
    pid = spawn CURLBIN, "-k", '--noproxy', '*', '-f',
                "-o", local_path,
                "-b", _connection.cookie,
                url,
                :out => '/dev/null'
    Process.waitpid(pid, 0)
    fail "download failed" unless $?.success?
  end

  # Download a file from this datastore.
  # @param remote_path [String] Source path on the datastore.
  # @param local_path [String] Destination path on the local machine.
  # @return [void]
  def download_to_stdout remote_path
    url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"

    pid = spawn CURLBIN, "-k", '--noproxy', '*', '-f',
                "-b", _connection.cookie,
                url


    Process.waitpid(pid, 0)
    fail "download failed" unless $?.success?
  end

  def is_descriptor? remote_path
    url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"

     rout, wout = IO.pipe
    
     pid = spawn CURLBIN, "-I", "-k", '--noproxy', '*', '-f',
                "-b", _connection.cookie,
                url,
		:out => wout,
                :err => '/dev/null'

    Process.waitpid(pid, 0)
    fail "read image header failed" unless $?.success?

     wout.close
     size = rout.readlines.select{|l| l.start_with?("Content-Length")}[0].sub("Content-Length: ","")
     rout.close
	size.chomp.to_i < 4096   # If <4k, then is a descriptor 
  end

  def get_text_file remote_path
    url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"

     rout, wout = IO.pipe
     pid = spawn CURLBIN, "-k", '--noproxy', '*', '-f',
                "-b", _connection.cookie,
                url,
		:out => wout,
                :err => '/dev/null'

    Process.waitpid(pid, 0)
    fail "get text file failed" unless $?.success?

     wout.close
     output = rout.readlines
     rout.close
     return output
  end

  # Upload a file to this datastore.
  # @param remote_path [String] Destination path on the datastore.
  # @param local_path [String] Source path on the local machine.
  # @return [void]
  def upload remote_path, local_path
    url = "http#{_connection.http.use_ssl? ? 's' : ''}://#{_connection.http.address}:#{_connection.http.port}#{mkuripath(remote_path)}"
    pid = spawn CURLBIN, "-k", '--noproxy', '*', '-f',
                "-T", local_path,
                "-b", _connection.cookie,
                url,
                :out => '/dev/null'
    Process.waitpid(pid, 0)
    fail "upload failed" unless $?.success?
  end

  private

  def datacenter
    return @datacenter if @datacenter
    x = parent
    while not x.is_a? RbVmomi::VIM::Datacenter
      x = x.parent
    end
    fail unless x.is_a? RbVmomi::VIM::Datacenter
    @datacenter = x
  end

  def mkuripath path
    "/folder/#{URI.escape path}?dcPath=#{URI.escape datacenter.name}&dsName=#{URI.escape name}"
  end
end
