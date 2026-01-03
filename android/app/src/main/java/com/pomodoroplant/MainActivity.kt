package com.pomodoroplant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.pomodoroplant.ui.garden.GardenScreen
import com.pomodoroplant.ui.login.LoginScreen
import com.pomodoroplant.ui.theme.PomodoroPlantTheme
import com.pomodoroplant.ui.timer.TimerScreen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PomodoroPlantTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        } 
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate("timer") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("timer") {
            TimerScreen(
                onGoToGarden = {
                    navController.navigate("garden")
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }
        composable("garden") {
            GardenScreen(
                onBackToTimer = {
                    navController.popBackStack()
                }
            )
        }
    }
}
