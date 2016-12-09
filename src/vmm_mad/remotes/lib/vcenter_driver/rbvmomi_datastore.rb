
class RbVmomi::VIM::Datastore

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
end
