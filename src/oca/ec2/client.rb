#!/usr/bin/ruby

require 'pp'

require 'rubygems'
require 'EC2'


ACCESS_KEY_ID = 'jfontan'
#SECRET_ACCESS_KEY = 'opennebula'
SECRET_ACCESS_KEY = '4478db59d30855454ece114e8ccfa5563d21c9bd'
SERVER = '127.0.0.1'
PORT = 4567

base=EC2::Base.new(
    :access_key_id => ACCESS_KEY_ID,
    :secret_access_key => SECRET_ACCESS_KEY,
    :server => SERVER,
    :port => PORT,
    :use_ssl => false
)

#pp base.describe_images

#pp base.register_image(
#    :image_location => 'eco.rb'
#)

#pp base.run_instances(
#    :image_id => "b8329b60-4227-012c-da6e-0019e333ebc5"
#)

pp base.describe_instances



def upload_request (base, file_name=nil )
    params =  {"Action" => "UploadImage",
               "SignatureVersion" => "2",
               "SignatureMethod" => 'HmacSHA1',
               "AWSAccessKeyId" => ACCESS_KEY_ID,
               "Version" => API_VERSION,
               "Timestamp"=>Time.now.getutc.iso8601}

    #sig = base.get_aws_auth_param(params, SECRET_ACCESS_KEY, SERVER)

    canonical_string =  EC2.canonical_string(params, SERVER)
    sig = EC2.encode(SECRET_ACCESS_KEY, canonical_string, false)
    pp sig

    post_fields = Array.new;

    params.each { |k,v|
        post_fields << Curl::PostField.content(k,v)
    }

    post_fields << Curl::PostField.content("Signature",sig)
    post_fields << Curl::PostField.file("file",file_name)

    c = Curl::Easy.new("http://localhost:4567/")
    c.multipart_form_post = true
    c.http_post(*post_fields)
    #pp c.body_str
end

