# Путь к исходной директории
SOURCE_DIR="../docs"

# Путь к целевой директории
TARGET_DIR="./src"

# Создаем целевую директорию, если она не существует
mkdir -p "$TARGET_DIR"

# Копируем файлы
cp -r "$SOURCE_DIR"/* "$TARGET_DIR"
