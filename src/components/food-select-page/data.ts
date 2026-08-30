import type { FoodCategory } from "./types";

const ing = (...names: string[]) =>
  names.map((n) => ({ id: n.toLowerCase().replace(/\s+/g, "-"), name: n }));

// Swap `image` urls for real photography from your db.
export const CATEGORIES: FoodCategory[] = [
  {
    id: "c1",
    name: "Burgers",
    subtitle: "Flame grilled",
    image: "https://placehold.co/200x200/A80D25/FFFFFF?text=Burgers",
    subcategories: [
      {
        id: "s1",
        name: "Beef",
        items: [
          {
            id: "f1",
            name: "SMOKEHOUSE STACK",
            subtitle: "Double beef, smoked cheddar",
            price: 12.9,
            popularity: 61,
            image: "https://placehold.co/800x600/A80D25/FFFFFF?text=Smokehouse+Stack",
            ingredients: ing("Smoked Cheddar", "Bacon", "Onion", "Pickles", "BBQ Sauce"),
            addOns: [
              { id: "e1", name: "Extra Patty", price: 3.5 },
              { id: "e2", name: "Cheese Slice", price: 1.2 },
              { id: "e3", name: "Truffle Mayo", price: 0.9 },
            ],
          },
          {
            id: "f2",
            name: "CLASSIC CHEESE",
            subtitle: "Single patty, cheddar",
            price: 8.5,
            popularity: 39,
            image: "https://placehold.co/800x600/C8102E/FFFFFF?text=Classic+Cheese",
            ingredients: ing("Cheddar", "Lettuce", "Tomato", "Pickles", "Ketchup"),
            addOns: [
              { id: "e4", name: "Extra Patty", price: 3.2 },
              { id: "e5", name: "Jalapeños", price: 0.8 },
            ],
          },
        ],
      },
      {
        id: "s2",
        name: "Chicken",
        items: [
          {
            id: "f3",
            name: "SPICY CHICKEN",
            subtitle: "Crispy fillet, jalapeño mayo",
            price: 9.9,
            popularity: 70,
            image: "https://placehold.co/800x600/D91E38/FFFFFF?text=Spicy+Chicken",
            ingredients: ing("Jalapeño Mayo", "Slaw", "Pickles", "Hot Honey"),
            addOns: [
              { id: "e6", name: "Double Fillet", price: 3.9 },
              { id: "e7", name: "Blue Cheese Dip", price: 1.0 },
            ],
          },
          {
            id: "f4",
            name: "BUTTERMILK BIRD",
            subtitle: "Buttermilk brined, herb aioli",
            price: 10.4,
            popularity: 26,
            image: "https://placehold.co/800x600/B4152F/FFFFFF?text=Buttermilk+Bird",
            ingredients: ing("Herb Aioli", "Lettuce", "Tomato", "Red Onion"),
            addOns: [
              { id: "e8", name: "Crispy Onions", price: 1.1 },
              { id: "e9", name: "Extra Aioli", price: 0.7 },
            ],
          },
        ],
      },
      {
        id: "s3",
        name: "Veggie",
        items: [
          {
            id: "f5",
            name: "GARDEN STACK",
            subtitle: "Chickpea patty, avocado",
            price: 9.2,
            popularity: 29,
            image: "https://placehold.co/800x600/6F9E3E/FFFFFF?text=Garden+Stack",
            ingredients: ing("Avocado", "Rocket", "Tomato", "Vegan Mayo"),
            addOns: [
              { id: "e10", name: "Vegan Cheese", price: 1.4 },
              { id: "e11", name: "Grilled Mushroom", price: 1.6 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c2",
    name: "Pizza",
    subtitle: "Stone baked",
    image: "https://placehold.co/200x200/C8102E/FFFFFF?text=Pizza",
    subcategories: [
      {
        id: "s4",
        name: "Classics",
        items: [
          {
            id: "f6",
            name: "MARGHERITA",
            subtitle: "San Marzano tomato, basil",
            price: 11.0,
            popularity: 88,
            image: "https://placehold.co/800x600/6F9E3E/FFFFFF?text=Margherita",
            ingredients: ing("Basil", "Mozzarella", "Oregano"),
            addOns: [
              { id: "e12", name: "Buffalo Mozzarella", price: 2.4 },
              { id: "e13", name: "Chilli Oil", price: 0.6 },
            ],
          },
          {
            id: "f7",
            name: "PEPPERONI",
            subtitle: "Double pepperoni, mozzarella",
            price: 13.5,
            popularity: 32,
            image: "https://placehold.co/800x600/A80D25/FFFFFF?text=Pepperoni",
            ingredients: ing("Pepperoni", "Mozzarella", "Oregano", "Tomato Base"),
            addOns: [
              { id: "e14", name: "Extra Pepperoni", price: 2.2 },
              { id: "e15", name: "Stuffed Crust", price: 3.0 },
            ],
          },
        ],
      },
      {
        id: "s5",
        name: "White Base",
        items: [
          {
            id: "f8",
            name: "TARTUFO",
            subtitle: "Truffle cream, mushroom",
            price: 15.0,
            popularity: 66,
            image: "https://placehold.co/800x600/6B351E/FFFFFF?text=Tartufo",
            ingredients: ing("Truffle Cream", "Mushroom", "Parmesan", "Thyme"),
            addOns: [
              { id: "e16", name: "Extra Truffle", price: 3.5 },
              { id: "e17", name: "Rocket & Parma", price: 2.8 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c3",
    name: "Salads",
    subtitle: "Fresh daily",
    image: "https://placehold.co/200x200/527A2E/FFFFFF?text=Salads",
    subcategories: [
      {
        id: "s6",
        name: "Green Bowls",
        items: [
          {
            id: "f9",
            name: "CAESAR SALAD",
            subtitle: "Romaine, parmesan, croutons",
            price: 7.5,
            popularity: 94,
            image: "https://placehold.co/800x600/527A2E/FFFFFF?text=Caesar",
            ingredients: ing("Croutons", "Parmesan", "Anchovy Dressing"),
            addOns: [
              { id: "e18", name: "Grilled Chicken", price: 3.0 },
              { id: "e19", name: "Soft Egg", price: 1.2 },
            ],
          },
          {
            id: "f10",
            name: "GREEK SALAD",
            subtitle: "Feta, olives, cucumber",
            price: 7.9,
            popularity: 27,
            image: "https://placehold.co/800x600/6F9E3E/FFFFFF?text=Greek+Salad",
            ingredients: ing("Feta", "Olives", "Red Onion", "Oregano"),
            addOns: [{ id: "e20", name: "Extra Feta", price: 1.5 }],
          },
        ],
      },
    ],
  },
  {
    id: "c4",
    name: "Drinks",
    subtitle: "Cold & fresh",
    image: "https://placehold.co/200x200/F5C542/171717?text=Drinks",
    subcategories: [
      {
        id: "s7",
        name: "Cold Press",
        items: [
          {
            id: "f11",
            name: "FRESH LEMONADE",
            subtitle: "Hand-squeezed, mint",
            price: 3.5,
            popularity: 84,
            image: "https://placehold.co/800x600/F5C542/171717?text=Lemonade",
            ingredients: ing("Mint", "Ice", "Sugar Syrup"),
            addOns: [{ id: "e21", name: "Double Shot Syrup", price: 0.5 }],
          },
        ],
      },
      {
        id: "s8",
        name: "Coffee",
        items: [
          {
            id: "f12",
            name: "ICED COFFEE",
            subtitle: "Cold brew, oat milk",
            price: 4.2,
            popularity: 47,
            image: "https://placehold.co/800x600/6B351E/FFFFFF?text=Iced+Coffee",
            ingredients: ing("Oat Milk", "Ice", "Sugar"),
            addOns: [
              { id: "e22", name: "Extra Shot", price: 0.9 },
              { id: "e23", name: "Vanilla Syrup", price: 0.6 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c5",
    name: "Desserts",
    subtitle: "Sweet finish",
    image: "https://placehold.co/200x200/402015/FFFFFF?text=Desserts",
    subcategories: [
      {
        id: "s9",
        name: "Warm",
        items: [
          {
            id: "f13",
            name: "CHOCOLATE LAVA CAKE",
            subtitle: "Warm center, vanilla ice cream",
            price: 6.5,
            popularity: 24,
            image: "https://placehold.co/800x600/402015/FFFFFF?text=Lava+Cake",
            ingredients: ing("Vanilla Ice Cream", "Cocoa Dust", "Berries"),
            addOns: [
              { id: "e24", name: "Extra Scoop", price: 1.8 },
              { id: "e25", name: "Salted Caramel", price: 1.0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c6",
    name: "Grill (مشاوي)",
    subtitle: "Charcoal fired",
    image: "https://placehold.co/200x200/A80D25/FFFFFF?text=Grill",
    subcategories: [
      {
        id: "s10",
        name: "Merguez",
        items: [
          {
            id: "f14",
            name: "Merguez Sandwich",
            subtitle: "Spicy lamb sausage in baguette",
            price: 7.5,
            popularity: 58,
            image: "https://placehold.co/800x600/A80D25/FFFFFF?text=Merguez+Sandwich",
            ingredients: ing("Merguez", "Baguette", "Harissa", "Onion"),
            addOns: [
              { id: "e26", name: "Extra Merguez", price: 2.5 },
              { id: "e27", name: "Fries Side", price: 2.0 },
            ],
          },
          {
            id: "f15",
            name: "Merguez Plate with Fries",
            subtitle: "Grilled merguez served with fries",
            price: 11.0,
            popularity: 62,
            image: "https://placehold.co/800x600/C8102E/FFFFFF?text=Merguez+Plate",
            ingredients: ing("Merguez", "Fries", "Harissa", "Bread"),
            addOns: [
              { id: "e28", name: "Extra Merguez", price: 2.5 },
              { id: "e29", name: "Fries", price: 2.0 },
            ],
          },
          {
            id: "f16",
            name: "Merguez Couscous",
            subtitle: "Merguez over steamed couscous",
            price: 12.5,
            popularity: 48,
            image: "https://placehold.co/800x600/D91E38/FFFFFF?text=Merguez+Couscous",
            ingredients: ing("Merguez", "Couscous", "Vegetable Broth", "Chickpeas"),
            addOns: [
              { id: "e30", name: "Extra Merguez", price: 2.5 },
              { id: "e31", name: "Chili Paste", price: 0.5 },
            ],
          },
        ],
      },
      {
        id: "s11",
        name: "Kebab",
        items: [
          {
            id: "f17",
            name: "Beef Kebab Skewer",
            subtitle: "Two grilled beef skewers",
            price: 13.0,
            popularity: 55,
            image: "https://placehold.co/800x600/6B351E/FFFFFF?text=Beef+Kebab",
            ingredients: ing("Beef", "Spices", "Onion", "Parsley"),
            addOns: [
              { id: "e32", name: "Extra Skewer", price: 4.0 },
              { id: "e33", name: "Rice", price: 2.5 },
            ],
          },
          {
            id: "f18",
            name: "Chicken Kebab Wrap",
            subtitle: "Grilled chicken in flatbread",
            price: 8.5,
            popularity: 60,
            image: "https://placehold.co/800x600/B4152F/FFFFFF?text=Chicken+Kebab+Wrap",
            ingredients: ing("Chicken", "Flatbread", "Garlic Sauce", "Lettuce"),
            addOns: [
              { id: "e34", name: "Extra Chicken", price: 3.0 },
              { id: "e35", name: "Cheese", price: 1.2 },
            ],
          },
        ],
      },
      {
        id: "s12",
        name: "Mixed Grill",
        items: [
          {
            id: "f19",
            name: "Mixed Grill Plate",
            subtitle: "Lamb + chicken + merguez",
            price: 18.0,
            popularity: 72,
            image: "https://placehold.co/800x600/A80D25/FFFFFF?text=Mixed+Grill",
            ingredients: ing("Lamb", "Chicken", "Merguez", "Rice", "Grilled Vegetables"),
            addOns: [
              { id: "e36", name: "Extra Lamb", price: 5.0 },
              { id: "e37", name: "Extra Rice", price: 2.0 },
            ],
          },
          {
            id: "f20",
            name: "Family Mixed Grill Platter",
            subtitle: "Generous mix for two to three",
            price: 32.0,
            popularity: 45,
            image: "https://placehold.co/800x600/C8102E/FFFFFF?text=Family+Platter",
            ingredients: ing("Lamb", "Chicken", "Merguez", "Couscous", "Salad"),
            addOns: [
              { id: "e38", name: "Extra Bread", price: 1.5 },
              { id: "e39", name: "Extra Harissa", price: 0.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c7",
    name: "Traditional Tunisian (أكلة تونسية)",
    subtitle: "Heritage recipes",
    image: "https://placehold.co/200x200/6B351E/FFFFFF?text=Tunisian",
    subcategories: [
      {
        id: "s13",
        name: "Couscous",
        items: [
          {
            id: "f21",
            name: "Couscous with Lamb",
            subtitle: "Steamed couscous, lamb, vegetables",
            price: 14.5,
            popularity: 68,
            image: "https://placehold.co/800x600/6B351E/FFFFFF?text=Couscous+Lamb",
            ingredients: ing("Lamb", "Couscous", "Carrots", "Chickpeas", "Zucchini"),
            addOns: [
              { id: "e40", name: "Extra Lamb", price: 4.5 },
              { id: "e41", name: "Harissa", price: 0.5 },
            ],
          },
          {
            id: "f22",
            name: "Couscous with Chicken",
            subtitle: "Steamed couscous, chicken, vegetables",
            price: 12.5,
            popularity: 64,
            image: "https://placehold.co/800x600/8B5A2B/FFFFFF?text=Couscous+Chicken",
            ingredients: ing("Chicken", "Couscous", "Carrots", "Chickpeas", "Zucchini"),
            addOns: [
              { id: "e42", name: "Extra Chicken", price: 3.5 },
              { id: "e43", name: "Harissa", price: 0.5 },
            ],
          },
          {
            id: "f23",
            name: "Couscous with Vegetables",
            subtitle: "Vegetarian steamed couscous",
            price: 10.5,
            popularity: 35,
            image: "https://placehold.co/800x600/527A2E/FFFFFF?text=Couscous+Veg",
            ingredients: ing("Couscous", "Carrots", "Chickpeas", "Zucchini", "Pumpkin"),
            addOns: [
              { id: "e44", name: "Feta", price: 1.5 },
              { id: "e45", name: "Harissa", price: 0.5 },
            ],
          },
        ],
      },
      {
        id: "s14",
        name: "Tajine",
        items: [
          {
            id: "f24",
            name: "Tajine Malsouka",
            subtitle: "Tunisian egg pastry pie",
            price: 9.5,
            popularity: 52,
            image: "https://placehold.co/800x600/F5C542/171717?text=Tajine+Malsouka",
            ingredients: ing("Malsouka", "Egg", "Tuna", "Harissa", "Potato"),
            addOns: [
              { id: "e46", name: "Extra Egg", price: 1.0 },
              { id: "e47", name: "Extra Tuna", price: 2.0 },
            ],
          },
          {
            id: "f25",
            name: "Tajine with Potato & Egg",
            subtitle: "Baked potato, egg and cheese",
            price: 8.5,
            popularity: 50,
            image: "https://placehold.co/800x600/D4A017/171717?text=Tajine+Potato",
            ingredients: ing("Potato", "Egg", "Cheese", "Parsley"),
            addOns: [
              { id: "e48", name: "Extra Cheese", price: 1.2 },
              { id: "e49", name: "Extra Egg", price: 1.0 },
            ],
          },
        ],
      },
      {
        id: "s15",
        name: "Soups",
        items: [
          {
            id: "f26",
            name: "Chorba Frik",
            subtitle: "Lamb and green wheat soup",
            price: 7.0,
            popularity: 42,
            image: "https://placehold.co/800x600/6B351E/FFFFFF?text=Chorba+Frik",
            ingredients: ing("Lamb", "Frik", "Tomato", "Onion", "Cilantro"),
            addOns: [
              { id: "e50", name: "Extra Bread", price: 1.0 },
              { id: "e51", name: "Lemon", price: 0.3 },
            ],
          },
          {
            id: "f27",
            name: "Lablabi",
            subtitle: "Chickpea soup with bread and egg",
            price: 6.5,
            popularity: 38,
            image: "https://placehold.co/800x600/C8102E/FFFFFF?text=Lablabi",
            ingredients: ing("Chickpeas", "Bread", "Egg", "Cumin", "Garlic"),
            addOns: [
              { id: "e52", name: "Extra Egg", price: 1.0 },
              { id: "e53", name: "Extra Bread", price: 1.0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c8",
    name: "Fast Food",
    subtitle: "Quick bites",
    image: "https://placehold.co/200x200/F5C542/171717?text=Fast+Food",
    subcategories: [
      {
        id: "s16",
        name: "Sandwiches",
        items: [
          {
            id: "f28",
            name: "Tunisian Sandwich (baguette)",
            subtitle: "Tuna, egg, olives, harissa",
            price: 5.5,
            popularity: 75,
            image: "https://placehold.co/800x600/F5C542/171717?text=Tunisian+Sandwich",
            ingredients: ing("Baguette", "Tuna", "Egg", "Olives", "Harissa"),
            addOns: [
              { id: "e54", name: "Extra Tuna", price: 1.5 },
              { id: "e55", name: "Extra Egg", price: 1.0 },
            ],
          },
          {
            id: "f29",
            name: "Chicken Escalope Sandwich",
            subtitle: "Breaded chicken fillet sandwich",
            price: 6.5,
            popularity: 56,
            image: "https://placehold.co/800x600/D91E38/FFFFFF?text=Escalope+Sandwich",
            ingredients: ing("Chicken Escalope", "Baguette", "Mayo", "Lettuce"),
            addOns: [
              { id: "e56", name: "Extra Chicken", price: 2.5 },
              { id: "e57", name: "Cheese", price: 1.0 },
            ],
          },
        ],
      },
      {
        id: "s17",
        name: "Pizza",
        items: [
          {
            id: "f30",
            name: "Margherita Pizza",
            subtitle: "Tomato, mozzarella, basil",
            price: 10.0,
            popularity: 66,
            image: "https://placehold.co/800x600/6F9E3E/FFFFFF?text=Margherita",
            ingredients: ing("Tomato", "Mozzarella", "Basil"),
            addOns: [
              { id: "e58", name: "Extra Cheese", price: 2.0 },
              { id: "e59", name: "Mushrooms", price: 1.5 },
            ],
          },
          {
            id: "f31",
            name: "Tuna Pizza",
            subtitle: "Tomato, mozzarella, tuna, onion",
            price: 11.5,
            popularity: 54,
            image: "https://placehold.co/800x600/527A2E/FFFFFF?text=Tuna+Pizza",
            ingredients: ing("Tomato", "Mozzarella", "Tuna", "Onion"),
            addOns: [
              { id: "e60", name: "Extra Tuna", price: 2.0 },
              { id: "e61", name: "Olives", price: 1.0 },
            ],
          },
        ],
      },
      {
        id: "s18",
        name: "Burgers",
        items: [
          {
            id: "f32",
            name: "Classic Beef Burger",
            subtitle: "Beef patty, cheddar, lettuce, tomato",
            price: 9.0,
            popularity: 70,
            image: "https://placehold.co/800x600/A80D25/FFFFFF?text=Classic+Beef+Burger",
            ingredients: ing("Beef Patty", "Cheddar", "Lettuce", "Tomato", "Pickles"),
            addOns: [
              { id: "e62", name: "Extra Patty", price: 3.0 },
              { id: "e63", name: "Bacon", price: 1.5 },
            ],
          },
          {
            id: "f33",
            name: "Chicken Burger",
            subtitle: "Grilled chicken, mayo, lettuce",
            price: 8.0,
            popularity: 58,
            image: "https://placehold.co/800x600/C8102E/FFFFFF?text=Chicken+Burger",
            ingredients: ing("Chicken", "Mayo", "Lettuce", "Tomato"),
            addOns: [
              { id: "e64", name: "Extra Chicken", price: 2.5 },
              { id: "e65", name: "Cheese", price: 1.0 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "c9",
    name: "Sweets & Pastry (حلويات)",
    subtitle: "Sweet finish",
    image: "https://placehold.co/200x200/402015/FFFFFF?text=Sweets",
    subcategories: [
      {
        id: "s19",
        name: "Tunisian Pastry",
        items: [
          {
            id: "f34",
            name: "Makroudh",
            subtitle: "Date-filled semolina pastry",
            price: 4.5,
            popularity: 48,
            image: "https://placehold.co/800x600/402015/FFFFFF?text=Makroudh",
            ingredients: ing("Dates", "Semolina", "Orange Blossom", "Honey"),
            addOns: [
              { id: "e66", name: "Extra Honey", price: 0.8 },
              { id: "e67", name: "Pistachios", price: 1.2 },
            ],
          },
          {
            id: "f35",
            name: "Baklawa",
            subtitle: "Layered nut pastry in syrup",
            price: 4.0,
            popularity: 46,
            image: "https://placehold.co/800x600/6B351E/FFFFFF?text=Baklawa",
            ingredients: ing("Phyllo", "Walnuts", "Pistachios", "Syrup"),
            addOns: [
              { id: "e68", name: "Extra Syrup", price: 0.5 },
              { id: "e69", name: "Extra Nuts", price: 1.5 },
            ],
          },
        ],
      },
      {
        id: "s20",
        name: "Ice Cream",
        items: [
          {
            id: "f36",
            name: "Vanilla Scoop",
            subtitle: "Creamy vanilla ice cream",
            price: 3.0,
            popularity: 50,
            image: "https://placehold.co/800x600/F5C542/171717?text=Vanilla",
            ingredients: ing("Vanilla", "Cream", "Milk"),
            addOns: [
              { id: "e70", name: "Extra Scoop", price: 2.0 },
              { id: "e71", name: "Chocolate Sauce", price: 0.8 },
            ],
          },
          {
            id: "f37",
            name: "Chocolate Sundae",
            subtitle: "Chocolate ice cream with sauce",
            price: 4.5,
            popularity: 55,
            image: "https://placehold.co/800x600/402015/FFFFFF?text=Sundae",
            ingredients: ing("Chocolate Ice Cream", "Chocolate Sauce", "Cream"),
            addOns: [
              { id: "e72", name: "Extra Scoop", price: 2.0 },
              { id: "e73", name: "Whipped Cream", price: 0.5 },
            ],
          },
        ],
      },
    ],
  },
];

/** "Universal division" grouping: which division each category belongs to. */
export const DIVISIONS: { id: string; label: string; arabic: string; categoryIds: string[] }[] = [
  { id: "starters", label: "Starters", arabic: "مقبلات", categoryIds: ["c3"] },
  { id: "mains", label: "Mains", arabic: "أطباق رئيسية", categoryIds: ["c2", "c7", "c6"] },
  { id: "sandwiches", label: "Sandwiches", arabic: "سندويش", categoryIds: ["c8", "c1"] },
  { id: "desserts", label: "Desserts", arabic: "حلويات", categoryIds: ["c5", "c9"] },
  { id: "drinks", label: "Drinks", arabic: "مشروبات", categoryIds: ["c4"] },
];
