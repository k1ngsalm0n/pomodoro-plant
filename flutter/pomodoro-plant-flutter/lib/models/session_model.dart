class PomodoroSession {
  final int sessionId;
  final DateTime startedAt;
  final int durationMinutes;
  final String sessionType;
  final DateTime? completedAt;

  PomodoroSession({
    required this.sessionId,
    required this.startedAt,
    required this.durationMinutes,
    required this.sessionType,
    this.completedAt,
  });

  factory PomodoroSession.fromJson(Map<String, dynamic> json) {
    return PomodoroSession(
      sessionId: json['session_id'] as int,
      startedAt: DateTime.parse(json['started_at'] as String),
      durationMinutes: json['duration_minutes'] as int,
      sessionType: json['session_type'] as String,
      completedAt: json['completed_at'] != null
          ? DateTime.parse(json['completed_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'session_id': sessionId,
      'started_at': startedAt.toIso8601String(),
      'duration_minutes': durationMinutes,
      'session_type': sessionType,
      'completed_at': completedAt?.toIso8601String(),
    };
  }
}

class PomodoroSettings {
  final int study;
  final int shortBreak;
  final int longBreak;
  final int sessionsUntilLongBreak;
  final String user;

  PomodoroSettings({
    required this.study,
    required this.shortBreak,
    required this.longBreak,
    required this.sessionsUntilLongBreak,
    required this.user,
  });

  factory PomodoroSettings.fromJson(Map<String, dynamic> json) {
    return PomodoroSettings(
      study: json['study'] as int,
      shortBreak: json['short_break'] as int,
      longBreak: json['long_break'] as int,
      sessionsUntilLongBreak: json['sessions_until_long_break'] as int,
      user: json['user'] as String,
    );
  }
}
