# frozen_string_literal: true

get '/vm' do
  filter = params[:search] ? { search: params[:search] } : {}
  deep_search = nil
  if params[:deep_search]
    begin
      deep_search = JSON.parse(params[:deep_search])
    rescue JSON::ParserError
      deep_search = nil
    end
  end
  @vms = VMPool.new.search(filter, deep_search)
  erb :'vms/index'
end
