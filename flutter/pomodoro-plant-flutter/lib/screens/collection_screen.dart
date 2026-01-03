import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class CollectionScreen extends StatelessWidget {
  const CollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flower Collection'),
      ),
      body: Consumer<AppProvider>(
        builder: (context, provider, child) {
          final unlockedIds =
              provider.unlockedPlants.map((p) => p.id).toSet();
          final allFlowerIds =
              List<int>.generate(provider.totalAvailable, (i) => i + 1);

          return SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        children: [
                          Text(
                            '${provider.unlockedCount} / ${provider.totalAvailable}',
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: provider.unlockedCount /
                                provider.totalAvailable,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            '${((provider.unlockedCount / provider.totalAvailable) * 100).toStringAsFixed(1)}% Complete',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16.0),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: allFlowerIds.length,
                    itemBuilder: (context, index) {
                      final flowerId = allFlowerIds[index];
                      final isUnlocked = unlockedIds.contains(flowerId);

                      final unlockedPlant = isUnlocked
                          ? provider.unlockedPlants
                              .firstWhere((p) => p.id == flowerId)
                          : null;

                      return GestureDetector(
                        onTap: isUnlocked
                            ? () {
                                _showFlowerDetails(
                                    context, unlockedPlant!, provider);
                              }
                            : null,
                        child: Card(
                          elevation: isUnlocked ? 2 : 0,
                          color: isUnlocked
                              ? null
                              : Theme.of(context)
                                  .colorScheme
                                  .surfaceContainerHighest
                                  .withOpacity(0.3),
                          child: Stack(
                            children: [
                              Center(
                                child: SvgPicture.network(
                                  provider.getFlowerImageUrl(flowerId),
                                  width: 80,
                                  height: 80,
                                  placeholderBuilder: (context) =>
                                      const CircularProgressIndicator(),
                                  colorFilter: isUnlocked
                                      ? null
                                      : const ColorFilter.mode(
                                          Colors.grey,
                                          BlendMode.saturation,
                                        ),
                                ),
                              ),
                              if (!isUnlocked)
                                Container(
                                  color: Colors.black.withOpacity(0.3),
                                  child: const Center(
                                    child: Icon(
                                      Icons.lock,
                                      color: Colors.white,
                                      size: 32,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showFlowerDetails(
      BuildContext context, unlockedPlant, AppProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(unlockedPlant.name),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.network(
              provider.getFlowerImageUrl(unlockedPlant.id),
              width: 150,
              height: 150,
            ),
            const SizedBox(height: 16),
            Text(
              'Unlocked: ${_formatDate(unlockedPlant.unlockedAt)}',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
