-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: uniride_db
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ride_id` bigint unsigned NOT NULL,
  `passenger_id` bigint unsigned NOT NULL,
  `seats_booked` tinyint unsigned NOT NULL DEFAULT '1',
  `total_ride_cost` decimal(10,2) NOT NULL,
  `passenger_count_at_booking` int unsigned NOT NULL,
  `base_fare` decimal(10,2) NOT NULL,
  `student_discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `student_discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `final_fare` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','rejected','cancelled','completed') NOT NULL DEFAULT 'pending',
  `driver_response_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_booking_passenger_ride` (`ride_id`,`passenger_id`),
  KEY `idx_booking_passenger` (`passenger_id`),
  KEY `idx_booking_ride_status` (`ride_id`,`status`),
  KEY `idx_booking_status` (`status`),
  CONSTRAINT `fk_booking_passenger` FOREIGN KEY (`passenger_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_booking_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_booking_fares` CHECK (((`total_ride_cost` >= 0) and (`base_fare` >= 0) and (`student_discount_amount` >= 0) and (`final_fare` >= 0))),
  CONSTRAINT `chk_booking_seats` CHECK ((`seats_booked` between 1 and 8))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ride_id` bigint unsigned NOT NULL,
  `sender_id` bigint unsigned NOT NULL,
  `receiver_id` bigint unsigned NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_ride_time` (`ride_id`,`created_at`),
  KEY `idx_chat_sender` (`sender_id`),
  KEY `idx_chat_receiver_unread` (`receiver_id`,`is_read`),
  CONSTRAINT `fk_chat_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_chat_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `driver_verifications`
--

DROP TABLE IF EXISTS `driver_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver_verifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `licence_number` varchar(100) NOT NULL,
  `licence_document_url` varchar(500) NOT NULL,
  `licence_document_public_id` varchar(255) DEFAULT NULL,
  `government_id_type` enum('aadhaar','passport','voter_id','other') NOT NULL,
  `government_id_number` varchar(100) NOT NULL,
  `government_id_url` varchar(500) NOT NULL,
  `government_id_public_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_remarks` varchar(500) DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `licence_number` (`licence_number`),
  KEY `fk_driver_verification_admin` (`reviewed_by`),
  KEY `idx_driver_verification_status` (`status`),
  CONSTRAINT `fk_driver_verification_admin` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_driver_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `emergency_contacts`
--

DROP TABLE IF EXISTS `emergency_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emergency_contacts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `contact_name` varchar(100) NOT NULL,
  `relationship` varchar(50) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_emergency_phone` (`user_id`,`phone`),
  KEY `idx_emergency_contact_user` (`user_id`),
  CONSTRAINT `fk_emergency_contact_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `ride_id` bigint unsigned DEFAULT NULL,
  `booking_id` bigint unsigned DEFAULT NULL,
  `type` enum('booking_request','booking_confirmed','booking_rejected','booking_cancelled','ride_cancelled','ride_started','ride_completed','verification_approved','verification_rejected','new_message','sos_alert','general') NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` varchar(500) NOT NULL,
  `data_json` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_notification_ride` (`ride_id`),
  KEY `fk_notification_booking` (`booking_id`),
  KEY `idx_notification_user_unread` (`user_id`,`is_read`),
  KEY `idx_notification_created` (`created_at`),
  CONSTRAINT `fk_notification_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notification_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_password_reset_user` (`user_id`),
  KEY `idx_password_reset_expiry` (`expires_at`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL,
  `device_info` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_refresh_token_user` (`user_id`),
  KEY `idx_refresh_token_expiry` (`expires_at`),
  KEY `idx_refresh_token_active` (`user_id`,`revoked_at`,`expires_at`),
  CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reported_issues`
--

DROP TABLE IF EXISTS `reported_issues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reported_issues` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `reported_by` bigint unsigned NOT NULL,
  `ride_id` bigint unsigned DEFAULT NULL,
  `booking_id` bigint unsigned DEFAULT NULL,
  `category` enum('safety','driver_behavior','passenger_behavior','vehicle','payment','route','technical','other') NOT NULL,
  `description` text NOT NULL,
  `evidence_url` varchar(500) DEFAULT NULL,
  `evidence_public_id` varchar(255) DEFAULT NULL,
  `status` enum('open','under_review','resolved','dismissed') NOT NULL DEFAULT 'open',
  `admin_notes` text,
  `handled_by` bigint unsigned DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_issue_ride` (`ride_id`),
  KEY `fk_issue_booking` (`booking_id`),
  KEY `fk_issue_admin` (`handled_by`),
  KEY `idx_issue_reporter` (`reported_by`),
  KEY `idx_issue_status` (`status`),
  KEY `idx_issue_created` (`created_at`),
  CONSTRAINT `fk_issue_admin` FOREIGN KEY (`handled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_issue_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_issue_reporter` FOREIGN KEY (`reported_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_issue_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ride_locations`
--

DROP TABLE IF EXISTS `ride_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ride_locations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ride_id` bigint unsigned NOT NULL,
  `driver_id` bigint unsigned NOT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `accuracy_meters` decimal(10,2) DEFAULT NULL,
  `speed_kmh` decimal(10,2) DEFAULT NULL,
  `heading_degrees` decimal(6,2) DEFAULT NULL,
  `recorded_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_ride_location_history` (`ride_id`,`recorded_at`),
  KEY `idx_ride_location_driver` (`driver_id`),
  CONSTRAINT `fk_ride_location_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ride_location_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rides`
--

DROP TABLE IF EXISTS `rides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rides` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `driver_id` bigint unsigned NOT NULL,
  `vehicle_id` bigint unsigned NOT NULL,
  `source_address` varchar(255) NOT NULL,
  `source_latitude` decimal(10,7) NOT NULL,
  `source_longitude` decimal(10,7) NOT NULL,
  `destination_address` varchar(255) NOT NULL,
  `destination_latitude` decimal(10,7) NOT NULL,
  `destination_longitude` decimal(10,7) NOT NULL,
  `departure_datetime` datetime NOT NULL,
  `total_seats` tinyint unsigned NOT NULL,
  `available_seats` tinyint unsigned NOT NULL,
  `estimated_total_cost` decimal(10,2) NOT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `estimated_duration_minutes` int unsigned DEFAULT NULL,
  `route_geometry` longtext,
  `status` enum('scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_ride_vehicle` (`vehicle_id`),
  KEY `idx_ride_driver` (`driver_id`),
  KEY `idx_ride_departure` (`departure_datetime`),
  KEY `idx_ride_status` (`status`),
  KEY `idx_ride_search` (`source_address`,`destination_address`,`departure_datetime`),
  CONSTRAINT `fk_ride_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ride_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_ride_available_seats` CHECK (((`available_seats` >= 0) and (`available_seats` <= `total_seats`))),
  CONSTRAINT `chk_ride_cost` CHECK ((`estimated_total_cost` >= 0)),
  CONSTRAINT `chk_ride_total_seats` CHECK ((`total_seats` between 1 and 8))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sos_incidents`
--

DROP TABLE IF EXISTS `sos_incidents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sos_incidents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `ride_id` bigint unsigned DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `location_accuracy_meters` decimal(10,2) DEFAULT NULL,
  `status` enum('triggered','acknowledged','resolved','false_alarm') NOT NULL DEFAULT 'triggered',
  `incident_notes` varchar(1000) DEFAULT NULL,
  `resolved_by` bigint unsigned DEFAULT NULL,
  `acknowledged_at` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sos_resolved_admin` (`resolved_by`),
  KEY `idx_sos_user` (`user_id`),
  KEY `idx_sos_ride` (`ride_id`),
  KEY `idx_sos_status_created` (`status`,`created_at`),
  CONSTRAINT `fk_sos_resolved_admin` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sos_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_verifications`
--

DROP TABLE IF EXISTS `student_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_verifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `college_name` varchar(200) NOT NULL,
  `enrollment_number` varchar(100) NOT NULL,
  `college_id_url` varchar(500) NOT NULL,
  `college_id_public_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `admin_remarks` varchar(500) DEFAULT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `fk_student_verification_admin` (`reviewed_by`),
  KEY `idx_student_verification_status` (`status`),
  CONSTRAINT `fk_student_verification_admin` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_student_verification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trip_shares`
--

DROP TABLE IF EXISTS `trip_shares`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trip_shares` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `ride_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `recipient_name` varchar(100) DEFAULT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(1) NOT NULL DEFAULT '0',
  `view_count` int unsigned NOT NULL DEFAULT '0',
  `last_viewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_trip_share_creator` (`created_by`),
  KEY `idx_trip_share_ride` (`ride_id`),
  KEY `idx_trip_share_expiry` (`expires_at`),
  KEY `idx_trip_share_active` (`is_revoked`,`expires_at`),
  CONSTRAINT `fk_trip_share_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trip_share_ride` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('passenger','driver','admin') NOT NULL,
  `account_status` enum('active','suspended','deactivated') NOT NULL DEFAULT 'active',
  `avatar_url` varchar(500) DEFAULT NULL,
  `token_version` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`account_status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vehicles`
--

DROP TABLE IF EXISTS `vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `driver_id` bigint unsigned NOT NULL,
  `make` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  `manufacturing_year` year NOT NULL,
  `color` varchar(50) NOT NULL,
  `registration_number` varchar(50) NOT NULL,
  `vehicle_type` enum('car','suv','van') NOT NULL DEFAULT 'car',
  `total_seats` tinyint unsigned NOT NULL,
  `registration_document_url` varchar(500) NOT NULL,
  `registration_document_public_id` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_number` (`registration_number`),
  KEY `idx_vehicle_driver` (`driver_id`),
  KEY `idx_vehicle_active` (`is_active`),
  CONSTRAINT `fk_vehicle_driver` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_vehicle_seats` CHECK ((`total_seats` between 1 and 8))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-26 16:24:23
