import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/plant_widget.dart';
import 'stats_screen.dart';
import 'collection_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Timer? _timer;
  int _selectedDuration = 25;
  int _timerTotalSeconds = 0; // Track the total duration for progress calculation

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    final provider = Provider.of<AppProvider>(context, listen: false);

    // Handle 5 second debug timer (0 = 5 seconds for debugging)
    final int durationMinutes = _selectedDuration == 0 ? 1 : _selectedDuration;
    final int durationSeconds = _selectedDuration == 0 ? 5 : (_selectedDuration * 60);
    _timerTotalSeconds = durationSeconds; // Store for progress calculation

    print('Starting timer: $_selectedDuration (duration: $durationMinutes min, $durationSeconds sec)');

    provider.startTimer(durationMinutes: durationMinutes, actualSeconds: durationSeconds);

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final remaining = provider.remainingSeconds;
      if (remaining != null && remaining > 0) {
        provider.updateTimer(remaining - 1);
      } else {
        timer.cancel();
        if (remaining == 0) {
          _handleTimerComplete();
        }
      }
    });
  }

  void _handleTimerComplete() {
    final provider = Provider.of<AppProvider>(context, listen: false);
    provider.completeTimer();

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Pomodoro complete! Your plant has grown!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _cancelTimer() {
    _timer?.cancel();
    final provider = Provider.of<AppProvider>(context, listen: false);
    provider.cancelTimer();
  }

  String _formatTime(int seconds) {
    final minutes = seconds ~/ 60;
    final secs = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  Future<void> _handleLogout() async {
    final provider = Provider.of<AppProvider>(context, listen: false);
    await provider.logout();

    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pomodoro Plant'),
        actions: [
          IconButton(
            icon: const Icon(Icons.bar_chart),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const StatsScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.collections),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (context) => const CollectionScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          if (provider.currentPlant == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  Text(
                    'Welcome, ${provider.username ?? 'User'}!',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 24),
                  PlantWidget(plant: provider.currentPlant!),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          Text(
                            provider.currentPlant!.plantType,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: provider.currentPlant!.growthStage /
                                provider.currentPlant!.maxGrowth,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Growth: ${provider.currentPlant!.growthStage}/${provider.currentPlant!.maxGrowth}',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  if (!provider.isTimerRunning) ...[
                    Text(
                      'Select Duration',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      children: [
                        ChoiceChip(
                          label: const Text('5 sec'),
                          selected: _selectedDuration == 0,
                          onSelected: (selected) {
                            setState(() {
                              _selectedDuration = 0;
                            });
                          },
                        ),
                        ChoiceChip(
                          label: const Text('1 min'),
                          selected: _selectedDuration == 1,
                          onSelected: (selected) {
                            setState(() {
                              _selectedDuration = 1;
                            });
                          },
                        ),
                        ChoiceChip(
                          label: const Text('5 min'),
                          selected: _selectedDuration == 5,
                          onSelected: (selected) {
                            setState(() {
                              _selectedDuration = 5;
                            });
                          },
                        ),
                        ChoiceChip(
                          label: const Text('25 min'),
                          selected: _selectedDuration == 25,
                          onSelected: (selected) {
                            setState(() {
                              _selectedDuration = 25;
                            });
                          },
                        ),
                        ChoiceChip(
                          label: const Text('45 min'),
                          selected: _selectedDuration == 45,
                          onSelected: (selected) {
                            setState(() {
                              _selectedDuration = 45;
                            });
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: _startTimer,
                      icon: const Icon(Icons.play_arrow),
                      label: const Text('Start Pomodoro'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 16,
                        ),
                      ),
                    ),
                  ] else ...[
                    Text(
                      _formatTime(provider.remainingSeconds ?? 0),
                      style: Theme.of(context).textTheme.displayLarge,
                    ),
                    const SizedBox(height: 24),
                    LinearProgressIndicator(
                      value: _timerTotalSeconds > 0
                          ? (provider.remainingSeconds ?? 0) / _timerTotalSeconds
                          : 0.0,
                    ),
                    const SizedBox(height: 24),
                    FilledButton.tonalIcon(
                      onPressed: _cancelTimer,
                      icon: const Icon(Icons.stop),
                      label: const Text('Cancel'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 16,
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 32),
                  if (provider.currentPlant!.growthStage ==
                      provider.currentPlant!.maxGrowth)
                    OutlinedButton.icon(
                      onPressed: () async {
                        await provider.startNewPlant();
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Started a new plant!'),
                            ),
                          );
                        }
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Start New Plant'),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
