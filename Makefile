run:
	tmux new-session 'yarn --cwd front-end start' \; split-window -h 'yarn --cwd server start' \;

build-front-end:
	yarn --cwd front-end build

deploy: build-front-end
	cd server && gcloud app deploy