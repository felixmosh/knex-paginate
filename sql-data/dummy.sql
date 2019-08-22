DROP TABLE IF EXISTS `persons`;

CREATE TABLE persons (
    id int PRIMARY KEY,
    name varchar(255),
    email varchar(255) DEFAULT Null
);
