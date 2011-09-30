require 'sinatra'

# set sinatra's variables
set :app_file, __FILE__
set :root, File.dirname(__FILE__)
set :public, 'public'


get '/app' do
  File.read(File.join('public', 'index.html'))
end
