projectPath=$PWD
echo $projectPath
"/Applications/CocosCreator 2.app/Contents/MacOS/CocosCreator" --path "$projectPath" --build "platform=fb-instant-games;debug=true;autoCompile=true"
cp key.pem build/fb-instant-games/
cp cert.pem build/fb-instant-games/
cd build/fb-instant-games/
http-server --ssl -c-1 -p 8080 -a 127.0.0.1 &
open https://www.facebook.com/embed/instantgames/394463171313326/player?game_url=https%3A%2F%2Flocalhost%3A8080
