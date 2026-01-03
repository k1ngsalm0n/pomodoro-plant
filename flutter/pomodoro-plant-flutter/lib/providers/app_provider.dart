import 'package:flutter/foundation.dart';
import '../models/plant_model.dart';
import '../models/stats_model.dart';
import '../models/session_model.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../services/notification_service.dart';

class AppProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final SocketService _socketService = SocketService();
  final NotificationService? _notificationService;

  String? _username;
  bool _isAuthenticated = false;
  PlantState? _currentPlant;
  UserStats? _userStats;
  PomodoroSession? _currentSession;
  int? _remainingSeconds;
  List<UnlockedPlant> _unlockedPlants = [];
  int _totalAvailable = 30;
  bool _isLoading = false;
  String? _error;

  // Getters
  String? get username => _username;
  bool get isAuthenticated => _isAuthenticated;
  PlantState? get currentPlant => _currentPlant;
  UserStats? get userStats => _userStats;
  PomodoroSession? get currentSession => _currentSession;
  int? get remainingSeconds => _remainingSeconds;
  List<UnlockedPlant> get unlockedPlants => _unlockedPlants;
  int get totalAvailable => _totalAvailable;
  int get unlockedCount => _unlockedPlants.length;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isTimerRunning => _currentSession != null && _remainingSeconds != null;

  AppProvider({NotificationService? notificationService})
      : _notificationService = notificationService {
    _initialize();
  }

  Future<void> _initialize() async {
    await _apiService.loadToken();
    if (_apiService.token != null) {
      _isAuthenticated = true;
      _socketService.initialize(token: _apiService.token);
      _socketService.connect();
      _setupSocketListeners();
      await loadUserData();
    }
  }

  void _setupSocketListeners() {
    _socketService.onTimerUpdate((data) {
      print('Timer update from another device: $data');
      // Handle timer sync from other devices
      if (data['action'] == 'started') {
        // Update local timer state
        notifyListeners();
      } else if (data['action'] == 'completed') {
        _currentSession = null;
        _remainingSeconds = null;
        notifyListeners();
      }
    });

    _socketService.onPlantUpdate((data) {
      print('Plant update from another device: $data');
      // Reload plant state
      loadPlantState();
    });
  }

  void setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Authentication methods

  Future<void> login(String username, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final result = await _apiService.login(username, password);
      _username = result['username'];
      _isAuthenticated = true;

      _socketService.initialize(token: _apiService.token);
      _socketService.connect();
      _setupSocketListeners();

      await loadUserData();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }

  Future<void> register(String username, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      final result = await _apiService.register(username, password);
      _username = result['username'];
      _isAuthenticated = true;

      _socketService.initialize(token: _apiService.token);
      _socketService.connect();
      _setupSocketListeners();

      await loadUserData();

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _apiService.logout();
    _socketService.disconnect();
    _username = null;
    _isAuthenticated = false;
    _currentPlant = null;
    _userStats = null;
    _currentSession = null;
    _remainingSeconds = null;
    _unlockedPlants = [];
    notifyListeners();
  }

  // Data loading methods

  Future<void> loadUserData() async {
    await Future.wait([
      loadPlantState(),
      loadUserStats(),
      loadCollection(),
    ]);
  }

  Future<void> loadPlantState() async {
    try {
      _currentPlant = await _apiService.getPlantState();
      notifyListeners();
    } catch (e) {
      print('Error loading plant state: $e');
    }
  }

  Future<void> loadUserStats() async {
    try {
      _userStats = await _apiService.getUserStats();
      notifyListeners();
    } catch (e) {
      print('Error loading user stats: $e');
    }
  }

  Future<void> loadCollection() async {
    try {
      final result = await _apiService.getUserCollection();
      _unlockedPlants = (result['plants'] as List)
          .map((p) => UnlockedPlant.fromJson(p))
          .toList();
      _totalAvailable = result['total_available'] as int;
      notifyListeners();
    } catch (e) {
      print('Error loading collection: $e');
    }
  }

  // Timer methods

  Future<void> startTimer({int durationMinutes = 25, int? actualSeconds}) async {
    try {
      print('[AppProvider] Starting timer: $durationMinutes minutes, $actualSeconds seconds');
      _error = null;
      _currentSession = await _apiService.startPomodoroSession(
        durationMinutes: durationMinutes,
      );
      _remainingSeconds = actualSeconds ?? (durationMinutes * 60);

      print('[AppProvider] Timer started - Session ID: ${_currentSession!.sessionId}, Remaining: $_remainingSeconds sec');

      // Sync to other devices
      _socketService.syncTimer({
        'action': 'started',
        'session_id': _currentSession!.sessionId,
        'started_at': _currentSession!.startedAt.toIso8601String(),
        'duration_minutes': _currentSession!.durationMinutes,
        'session_type': _currentSession!.sessionType,
      });

      notifyListeners();
    } catch (e) {
      print('[AppProvider] Error starting timer: $e');
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      rethrow;
    }
  }

  void updateTimer(int seconds) {
    _remainingSeconds = seconds;
    notifyListeners();
  }

  Future<void> completeTimer() async {
    if (_currentSession == null) {
      print('[AppProvider] ERROR: No current session to complete!');
      return;
    }

    print('[AppProvider] Completing timer - Session ID: ${_currentSession!.sessionId}');

    try {
      final sessionId = _currentSession!.sessionId;
      final durationMinutes = _currentSession!.durationMinutes;
      print('[AppProvider] Calling API to complete session $sessionId...');

      await _apiService.completePomodoroSession(sessionId);
      print('[AppProvider] Session $sessionId completed successfully');

      // Show notification
      if (_notificationService != null) {
        await _notificationService!.showTimerComplete(
          durationMinutes: durationMinutes,
        );
      }

      // Sync to other devices
      _socketService.syncTimer({
        'action': 'completed',
        'session_id': sessionId,
        'completed_at': DateTime.now().toIso8601String(),
      });

      _currentSession = null;
      _remainingSeconds = null;

      print('[AppProvider] Growing plant...');
      // Grow plant as reward
      await growPlant();

      print('[AppProvider] Reloading stats...');
      // Reload stats
      await loadUserStats();

      print('[AppProvider] Timer completion finished!');
      notifyListeners();
    } catch (e) {
      print('[AppProvider] ERROR completing timer: $e');
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  void cancelTimer() {
    _currentSession = null;
    _remainingSeconds = null;
    notifyListeners();
  }

  // Plant methods

  Future<void> growPlant() async {
    try {
      print('[AppProvider] Calling API to grow plant...');
      final updatedPlant = await _apiService.growPlant();
      print('[AppProvider] Plant grew! Stage: ${updatedPlant.growthStage}/${updatedPlant.maxGrowth}, Fully grown: ${updatedPlant.isFullyGrown}, New: ${updatedPlant.isNew}');

      _currentPlant = updatedPlant;

      // Sync to other devices
      _socketService.syncPlant({
        'plant_type': updatedPlant.plantType,
        'growth_stage': updatedPlant.growthStage,
        'flower': updatedPlant.flower.toJson(),
      });

      // If plant is fully grown and new, reload collection
      if (updatedPlant.isFullyGrown == true && updatedPlant.isNew == true) {
        print('[AppProvider] Plant fully grown and new! Reloading collection...');
        await loadCollection();
      }

      notifyListeners();
    } catch (e) {
      print('[AppProvider] ERROR growing plant: $e');
    }
  }

  Future<void> startNewPlant() async {
    try {
      _currentPlant = await _apiService.startNewPlant();

      // Sync to other devices
      _socketService.syncPlant({
        'plant_type': _currentPlant!.plantType,
        'growth_stage': _currentPlant!.growthStage,
        'flower': _currentPlant!.flower.toJson(),
      });

      notifyListeners();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  String getFlowerImageUrl(int flowerId) {
    return _apiService.getFlowerImageUrl(flowerId);
  }

  String getPlantStage3Url(int flowerId) {
    return _apiService.getPlantStage3Url(flowerId);
  }

  String getPlantStage4Url(int flowerId) {
    return _apiService.getPlantStage4Url(flowerId);
  }

  @override
  void dispose() {
    _socketService.dispose();
    super.dispose();
  }
}
