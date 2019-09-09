DROP TABLE IF EXISTS `persons`;
DROP TABLE IF EXISTS `person_details`;

CREATE TABLE persons (
    id int PRIMARY KEY,
    name varchar(255),
    email varchar(255) DEFAULT Null
);

CREATE TABLE `person_details` (
  `person_id` int(11) NOT NULL,
  `city_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `person_details`
  ADD PRIMARY KEY (`person_id`,`city_id`);
