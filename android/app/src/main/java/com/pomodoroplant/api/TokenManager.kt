package com.pomodoroplant.api

object TokenManager {
    var token: String? = null
    var username: String? = null

    fun getAuthHeader(): String {
        return "Bearer $token"
    }
}
