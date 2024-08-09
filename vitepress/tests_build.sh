#!/bin/bash

# Проходимся по всем сгенерированным отчетам, берем путь каждого
find ../test_reports -type f | while read -r file; do
  # Указываем директорию для тестов в api references (директория будет называться именем пакета)
  dest_dir_tests="src/API-Reference/$(basename "$file" .md)/test_cases"
  # Создаем папку для тестов, если ее нет
  mkdir -p "$dest_dir_tests"
  # копируем отчеты с тестами из test_reports/
  cp "$file" "$dest_dir_tests"
done