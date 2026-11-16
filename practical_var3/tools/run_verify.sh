#!/bin/sh
# Перевірка схеми симулятором Logisim Evolution 5.0.0 (без GUI).
# Використання: sh tools/run_verify.sh [шлях/до/logisim-evolution-5.0.0-all.jar]
set -e
cd "$(dirname "$0")/.."
JAR=${1:-/opt/logisim/logisim-evolution-5.0.0-all.jar}
OUT=$(mktemp -d)
javac -encoding UTF-8 -cp "$JAR" -d "$OUT" tools/VerifyAvtomat.java
java -Djava.awt.headless=true -cp "$JAR:$OUT" VerifyAvtomat avtomat_var3.circ results_verification.md
# офіційна статистика елементів з консольного режиму Logisim (--tty stats)
{
  printf '\n## 3. Статистика елементів (java -jar logisim-evolution-5.0.0-all.jar avtomat_var3.circ --tty stats)\n\n```\n'
  java -Dstdout.encoding=UTF-8 -jar "$JAR" avtomat_var3.circ --tty stats 2>/dev/null | grep -v 'INFO\|prefs\|JAVA_TOOL'
  printf '```\n'
} >> results_verification.md
# офіційна перевірка тест-вектором Logisim (-w); у версії 5.0.0 режим потребує дисплея, тому xvfb-run
{
  printf '\n## 4. Тест-вектор Logisim (test_vector_var3.txt, 26 кроків: скидання + 12 тактів)\n\n'
  printf 'Команда: `java -jar logisim-evolution-5.0.0-all.jar -w avtomat_var3 test_vector_var3.txt avtomat_var3.circ`\n\n```\n'
  xvfb-run -a java -Dstdout.encoding=UTF-8 -jar "$JAR" -w avtomat_var3 test_vector_var3.txt avtomat_var3.circ 2>/dev/null | grep -v 'INFO\|prefs\|JAVA_TOOL' | tr -d '\r' | sed 's/?$//'
  printf '```\n'
} >> results_verification.md
