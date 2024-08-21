yarn preparePublish
cp README.md package.json LICENSE dist
cd dist
yarn publish --access public
cd ..