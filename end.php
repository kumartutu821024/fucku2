<?php
/**
 * API Proxy for Educational Streaming Platform (InfinityFree Compatiable)
 * Location: web/api/send.php
 */

// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$API_BASE = "https://sahukgs.vercel.app/api";

// Fetch action and id parameters
$action = isset($_GET['action']) ? $_GET['action'] : '';
$id = isset($_GET['id']) ? $_GET['id'] : '';

if (empty($action) || empty($id)) {
    // Fallback to reading raw "path" parameter if present
    $path = isset($_GET['path']) ? $_GET['path'] : '';
    if (!empty($path)) {
        $path = ltrim($path, '/');
        // Extract action and id
        $parts = explode('/', $path);
        if (count($parts) >= 2) {
            $action = $parts[0];
            $id = $parts[1];
        }
    }
}

// Map the actions to exact endpoints
$endpoint = '';
switch ($action) {
    case 'today':
    case 'classroom':
    case 'lesson':
    case 'video':
        $endpoint = rtrim($action, '/') . '/' . ltrim($id, '/');
        break;
    default:
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => "Unsupported or missing action. Use today, classroom, lesson, or video with an id parameter."
        ]);
        exit;
}

$url = $API_BASE . "/" . $endpoint;

// Initialize cURL call
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

// Set proxy user-agent to avoid being blocked
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    http_response_code(502);
    echo json_encode([
        "success" => false,
        "error" => "Failed to reach backend API proxy: " . $error_msg
    ]);
} else {
    http_response_code($http_code);
    echo $response;
}

curl_close($ch);
?>
