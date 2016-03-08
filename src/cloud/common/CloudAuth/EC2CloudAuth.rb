# -------------------------------------------------------------------------- #
# Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                #
#                                                                            #
# Licensed under the Apache License, Version 2.0 (the "License"); you may    #
# not use this file except in compliance with the License. You may obtain    #
# a copy of the License at                                                   #
#                                                                            #
# http://www.apache.org/licenses/LICENSE-2.0                                 #
#                                                                            #
# Unless required by applicable law or agreed to in writing, software        #
# distributed under the License is distributed on an "AS IS" BASIS,          #
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   #
# See the License for the specific language governing permissions and        #
# limitations under the License.                                             #
#--------------------------------------------------------------------------- #

module EC2CloudAuth
    def do_auth(req_env, params={})
        username = params['AWSAccessKeyId']
        if username.nil?
            # Signature v4
            abstract_request = Rack::Auth::AbstractRequest.new(req_env)
            auth_attrs = {}
            if abstract_request.scheme == "aws4-hmac-sha256"
                abstract_request.params.split(', ').each { |attr|
                    key, value = attr.split('=')
                    auth_attrs[key] = value
                }

                split_creds = auth_attrs["Credential"].split('/')
                opts = {
                    'username' => split_creds[0],
                    'datetime' => req_env["HTTP_X_AMZ_DATE"],
                    'region' => split_creds[2],
                    'service_name' => split_creds[3],
                    'aws4_request' => split_creds[4],
                    'signed_headers' => auth_attrs["SignedHeaders"]
                }

                opts['one_pass'] = get_password(opts['username'],  'core|public')
                if !opts['one_pass']
                    logger.error { "No password found for #{opts['username']}" }
                    return nil
                end

                if auth_attrs["Signature"] == signature_v4(req_env, opts)
                    return opts['username']
                else
                    return nil
                end
            else
                logger.error { 
                    abstract_request.scheme + " authentication not supported"
                }
            end
        else
            one_pass = get_password(username,  'core|public')
            return nil unless one_pass

            signature = case params['SignatureVersion']
                when "1" then signature_v1(params.clone,one_pass)
                when "2" then signature_v2(params.clone,one_pass,req_env,true,false)
                else return nil
            end

            if params['Signature'] == signature
                return username
            elsif params['SignatureVersion']=="2"
                signature = signature_v2(params.clone,one_pass,req_env,false,false)
                if params['Signature'] == signature
                    return username
                end
            end
        end

        return nil
    end

    private

    # Calculates signature version 1
    def signature_v1(params, secret_key, digest='sha1')
        params.delete('Signature')
        params.delete('econe_host')
        params.delete('econe_port')
        params.delete('econe_path')
        req_desc = params.sort {|x,y| x[0].downcase <=> y[0].downcase}.to_s

        digest_generator = OpenSSL::Digest::Digest.new(digest)
        digest = OpenSSL::HMAC.digest(digest_generator, secret_key, req_desc)
        b64sig = Base64.encode64(digest)
        return b64sig.strip
    end

    # Calculates signature version 2
    def signature_v2(params, secret_key, env, include_port=true, urlencode=true)
        params.delete('Signature')
        params.delete('file')

        server_host = params.delete('econe_host')
        server_port = params.delete('econe_port')
        server_path = params.delete('econe_path') || '/'
        if include_port
            server_str = "#{server_host}:#{server_port}"
        else
            server_str = server_host
        end

        canonical_str = AWS.canonical_string(
                                params,
                                server_str,
                                env['REQUEST_METHOD'],
                                server_path)

        # Use the correct signature strength
        sha_strength = case params['SignatureMethod']
            when "HmacSHA1"   then 'sha1'
            when "HmacSHA256" then 'sha256'
            else 'sha1'
        end

        digest  = OpenSSL::Digest::Digest.new(sha_strength)
        hmac    = OpenSSL::HMAC.digest(digest, secret_key, canonical_str)
        b64hmac = Base64.encode64(hmac).gsub("\n","")

        if urlencode
            return CGI::escape(b64hmac)
        else
            return b64hmac
        end
    end

    # The code used to generate the signature v4 is based on the aws ruby sdk:
    #   https://github.com/aws/aws-sdk-ruby
    def signature_v4(req_env, opts)
        k_date = hmac("AWS4" + opts['one_pass'], opts['datetime'][0,8])
        k_region = hmac(k_date, opts['region'])
        k_service = hmac(k_region, opts['service_name'])
        k_credentials = hmac(k_service, opts['aws4_request'])
        hexhmac(k_credentials, string_to_sign(req_env, opts))
    end

    def string_to_sign(req_env, opts)
        parts = []
        parts << 'AWS4-HMAC-SHA256'
        parts << opts['datetime']
        parts << credential_scope(opts)
        parts << hexdigest(canonical_request(req_env, opts))
        parts.join("\n")
    end

    def credential_scope(opts)
        parts = []
        parts << opts['datetime'][0,8]
        parts << opts['region']
        parts << opts['service_name']
        parts << opts['aws4_request']
        parts.join("/")
    end

    def canonical_request(req_env, opts)
        if req_env["HTTP_X_AMZ_CONTENT_SHA256"]
            body_digest = req_env["HTTP_X_AMZ_CONTENT_SHA256"]
        else
            body = req_env['rack.input'].read
            req_env['rack.input'].rewind
            body_digest = hexdigest(body)
        end

        [
            req_env["REQUEST_METHOD"],
            uri_path_escape(req_env["REQUEST_PATH"]),
            normalized_querystring(req_env["QUERY_STRING"]),
            canonical_headers(req_env, opts) + "\n",
            opts['signed_headers'],
            body_digest
        ].join("\n")
    end

    def normalized_querystring(querystring)
        params = querystring.split('&')
        params = params.map { |p| p.match(/=/) ? p : p + '=' }
        # We have to sort by param name and preserve order of params that
        # have the same name. Default sort <=> in JRuby will swap members
        # occasionally when <=> is 0 (considered still sorted), but this
        # causes our normalized query string to not match the sent querystring.
        # When names match, we then sort by their original order
        params = params.each.with_index.sort do |a, b|
            a, a_offset = a
            a_name = a.split('=')[0]
            b, b_offset = b
            b_name = b.split('=')[0]
            if a_name == b_name
                a_offset <=> b_offset
            else
                a_name <=> b_name
            end
        end.map(&:first).join('&')
    end

    def canonical_headers(req_env, opts)
        opts['signed_headers'].split(';').map{ |k| 
            key = k.upcase.gsub('-', '_')
            if req_env["HTTP_" + key]
                "#{k}:#{canonical_header_value(req_env["HTTP_" + key])}" 
            elsif req_env[key]
                "#{k}:#{canonical_header_value(req_env[key])}" 
            end
        }.join("\n")
    end

    def canonical_header_value(value)
        value.match(/^".*"$/) ? value : value.gsub(/\s+/, ' ').strip
    end

    def hexdigest(value)
        digest = OpenSSL::Digest::SHA256.new
        if value.respond_to?(:read)
            chunk = nil
            chunk_size = 1024 * 1024 # 1 megabyte
            digest.update(chunk) while chunk = value.read(chunk_size)
            value.rewind
        else
            digest.update(value)
        end
        digest.hexdigest
    end

    def hmac(key, value)
        OpenSSL::HMAC.digest(OpenSSL::Digest.new('sha256'), key, value)
    end

    def hexhmac(key, value)
        OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha256'), key, value)
    end

    def uri_escape(string)
        CGI.escape(string.encode('UTF-8')).gsub('+', '%20').gsub('%7E', '~')
    end

    def uri_path_escape(path)
        path.gsub(/[^\/]+/) { |part| uri_escape(part) }
    end
end
