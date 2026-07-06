class SunstoneServer
  get '/audit' do
    filters = {
      user_id:       params[:user_id],
      resource_type: params[:resource_type],
      resource_id:   params[:resource_id],
      start_time:    params[:start_time],
      end_time:      params[:end_time],
      action:        params[:action]
    }.compact

    results = Audit.search(filters).all
    json(results)
  end
end