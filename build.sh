projectPath=$PWD
echo $projectPath
/Applications/CocosCreator.app/Contents/MacOS/CocosCreator --path "$projectPath" --build "platform=fb-instant-games;debug=true;autoCompile=true"
