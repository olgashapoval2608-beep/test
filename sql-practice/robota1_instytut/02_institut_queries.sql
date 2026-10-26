-- Практична робота: база даних "Інститут"

-- 1. Прізвище студента, прізвище викладача і оцінка, яку отримав цей студент у викладача
SELECT student.name, vicladachi.name, uspishnist.otsinka
FROM vyz.student, vyz.vicladachi, vyz.uspishnist
WHERE uspishnist.kodV = vicladachi.kod
  AND student.kod = uspishnist.kodS;

-- 2. Вивести всіх, хто отримав оцінку = 5
SELECT student.name, vicladachi.name, uspishnist.otsinka
FROM vyz.student, vyz.vicladachi, vyz.uspishnist
WHERE uspishnist.kodV = vicladachi.kod
  AND student.kod = uspishnist.kodS
  AND uspishnist.otsinka = 5;

-- 3. Вивести всіх, в кого прізвище починається з П
SELECT student.name, vicladachi.name, uspishnist.otsinka
FROM vyz.student, vyz.vicladachi, vyz.uspishnist
WHERE uspishnist.kodV = vicladachi.kod
  AND student.kod = uspishnist.kodS
  AND student.name LIKE 'П%';

-- 4. Вивести всіх, хто отримав оцінки 4 або 3
SELECT student.name, vicladachi.name, uspishnist.otsinka
FROM vyz.student, vyz.vicladachi, vyz.uspishnist
WHERE uspishnist.kodV = vicladachi.kod
  AND student.kod = uspishnist.kodS
  AND (uspishnist.otsinka = 4 OR uspishnist.otsinka = 3)
ORDER BY student.name;

-- 5. Підрахувати кількість студентів в групі
SELECT student.grupa, COUNT(student.name) AS kilkist
FROM vyz.student
GROUP BY student.grupa;

-- 6. Підрахувати кількість студентів в групі, які не мають 3
SELECT student.grupa, COUNT(student.name) AS kilkist
FROM vyz.student
WHERE student.kod NOT IN (SELECT uspishnist.kodS
                          FROM vyz.uspishnist
                          WHERE uspishnist.otsinka = 3)
GROUP BY student.grupa;
