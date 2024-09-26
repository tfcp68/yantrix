# Путь к исходной директории
SOURCE_DIR="../examples"

# Путь к целевой директории
TARGET_DIR="./.vitepress/dist/examples"


# Находим и копируем файлы из всех dist директорий
find "$SOURCE_DIR" -type d -name "dist" | while read -r dir; do
  example_name=$(basename "$(dirname "$dir")")
  dest_dir="$TARGET_DIR/$example_name"
  mkdir -p "$dest_dir"
  cp -r "$dir"/* "$dest_dir"
done