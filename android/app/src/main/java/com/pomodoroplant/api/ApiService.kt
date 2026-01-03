package com.pomodoroplant.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {
    @POST("api/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/register")
    suspend fun register(@Body request: LoginRequest): Response<LoginResponse>

    @GET("api/user/stats")
    suspend fun getStats(@Header("Authorization") token: String): Response<UserStats>

    @GET("api/user/collection")
    suspend fun getCollection(@Header("Authorization") token: String): Response<CollectionResponse>

    @GET("api/plant/state")
    suspend fun getPlantState(@Header("Authorization") token: String): Response<PlantState>

    @POST("api/plant/grow")
    suspend fun growPlant(
        @Header("Authorization") token: String,
        @Body body: Map<String, Int>
    ): Response<GrowResponse>

    @POST("api/pomodoro/start")
    suspend fun startPomodoro(
        @Header("Authorization") token: String,
        @Body request: PomodoroStartRequest
    ): Response<PomodoroStartResponse>

    @POST("api/pomodoro/complete")
    suspend fun completePomodoro(
        @Header("Authorization") token: String,
        @Body request: PomodoroCompleteRequest
    ): Response<Void>
}
