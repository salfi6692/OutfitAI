export interface OutfitStyle {
  id: string;
  name: string;
  description: string;
  category: string;
  gender: 'Male' | 'Female' | 'Unisex';
  previewUrl?: string;
}

export const OUTFIT_CATEGORIES = [
  "Casual",
  "Formal",
  "Wedding",
  "Party",
  "Traditional Pakistani"
];

export const OUTFIT_STYLES: OutfitStyle[] = [
  // Casual
  { id: "c1", name: "White Tee & Jeans", description: "A classic white t-shirt with blue denim jeans", category: "Casual", gender: "Unisex" },
  { id: "c2", name: "Summer Floral Dress", description: "A light, breezy floral print summer dress", category: "Casual", gender: "Female" },
  { id: "c3", name: "Hoodie & Joggers", description: "A cozy oversized hoodie with matching joggers", category: "Casual", gender: "Unisex" },
  { id: "c4", name: "Polo & Chinos", description: "A navy blue polo shirt with beige chino trousers", category: "Casual", gender: "Male" },
  
  // Formal
  { id: "f1", name: "Navy Business Suit", description: "A sharp navy blue tailored business suit with a white shirt", category: "Formal", gender: "Male" },
  { id: "f2", name: "Pencil Skirt & Blouse", description: "A professional black pencil skirt with a silk cream blouse", category: "Formal", gender: "Female" },
  { id: "f3", name: "Charcoal Grey Blazer", description: "A charcoal grey blazer over a black turtleneck", category: "Formal", gender: "Unisex" },
  { id: "f4", name: "Women's Pantsuit", description: "A sophisticated emerald green tailored pantsuit", category: "Formal", gender: "Female" },

  // Wedding
  { id: "w1", name: "Classic Tuxedo", description: "A sophisticated black tuxedo with a bow tie", category: "Wedding", gender: "Male" },
  { id: "w2", name: "Elegant White Gown", description: "A stunning floor-length white lace wedding gown", category: "Wedding", gender: "Female" },
  { id: "w3", name: "Gold Embroidered Sherwani", description: "A luxurious gold embroidered sherwani for a groom", category: "Wedding", gender: "Male" },
  { id: "w4", name: "Bridal Saree", description: "A traditional red silk bridal saree with gold zari work", category: "Wedding", gender: "Female" },

  // Party
  { id: "p1", name: "Sequined Mini Dress", description: "A sparkling silver sequined mini dress for a night out", category: "Party", gender: "Female" },
  { id: "p2", name: "Leather Jacket & Black Jeans", description: "A cool black leather jacket with slim-fit black jeans", category: "Party", gender: "Unisex" },
  { id: "p3", name: "Red Cocktail Dress", description: "A vibrant red off-the-shoulder cocktail dress", category: "Party", gender: "Female" },
  { id: "p4", name: "Velvet Blazer", description: "A deep burgundy velvet blazer with black trousers", category: "Party", gender: "Male" },

  // Traditional Pakistani
  { id: "t1", name: "Black Shalwar Kameez", description: "A traditional black cotton shalwar kameez with intricate embroidery", category: "Traditional Pakistani", gender: "Male" },
  { id: "t2", name: "Embroidered Kurta", description: "A colorful silk kurta with traditional patterns", category: "Traditional Pakistani", gender: "Unisex" },
  { id: "t3", name: "Lehenga Choli", description: "A heavily embroidered bridal lehenga choli in deep maroon", category: "Traditional Pakistani", gender: "Female" },
  { id: "t4", name: "White Kurta Pajama", description: "A crisp white cotton kurta with matching pajama and a waistcoat", category: "Traditional Pakistani", gender: "Male" },
];
