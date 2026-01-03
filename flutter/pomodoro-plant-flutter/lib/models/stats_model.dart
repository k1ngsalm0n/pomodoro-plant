class UserStats {
  final int totalSessions;
  final int currentStreak;
  final int longestStreak;
  final String? lastSessionDate;

  UserStats({
    required this.totalSessions,
    required this.currentStreak,
    required this.longestStreak,
    this.lastSessionDate,
  });

  factory UserStats.fromJson(Map<String, dynamic> json) {
    return UserStats(
      totalSessions: json['total_sessions'] as int,
      currentStreak: json['current_streak'] as int,
      longestStreak: json['longest_streak'] as int,
      lastSessionDate: json['last_session_date'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total_sessions': totalSessions,
      'current_streak': currentStreak,
      'longest_streak': longestStreak,
      'last_session_date': lastSessionDate,
    };
  }
}
