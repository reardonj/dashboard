deploy-server:
	git subtree push --prefix server heroku master

deploy-ui:

	cd front-end && yarn build && rm -rf ../../reardonj.github.io/dashboard && cp -r build ../../reardonj.github.io/dashboard