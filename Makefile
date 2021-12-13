run:
	tmux new-session 'yarn --cwd front-end start' \; split-window -h 'yarn --cwd server start' \;

build-front-end:
	yarn --cwd front-end build

deploy: build-front-end
	cd server && gcloud app deploy

deploy-server:
	git subtree push --prefix server heroku master

deploy-front-end:
	cd front-end && yarn build && rm -r ../../reardonj.github.io/dashboard && cp -r build ../../reardonj.github.io/dashboard