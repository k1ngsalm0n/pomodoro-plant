import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../models/plant_model.dart';
import '../services/api_service.dart';

class PlantWidget extends StatelessWidget {
  final PlantState plant;

  const PlantWidget({super.key, required this.plant});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 300,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Center(
        child: _buildPlantStage(),
      ),
    );
  }

  Widget _buildPlantStage() {
    switch (plant.growthStage) {
      case 0:
        return _buildSeed();
      case 1:
        return _buildSprout();
      case 2:
        return _buildGrowing();
      case 3:
        return _buildBud();
      case 4:
        return _buildFullyBloomed();
      default:
        return _buildSeed();
    }
  }

  Widget _buildSeed() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.brown.shade700,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 16),
        const Text('Seed'),
      ],
    );
  }

  Widget _buildSprout() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Container(
          width: 4,
          height: 60,
          color: Colors.green.shade700,
        ),
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: Colors.brown.shade700,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 16),
        const Text('Sprout'),
      ],
    );
  }

  Widget _buildGrowing() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              width: 30,
              height: 20,
              decoration: BoxDecoration(
                color: Colors.green.shade400,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(10),
                  topRight: Radius.circular(10),
                ),
              ),
            ),
            Container(
              width: 4,
              height: 120,
              color: Colors.green.shade700,
            ),
            Container(
              width: 30,
              height: 20,
              decoration: BoxDecoration(
                color: Colors.green.shade400,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(10),
                  topRight: Radius.circular(10),
                ),
              ),
            ),
          ],
        ),
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: Colors.brown.shade700,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 16),
        const Text('Growing'),
      ],
    );
  }

  Widget _buildBud() {
    final apiService = ApiService();
    final imageUrl = apiService.getPlantStage3Url(plant.flower.id);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SvgPicture.network(
          imageUrl,
          width: 200,
          height: 200,
          placeholderBuilder: (context) => const CircularProgressIndicator(),
        ),
        const SizedBox(height: 16),
        const Text('Bud'),
      ],
    );
  }

  Widget _buildFullyBloomed() {
    final apiService = ApiService();
    final imageUrl = apiService.getPlantStage4Url(plant.flower.id);

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SvgPicture.network(
          imageUrl,
          width: 200,
          height: 200,
          placeholderBuilder: (context) => const CircularProgressIndicator(),
        ),
        const SizedBox(height: 16),
        const Text('Fully Bloomed!'),
      ],
    );
  }
}
