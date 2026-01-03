import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';

/// Singleton service for managing local notifications
class NotificationService {
  // Singleton pattern
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  // Notification channel IDs
  static const String _timerChannelId = 'pomodoro_timer';
  static const String _timerChannelName = 'Pomodoro Timer';
  static const String _timerChannelDescription =
      'Notifications for completed pomodoro sessions';

  // Notification ID counter to allow multiple notifications
  int _notificationIdCounter = 0;

  /// Initialize the notification service with Android configuration
  Future<void> initialize() async {
    try {
      // Android initialization settings
      const AndroidInitializationSettings androidSettings =
          AndroidInitializationSettings('@mipmap/ic_launcher');

      const InitializationSettings initSettings = InitializationSettings(
        android: androidSettings,
      );

      await _notifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      // Create notification channel for Android
      await _createNotificationChannel();

      _log('Notification service initialized successfully');
    } catch (e) {
      _log('Error initializing notification service: $e');
    }
  }

  /// Create Android notification channel
  Future<void> _createNotificationChannel() async {
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      _timerChannelId,
      _timerChannelName,
      description: _timerChannelDescription,
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    _log('Notification channel created: $_timerChannelId');
  }

  /// Request notification permissions (required for Android 13+)
  Future<bool> requestPermissions() async {
    try {
      final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
          _notifications.resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();

      final bool? granted = await androidImplementation?.requestNotificationsPermission();

      _log('Notification permission granted: ${granted ?? false}');
      return granted ?? false;
    } catch (e) {
      _log('Error requesting notification permissions: $e');
      return false;
    }
  }

  /// Show timer completion notification
  Future<void> showTimerComplete({required int durationMinutes}) async {
    try {
      final int notificationId = _notificationIdCounter++;

      const AndroidNotificationDetails androidDetails =
          AndroidNotificationDetails(
        _timerChannelId,
        _timerChannelName,
        channelDescription: _timerChannelDescription,
        importance: Importance.high,
        priority: Priority.high,
        enableVibration: true,
        playSound: true,
      );

      const NotificationDetails notificationDetails = NotificationDetails(
        android: androidDetails,
      );

      await _notifications.show(
        notificationId,
        'Pomodoro Complete!',
        'Great work! Your plant has grown.',
        notificationDetails,
      );

      _log('Timer completion notification shown: $durationMinutes min (ID: $notificationId)');
    } catch (e) {
      _log('Error showing timer completion notification: $e');
    }
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    _log('Notification tapped: ${response.id}');
    // App is already opened when notification is tapped
    // No additional action needed for MVP
  }

  /// Cancel all notifications
  Future<void> cancelAll() async {
    await _notifications.cancelAll();
    _log('All notifications cancelled');
  }

  /// Log messages in debug mode
  void _log(String message) {
    if (kDebugMode) {
      print('[NotificationService] $message');
    }
  }
}
