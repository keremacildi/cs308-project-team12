export const mockOrders = [
    {
      id: 1,
      date: "2025-03-10T10:30:00Z",
      customerName: "John Doe",
      total: 1238,
      status: "Shipped",
      items: [
        { productId: 1, title: "iPhone 15", price: 999, quantity: 1 },
        { productId: 4, title: "Smartwatch", price: 199, quantity: 1 },
        { productId: 12, title: "AmazonBasics Backpack", price: 40, quantity: 1 },
      ],
    },
    {
      id: 2,
      date: "2025-03-11T14:45:00Z",
      customerName: "Jane Smith",
      total: 2289,
      status: "Processing",
      items: [
        { productId: 2, title: "MacBook Pro", price: 1999, quantity: 1 },
        { productId: 12, title: "AmazonBasics Backpack", price: 40, quantity: 1 },
        { productId: 11, title: "Bose Bluetooth Speaker", price: 250, quantity: 1 },
      ],
    },
    {
      id: 3,
      date: "2025-03-12T09:20:00Z",
      customerName: "Alice Johnson",
      total: 510,
      status: "Delivered",
      items: [
        { productId: 3, title: "Nike Shoes", price: 120, quantity: 2 },
        { productId: 8, title: "Adidas Running Shoes", price: 130, quantity: 1 },
        { productId: 12, title: "AmazonBasics Backpack", price: 40, quantity: 1 },
        { productId: 13, title: "Puma Jacket", price: 100, quantity: 1 },
      ],
    },
    {
      id: 4,
      date: "2025-03-13T16:00:00Z",
      customerName: "Bob Williams",
      total: 939,
      status: "Cancelled",
      items: [
        { productId: 5, title: "Samsung Galaxy S23", price: 899, quantity: 1 },
        { productId: 12, title: "AmazonBasics Backpack", price: 40, quantity: 1 },
      ],
    },
    {
      id: 5,
      date: "2025-03-14T11:15:00Z",
      customerName: "Charlie Brown",
      total: 1880,
      status: "Processing",
      items: [
        { productId: 10, title: "HP Spectre x360", price: 1800, quantity: 1 },
        { productId: 12, title: "AmazonBasics Backpack", price: 40, quantity: 2 },
      ],
    },
  ];
  