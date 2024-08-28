yarn preparePublish
cp README.md package.json LICENSE dist
cd dist
yarn publish --access public
cp package.json ../package.json # save new version in package.json
cd ..