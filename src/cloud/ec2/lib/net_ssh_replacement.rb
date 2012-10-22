# Some of these functions are taken from net-ssh gem.

=begin
== LICENSE:

(The MIT License)

Copyright (c) 2008 Jamis Buck

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
=end

require 'openssl'


if RUBY_VERSION < "1.9"
  class String
      def getbyte(index)
        self[index]
      end
  end
end

module OpenSSL

  module SSHUtils
    def self.convert_string(string)
      [string.length].pack('N*')+string
    end

    def self.convert_bignum(bn)
      bn.to_ssh
    end
  end

  # This class is originally defined in the OpenSSL module. As needed, methods
  # have been added to it by the Net::SSH module for convenience in dealing with
  # SSH functionality.
  class BN

    # Converts a BN object to a string. The format used is that which is
    # required by the SSH2 protocol.
    def to_ssh
      if zero?
        return [0].pack("N")
      else
        buf = to_s(2)
        if buf.getbyte(0)[7] == 1
          return [buf.length+1, 0, buf].pack("NCA*")
        else
          return [buf.length, buf].pack("NA*")
        end
      end
    end

  end

  module PKey

    # This class is originally defined in the OpenSSL module. As needed, methods
    # have been added to it by the Net::SSH module for convenience in dealing
    # with SSH functionality.
    class RSA

      # Returns "ssh-rsa", which is the description of this key type used by the
      # SSH2 protocol.
      def ssh_type
        "ssh-rsa"
      end

      # Converts the key to a blob, according to the SSH2 protocol.
      def to_blob
        #@blob ||= Net::SSH::Buffer.from(:string, ssh_type, :bignum, e, :bignum, n).to_s
        SSHUtils.convert_string(ssh_type)<<
          SSHUtils.convert_bignum(e)<<
          SSHUtils.convert_bignum(n)
      end
    end

    # This class is originally defined in the OpenSSL module. As needed, methods
    # have been added to it by the Net::SSH module for convenience in dealing
    # with SSH functionality.
    class DSA

      # Returns "ssh-dss", which is the description of this key type used by the
      # SSH2 protocol.
      def ssh_type
        "ssh-dss"
      end

      # Converts the key to a blob, according to the SSH2 protocol.
      def to_blob
        #@blob ||= Net::SSH::Buffer.from(:string, ssh_type,
        #  :bignum, p, :bignum, q, :bignum, g, :bignum, pub_key).to_s
        SSHUtils.convert_string(ssh_type)<<
          SSHUtils.convert_bignum(p)<<
          SSHUtils.convert_bignum(q)<<
          SSHUtils.convert_bignum(g)<<
          SSHUtils.convert_bignum(pub_key)
      end
    end
  end
end

