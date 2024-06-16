#!/bin/bash

npm run docs

find ./src -type f -name 'README.md' | while read -r file; do
  # Переименовываем файл readme.md в index.md
  mv "$file" "$(dirname "$file")/index.md"
done

find ./src -type f | while read -r file; do
    # Заменить ссылки вида (./README.md) на (/)
    sed -i 's|\(\]\)(\./README\.md)|\1(/)|g' "$file"
    # Заменить ссылки вида (.*\README.md) на (\1)
    sed -i 's|\(\]\)(\(.*\)/README\.md)|\1(\2)|g' "$file"
done