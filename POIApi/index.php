<?php
ob_start(); // Bắt tất cả output thừa
ini_set('display_errors', 0); // Tắt hiển thị lỗi PHP ra output
error_reporting(0);
require_once 'api.php';