export const mapData = [
  {
    id: "reception",
    name: "Main Reception",
    floor: "Ground Floor",
    room: "G-101",
    coordinates: { x: 120, y: 500 },
    category: "Service",
    directions: ["You are currently at the Main Reception."],
    path: [{ x: 120, y: 500 }]
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    floor: "Ground Floor",
    room: "G-105",
    coordinates: { x: 350, y: 550 },
    category: "Service",
    directions: [
      "Start from Main Reception.",
      "Walk straight past the main hall.",
      "The Pharmacy is on your right, next to the exit."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 250, y: 500 },
      { x: 250, y: 550 },
      { x: 350, y: 550 }
    ]
  },
  {
    id: "emergency",
    name: "Emergency Unit",
    floor: "Ground Floor",
    room: "G-ER",
    coordinates: { x: 120, y: 200 },
    category: "Emergency",
    directions: [
      "Start from Main Reception.",
      "Turn left and walk towards the North Wing.",
      "The Emergency Unit is at the end of the corridor."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 120, y: 350 },
      { x: 120, y: 200 }
    ]
  },
  {
    id: "radiology",
    name: "Radiology",
    floor: "Ground Floor",
    room: "G-120",
    coordinates: { x: 600, y: 450 },
    category: "Lab",
    directions: [
      "Start from Main Reception.",
      "Walk straight to the main elevators.",
      "Pass the elevators and turn right.",
      "Radiology is located in Room G-120."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 450, y: 500 },
      { x: 450, y: 450 },
      { x: 600, y: 450 }
    ]
  },
  {
    id: "lab",
    name: "Main Laboratory",
    floor: "First Floor",
    room: "F-201",
    coordinates: { x: 200, y: 300 },
    category: "Lab",
    directions: [
      "Start from Main Reception.",
      "Walk straight to the main elevators.",
      "Take the elevator to the First Floor.",
      "Turn left after exiting the elevator.",
      "The Main Laboratory is the first door on your left."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 450, y: 500 }, // elevator ground
      { x: 450, y: 300 }, // elevator first (logical mapping)
      { x: 300, y: 300 },
      { x: 200, y: 300 }
    ]
  },
  {
    id: "cardiology",
    name: "Cardiology",
    floor: "Second Floor",
    room: "Room 204",
    coordinates: { x: 680, y: 320 },
    category: "Department",
    directions: [
      "Start from Main Reception.",
      "Walk straight to the main elevators.",
      "Take elevator to the Second Floor.",
      "Turn right after exiting elevator.",
      "Cardiology is located in Room 204."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 450, y: 500 }, // elevator ground
      { x: 450, y: 320 }, // elevator second (logical mapping)
      { x: 680, y: 320 }
    ]
  },
  {
    id: "neurology",
    name: "Neurology",
    floor: "Second Floor",
    room: "Room 208",
    coordinates: { x: 680, y: 150 },
    category: "Department",
    directions: [
      "Start from Main Reception.",
      "Walk straight to the main elevators.",
      "Take elevator to the Second Floor.",
      "Turn right and walk past Cardiology.",
      "Neurology is at the end of the East Wing."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 450, y: 500 },
      { x: 450, y: 320 },
      { x: 680, y: 320 },
      { x: 680, y: 150 }
    ]
  },
  {
    id: "orthopedics",
    name: "Orthopedics",
    floor: "Second Floor",
    room: "Room 215",
    coordinates: { x: 200, y: 150 },
    category: "Department",
    directions: [
      "Start from Main Reception.",
      "Walk straight to the main elevators.",
      "Take elevator to the Second Floor.",
      "Turn left and walk to the West Wing.",
      "Orthopedics is located in Room 215."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 450, y: 500 },
      { x: 450, y: 150 },
      { x: 200, y: 150 }
    ]
  },
  {
    id: "dermatology",
    name: "Dermatology",
    floor: "Second Floor",
    room: "Room 212",
    coordinates: { x: 200, y: 320 },
    category: "Department",
    directions: [
      "Start from Main Reception.",
      "Walk straight to the main elevators.",
      "Take elevator to the Second Floor.",
      "Turn left after exiting elevator.",
      "Dermatology is located in Room 212."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 450, y: 500 },
      { x: 450, y: 320 },
      { x: 200, y: 320 }
    ]
  },
  {
    id: "restroom_g",
    name: "Restroom (Ground Floor)",
    floor: "Ground Floor",
    room: "G-Rest",
    coordinates: { x: 450, y: 650 },
    category: "Service",
    directions: [
      "Start from Main Reception.",
      "Walk towards the elevators.",
      "The Restrooms are located behind the elevator bank."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 450, y: 500 },
      { x: 450, y: 650 }
    ]
  },
  {
    id: "stairs",
    name: "Main Stairs",
    floor: "Ground Floor",
    room: "G-Stairs",
    coordinates: { x: 400, y: 340 },
    category: "Service",
    directions: [
      "Start from Main Reception.",
      "Walk straight past the main hall towards the elevators.",
      "The stairs are located to the left of the main elevator bank."
    ],
    path: [
      { x: 120, y: 500 },
      { x: 400, y: 500 },
      { x: 400, y: 340 }
    ]
  }
];

export const floors = [
  { id: "ground", name: "Ground Floor", level: 0 },
  { id: "first", name: "First Floor", level: 1 },
  { id: "second", name: "Second Floor", level: 2 }
];
