import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/plant_model.dart';
import '../models/stats_model.dart';
import '../models/session_model.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator to access host machine's localhost
  static const String baseUrl = 'http://10.0.2.2:5001';
  String? _token;

  String? get token => _token;

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    _token = token;
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    _token = null;
  }

  Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = <String, String>{
      'Content-Type': 'application/json',
    };
    if (includeAuth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    return headers;
  }

  // Authentication endpoints

  Future<Map<String, dynamic>> register(
      String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/register'),
      headers: _getHeaders(includeAuth: false),
      body: json.encode({
        'username': username,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      await saveToken(data['token']);
      return data;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Registration failed');
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/login'),
      headers: _getHeaders(includeAuth: false),
      body: json.encode({
        'username': username,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      await saveToken(data['token']);
      return data;
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Login failed');
    }
  }

  Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('$baseUrl/api/logout'),
        headers: _getHeaders(),
      );
    } finally {
      await clearToken();
    }
  }

  // Pomodoro endpoints

  Future<PomodoroSettings> getPomodoroSettings() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/pomodoro/settings'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return PomodoroSettings.fromJson(data);
    } else {
      throw Exception('Failed to load settings');
    }
  }

  Future<PomodoroSession> startPomodoroSession({
    int durationMinutes = 25,
    String sessionType = 'study',
  }) async {
    print('[ApiService] POST $baseUrl/api/pomodoro/start - Duration: $durationMinutes min');

    final response = await http.post(
      Uri.parse('$baseUrl/api/pomodoro/start'),
      headers: _getHeaders(),
      body: json.encode({
        'duration_minutes': durationMinutes,
        'session_type': sessionType,
      }),
    );

    print('[ApiService] Response: ${response.statusCode} - ${response.body}');

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return PomodoroSession.fromJson(data);
    } else {
      throw Exception('Failed to start session: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> completePomodoroSession(int sessionId) async {
    print('[ApiService] POST $baseUrl/api/pomodoro/complete - Session ID: $sessionId');

    final response = await http.post(
      Uri.parse('$baseUrl/api/pomodoro/complete'),
      headers: _getHeaders(),
      body: json.encode({
        'session_id': sessionId,
      }),
    );

    print('[ApiService] Response: ${response.statusCode} - ${response.body}');

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to complete session: ${response.body}');
    }
  }

  // Plant endpoints

  Future<PlantState> getPlantState() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/plant/state'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return PlantState.fromJson(data);
    } else {
      throw Exception('Failed to load plant state');
    }
  }

  Future<PlantState> growPlant({int? flowerId}) async {
    final body = flowerId != null ? json.encode({'flowerId': flowerId}) : null;

    print('[ApiService] POST $baseUrl/api/plant/grow - Flower ID: $flowerId');

    final response = await http.post(
      Uri.parse('$baseUrl/api/plant/grow'),
      headers: _getHeaders(),
      body: body,
    );

    print('[ApiService] Response: ${response.statusCode} - ${response.body}');

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return PlantState.fromJson(data);
    } else {
      throw Exception('Failed to grow plant: ${response.body}');
    }
  }

  Future<PlantState> startNewPlant() async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/plant/new'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return PlantState.fromJson(data);
    } else {
      throw Exception('Failed to start new plant');
    }
  }

  // User endpoints

  Future<UserStats> getUserStats() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/user/stats'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return UserStats.fromJson(data);
    } else {
      throw Exception('Failed to load stats');
    }
  }

  Future<Map<String, dynamic>> getUserCollection() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/user/collection'),
      headers: _getHeaders(),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load collection');
    }
  }

  // Asset URLs

  String getFlowerImageUrl(int flowerId) {
    return '$baseUrl/assets/flower/$flowerId.svg';
  }

  String getPlantStage3Url(int flowerId) {
    return '$baseUrl/assets/plant_stage_3/$flowerId.svg';
  }

  String getPlantStage4Url(int flowerId) {
    return '$baseUrl/assets/plant_stage_4/$flowerId.svg';
  }
}
