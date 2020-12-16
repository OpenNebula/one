require 'sinatra/base'

class FakePacket < Sinatra::Base
  get('/operating-systems') { json_response 200, fixture(:operating_systems) }
  get('/plans') { json_response 200, fixture(:plans) }
  get('/projects') { json_response 200, fixture(:projects) }
  get('/projects/:id') do |id|
    projects = JSON.parse(fixture(:projects))['projects']

    if (project = projects.find { |p| p['id'] == id })
      json_response 200, project.to_json
    else
      json_response 404, { errors: ['Not found'] }.to_json
    end
  end
  get('/ssh-keys') { json_response 200, fixture(:ssh_keys) }
  post('/ssh-keys') { json_response 201, fixture(:ssh_key) }
  get('/ssh-keys/:key') { json_response 200, fixture(:ssh_key) }
  patch('/ssh-keys/:key') { json_response 200, fixture(:ssh_key) }
  delete('/ssh-keys/:key') { json_response 204 }

  private

  def json_response(response_code, body = nil)
    content_type :json
    status response_code
    body if body
  end

  def fixture(name)
    File.open("#{File.join(File.dirname(__FILE__), '..', 'fixtures', name.to_s)}.json", 'rb').read
  end
end
