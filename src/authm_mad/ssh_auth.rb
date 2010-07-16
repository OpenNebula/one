
require 'pp'
require 'openssl'
require 'base64'
require 'fileutils'

class SshAuth
    
    def get_priv_key
        path=ENV['HOME']+'/.ssh/id_rsa'
        File.read(path)
    end
    
    def get_proxy_file
        proxy_dir=ENV['HOME']+'/.one'
        begin
            FileUtils.mkdir_p(proxy_dir)
        rescue Errno::EEXIST
        end
        
        File.open(proxy_dir+'/one_ssh', "w")
    end
    
    def encrypt(data)
        rsa=OpenSSL::PKey::RSA.new(get_priv_key)
        Base64::encode64(rsa.private_encrypt(data)).gsub!(/\n/, '').strip
    end
    
    def decrypt(data, pub_key)
        rsa=OpenSSL::PKey::RSA.new(Base64::decode64(pub_key))
        rsa.public_decrypt(Base64::decode64(data))
    end
    
    def extract_public_key
        key=OpenSSL::PKey::RSA.new(get_priv_key)
        public_key=key.public_key.to_pem.split("\n")
        public_key.reject {|l| l.match(/RSA PUBLIC KEY/) }.join('')
    end
    
    def login(user, expire=3600)
        time=Time.now.to_i+expire
        proxy_text="#{user}:#{time}"
        proxy_crypted=encrypt(proxy_text)
        proxy="#{user}:ssh:#{proxy_crypted}"
        file=get_proxy_file
        file.write(proxy)
        file.close
        
        puts "export ONE_AUTH=#{ENV['HOME']}/.one/one_ssh"
        
        proxy_crypted
    end
    
    def auth(user_id, user, password, token)
        begin
            decrypted=decrypt(token, password)
        
            username, time=decrypted.split(':')
            
            pp [username, time]
        
            if user==username
                if Time.now.to_i>=time.to_i
                    "proxy expired, login again"
                else
                    true
                end
            else
                "invalid credentials"
            end
        rescue
            "error"
        end
    end
    
end

#pub_key="MIIBIDANBgkqhkiG9w0BAQEFAAOCAQ0AMIIBCAKCAQEAyspEH4KiKRX625j4knzQueD2IRxkJlvT7O777Q18105kqDhhPYW5RtvxKWFqhUAQPPd2cjLkJ1bmk4JJuDk4rJWN0KEmB14JWB68u+YAv+u3NWCw0StDf25hRf+iN9dBf+WOt9brTpLGBF1BPtHY0+XkC/DnVhPbCxz5dvptSW8ajmpRS+u1qQIyyv9/bucDIoBvHmiA10ydBoQYwMOHk3U+ONJrgniph01tYfeQqLIngG86yaauadp8CqScRhPZdvtbBIhbxghrE/AfhXhWNti0cPbTZTWc2teXHkiwq//JIyIl29oZjmr3jcAZT8j2e5kJzKSS6RxrGdmR66fSkwIBIw=="

#ssh=SshAuth.new
#pp data=ssh.encrypt("hola cucucucucuc #{Time.now.to_i}")
#pp ssh.decrypt(data, pub_key)

#pp ssh.decrypt(ssh.login("jfontan", 0), pub_key)

