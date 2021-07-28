set api_origin=http://127.0.0.1:10009
set project_name=test0622002
set git_url=http://gitlab-dev3.iiidevops.org/root/test0622002.git
set git_branch=master
set git_commit_id=ab12cd4e
set verbose=true
set username=romulus
set password=OpenStack0
:loop
node app.js
PAUSE
goto loop
