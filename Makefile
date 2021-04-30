run:
	tmux new-session 'yarn --cwd front-end start' \; split-window -h 'yarn --cwd server start' \;

deploy-server:
	git subtree push --prefix server heroku master

deploy-front-end:
	cd front-end && yarn build && rm -rf ../../reardonj.github.io/dashboard && cp -r build ../../reardonj.github.io/dashboard