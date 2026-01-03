import 'flower_model.dart';

class PlantState {
  final String plantType;
  final int growthStage;
  final int maxGrowth;
  final DateTime? lastUpdated;
  final Flower flower;
  final bool? isFullyGrown;
  final bool? isNew;

  PlantState({
    required this.plantType,
    required this.growthStage,
    required this.maxGrowth,
    this.lastUpdated,
    required this.flower,
    this.isFullyGrown,
    this.isNew,
  });

  factory PlantState.fromJson(Map<String, dynamic> json) {
    return PlantState(
      plantType: json['plant_type'] as String,
      growthStage: json['growth_stage'] as int,
      maxGrowth: json['max_growth'] ?? 4,
      lastUpdated: json['last_updated'] != null
          ? DateTime.parse(json['last_updated'] as String)
          : null,
      flower: Flower.fromJson(json['flower'] as Map<String, dynamic>),
      isFullyGrown: json['is_fully_grown'] as bool?,
      isNew: json['isNew'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'plant_type': plantType,
      'growth_stage': growthStage,
      'max_growth': maxGrowth,
      'last_updated': lastUpdated?.toIso8601String(),
      'flower': flower.toJson(),
      'is_fully_grown': isFullyGrown,
      'isNew': isNew,
    };
  }
}

class UnlockedPlant {
  final int id;
  final String name;
  final String color;
  final String center;
  final DateTime unlockedAt;

  UnlockedPlant({
    required this.id,
    required this.name,
    required this.color,
    required this.center,
    required this.unlockedAt,
  });

  factory UnlockedPlant.fromJson(Map<String, dynamic> json) {
    return UnlockedPlant(
      id: json['id'] as int,
      name: json['name'] as String,
      color: json['color'] as String,
      center: json['center'] as String,
      unlockedAt: DateTime.parse(json['unlocked_at'] as String),
    );
  }
}
