package com.pomodoroplant.api

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val username: String,
    val password: String
)

data class LoginResponse(
    val message: String,
    val username: String,
    val token: String
)

data class UserStats(
    @SerializedName("total_sessions") val totalSessions: Int,
    @SerializedName("current_streak") val currentStreak: Int,
    @SerializedName("longest_streak") val longestStreak: Int,
    @SerializedName("last_session_date") val lastSessionDate: String?
)

data class Plant(
    val id: Int,
    val name: String,
    val stage: Int,
    @SerializedName("unlocked_at") val unlockedAt: String?
)

data class PlantState(
    @SerializedName("plant_type") val plantType: String,
    @SerializedName("growth_stage") val growthStage: Int,
    @SerializedName("max_growth") val maxGrowth: Int,
    val flower: Plant?
)

data class GrowResponse(
    @SerializedName("plant_type") val plantType: String,
    @SerializedName("growth_stage") val growthStage: Int,
    @SerializedName("is_fully_grown") val isFullyGrown: Boolean,
    val isNew: Boolean,
    val flower: Plant?
)

data class PomodoroStartRequest(
    @SerializedName("duration_minutes") val durationMinutes: Double,
    @SerializedName("session_type") val sessionType: String
)

data class PomodoroStartResponse(
    @SerializedName("session_id") val sessionId: Int
)

data class PomodoroCompleteRequest(
    @SerializedName("session_id") val sessionId: Int
)

data class CollectionResponse(
    val plants: List<Plant>,
    @SerializedName("total_available") val totalAvailable: Int,
    @SerializedName("unlocked_count") val unlockedCount: Int
)

data class ErrorResponse(
    val error: String
)
