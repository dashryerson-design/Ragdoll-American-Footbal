#!/bin/sh
# builds index.html (the playable game) from src/pbb.html with the recorded sound clips from src/sounds.js inlined
cd "$(dirname "$0")" && sed -e '/\/\*__SOUNDS__\*\//{r src/sounds.js' -e 'd' -e '}' src/pbb.html > index.html && echo "built index.html ($(wc -c < index.html) bytes)"
