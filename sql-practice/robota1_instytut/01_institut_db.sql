-- База даних "Інститут" (таблиці з рис. 1)
DROP DATABASE IF EXISTS vyz;
CREATE DATABASE vyz CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE vyz;

CREATE TABLE student (
  kod   INT PRIMARY KEY,
  name  VARCHAR(30),
  grupa VARCHAR(10)
);

CREATE TABLE vicladachi (
  kod     INT PRIMARY KEY,
  name    VARCHAR(30),
  predmet VARCHAR(30)
);

CREATE TABLE uspishnist (
  kodS    INT,
  kodV    INT,
  otsinka INT,
  FOREIGN KEY (kodS) REFERENCES student(kod),
  FOREIGN KEY (kodV) REFERENCES vicladachi(kod)
);

INSERT INTO student VALUES
 (1,'иванов','ук-1'),(2,'петров','ук-1'),(3,'сидоров','ук-1'),
 (4,'иваненко','ук-2'),(5,'петренко','ук-2'),(6,'шевченко','ук-2');

INSERT INTO vicladachi VALUES
 (1,'капустин','математика'),(2,'старостин','информатика'),
 (3,'пасенко','базы данных'),(4,'петренко','ком_сети');

INSERT INTO uspishnist VALUES (1,1,4),(2,1,3),(3,2,2),(4,4,5);
