-- База даних "Автомобілі" для лабораторної роботи "Збережені процедури і функції"
DROP DATABASE IF EXISTS avto;
CREATE DATABASE avto CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE avto;

CREATE TABLE dvyguny (              -- Двигуни
  id          INT PRIMARY KEY,
  typ         VARCHAR(10),          -- компонування циліндрів
  obyem       DECIMAL(3,1),         -- об'єм, л
  potuzhnist  INT,                  -- потужність, к.с.
  palyvo      VARCHAR(10)           -- тип пального
);

CREATE TABLE postachalnyky (        -- Постачальники
  id     INT PRIMARY KEY,
  nazva  VARCHAR(40),
  misto  VARCHAR(30)
);

CREATE TABLE transport (            -- Машини
  id               INT PRIMARY KEY,
  marka            VARCHAR(30),
  model            VARCHAR(30),
  kraina           VARCHAR(30),     -- країна виробництва
  rik              INT,             -- рік випуску
  tsina            DECIMAL(12,2),   -- ціна, грн
  dvygun_id        INT,
  postachalnyk_id  INT,
  FOREIGN KEY (dvygun_id)       REFERENCES dvyguny(id),
  FOREIGN KEY (postachalnyk_id) REFERENCES postachalnyky(id)
);

INSERT INTO dvyguny VALUES
 (1,'R4',1.4,100,'бензин'),
 (2,'R4',1.6,123,'бензин'),
 (3,'R4',2.0,150,'дизель'),
 (4,'R4',2.5,181,'бензин'),
 (5,'V6',3.0,249,'дизель'),
 (6,'V8',4.4,530,'бензин'),
 (7,'R4',1.2,90,'бензин');

INSERT INTO postachalnyky VALUES
 (1,'АвтоІмпорт','Київ'),
 (2,'Автосвіт','Львів'),
 (3,'Мегамоторс','Одеса'),
 (4,'Драйв Плюс','Харків');

INSERT INTO transport VALUES
 (1,'Toyota','Camry','Японія',2021,1250000,4,1),
 (2,'Toyota','Corolla','Японія',2019,720000,2,2),
 (3,'Volkswagen','Golf','Німеччина',2018,560000,1,2),
 (4,'BMW','X5','Німеччина',2022,3100000,5,3),
 (5,'BMW','M5','Німеччина',2023,4800000,6,3),
 (6,'Skoda','Octavia','Чехія',2020,690000,2,1),
 (7,'Renault','Logan','Франція',2017,310000,7,4),
 (8,'Hyundai','Tucson','Південна Корея',2021,1050000,3,4),
 (9,'Kia','Sportage','Південна Корея',2022,1150000,3,1),
 (10,'Mercedes-Benz','E-Class','Німеччина',2020,2350000,5,3);
