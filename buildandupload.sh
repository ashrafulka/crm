projectPath=$PWD
"/Applications/CocosCreator 2.app/Contents/MacOS/CocosCreator" --path "$projectPath" --build "platform=fb-instant-games;debug=true;"
echo "uploading to facebook"
curl -X POST https://graph-video.facebook.com/394463171313326/assets -F 'access_token=EAAYsfZAxiFmMBAA3dTh9cZBmAxbO7mbxj2zJz0klBZBzl4KATVd17nnmYJKi3MMHzEfRVqowqx3ZCkIfMptT5ZCvc2DMHCm94Kznaqb4wwcHCTx99QXJnJbLgahPRZCZAyjNZBTNO0HGaqyurrkgiRI6CTjisXZCqZC3FPQunLRIUjSgZDZD' -F 'type=BUNDLE' -F 'asset=@./build/fb-instant-games/Carrom.zip' -F 'comment=Graph API upload'