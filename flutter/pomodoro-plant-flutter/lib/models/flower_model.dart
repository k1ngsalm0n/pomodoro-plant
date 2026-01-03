class Flower {
  final int id;
  final String name;
  final String color;
  final String center;

  Flower({
    required this.id,
    required this.name,
    required this.color,
    required this.center,
  });

  factory Flower.fromJson(Map<String, dynamic> json) {
    return Flower(
      id: json['id'] as int,
      name: json['name'] as String,
      color: json['color'] as String,
      center: json['center'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'color': color,
      'center': center,
    };
  }
}
