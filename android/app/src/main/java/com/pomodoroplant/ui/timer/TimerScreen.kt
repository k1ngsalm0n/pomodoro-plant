package com.pomodoroplant.ui.timer

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.decode.SvgDecoder
import coil.request.ImageRequest

@Composable
fun TimerScreen(
    onGoToGarden: () -> Unit,
    onBack: () -> Unit,
    viewModel: TimerViewModel = viewModel()
) {
    val seconds by viewModel.seconds.collectAsState()
    val pomodoroCount by viewModel.pomodoroCount.collectAsState()
    val isRunning by viewModel.isRunning.collectAsState()
    val onBreak by viewModel.onBreak.collectAsState()
    val currentPlant by viewModel.currentPlant.collectAsState()

    val minutes = seconds / 60
    val remainingSeconds = seconds % 60
    val timeText = "%02d:%02d".format(minutes, remainingSeconds)

    val stage = if (!onBreak) (pomodoroCount + 1).coerceAtMost(4) else 1
    val imageUrl = if (!onBreak) {
        if (stage >= 3 && currentPlant != null) {
            "http://10.0.2.2:5001/assets/plant_stage_$stage/${currentPlant?.id}.svg"
        } else {
            "http://10.0.2.2:5001/assets/plant_stage_$stage.svg"
        }
    } else {
        "http://10.0.2.2:5001/assets/break_icon.svg"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        Text(
            text = if (onBreak) (if (pomodoroCount % 4 == 0) "Long Break" else "Short Break") else "Study Mode",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.tertiary,
            fontWeight = FontWeight.Bold
        )

        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(imageUrl)
                .decoderFactory(SvgDecoder.Factory())
                .build(),
            contentDescription = "Plant Image",
            modifier = Modifier.size(200.dp),
            contentScale = ContentScale.Fit
        )

        Text(
            text = timeText,
            style = MaterialTheme.typography.displayLarge,
            fontSize = 72.sp,
            color = MaterialTheme.colorScheme.onBackground,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "Pomodoros completed: $pomodoroCount / 4",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Button(
                onClick = { viewModel.toggleTimer() },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                modifier = Modifier.weight(1f)
            ) {
                Text(if (isRunning) "Pause" else "Start")
            }
            Button(
                onClick = { viewModel.resetTimer() },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.weight(1f)
            ) {
                Text("Reset")
            }
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Button(
                onClick = { onGoToGarden() },
                modifier = Modifier.weight(1f)
            ) {
                Text("Garden")
            }
            Button(
                onClick = { onBack() },
                modifier = Modifier.weight(1f)
            ) {
                Text("Back")
            }
        }
    }
}
