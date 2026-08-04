import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-etoan-invoice',
  imports: [NgTemplateOutlet, CommonModule],
  templateUrl: './etoan-invoice.component.html',
  styleUrl: './etoan-invoice.component.scss',
  standalone: true
})
export class EtoanInvoiceComponent {

    title = 'Etoan-Ventures';
    charString: string = '@'

//     menuItems = [
//   { name: 'Immunity Shot', ingredients: ['Turmeric', 'Ginger', 'Lemon', 'Black Pepper', 'Honey'], price: '$5.20'},
//   { name: 'Gut Cleanse', ingredients: ['Aloe Vera Juice', 'Fennel Seeds', 'Mint', 'Lemon'] , price: '$4.60' },
//   { name: 'Morning Detox', ingredients: ['Lemon', 'Ginger', 'Cucumber', 'Coriander', 'Honey'], price: '$5.20' },
//   { name: 'Digestive Elixir', ingredients: ['Ajwain (Carom Seeds)', 'Cumin', 'Ginger', 'Black Salt'], price: '$4.60' },
//   { name: 'Stress Relief Tonic', ingredients: ['Ashwagandha', 'Tulsi (Holy Basil)', 'Cardamom', 'Almond Milk'] , price: '$4.60' },
//   { name: 'Liver Support', ingredients: ['Turmeric', 'Dandelion Root', 'Lemon', 'Honey'] , price: '$4.60' },
//   { name: 'Detox Lemonade', ingredients: ['Lemon', 'Mint', 'Cucumber', 'Ginger'] , price: '$4.60' },
//   { name: 'Anti-Inflammatory Tonic', ingredients: ['Turmeric', 'Cinnamon', 'Black Pepper'] , price: '$3.20' },
//   { name: 'Cold & Flu Fighter', ingredients: ['Ginger', 'Tulsi', 'Black Pepper', 'Honey'] , price: '$4.60' },
//   { name: 'Skin Glow Tonic', ingredients: ['Turmeric', 'Rose Water', 'Lemon', 'Honey'] , price: '$4.60'},
//   { name: 'Kidney Cleanse', ingredients: ['Coriander Seeds', 'Cumin Seeds', 'Lemon'] , price: '$3.20'},
//   { name: 'Afternoon Rejuvenator', ingredients: ['Amla (Gooseberry)', 'Lemon', 'Honey', 'Mint'] , price: '$3.60'},
// ];

// quartelyMenuItems = [
//     { name: 'CCF Detox', ingredients: ['Cumin Seeds', 'Coriander Seeds', 'Fennel Seeds', 'Warm Water'], price: '$5.20'},
//   { name: 'Lemon Ginger', ingredients: ['Fresh Lemon Juice', 'Grated Ginger', 'Honey', 'Warm Water'] , price: '$4.60' },
//   { name: 'Gooseberry Rejuvenation', ingredients: ['Gooseberry', 'Honey', 'Warm Water'], price: '$5.20' },
//   { name: 'Triphala Detox', ingredients: ['Triphala Powder', 'Warm Water'], price: '$4.60' },

// ]
// yearlyMenuItems = [
//     { name: 'Deep Tissue Detox', ingredients: ['Turmeric', 'Black Pepper', 'Honey', 'Warm Water'], price: '$5.20'},
//   { name: 'Blood Purifer / Skin-Liver Detox', ingredients: ['Neem Leaves / Neem Powder', 'Warm Water'] , price: '$4.60' },
//   { name: 'Bowel Cleanse', ingredients: ['Warm Milk', 'Castor Oil'], price: '$5.20' },
//   { name: 'Panchakola Digestive Drink', ingredients: [
//   'Pippali (long pepper)',
//   'Pippalimool',
//   'Chavya',
//   'Chitrak',
//   'Nagar (dry ginger)'
// ], price: '$5.20' },

// ]
}
